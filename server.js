import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, desc, and, inArray, sql } from 'drizzle-orm';

const app = express();
const PORT = process.env.PORT || 3001;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

// ============== DATABASE SETUP ==============
const { Pool } = pg;
let db = null;
let pool = null;

// Nationality to Region mapping
const nationalityToRegion = {
  "Japanese": "Asian", "Korean": "Asian", "Chinese": "Asian", "Thai": "Asian",
  "Vietnamese": "Asian", "Filipino": "Asian", "Filipina": "Asian", "Indonesian": "Asian",
  "Malaysian": "Asian", "Singaporean": "Asian", "Indian": "Asian", "Pakistani": "Asian",
  "Bangladeshi": "Asian", "Sri Lankan": "Asian", "Nepali": "Asian", "Taiwanese": "Asian",
  "Hong Konger": "Asian", "Mongolian": "Asian", "Cambodian": "Asian", "Laotian": "Asian",
  "Myanmar": "Asian", "Burmese": "Asian", "Balinese": "Asian",
  "British": "European", "English": "European", "Scottish": "European", "Welsh": "European",
  "Irish": "European", "French": "European", "German": "European", "Italian": "European",
  "Spanish": "European", "Portuguese": "European", "Dutch": "European", "Belgian": "European",
  "Swiss": "European", "Austrian": "European", "Swedish": "European", "Norwegian": "European",
  "Danish": "European", "Finnish": "European", "Polish": "European", "Czech": "European",
  "Hungarian": "European", "Romanian": "European", "Bulgarian": "European", "Greek": "European",
  "Croatian": "European", "Serbian": "European", "Slovenian": "European", "Slovak": "European",
  "Ukrainian": "European", "Russian": "European", "Belarusian": "European",
  "Lithuanian": "European", "Latvian": "European", "Estonian": "European", "Icelandic": "European",
  "Albanian": "European", "Macedonian": "European", "Montenegrin": "European", "Bosnian": "European",
  "Brazilian": "Latin American", "Mexican": "Latin American", "Argentine": "Latin American",
  "Argentinian": "Latin American", "Colombian": "Latin American", "Peruvian": "Latin American",
  "Venezuelan": "Latin American", "Chilean": "Latin American", "Ecuadorian": "Latin American",
  "Bolivian": "Latin American", "Paraguayan": "Latin American", "Uruguayan": "Latin American",
  "Cuban": "Latin American", "Dominican": "Latin American", "Puerto Rican": "Latin American",
  "Costa Rican": "Latin American", "Panamanian": "Latin American", "Guatemalan": "Latin American",
  "Honduran": "Latin American", "Salvadoran": "Latin American", "Nicaraguan": "Latin American",
  "Jamaican": "Latin American", "Haitian": "Latin American", "Trinidadian": "Latin American",
  "American": "North American", "Canadian": "North American",
  "Nigerian": "African", "South African": "African", "Egyptian": "African", "Kenyan": "African",
  "Ethiopian": "African", "Ghanaian": "African", "Moroccan": "African", "Algerian": "African",
  "Tunisian": "African", "Senegalese": "African", "Cameroonian": "African", "Tanzanian": "African",
  "Cape Verdean": "African",
  "Turkish": "Middle Eastern", "Iranian": "Middle Eastern", "Iraqi": "Middle Eastern",
  "Saudi": "Middle Eastern", "Saudi Arabian": "Middle Eastern", "Emirati": "Middle Eastern",
  "Qatari": "Middle Eastern", "Kuwaiti": "Middle Eastern", "Lebanese": "Middle Eastern",
  "Syrian": "Middle Eastern", "Israeli": "Middle Eastern", "Palestinian": "Middle Eastern",
  "Afghan": "Middle Eastern", "Jordanian": "Middle Eastern",
  "Australian": "Oceanian", "New Zealander": "Oceanian", "Kiwi": "Oceanian", "Fijian": "Oceanian",
};

function getRegion(nationality) {
  if (!nationality) return null;
  if (nationalityToRegion[nationality]) return nationalityToRegion[nationality];
  const normalized = nationality.trim();
  for (const [key, region] of Object.entries(nationalityToRegion)) {
    if (key.toLowerCase() === normalized.toLowerCase()) return region;
  }
  return "Other";
}

function getAgeBracket(age) {
  if (!age || age < 21) return null;
  if (age >= 21 && age <= 25) return "21-25";
  if (age >= 26 && age <= 30) return "26-30";
  return "30+";
}

