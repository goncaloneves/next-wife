const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Allowed CDN hostnames for Telegram images
const ALLOWED_HOSTS = ['telesco.pe', 'telegram-cdn.org'];

function isAllowedHost(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    
    // Check if hostname matches or is a subdomain of allowed hosts
    return ALLOWED_HOSTS.some(allowed => 
      hostname === allowed || hostname.endsWith(`.${allowed}`)
    );
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const imageUrl = url.searchParams.get('u');

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing image URL parameter "u"' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate URL is from allowed hosts
    if (!isAllowedHost(imageUrl)) {
      console.error(`Blocked proxy request to disallowed host: ${imageUrl}`);
      return new Response(
        JSON.stringify({ error: 'Host not allowed' }),
        { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Proxying image: ${imageUrl}`);

    // Fetch the image from Telegram CDN
    const imageResponse = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TelegramImageProxy/1.0)',
      },
    });

    if (!imageResponse.ok) {
      console.error(`Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch image',
          status: imageResponse.status 
        }),
        { 
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get content type from upstream response
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

    // Stream the image response with proper caching headers
    return new Response(imageResponse.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        'Access-Control-Max-Age': '86400',
      },
    });

  } catch (error) {
    console.error('Error in image proxy:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ 
        error: 'Proxy error',
        message: errorMessage 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
