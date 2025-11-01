import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Parse HTML to extract channel info and posts
function parseChannelHTML(html, channelName) {
  const channelInfo = {
    name: channelName,
    avatar: null,
    description: null,
    subscribers: null,
  };

  // Extract channel avatar - try multiple patterns
  let avatarUrl = null;
  
  const avatarMatch1 = html.match(/<img\s+class="tgme_page_photo_image"\s+src="([^"]+)"/);
  if (avatarMatch1) avatarUrl = avatarMatch1[1];
  
  if (!avatarUrl) {
    const avatarMatch2 = html.match(/<img[^>]*src="([^"]+)"[^>]*class="tgme_page_photo_image"/);
    if (avatarMatch2) avatarUrl = avatarMatch2[1];
  }
  
  if (!avatarUrl) {
    const avatarMatch3 = html.match(/<div class="tgme_page_photo"[^>]*>[\s\S]*?<img[^>]+src="([^"]+)"/);
    if (avatarMatch3) avatarUrl = avatarMatch3[1];
  }
  
  if (!avatarUrl) {
    const ogImageMatch = html.match(/<meta\s*property="og:image"\s+content="([^"]+)"/i);
    if (ogImageMatch) avatarUrl = ogImageMatch[1];
  }
  
  if (avatarUrl) {
    channelInfo.avatar = avatarUrl;
  }

  // Extract channel title
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
  
  const posts = [];
  
  // Extract post blocks
  const postRegex = /<div class="tgme_widget_message[^"]*"[^>]*data-post="([^"]*)"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/g;
  let match;

  while ((match = postRegex.exec(html)) !== null) {
    const postId = match[1];
    const postContent = match[2];

    // Extract bot link BEFORE text extraction (from raw postContent, not from entity-encoded text div)
    let botLink = null;
    
    // Look for links containing "nextwifebot" in the entire post content
    // Note: Link text can contain nested HTML tags like <i class="emoji">
    const linkRegex = /<a\s+([^>]*?)href="([^"]*?)"([^>]*?)>([\s\S]*?)<\/a>/gi;
    let linkMatch;
    while ((linkMatch = linkRegex.exec(postContent)) !== null) {
      const href = linkMatch[2];
      const linkText = linkMatch[4]; // Can contain HTML
      
      // Check if link href or text contains "nextwifebot"
      if (href.toLowerCase().includes('nextwifebot') || linkText.toLowerCase().includes('nextwifebot')) {
        // Decode HTML entities in the URL to preserve query parameters
        botLink = href
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num)))
          .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
        
        break;
      }
    }

    // Extract text content
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

    // Filter out service messages
    const serviceMessagePatterns = [
      /^(Channel|Chat|Group) (was )?created$/i,
      /^(Channel|Chat|Group) (name|title) was changed to/i,
      /^(Channel|Chat|Group) photo (updated|changed|was deleted)/i,
      /joined the (channel|group|chat)/i,
      /left the (channel|group|chat)/i,
      /^(Message|Post) was pinned/i,
      /^History was cleared/i,
      /(Voice|Video) chat (started|ended|scheduled)/i,
      /^Giveaway (started|ended|launched)/i,
      /(Channel|Group) was boosted/i,
    ];

    const isServiceMessage = serviceMessagePatterns.some(pattern => pattern.test(text));
    
    if (isServiceMessage) {
      continue;
    }

    // Extract date
    const dateMatch = /<time[^>]*datetime="([^"]*)"/.exec(postContent);
    const date = dateMatch ? dateMatch[1] : new Date().toISOString();

    // Extract media/image
    const imageMatch = /<a[^>]*class="[^"]*tgme_widget_message_photo_wrap[^"]*"[^>]*style="[^"]*background-image:url\('([^']*)'/.exec(postContent);
    let media = imageMatch ? imageMatch[1] : null;
    
    if (media && media.startsWith('//')) {
      media = 'https:' + media;
    }

    // Extract per-message avatar
    let avatar = null;
    const avatarMatch1 = /<[^>]*class="[^"]*tgme_widget_message_user_photo[^"]*"[^>]*style="[^"]*background-image:\s*url\((?:'|")?([^'")]+)(?:'|")?\)[^"]*"[^>]*>/i.exec(postContent);
    if (avatarMatch1) {
      avatar = avatarMatch1[1];
    }

    if (avatar && avatar.startsWith('//')) {
      avatar = 'https:' + avatar;
    }
    if (avatar && /telegram\.org\/img\/emoji/.test(avatar)) {
      avatar = null;
    }
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
        avatar,
        botLink
      });
    }
  }

  return { channelInfo, posts };
}

// API endpoint for Telegram channel feed
app.get('/api/tg-channel-feed', async (req, res) => {
  try {
    const channel = req.query.channel || 'nextwife_ai';
    const before = req.query.before;
    const limit = parseInt(req.query.limit || '20');
    const channelName = channel.replace('@', '');

    console.log(`Fetching page from channel: ${channelName} (before: ${before || 'first'}, limit: ${limit})`);

    // Fetch page with cache-busting
    const ts = Date.now();
    const pageUrl = before 
      ? `https://t.me/s/${channelName}?before=${before}&_=${ts}`
      : `https://t.me/s/${channelName}?_=${ts}`;
    
    const response = await fetch(pageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch channel: ${response.statusText}`);
    }

    const html = await response.text();
    const result = parseChannelHTML(html, channelName);
    
    // Sort by date descending
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

    console.log(`Fetched page: ${posts.length} posts, nextCursor=${nextBefore}`);

    res.json({ 
      channelInfo: before ? undefined : result.channelInfo,
      posts,
      nextBefore,
      hasMore
    });

  } catch (error) {
    console.error('Error fetching Telegram channel:', error);
    res.status(500).json({ 
      error: 'Failed to fetch channel posts',
      message: error.message,
      posts: []
    });
  }
});

// Image proxy endpoint
app.get('/api/tg-image-proxy', async (req, res) => {
  try {
    const imageUrl = req.query.u;

    if (!imageUrl) {
      return res.status(400).json({ error: 'Missing image URL parameter "u"' });
    }

    // Validate URL is from allowed hosts
    const allowedHosts = ['telesco.pe', 'telegram-cdn.org'];
    const url = new URL(imageUrl);
    const hostname = url.hostname.toLowerCase();
    const isAllowed = allowedHosts.some(allowed => 
      hostname === allowed || hostname.endsWith(`.${allowed}`)
    );

    if (!isAllowed) {
      console.error(`Blocked proxy request to disallowed host: ${imageUrl}`);
      return res.status(403).json({ error: 'Host not allowed' });
    }

    console.log(`Proxying image: ${imageUrl}`);

    // Fetch the image
    const imageResponse = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TelegramImageProxy/1.0)',
      },
    });

    if (!imageResponse.ok) {
      console.error(`Failed to fetch image: ${imageResponse.status}`);
      return res.status(502).json({ 
        error: 'Failed to fetch image',
        status: imageResponse.status 
      });
    }

    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
    const buffer = await imageResponse.buffer();

    res.set({
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    });
    res.send(buffer);

  } catch (error) {
    console.error('Error proxying image:', error);
    res.status(500).json({ 
      error: 'Failed to proxy image',
      message: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📡 API endpoints:`);
  console.log(`   - GET /api/tg-channel-feed?channel=nextwife_ai`);
  console.log(`   - GET /api/tg-image-proxy?u=<image_url>\n`);
});