// Occupation categories - keywords that map to broader categories
const occupationKeywords = {
  "Arts & Gallery": ["curator", "gallery", "artist", "painter", "sculptor", "art conservator", "art restorer", "museum", "exhibition", "fine art"],
  "Design & Creative": ["graphic design", "illustrator", "designer", "visual", "digital artist", "creative", "branding", "ui", "ux", "pattern", "textile"],
  "Photography & Film": ["photographer", "photography", "cinematographer", "videographer", "film"],
  "Architecture": ["architect", "architecture", "urban planning", "interior design"],
  "Food & Hospitality": ["chef", "baker", "pastry", "barista", "sommelier", "restaurant", "hotel", "hospitality", "café", "cafe", "tea house", "wine", "culinary", "food", "cook", "kitchen"],
  "Education & Academia": ["teacher", "instructor", "professor", "tutor", "student", "university", "school", "education", "lecturer"],
  "Business & Marketing": ["marketing", "manager", "business", "executive", "consultant", "entrepreneur", "startup", "agency", "director"],
  "Healthcare & Wellness": ["therapist", "nurse", "doctor", "medical", "health", "wellness", "yoga", "fitness", "counselor"],
  "Fashion & Beauty": ["fashion", "model", "stylist", "makeup", "beauty", "boutique", "jewelry", "jeweler", "leather"],
  "Travel & Tourism": ["tour guide", "travel", "tourism", "adventure"],
  "Tech & Engineering": ["engineer", "developer", "programmer", "tech", "software", "data"]
};

function getOccupationCategory(work) {
  if (!work) return null;
  const workLower = work.toLowerCase();
  for (const [category, keywords] of Object.entries(occupationKeywords)) {
    for (const keyword of keywords) {
      if (workLower.includes(keyword)) return category;
    }
  }
  return "Other";
}

// Nationality to Language mapping
const nationalityToLanguage = {
  "Japanese": "Japanese", "Korean": "Korean", "Chinese": "Mandarin", "Taiwanese": "Mandarin",
  "Hong Konger": "Cantonese", "Thai": "Thai", "Vietnamese": "Vietnamese", "Filipino": "Filipino",
  "Filipina": "Filipino", "Indonesian": "Indonesian", "Malaysian": "Malay", "Singaporean": "English",
  "Indian": "Hindi", "Pakistani": "Urdu", "Bangladeshi": "Bengali", "Sri Lankan": "Sinhala",
  "Nepali": "Nepali", "Mongolian": "Mongolian", "Cambodian": "Khmer", "Laotian": "Lao",
  "Myanmar": "Burmese", "Burmese": "Burmese", "Balinese": "Indonesian",
  "British": "English", "English": "English", "Scottish": "English", "Welsh": "English",
  "Irish": "English", "French": "French", "German": "German", "Italian": "Italian",
  "Spanish": "Spanish", "Portuguese": "Portuguese", "Dutch": "Dutch", "Belgian": "Dutch",
  "Swiss": "German", "Austrian": "German", "Swedish": "Swedish", "Norwegian": "Norwegian",
  "Danish": "Danish", "Finnish": "Finnish", "Polish": "Polish", "Czech": "Czech",
  "Hungarian": "Hungarian", "Romanian": "Romanian", "Bulgarian": "Bulgarian", "Greek": "Greek",
  "Croatian": "Croatian", "Serbian": "Serbian", "Slovenian": "Slovenian", "Slovak": "Slovak",
  "Ukrainian": "Ukrainian", "Russian": "Russian", "Belarusian": "Belarusian",
  "Lithuanian": "Lithuanian", "Latvian": "Latvian", "Estonian": "Estonian", "Icelandic": "Icelandic",
  "Albanian": "Albanian", "Macedonian": "Macedonian", "Montenegrin": "Serbian", "Bosnian": "Bosnian",
  "Brazilian": "Portuguese", "Mexican": "Spanish", "Argentine": "Spanish", "Argentinian": "Spanish",
  "Colombian": "Spanish", "Peruvian": "Spanish", "Venezuelan": "Spanish", "Chilean": "Spanish",
  "Ecuadorian": "Spanish", "Bolivian": "Spanish", "Paraguayan": "Spanish", "Uruguayan": "Spanish",
  "Cuban": "Spanish", "Dominican": "Spanish", "Puerto Rican": "Spanish", "Costa Rican": "Spanish",
  "Panamanian": "Spanish", "Guatemalan": "Spanish", "Honduran": "Spanish", "Salvadoran": "Spanish",
  "Nicaraguan": "Spanish", "Jamaican": "English", "Haitian": "French", "Trinidadian": "English",
  "American": "English", "Canadian": "English",
  "Nigerian": "English", "South African": "English", "Egyptian": "Arabic", "Kenyan": "Swahili",
  "Ethiopian": "Amharic", "Ghanaian": "English", "Moroccan": "Arabic", "Algerian": "Arabic",
  "Tunisian": "Arabic", "Senegalese": "French", "Cameroonian": "French", "Tanzanian": "Swahili",
  "Cape Verdean": "Portuguese",
  "Turkish": "Turkish", "Iranian": "Persian", "Iraqi": "Arabic", "Saudi": "Arabic",
  "Saudi Arabian": "Arabic", "Emirati": "Arabic", "Qatari": "Arabic", "Kuwaiti": "Arabic",
  "Lebanese": "Arabic", "Syrian": "Arabic", "Israeli": "Hebrew", "Palestinian": "Arabic",
  "Afghan": "Dari", "Jordanian": "Arabic",
  "Australian": "English", "New Zealander": "English", "Kiwi": "English", "Fijian": "English",
};

