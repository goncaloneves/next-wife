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

  // Extract channel avatar - try multiple patterns
  console.log('HTML length:', html.length);
  console.log('Looking for avatar in HTML snippet:', html.substring(0, 2000));
  
  // Try multiple avatar extraction patterns
  let avatarUrl = null;
  
  // Pattern 1: Standard img tag with class tgme_page_photo_image
  const avatarMatch1 = html.match(/<img\s+class="tgme_page_photo_image"\s+src="([^"]+)"/);
  if (avatarMatch1) {
    avatarUrl = avatarMatch1[1];
    console.log('Avatar found with pattern 1:', avatarUrl);
  }
  
  // Pattern 2: Reversed attributes (src before class)
  if (!avatarUrl) {
    const avatarMatch2 = html.match(/<img[^>]*src="([^"]+)"[^>]*class="tgme_page_photo_image"/);
    if (avatarMatch2) {
      avatarUrl = avatarMatch2[1];
      console.log('Avatar found with pattern 2:', avatarUrl);
    }
  }
  
  // Pattern 3: More lenient - any img in tgme_page_photo div
  if (!avatarUrl) {
    const avatarMatch3 = html.match(/<div class="tgme_page_photo"[^>]*>[\s\S]*?<img[^>]+src="([^"]+)"/);
    if (avatarMatch3) {
      avatarUrl = avatarMatch3[1];
      console.log('Avatar found with pattern 3:', avatarUrl);
    }
  }
  
  // Pattern 4: Background image style
  if (!avatarUrl) {
    const avatarMatch4 = html.match(/class="tgme_page_photo"[^>]*style="[^"]*background-image:\s*url\('([^']+)'\)/);
    if (avatarMatch4) {
      avatarUrl = avatarMatch4[1];
      console.log('Avatar found with pattern 4:', avatarUrl);
    }
  }
  
  // Pattern 5: Open Graph image (allow optional whitespace)
  if (!avatarUrl) {
    const ogImageMatch = html.match(/<meta\s*property="og:image"\s+content="([^"]+)"/i);
    if (ogImageMatch) {
      avatarUrl = ogImageMatch[1];
      console.log('Avatar found with pattern 5 (og:image):', avatarUrl);
    }
  }
  
  // Pattern 6: Twitter image (allow optional whitespace)
  if (!avatarUrl) {
    const twitterImageMatch = html.match(/<meta\s*property="twitter:image"\s+content="([^"]+)"/i);
    if (twitterImageMatch) {
      avatarUrl = twitterImageMatch[1];
      console.log('Avatar found with pattern 6 (twitter:image):', avatarUrl);
    }
  }
  
  if (avatarUrl) {
    channelInfo.avatar = avatarUrl;
    console.log('Final avatar URL:', avatarUrl);
  } else {
    console.log('No avatar found with any pattern');
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
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num)))
      .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
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

    // Extract text content first
    const textMatch = /<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/.exec(postContent);
    const text = textMatch ? textMatch[1]
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num)))
      .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
      .trim() : '';

    // Filter out service messages by text patterns - comprehensive list covering all Telegram MessageAction types
    const serviceMessagePatterns = [
      // Channel/Chat creation and migration
      /^(Channel|Chat|Group) (was )?created$/i,
      /^(Channel|Chat|Group) (name|title) was changed to/i,
      /^(Channel|Chat|Group) photo (updated|changed|was deleted)/i,
      
      // User join/leave actions
      /joined the (channel|group|chat)/i,
      /left the (channel|group|chat)/i,
      /joined via invite link/i,
      /joined by request/i,
      /joined Telegram/i,
      
      // Pinning and history
      /^(Message|Post) was pinned/i,
      /^History was cleared/i,
      
      // Voice/Video calls
      /(Voice|Video) chat (started|ended|scheduled)/i,
      /invited to (voice|video) chat/i,
      /^Phone call/i,
      /^Call duration:/i,
      
      // Giveaways and boosts
      /^Giveaway (started|ended|launched)/i,
      /(Channel|Group) was boosted/i,
      /^Boost applied/i,
      
      // Topics (forums)
      /^Topic created:/i,
      /^Topic (renamed|edited)/i,
      
      // Payments and games
      /^Payment (of|sent)/i,
      /^Game score:/i,
      
      // Settings changes
      /^Auto-delete timer set to/i,
      /^Chat theme changed to/i,
      /^Wallpaper changed/i,
      
      // Screenshots and security
      /^Screenshot was taken/i,
      /^Secure values/i,
      
      // Proximity and location
      /is within \d+ meters/i,
      
      // Gifts and premium
      /^Premium (gift|subscription)/i,
      /^Gift code/i,
      
      // Profile and suggestions
      /^Profile photo suggested/i,
      
      // Migration messages
      /upgraded to (supergroup|channel)/i,
      /migrated (from|to)/i,
      
      // Bot permissions
      /^Bot was allowed/i,
      
      // Web view and data
      /^Web view data/i,
      
      // Generic service notification
      /^Service notification/i,
      /^System message/i
    ];

    const isServiceMessage = serviceMessagePatterns.some(pattern => pattern.test(text));
    
    if (isServiceMessage) {
      console.log(`Filtered out service message: ${postId} - "${text}"`);
      continue;
    }

    // Extract date
    const dateMatch = /<time[^>]*datetime="([^"]*)"/.exec(postContent);
    const date = dateMatch ? dateMatch[1] : new Date().toISOString();

    // Extract media (image or video)
    let media = null;
    let mediaType: 'image' | 'video' | null = null;
    
    // Try to extract image first
    const imageMatch = /<a[^>]*class="[^"]*tgme_widget_message_photo_wrap[^"]*"[^>]*style="[^"]*background-image:url\('([^']*)'/.exec(postContent);
    if (imageMatch) {
      media = imageMatch[1];
      mediaType = 'image';
    }
    
    // Try to extract video if no image found
    if (!media) {
      // Pattern 1: Video wrap with background poster image
      const videoWrapMatch = /<a[^>]*class="[^"]*tgme_widget_message_video_wrap[^"]*"[^>]*style="[^"]*background-image:url\('([^']*)'/.exec(postContent);
      if (videoWrapMatch) {
        media = videoWrapMatch[1];
        mediaType = 'video';
      }
    }
    
    // Pattern 2: Video player with thumb
    if (!media) {
      const videoThumbMatch = /<div[^>]*class="[^"]*tgme_widget_message_video_thumb[^"]*"[^>]*style="[^"]*background-image:url\('([^']*)'/.exec(postContent);
      if (videoThumbMatch) {
        media = videoThumbMatch[1];
        mediaType = 'video';
      }
    }
    
    // Pattern 3: Direct video element
    if (!media) {
      const videoMatch = /<video[^>]*src="([^"]*)"/.exec(postContent);
      if (videoMatch) {
        media = videoMatch[1];
        mediaType = 'video';
      }
    }

    // Extract per-message avatar from tgme_widget_message_user_photo
    let avatar = null;
    
    // Pattern 1: Same tag (class before style), allow single/double quotes
    const avatarMatch1 = /<[^>]*class="[^"]*tgme_widget_message_user_photo[^"]*"[^>]*style="[^"]*background-image:\s*url\((?:'|")?([^'")]+)(?:'|")?\)[^"]*"[^>]*>/i.exec(postContent);
    if (avatarMatch1) {
      avatar = avatarMatch1[1];
      console.log('Avatar found with strict pattern 1:', avatar);
    }

    // Pattern 2: Same tag (style before class)
    if (!avatar) {
      const avatarMatch2 = /<[^>]*style="[^"]*background-image:\s*url\((?:'|")?([^'")]+)(?:'|")?\)[^"]*"[^>]*class="[^"]*tgme_widget_message_user_photo[^"]*"[^>]*>/i.exec(postContent);
      if (avatarMatch2) {
        avatar = avatarMatch2[1];
        console.log('Avatar found with strict pattern 2:', avatar);
      }
    }

    // Pattern 3: Fallback within the same tag regardless of attribute order
    if (!avatar) {
      const avatarMatch3 = /<[^>]*class="[^"]*tgme_widget_message_user_photo[^"]*"[^>]*style="[^"]*url\((?:'|")?([^'")]+)(?:'|")?\)[^"]*"[^>]*>/i.exec(postContent);
      if (avatarMatch3) {
        avatar = avatarMatch3[1];
        console.log('Avatar found with strict pattern 3:', avatar);
      }
    }

    // Normalize and filter invalid avatar URLs
    if (avatar && avatar.startsWith('//')) {
      avatar = 'https:' + avatar;
    }
    if (avatar && /telegram\.org\/img\/emoji/.test(avatar)) {
      console.log('Discarding emoji fallback avatar');
      avatar = null;
    }
    // Fallback to channel avatar when no per-message avatar available or only emoji found
    if (!avatar) {
      avatar = channelInfo.avatar || null;
    }

    if (text || media) {
      posts.push({
        id: postId.split('/').pop(),
        text,
        date,
        link: `https://t.me/${channelName}/${postId.split('/').pop()}`,
        media,
        mediaType,
        avatar
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
    const before = url.searchParams.get('before'); // Cursor for pagination
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const channelName = channel.replace('@', '');

    console.log(`Fetching page from channel: ${channelName} (before: ${before || 'first'}, limit: ${limit})`);

    // Check cache - per-page caching
    const cacheKey = `${channelName}:page:${before || 'first'}:${limit}`;
    const cached = cache.get(cacheKey);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < CACHE_TTL) {
      console.log(`Returning cached page (${cached.data.posts.length} posts)`);
      return new Response(
        JSON.stringify({ ...cached.data, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch single page
    const pageUrl = before 
      ? `https://t.me/s/${channelName}?before=${before}`
      : `https://t.me/s/${channelName}`;
    
    const response = await fetch(pageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch channel: ${response.statusText}`);
    }

    const html = await response.text();
    const result = parseChannelHTML(html, channelName);
    
    // Sort by date descending (newest first)
    const posts = result.posts.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });

    // Extract oldest ID as next cursor
    const oldestId = posts.length > 0 
      ? Math.min(...posts.map(p => parseInt(p.id)).filter(id => !isNaN(id)))
      : null;

    const nextBefore = oldestId ? String(oldestId) : null;
    const hasMore = posts.length > 0;

    console.log(`Fetched page (before=${before || 'first'}): ${posts.length} posts, nextCursor=${nextBefore}, hasMore=${hasMore}`);

    const responseData = { 
      channelInfo: before ? undefined : result.channelInfo, // Only include channel info on first page
      posts,
      nextBefore,
      hasMore,
      cached: false
    };

    // Update cache
    cache.set(cacheKey, { data: responseData, timestamp: now });

    return new Response(
      JSON.stringify(responseData),
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
