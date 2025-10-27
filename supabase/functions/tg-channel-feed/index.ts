const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 3000; // 3 seconds

// Parse HTML to extract channel info and posts
function parseChannelHTML(html: string, channelName: string): { channelInfo: any; posts: any[] } {
  // Extract channel metadata
  const channelInfo = {
    name: channelName,
    avatar: null as string | null,
    description: null as string | null,
    subscribers: null as string | null,
  };

  // Extract channel avatar
  const avatarMatch = html.match(/<img class="tgme_page_photo_image"[^>]+src="([^"]+)"/);
  if (avatarMatch) {
    channelInfo.avatar = avatarMatch[1];
  }

  // Extract channel title/name
  const titleMatch = html.match(/<div class="tgme_page_title"[^>]*><span[^>]*>([^<]+)<\/span>/);
  if (titleMatch) {
    channelInfo.name = titleMatch[1].trim();
  }

  // Extract channel description
  const descMatch = html.match(/<div class="tgme_page_description[^"]*"[^>]*>([\s\S]*?)<\/div>/);
  if (descMatch) {
    channelInfo.description = descMatch[1]
      .replace(/<[^>]+>/g, '')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .trim();
  }

  // Extract subscriber count
  const subsMatch = html.match(/<div class="tgme_page_extra">([^<]+subscribers?)<\/div>/i);
  if (subsMatch) {
    channelInfo.subscribers = subsMatch[1].trim();
  }
  
  const posts: any[] = [];
  
  // Extract post blocks - Telegram uses specific class names
  const postRegex = /<div class="tgme_widget_message[^"]*"[^>]*data-post="([^"]*)"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/g;
  let match;

  while ((match = postRegex.exec(html)) !== null) {
    const postId = match[1];
    const postContent = match[2];

    // Extract text content
    const textMatch = /<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/.exec(postContent);
    const text = textMatch ? textMatch[1]
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim() : '';

    // Extract date
    const dateMatch = /<time[^>]*datetime="([^"]*)"/.exec(postContent);
    const date = dateMatch ? dateMatch[1] : new Date().toISOString();

    // Extract media/image
    const imageMatch = /<a[^>]*class="[^"]*tgme_widget_message_photo_wrap[^"]*"[^>]*style="[^"]*background-image:url\('([^']*)'/.exec(postContent);
    const media = imageMatch ? imageMatch[1] : null;

    if (text || media) {
      posts.push({
        id: postId.split('/').pop(),
        text,
        date,
        link: `https://t.me/${channelName}/${postId.split('/').pop()}`,
        media
      });
    }
  }

  return { channelInfo, posts };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const channel = url.searchParams.get('channel') || 'nextwifeai';
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const channelName = channel.replace('@', '');

    console.log(`Fetching posts from channel: ${channelName}`);

    // Check cache
    const cacheKey = `${channelName}-${limit}`;
    const cached = cache.get(cacheKey);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < CACHE_TTL) {
      console.log('Returning cached data');
      return new Response(
        JSON.stringify({ ...cached.data, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch channel HTML from public preview page
    const response = await fetch(`https://t.me/s/${channelName}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch channel: ${response.statusText}`);
    }

    const html = await response.text();
    
    // Parse HTML to extract channel info and posts
    const { channelInfo, posts: allPosts } = parseChannelHTML(html, channelName);
    const posts = allPosts.slice(0, limit);

    // Update cache
    const responseData = { channelInfo, posts };
    cache.set(cacheKey, { data: responseData, timestamp: now });

    console.log(`Successfully fetched ${posts.length} posts`);

    return new Response(
      JSON.stringify({ ...responseData, cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching Telegram channel:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch channel posts',
        message: errorMessage,
        posts: []
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