function getLanguage(nationality) {
  if (!nationality) return null;
  if (nationalityToLanguage[nationality]) return nationalityToLanguage[nationality];
  const normalized = nationality.trim();
  for (const [key, language] of Object.entries(nationalityToLanguage)) {
    if (key.toLowerCase() === normalized.toLowerCase()) return language;
  }
  return null;
}

// Initialize database connection
async function initDatabase() {
  if (!process.env.DATABASE_URL) {
    console.log('⚠️  DATABASE_URL not set - running without database');
    return false;
  }
  
  try {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle(pool);
    console.log('✅ Database connected');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// ============== TELEGRAM SCRAPING ==============
function parseChannelHTML(html, channelName) {
  const channelInfo = {
    name: channelName,
    avatar: null,
    description: null,
    subscribers: null,
  };

  let avatarUrl = null;
  const avatarMatch1 = html.match(/<img\s+class="tgme_page_photo_image"\s+src="([^"]+)"/);
  if (avatarMatch1) avatarUrl = avatarMatch1[1];
  if (!avatarUrl) {
    const avatarMatch2 = html.match(/<img[^>]*src="([^"]+)"[^>]*class="tgme_page_photo_image"/);
    if (avatarMatch2) avatarUrl = avatarMatch2[1];
  }
  if (!avatarUrl) {
    const ogImageMatch = html.match(/<meta\s*property="og:image"\s+content="([^"]+)"/i);
    if (ogImageMatch) avatarUrl = ogImageMatch[1];
  }
  if (avatarUrl) channelInfo.avatar = avatarUrl;

  const titleMatch = html.match(/<div class="tgme_page_title"[^>]*><span[^>]*>([^<]+)<\/span>/);
  if (titleMatch) channelInfo.name = titleMatch[1].trim();

  const descMatch = html.match(/<div class="tgme_page_description[^"]*"[^>]*>([\s\S]*?)<\/div>/);
  if (descMatch) {
    channelInfo.description = descMatch[1]
      .replace(/<[^>]+>/g, '')
      .replace(/&quot;/g, '"').replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num)))
      .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
      .trim();
  }

  const subsMatch = html.match(/<div class="tgme_page_extra">([^<]+subscribers?)<\/div>/i);
  if (subsMatch) channelInfo.subscribers = subsMatch[1].trim();
  
  const posts = [];
  const postRegex = /<div class="tgme_widget_message[^"]*"[^>]*data-post="([^"]*)"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/g;
  let match;

  while ((match = postRegex.exec(html)) !== null) {
    const postId = match[1];
    const postContent = match[2];

    let botLink = null;
    const linkRegex = /<a\s+([^>]*?)href="([^"]*?)"([^>]*?)>([\s\S]*?)<\/a>/gi;
    let linkMatch;
    while ((linkMatch = linkRegex.exec(postContent)) !== null) {
      const href = linkMatch[2];
      const linkText = linkMatch[4];
      if (href.toLowerCase().includes('nextwifebot') || linkText.toLowerCase().includes('nextwifebot')) {
        botLink = href.replace(/&amp;/g, '&').replace(/&quot;/g, '"')
          .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
          .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num)))
          .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
        break;
      }
    }

    const textMatch = /<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/.exec(postContent);
    const text = textMatch ? textMatch[1]
      .replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '')
      .replace(/&quot;/g, '"').replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num)))
      .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
      .trim() : '';

    let profileData = null;
    if (text) {
      const nameMatch = text.match(/Name:\s*([^\n]+)/i);
      const ageMatch = text.match(/Age:\s*(\d+)/i);
      const nationalityMatch = text.match(/Nationality:\s*([^\n]+)/i);
      const hometownMatch = text.match(/Hometown:\s*([^\n]+)/i);
      const workMatch = text.match(/Work:\s*([^\n]+)/i);

      if (nameMatch && ageMatch && nationalityMatch && hometownMatch && workMatch) {
        profileData = {
          name: nameMatch[1].trim(),
          age: parseInt(ageMatch[1]),
          nationality: nationalityMatch[1].trim(),
          hometown: hometownMatch[1].trim(),
          work: workMatch[1].trim()
        };
      }
    }

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

    if (serviceMessagePatterns.some(pattern => pattern.test(text))) continue;

    const dateMatch = /<time[^>]*datetime="([^"]*)"/.exec(postContent);
    const date = dateMatch ? dateMatch[1] : new Date().toISOString();

    const imageMatch = /<a[^>]*class="[^"]*tgme_widget_message_photo_wrap[^"]*"[^>]*style="[^"]*background-image:url\('([^']*)'/.exec(postContent);
    let media = imageMatch ? imageMatch[1] : null;
    if (media && media.startsWith('//')) media = 'https:' + media;

    let avatar = null;
    const avatarMatch = /<[^>]*class="[^"]*tgme_widget_message_user_photo[^"]*"[^>]*style="[^"]*background-image:\s*url\((?:'|")?([^'")]+)(?:'|")?\)[^"]*"[^>]*>/i.exec(postContent);
    if (avatarMatch) avatar = avatarMatch[1];
    if (avatar && avatar.startsWith('//')) avatar = 'https:' + avatar;
    if (avatar && /telegram\.org\/img\/emoji/.test(avatar)) avatar = null;
    if (!avatar) avatar = channelInfo.avatar || null;

    if (text || media) {
      posts.push({
        id: postId.split('/').pop(),
        text,
        date,
        link: `https://t.me/${channelName}/${postId.split('/').pop()}`,
        media,
        avatar,
        botLink,
        profileData
      });
    }
  }

  // Extract next cursor from load-more button (Telegram's pagination metadata)
  let nextCursor = null;
  const loadMoreMatch = html.match(/data-before="(\d+)"/);
  if (loadMoreMatch) {
    nextCursor = loadMoreMatch[1];
  }

  return { channelInfo, posts, nextCursor };
}

// ============== DATABASE SYNC ==============
// Normalize channel name to consistent format (no @, no underscores)
function normalizeChannel(channel) {
  return channel.replace('@', '').replace(/_/g, '');
}

async function syncPostsToDatabase(posts, channel = 'nextwife_ai') {
  if (!db) return { synced: 0, skipped: 0 };
  
  const channelName = normalizeChannel(channel);
  let synced = 0;
  let skipped = 0;
  
  for (const post of posts) {
    try {
      const region = post.profileData ? getRegion(post.profileData.nationality) : null;
      const ageBracket = post.profileData ? getAgeBracket(post.profileData.age) : null;
      const occupationCategory = post.profileData ? getOccupationCategory(post.profileData.work) : null;
      const language = post.profileData ? getLanguage(post.profileData.nationality) : null;
      
      await pool.query(`
        INSERT INTO telegram_posts (id, channel, text, date, link, media, avatar, bot_link, name, age, nationality, hometown, work, region, age_bracket, occupation_category, language, updated_at, deleted_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NULL)
        ON CONFLICT (id) DO UPDATE SET
          text = EXCLUDED.text,
          date = EXCLUDED.date,
          link = EXCLUDED.link,
          media = EXCLUDED.media,
          avatar = EXCLUDED.avatar,
          bot_link = EXCLUDED.bot_link,
          name = EXCLUDED.name,
          age = EXCLUDED.age,
          nationality = EXCLUDED.nationality,
          hometown = EXCLUDED.hometown,
          work = EXCLUDED.work,
          region = EXCLUDED.region,
          age_bracket = EXCLUDED.age_bracket,
          occupation_category = EXCLUDED.occupation_category,
          language = EXCLUDED.language,
          updated_at = NOW(),
          deleted_at = NULL
      `, [
        post.id,
        channelName,
        post.text,
        post.date,
        post.link,
        post.media,
        post.avatar,
        post.botLink,
        post.profileData?.name || null,
        post.profileData?.age || null,
        post.profileData?.nationality || null,
        post.profileData?.hometown || null,
        post.profileData?.work || null,
        region,
        ageBracket,
        occupationCategory,
        language
      ]);
      synced++;
    } catch (error) {
      console.error(`Failed to sync post ${post.id}:`, error.message);
      skipped++;
    }
  }
  
  return { synced, skipped };
}

// Background sync - fetch multiple pages and store in DB
async function backgroundSync(channel = 'nextwife_ai', maxPages = 10) {
  if (!db) {
    console.log('⚠️  Database not available for sync');
    return;
  }
  
  // Normalize channel name for Telegram URL (remove underscores)
  const telegramChannel = channel.replace(/_/g, '');
  
  console.log(`🔄 Starting background sync for @${channel} (fetching from ${telegramChannel})...`);
  let totalSynced = 0;
  let cursor = null;
  let lastCursor = null;
  
  for (let page = 0; page < maxPages; page++) {
    try {
      const ts = Date.now();
      const pageUrl = cursor 
        ? `https://t.me/s/${telegramChannel}?before=${cursor}&_=${ts}`
        : `https://t.me/s/${telegramChannel}?_=${ts}`;
      
      const response = await fetch(pageUrl);
      if (!response.ok) break;
      
      const html = await response.text();
      const result = parseChannelHTML(html, telegramChannel);
      
      if (result.posts.length === 0) break;
      
      const { synced } = await syncPostsToDatabase(result.posts, channel);
      totalSynced += synced;
      
      // Use Telegram's pagination cursor from load-more button
      // This properly handles pinned messages that would otherwise cause infinite loops
      if (result.nextCursor) {
        cursor = result.nextCursor;
      } else {
        // Fallback: use oldest non-pinned post ID minus 1
        const postIds = result.posts.map(p => parseInt(p.id)).filter(id => !isNaN(id));
        const oldestId = Math.min(...postIds);
        cursor = String(oldestId - 1);
      }
      
      // Prevent infinite loop if cursor doesn't advance
      if (cursor === lastCursor) {
        console.log(`  Pagination stalled at cursor ${cursor}, stopping sync`);
        break;
      }
      lastCursor = cursor;
      
      console.log(`  Page ${page + 1}: synced ${synced} posts (next cursor: ${cursor})`);
      
      // Small delay between pages
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`  Page ${page + 1} failed:`, error.message);
      break;
    }
  }
  
  console.log(`✅ Background sync complete: ${totalSynced} posts synced`);
  return totalSynced;
}

// ============== DELETED POST DETECTION ==============
// Throttled service to detect and soft-delete posts that were removed from Telegram
const syncState = {
  lastRun: 0,
  inFlight: false
};
const SYNC_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes between syncs
const SYNC_WINDOW = 200; // Check the most recent 200 posts

async function detectDeletedPosts(channel = 'nextwife_ai') {
  if (!db) return { deleted: 0, resurrected: 0 };
  
  // Throttle: don't run more than once per SYNC_INTERVAL_MS
  const now = Date.now();
  if (syncState.inFlight || now - syncState.lastRun < SYNC_INTERVAL_MS) {
    return { deleted: 0, resurrected: 0, throttled: true };
  }
  
  syncState.inFlight = true;
  syncState.lastRun = now;
  
  try {
    // Normalize channel name for both DB and Telegram (no @, no underscores)
    const channelName = normalizeChannel(channel);
    const telegramChannel = channelName;
    
    // Get the most recent SYNC_WINDOW posts from database (including deleted ones to check for resurrection)
    const dbResult = await pool.query(
      `SELECT id, deleted_at FROM telegram_posts 
       WHERE channel = $1 
       ORDER BY id::bigint DESC 
       LIMIT $2`,
      [channelName, SYNC_WINDOW]
    );
    
    const dbPosts = dbResult.rows;
    const dbIds = new Set(dbPosts.map(p => p.id));
    const deletedDbIds = new Set(dbPosts.filter(p => p.deleted_at).map(p => p.id));
    
    if (dbIds.size === 0) {
      syncState.inFlight = false;
      return { deleted: 0, resurrected: 0 };
    }
    
    // Get the ID range we need to check
    const dbIdNumbers = [...dbIds].map(id => parseInt(id)).filter(id => !isNaN(id));
    const maxDbId = Math.max(...dbIdNumbers);
    const minDbId = Math.min(...dbIdNumbers);
    
    console.log(`🔍 Detecting deleted posts for @${channel} (checking IDs ${minDbId}-${maxDbId})...`);
    
    // Fetch recent pages from Telegram to get live post IDs
    const liveIds = new Set();
    let cursor = null;
    const maxPages = 15; // Enough to cover SYNC_WINDOW posts
    
    for (let page = 0; page < maxPages; page++) {
      const ts = Date.now();
      const pageUrl = cursor
        ? `https://t.me/s/${telegramChannel}?before=${cursor}&_=${ts}`
        : `https://t.me/s/${telegramChannel}?_=${ts}`;
      
      try {
        const response = await fetch(pageUrl);
        if (!response.ok) break;
        
        const html = await response.text();
        const result = parseChannelHTML(html, telegramChannel);
        
        if (result.posts.length === 0) break;
        
        // Sync posts to database (also resurrects deleted posts by setting deleted_at to NULL via UPSERT)
        await syncPostsToDatabase(result.posts, channel);
        
        for (const post of result.posts) {
          liveIds.add(post.id);
        }
        
        // Check if we've covered the range we care about
        const postIdNumbers = result.posts.map(p => parseInt(p.id)).filter(id => !isNaN(id));
        const oldestFetched = Math.min(...postIdNumbers);
        
        if (oldestFetched <= minDbId) {
          // We've covered the range
          break;
        }
        
        // Get next cursor
        if (result.nextCursor) {
          cursor = result.nextCursor;
        } else {
          cursor = String(oldestFetched - 1);
        }
        
        // Delay between fetches to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`  Page ${page + 1} failed:`, error.message);
        break;
      }
    }
    
    // Find posts that are in DB but not in Telegram (deleted)
    const toDelete = [...dbIds].filter(id => !liveIds.has(id) && !deletedDbIds.has(id));
    
    // Find posts that were previously deleted but now exist (resurrected)
    const toResurrect = [...deletedDbIds].filter(id => liveIds.has(id));
    
    // Soft-delete missing posts
    if (toDelete.length > 0) {
      await pool.query(
        `UPDATE telegram_posts SET deleted_at = NOW() WHERE id = ANY($1) AND channel = $2`,
        [toDelete, channelName]
      );
      console.log(`  🗑️  Soft-deleted ${toDelete.length} posts: ${toDelete.join(', ')}`);
    }
    
    // Resurrect posts that reappeared
    if (toResurrect.length > 0) {
      await pool.query(
        `UPDATE telegram_posts SET deleted_at = NULL WHERE id = ANY($1) AND channel = $2`,
        [toResurrect, channelName]
      );
      console.log(`  ♻️  Resurrected ${toResurrect.length} posts: ${toResurrect.join(', ')}`);
    }
    
    console.log(`✅ Delete detection complete: ${toDelete.length} deleted, ${toResurrect.length} resurrected`);
    
    syncState.inFlight = false;
    return { deleted: toDelete.length, resurrected: toResurrect.length };
  } catch (error) {
    console.error('❌ Delete detection failed:', error.message);
    syncState.inFlight = false;
    return { deleted: 0, resurrected: 0, error: error.message };
  }
}

// ============== BACKGROUND SCHEDULER ==============
// Runs deleted post detection automatically, independent of page visits
const SCHEDULER_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
let schedulerRunning = false;

async function runScheduledSync() {
  if (!db || schedulerRunning) return;
  
  schedulerRunning = true;
  console.log('⏰ Scheduled sync starting...');
  
  try {
    // Reset throttle to allow sync regardless of last run
    syncState.lastRun = 0;
    
    const result = await detectDeletedPosts('nextwifeai');
    console.log(`⏰ Scheduled sync complete:`, result);
  } catch (error) {
    console.error('⏰ Scheduled sync error:', error.message);
  } finally {
    schedulerRunning = false;
  }
}

// Start the background scheduler when server starts
function startScheduler() {
  if (!process.env.DATABASE_URL) {
    console.log('⏰ Scheduler disabled (no database)');
    return;
  }
  
  console.log('⏰ Background sync scheduler started (every 30 minutes)');
  
  // Run immediately on startup (after a short delay for DB init)
  setTimeout(() => {
    runScheduledSync();
  }, 10000);
  
  // Then run every 30 minutes
  setInterval(runScheduledSync, SCHEDULER_INTERVAL_MS);
}

// ============== API ENDPOINTS ==============

// All occupation categories in display order
const ALL_OCCUPATION_CATEGORIES = [
  "Arts & Gallery",
  "Design & Creative",
  "Photography & Film",
  "Architecture",
  "Food & Hospitality",
  "Education & Academia",
  "Business & Marketing",
  "Healthcare & Wellness",
  "Fashion & Beauty",
  "Travel & Tourism",
  "Tech & Engineering",
  "Other"
];

// Get filter options from database
app.get('/api/tg-channel-filters', async (req, res) => {
  try {
    if (!db) {
      return res.json({
        regions: ["Asian", "European", "Latin American", "North American", "African", "Middle Eastern", "Oceanian", "Other"],
        ageBrackets: ["21-25", "26-30", "30+"],
        occupationCategories: ALL_OCCUPATION_CATEGORIES,
        languages: [],
        hometowns: {}
      });
    }
    
    const channel = req.query.channel || 'nextwife_ai';
    const channelName = channel.replace('@', '').replace(/_/g, '');
    
    // Get distinct regions, occupation categories, languages, and hometowns from database
    const [regionsResult, occupationResult, languagesResult, hometownsResult] = await Promise.all([
      pool.query(`SELECT DISTINCT region FROM telegram_posts WHERE channel = $1 AND region IS NOT NULL AND deleted_at IS NULL ORDER BY region`, [channelName]),
      pool.query(`SELECT DISTINCT occupation_category FROM telegram_posts WHERE channel = $1 AND occupation_category IS NOT NULL AND deleted_at IS NULL ORDER BY occupation_category`, [channelName]),
      pool.query(`SELECT DISTINCT language FROM telegram_posts WHERE channel = $1 AND language IS NOT NULL AND deleted_at IS NULL ORDER BY language`, [channelName]),
      pool.query(`SELECT DISTINCT region, hometown FROM telegram_posts WHERE channel = $1 AND hometown IS NOT NULL AND region IS NOT NULL AND deleted_at IS NULL ORDER BY region, hometown`, [channelName])
    ]);
    
    const regions = regionsResult.rows.map(r => r.region);
    const occupationCategories = occupationResult.rows.map(r => r.occupation_category);
    const languages = languagesResult.rows.map(r => r.language);
    
    // Group hometowns by region
    const hometowns = {};
    for (const row of hometownsResult.rows) {
      if (!hometowns[row.region]) {
        hometowns[row.region] = [];
      }
      if (!hometowns[row.region].includes(row.hometown)) {
        hometowns[row.region].push(row.hometown);
      }
    }
    
    res.json({
      regions: regions.length > 0 ? regions : ["Asian", "European", "Latin American", "North American", "African", "Middle Eastern", "Oceanian", "Other"],
      ageBrackets: ["21-25", "26-30", "30+"],
      occupationCategories: occupationCategories.length > 0 ? occupationCategories : ALL_OCCUPATION_CATEGORIES,
      languages,
      hometowns
    });
  } catch (error) {
    console.error('Error fetching filters:', error);
    res.status(500).json({ error: 'Failed to fetch filters' });
  }
});

// Get feed from database with filters
app.get('/api/tg-channel-feed', async (req, res) => {
  try {
    const channel = req.query.channel || 'nextwife_ai';
    const before = req.query.before;
    const limit = parseInt(req.query.limit || '20');
    // Normalize channel name: remove @ and underscores for Telegram URL compatibility
    const channelName = channel.replace('@', '').replace(/_/g, '');
    
    // Trigger background deleted post detection (fire and forget, throttled)
    if (db && !before) {
      detectDeletedPosts(channel).catch(err => console.error('Delete detection error:', err));
    }
    
    // Filter parameters
    const regions = req.query.region ? (Array.isArray(req.query.region) ? req.query.region : [req.query.region]) : null;
    const ageBrackets = req.query.ageBracket ? (Array.isArray(req.query.ageBracket) ? req.query.ageBracket : [req.query.ageBracket]) : null;
    const occupationCategories = req.query.occupationCategory ? (Array.isArray(req.query.occupationCategory) ? req.query.occupationCategory : [req.query.occupationCategory]) : null;
    const languages = req.query.language ? (Array.isArray(req.query.language) ? req.query.language : [req.query.language]) : null;
    const hometowns = req.query.hometown ? (Array.isArray(req.query.hometown) ? req.query.hometown : [req.query.hometown]) : null;
    const sortBy = req.query.sort || 'recent'; // 'recent' or 'hot'
    
    const hasFilters = regions || ageBrackets || occupationCategories || languages || hometowns || sortBy === 'hot';
    
    // If database is available and we have posts, use it
    if (db && hasFilters) {
      let query = `
        SELECT id, text, date, link, media, avatar, bot_link as "botLink", 
               name, age, nationality, hometown, work, region, age_bracket, occupation_category, language
        FROM telegram_posts 
        WHERE channel = $1 AND media IS NOT NULL AND deleted_at IS NULL
      `;
      const params = [channelName];
      let paramIndex = 2;
      
      if (regions && regions.length > 0) {
        query += ` AND region = ANY($${paramIndex})`;
        params.push(regions);
        paramIndex++;
      }
      
      if (ageBrackets && ageBrackets.length > 0) {
        query += ` AND age_bracket = ANY($${paramIndex})`;
        params.push(ageBrackets);
        paramIndex++;
      }
      
      if (occupationCategories && occupationCategories.length > 0) {
        query += ` AND occupation_category = ANY($${paramIndex})`;
        params.push(occupationCategories);
        paramIndex++;
      }
      
      if (languages && languages.length > 0) {
        query += ` AND language = ANY($${paramIndex})`;
        params.push(languages);
        paramIndex++;
      }
      
      if (hometowns && hometowns.length > 0) {
        query += ` AND hometown = ANY($${paramIndex})`;
        params.push(hometowns);
        paramIndex++;
      }
      
      if (before) {
        query += ` AND id::bigint < $${paramIndex}::bigint`;
        params.push(before);
        paramIndex++;
      }
      
      // Sort by popularity (click_count) or by recency (id)
      if (sortBy === 'hot') {
        query += ` ORDER BY COALESCE(click_count, 0) DESC, id::bigint DESC LIMIT $${paramIndex}`;
      } else {
        query += ` ORDER BY id::bigint DESC LIMIT $${paramIndex}`;
      }
      params.push(limit);
      
      const result = await pool.query(query, params);
      const posts = result.rows.map(row => ({
        id: row.id,
        text: row.text,
        date: row.date,
        link: row.link,
        media: row.media,
        avatar: row.avatar,
        botLink: row.botLink,
        profileData: row.name ? {
          name: row.name,
          age: row.age,
          nationality: row.nationality,
          hometown: row.hometown,
          work: row.work
        } : null
      }));
      
      const lastPost = posts[posts.length - 1];
      const nextCursor = lastPost ? lastPost.id : null;
      
      return res.json({
        posts,
        nextBefore: nextCursor,
        hasMore: posts.length === limit
      });
    }
    
    // Fallback to live Telegram scraping (no filters)
    console.log(`Fetching page from channel: ${channelName} (before: ${before || 'first'}, limit: ${limit})`);

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
    
    const posts = result.posts.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });

    // Sync to database in background
    if (db) {
      syncPostsToDatabase(posts, channelName).catch(err => console.error('Background sync error:', err));
    }

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

// Track click on a post
app.post('/api/tg-post-click', async (req, res) => {
  if (!db) {
    return res.status(503).json({ error: 'Database not available' });
  }
  
  try {
    const { postId } = req.body;
    if (!postId) {
      return res.status(400).json({ error: 'postId is required' });
    }
    
    await pool.query(
      `UPDATE telegram_posts SET click_count = COALESCE(click_count, 0) + 1 WHERE id = $1`,
      [postId]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking click:', error);
    res.status(500).json({ error: 'Failed to track click' });
  }
});

// Trigger manual sync
app.post('/api/tg-sync', async (req, res) => {
  try {
    const channel = req.query.channel || 'nextwife_ai';
    const pages = parseInt(req.query.pages || '10');
    const synced = await backgroundSync(channel, pages);
    res.json({ success: true, synced });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: 'Sync failed', message: error.message });
  }
});

// Cleanup deleted posts from database
app.post('/api/tg-cleanup', async (req, res) => {
  if (!db) {
    return res.status(503).json({ error: 'Database not available' });
  }
  
  try {
    const channel = req.query.channel || 'nextwife_ai';
    const channelName = channel.replace('@', '').replace(/_/g, '');
    
    // Get all post IDs from database for this channel
    const result = await pool.query(
      `SELECT id FROM telegram_posts WHERE channel = $1 ORDER BY id::bigint DESC`,
      [channelName]
    );
    
    const dbIds = result.rows.map(r => r.id);
    console.log(`🧹 Checking ${dbIds.length} posts for deletion...`);
    
    const deletedIds = [];
    const batchSize = 20;
    
    // Check posts in batches by fetching the channel page
    for (let i = 0; i < dbIds.length; i += batchSize) {
      const batch = dbIds.slice(i, i + batchSize);
      
      for (const postId of batch) {
        try {
          // Check if post exists by fetching its direct URL
          const postUrl = `https://t.me/${channelName}/${postId}?embed=1`;
          const response = await fetch(postUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TelegramFeed/1.0)' }
          });
          
          if (!response.ok) {
            deletedIds.push(postId);
            continue;
          }
          
          const html = await response.text();
          // Check for "Post not found" or similar indicators
          if (html.includes('tgme_widget_message_error') || 
              html.includes('Post not found') ||
              html.includes('This message') && html.includes('deleted')) {
            deletedIds.push(postId);
          }
        } catch (err) {
          console.error(`Error checking post ${postId}:`, err.message);
        }
      }
      
      // Small delay between batches to avoid rate limiting
      if (i + batchSize < dbIds.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // Delete the posts that were found to be deleted
    if (deletedIds.length > 0) {
      await pool.query(
        `DELETE FROM telegram_posts WHERE id = ANY($1)`,
        [deletedIds]
      );
      console.log(`🗑️ Deleted ${deletedIds.length} posts: ${deletedIds.join(', ')}`);
    }
    
    res.json({ 
      success: true, 
      checked: dbIds.length, 
      deleted: deletedIds.length,
      deletedIds 
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ error: 'Cleanup failed', message: error.message });
  }
});

// Image proxy endpoint
app.get('/api/tg-image-proxy', async (req, res) => {
  try {
    const imageUrl = req.query.u;
    if (!imageUrl) {
      return res.status(400).json({ error: 'Missing image URL parameter "u"' });
    }

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

    const imageResponse = await fetch(imageUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TelegramImageProxy/1.0)' },
    });

    if (!imageResponse.ok) {
      return res.status(502).json({ error: 'Failed to fetch image', status: imageResponse.status });
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
    res.status(500).json({ error: 'Failed to proxy image', message: error.message });
  }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, 'dist');
  console.log(`📦 Serving static files from: ${distPath}`);
  app.use(express.static(distPath));
  app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Start server
async function start() {
  const dbConnected = await initDatabase();
  
  app.listen(PORT, '0.0.0.0', async () => {
    console.log(`\n🚀 Backend server running on http://0.0.0.0:${PORT}`);
    console.log(`📡 API endpoints:`);
    console.log(`   - GET /api/tg-channel-feed?channel=nextwife_ai`);
    console.log(`   - GET /api/tg-channel-filters`);
    console.log(`   - POST /api/tg-sync`);
    console.log(`   - GET /api/tg-image-proxy?u=<image_url>`);
    if (process.env.NODE_ENV === 'production') {
      console.log(`🌐 Serving frontend from dist/`);
    }
    console.log(`💾 Database: ${dbConnected ? 'Connected' : 'Not available'}`);
    
    // Run initial sync on startup if database is available - fetch ALL posts
    // Use 'nextwifeai' (without underscore) as the canonical channel name
    if (dbConnected) {
      console.log('');
      setTimeout(() => backgroundSync('nextwifeai', 200), 2000); // Fetch up to 4000 posts
      
      // Start the background scheduler for deleted post detection
      startScheduler();
    }
    console.log('');
  });
}

start();
