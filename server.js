import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, desc, and, inArray, sql } from 'drizzle-orm';
import { countries, languages } from 'countries-list';

const app = express();
const PORT = process.env.PORT || 3001;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

// Serve static files from public folder (for og-image.jpg, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// ============== DATABASE SETUP ==============
const { Pool } = pg;
let db = null;
let pool = null;

// ============== TELEGRAM BOT API CONFIG ==============
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

async function telegramApiCall(method, params = {}) {
  if (!TELEGRAM_BOT_TOKEN) {
    throw new Error('TELEGRAM_BOT_TOKEN not configured');
  }
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await response.json();
  if (!data.ok) {
    throw new Error(`Telegram API error: ${data.description}`);
  }
  return data.result;
}

async function getHighResImageUrl(fileId) {
  const file = await telegramApiCall('getFile', { file_id: fileId });
  return `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${file.file_path}`;
}

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

// Demonym to ISO country code mapping for language lookup
const demonymToCountryCode = {
  "Japanese": "JP", "Korean": "KR", "Chinese": "CN", "Taiwanese": "TW", "Hong Konger": "HK",
  "Thai": "TH", "Vietnamese": "VN", "Filipino": "PH", "Filipina": "PH", "Indonesian": "ID",
  "Balinese": "ID", "Malaysian": "MY", "Singaporean": "SG", "Indian": "IN", "Pakistani": "PK",
  "Bangladeshi": "BD", "Sri Lankan": "LK", "Nepali": "NP", "Mongolian": "MN", "Cambodian": "KH",
  "Laotian": "LA", "Myanmar": "MM", "Burmese": "MM",
  "British": "GB", "English": "GB", "Scottish": "GB", "Welsh": "GB", "Irish": "IE",
  "French": "FR", "German": "DE", "Italian": "IT", "Spanish": "ES", "Portuguese": "PT",
  "Dutch": "NL", "Belgian": "BE", "Swiss": "CH", "Austrian": "AT", "Swedish": "SE",
  "Norwegian": "NO", "Danish": "DK", "Finnish": "FI", "Polish": "PL", "Czech": "CZ",
  "Hungarian": "HU", "Romanian": "RO", "Bulgarian": "BG", "Greek": "GR", "Croatian": "HR",
  "Serbian": "RS", "Slovenian": "SI", "Slovak": "SK", "Ukrainian": "UA", "Russian": "RU",
  "Belarusian": "BY", "Lithuanian": "LT", "Latvian": "LV", "Estonian": "EE", "Icelandic": "IS",
  "Luxembourgish": "LU", "Maltese": "MT", "Cypriot": "CY", "Albanian": "AL", "Macedonian": "MK",
  "Montenegrin": "ME", "Bosnian": "BA", "Moldovan": "MD",
  "Brazilian": "BR", "Mexican": "MX", "Argentine": "AR", "Argentinian": "AR", "Colombian": "CO",
  "Peruvian": "PE", "Venezuelan": "VE", "Chilean": "CL", "Ecuadorian": "EC", "Bolivian": "BO",
  "Paraguayan": "PY", "Uruguayan": "UY", "Cuban": "CU", "Dominican": "DO", "Puerto Rican": "PR",
  "Costa Rican": "CR", "Panamanian": "PA", "Guatemalan": "GT", "Honduran": "HN", "Salvadoran": "SV",
  "Nicaraguan": "NI", "Jamaican": "JM", "Haitian": "HT", "Trinidadian": "TT",
  "American": "US", "Canadian": "CA",
  "Nigerian": "NG", "South African": "ZA", "Egyptian": "EG", "Kenyan": "KE", "Ethiopian": "ET",
  "Ghanaian": "GH", "Moroccan": "MA", "Algerian": "DZ", "Tunisian": "TN", "Senegalese": "SN",
  "Cameroonian": "CM", "Tanzanian": "TZ", "Ugandan": "UG", "Zimbabwean": "ZW", "Congolese": "CD",
  "Ivorian": "CI", "Sudanese": "SD", "Angolan": "AO", "Mozambican": "MZ", "Rwandan": "RW",
  "Cape Verdean": "CV",
  "Turkish": "TR", "Iranian": "IR", "Iraqi": "IQ", "Saudi": "SA", "Saudi Arabian": "SA",
  "Emirati": "AE", "Qatari": "QA", "Kuwaiti": "KW", "Bahraini": "BH", "Omani": "OM",
  "Yemeni": "YE", "Jordanian": "JO", "Lebanese": "LB", "Syrian": "SY", "Israeli": "IL",
  "Palestinian": "PS", "Afghan": "AF", "Uzbek": "UZ", "Kazakh": "KZ", "Azerbaijani": "AZ",
  "Georgian": "GE", "Armenian": "AM",
  "Australian": "AU", "New Zealander": "NZ", "Kiwi": "NZ", "Fijian": "FJ", "Samoan": "WS",
  "Tongan": "TO", "Papua New Guinean": "PG",
  // Country name fallbacks (when nationality is stored as country name instead of demonym)
  "Japan": "JP", "Korea": "KR", "South Korea": "KR", "China": "CN", "Taiwan": "TW",
  "Thailand": "TH", "Vietnam": "VN", "Philippines": "PH", "Indonesia": "ID", "Bali": "ID",
  "Malaysia": "MY", "Singapore": "SG", "India": "IN", "Pakistan": "PK", "Bangladesh": "BD",
  "Sri Lanka": "LK", "Nepal": "NP", "Mongolia": "MN", "Cambodia": "KH", "Laos": "LA",
  "UK": "GB", "United Kingdom": "GB", "England": "GB", "Scotland": "GB", "Wales": "GB",
  "Ireland": "IE", "France": "FR", "Germany": "DE", "Italy": "IT", "Spain": "ES",
  "Portugal": "PT", "Netherlands": "NL", "Belgium": "BE", "Switzerland": "CH", "Austria": "AT",
  "Sweden": "SE", "Norway": "NO", "Denmark": "DK", "Finland": "FI", "Poland": "PL",
  "Czech Republic": "CZ", "Czechia": "CZ", "Hungary": "HU", "Romania": "RO", "Bulgaria": "BG",
  "Greece": "GR", "Croatia": "HR", "Serbia": "RS", "Slovenia": "SI", "Slovakia": "SK",
  "Ukraine": "UA", "Russia": "RU", "Belarus": "BY", "Lithuania": "LT", "Latvia": "LV",
  "Estonia": "EE", "Iceland": "IS", "Luxembourg": "LU", "Malta": "MT", "Cyprus": "CY",
  "Albania": "AL", "North Macedonia": "MK", "Macedonia": "MK", "Montenegro": "ME",
  "Bosnia": "BA", "Bosnia and Herzegovina": "BA", "Moldova": "MD",
  "Brazil": "BR", "Mexico": "MX", "Argentina": "AR", "Colombia": "CO", "Peru": "PE",
  "Venezuela": "VE", "Chile": "CL", "Ecuador": "EC", "Bolivia": "BO", "Paraguay": "PY",
  "Uruguay": "UY", "Cuba": "CU", "Dominican Republic": "DO", "Puerto Rico": "PR",
  "Costa Rica": "CR", "Panama": "PA", "Guatemala": "GT", "Honduras": "HN", "El Salvador": "SV",
  "Nicaragua": "NI", "Jamaica": "JM", "Haiti": "HT", "Trinidad and Tobago": "TT",
  "USA": "US", "United States": "US", "America": "US", "Canada": "CA",
  "Nigeria": "NG", "South Africa": "ZA", "Egypt": "EG", "Kenya": "KE", "Ethiopia": "ET",
  "Ghana": "GH", "Morocco": "MA", "Algeria": "DZ", "Tunisia": "TN", "Senegal": "SN",
  "Cameroon": "CM", "Tanzania": "TZ", "Uganda": "UG", "Zimbabwe": "ZW", "Congo": "CD",
  "Ivory Coast": "CI", "Sudan": "SD", "Angola": "AO", "Mozambique": "MZ", "Rwanda": "RW",
  "Cape Verde": "CV", "Cabo Verde": "CV",
  "Turkey": "TR", "Iran": "IR", "Iraq": "IQ", "Saudi Arabia": "SA", "UAE": "AE",
  "United Arab Emirates": "AE", "Qatar": "QA", "Kuwait": "KW", "Bahrain": "BH", "Oman": "OM",
  "Yemen": "YE", "Jordan": "JO", "Lebanon": "LB", "Syria": "SY", "Israel": "IL",
  "Palestine": "PS", "Afghanistan": "AF", "Uzbekistan": "UZ", "Kazakhstan": "KZ", "Azerbaijan": "AZ",
  "Georgia": "GE", "Armenia": "AM",
  "Australia": "AU", "New Zealand": "NZ", "Fiji": "FJ", "Samoa": "WS", "Tonga": "TO",
  "Papua New Guinea": "PG"
};

// Helper to get language name from ISO code using countries-list
function getLanguageName(code) {
  if (!code) return null;
  const lang = languages[code];
  return lang ? lang.name : code.toUpperCase();
}

// Direct nationality-to-language mapping for when nationality IS a language/ethnicity name
const directLanguageMap = {
  "Telugu": "Telugu", "Tamil": "Tamil", "Kannada": "Kannada", "Malayalam": "Malayalam",
  "Marathi": "Marathi", "Gujarati": "Gujarati", "Punjabi": "Punjabi", "Bengali": "Bengali",
  "Odia": "Odia", "Assamese": "Assamese", "Kashmiri": "Kashmiri", "Sindhi": "Sindhi",
  "Konkani": "Konkani", "Manipuri": "Manipuri", "Nepali": "Nepali", "Sanskrit": "Sanskrit",
  "Cantonese": "Cantonese", "Hokkien": "Hokkien", "Hakka": "Hakka", "Teochew": "Teochew"
};

// Extract country from hometown (e.g., "Dublin, Ireland" -> "Ireland")
function extractCountryFromHometown(hometown) {
  if (!hometown) return null;
  const parts = hometown.split(',').map(p => p.trim());
  // Return the last part which is typically the country
  return parts.length > 1 ? parts[parts.length - 1] : null;
}

// Get native language from nationality or hometown country
// Prefers the first non-English language if available, falls back to English
function getNativeLanguage(nationality, hometown) {
  // Try to find country code from nationality first, then hometown country
  const sources = [nationality, extractCountryFromHometown(hometown)].filter(Boolean);
  
  for (const source of sources) {
    const normalized = source.trim();
    
    // Check if the source is actually a language/ethnicity name
    if (directLanguageMap[normalized]) {
      return directLanguageMap[normalized];
    }
    
    let countryCode = demonymToCountryCode[normalized];
    
    if (!countryCode) {
      // Case-insensitive fallback
      for (const [demonym, code] of Object.entries(demonymToCountryCode)) {
        if (demonym.toLowerCase() === normalized.toLowerCase()) {
          countryCode = code;
          break;
        }
      }
    }
    
    if (countryCode) {
      const country = countries[countryCode];
      if (country && country.languages && country.languages.length > 0) {
        // Prefer first non-English language (for multilingual countries like Nigeria, Singapore)
        const nonEnglishLang = country.languages.find(code => code !== 'en');
        if (nonEnglishLang) {
          return getLanguageName(nonEnglishLang);
        }
        // If only English is available, return English
        if (country.languages.includes('en')) {
          return "English";
        }
      }
    }
  }
  
  return "English";
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
  // Match widget message up to footer boundary (date extracted from match[0] which includes footer)
  const postRegex = /<div class="tgme_widget_message_wrap[^"]*"[^>]*>\s*<div class="tgme_widget_message[^"]*"[^>]*data-post="([^"]*)"[^>]*>([\s\S]*?)<div class="tgme_widget_message_footer/g;
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
      const personalityMatch = text.match(/Personality:\s*([^\n]+)/i);
      const relationshipMatch = text.match(/Relationship:\s*([^\n]+)/i);
      const aboutMatch = text.match(/About:\s*([^\n]+(?:\n(?!Meet me|Name:|Age:|Nationality:|Hometown:|Work:|Personality:|Relationship:)[^\n]+)*)/i);

      if (nameMatch && ageMatch && nationalityMatch && hometownMatch && workMatch) {
        // Strip trailing numbers in parentheses like "(1)", "(2)", "(3)" from names
        const cleanName = nameMatch[1].trim().replace(/\s*\(\d+\)\s*$/, '');
        profileData = {
          name: cleanName,
          age: parseInt(ageMatch[1]),
          nationality: nationalityMatch[1].trim(),
          hometown: hometownMatch[1].trim(),
          work: workMatch[1].trim(),
          personality: personalityMatch ? personalityMatch[1].trim().toLowerCase() : null,
          relationship: relationshipMatch ? relationshipMatch[1].trim().toLowerCase() : 'girlfriend',
          about: aboutMatch ? aboutMatch[1].trim() : null
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

    // Extract date from footer section which starts right after match[0]
    // The footer contains <time datetime="..."> within about 400-600 chars
    const footerStart = match.index + match[0].length;
    const footerSection = html.substring(footerStart, footerStart + 600);
    const dateMatch = /<time[^>]*datetime="([^"]*)"/.exec(footerSection);
    const date = dateMatch ? dateMatch[1] : new Date().toISOString();

    // Extract ALL media URLs (photos and videos) from the post in DOM order
    const mediaItems = [];
    
    // Find all media elements with their positions to maintain original order
    const photoRegex = /<a[^>]*class="[^"]*tgme_widget_message_photo_wrap[^"]*"[^>]*style="[^"]*background-image:url\('([^']*)'/g;
    let photoMatch;
    while ((photoMatch = photoRegex.exec(postContent)) !== null) {
      let url = photoMatch[1];
      if (url && url.startsWith('//')) url = 'https:' + url;
      if (url) {
        mediaItems.push({ type: 'photo', url, index: photoMatch.index });
      }
    }
    
    // Extract videos - look for video elements with src attribute
    const videoRegex = /<video[^>]*src="([^"]+)"[^>]*class="[^"]*tgme_widget_message_video[^"]*"/g;
    let videoMatch;
    while ((videoMatch = videoRegex.exec(postContent)) !== null) {
      let url = videoMatch[1];
      if (url && url.startsWith('//')) url = 'https:' + url;
      if (url) {
        mediaItems.push({ type: 'video', url, index: videoMatch.index });
      }
    }
    
    // Also try alternate video pattern where class comes before src
    const videoRegex2 = /<video[^>]*class="[^"]*tgme_widget_message_video[^"]*"[^>]*src="([^"]+)"/g;
    while ((videoMatch = videoRegex2.exec(postContent)) !== null) {
      let url = videoMatch[1];
      if (url && url.startsWith('//')) url = 'https:' + url;
      if (url) {
        mediaItems.push({ type: 'video', url, index: videoMatch.index });
      }
    }
    
    // Sort by position in HTML to preserve original order, then dedupe
    mediaItems.sort((a, b) => a.index - b.index);
    const mediaUrls = [];
    for (const item of mediaItems) {
      if (!mediaUrls.some(m => m.url === item.url)) {
        mediaUrls.push({ type: item.type, url: item.url });
      }
    }
    
    // Keep backward compatibility - use first media as primary
    let media = mediaUrls.length > 0 ? mediaUrls[0].url : null;

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
        mediaUrls: mediaUrls.length > 0 ? mediaUrls : null,
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

// ============== SINGLE POST FETCH ==============
// Parse single-post embed HTML (different format from channel feed)
function parseSinglePostHTML(html, postId, channelName) {
  // Single-post embeds don't have tgme_widget_message_wrap or data-post
  // They have tgme_widget_message directly
  
  // Extract text content
  const textMatch = /<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/.exec(html);
  const text = textMatch ? textMatch[1]
    .replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '')
    .replace(/&quot;/g, '"').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .trim() : '';
  
  if (!text) return null;
  
  // Parse profile data
  let profileData = null;
  const nameMatch = text.match(/Name:\s*([^\n]+)/i);
  const ageMatch = text.match(/Age:\s*(\d+)/i);
  const nationalityMatch = text.match(/Nationality:\s*([^\n]+)/i);
  const hometownMatch = text.match(/Hometown:\s*([^\n]+)/i);
  const workMatch = text.match(/Work:\s*([^\n]+)/i);
  const personalityMatch = text.match(/Personality:\s*([^\n]+)/i);
  const relationshipMatch = text.match(/Relationship:\s*([^\n]+)/i);
  const aboutMatch = text.match(/About:\s*([^\n]+(?:\n(?!Meet me|Name:|Age:|Nationality:|Hometown:|Work:|Personality:|Relationship:)[^\n]+)*)/i);

  if (nameMatch && ageMatch && nationalityMatch && hometownMatch && workMatch) {
    const cleanName = nameMatch[1].trim().replace(/\s*\(\d+\)\s*$/, '');
    profileData = {
      name: cleanName,
      age: parseInt(ageMatch[1]),
      nationality: nationalityMatch[1].trim(),
      hometown: hometownMatch[1].trim(),
      work: workMatch[1].trim(),
      personality: personalityMatch ? personalityMatch[1].trim().toLowerCase() : null,
      relationship: relationshipMatch ? relationshipMatch[1].trim().toLowerCase() : 'girlfriend',
      about: aboutMatch ? aboutMatch[1].trim() : null
    };
  }
  
  // Extract bot link
  let botLink = null;
  const linkRegex = /<a\s+([^>]*?)href="([^"]*?)"([^>]*?)>([\s\S]*?)<\/a>/gi;
  let linkMatch;
  while ((linkMatch = linkRegex.exec(html)) !== null) {
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
  
  // Extract media URLs in DOM order
  const mediaItems = [];
  
  // Photos
  const photoRegex = /class="[^"]*tgme_widget_message_photo_wrap[^"]*"[^>]*style="[^"]*background-image:url\('([^']*)'/g;
  let photoMatch;
  while ((photoMatch = photoRegex.exec(html)) !== null) {
    let url = photoMatch[1];
    if (url && url.startsWith('//')) url = 'https:' + url;
    if (url) {
      mediaItems.push({ type: 'photo', url, index: photoMatch.index });
    }
  }
  
  // Videos
  const videoRegex = /<video[^>]*src="([^"]+)"[^>]*class="[^"]*tgme_widget_message_video/g;
  let videoMatch;
  while ((videoMatch = videoRegex.exec(html)) !== null) {
    let url = videoMatch[1];
    if (url && url.startsWith('//')) url = 'https:' + url;
    if (url) {
      mediaItems.push({ type: 'video', url, index: videoMatch.index });
    }
  }
  
  const videoRegex2 = /<video[^>]*class="[^"]*tgme_widget_message_video[^"]*"[^>]*src="([^"]+)"/g;
  while ((videoMatch = videoRegex2.exec(html)) !== null) {
    let url = videoMatch[1];
    if (url && url.startsWith('//')) url = 'https:' + url;
    if (url) {
      mediaItems.push({ type: 'video', url, index: videoMatch.index });
    }
  }
  
  // Sort by position in HTML to preserve original order, then dedupe
  mediaItems.sort((a, b) => a.index - b.index);
  const mediaUrls = [];
  for (const item of mediaItems) {
    if (!mediaUrls.some(m => m.url === item.url)) {
      mediaUrls.push({ type: item.type, url: item.url });
    }
  }
  
  const media = mediaUrls.length > 0 ? mediaUrls[0].url : null;
  
  // Extract date
  const dateMatch = /<time[^>]*datetime="([^"]*)"/.exec(html);
  const date = dateMatch ? dateMatch[1] : new Date().toISOString();
  
  // Extract avatar
  let avatar = null;
  const avatarMatch = /class="[^"]*tgme_widget_message_user_photo[^"]*"[^>]*style="[^"]*background-image:\s*url\((?:'|")?([^'")]+)(?:'|")?\)/i.exec(html);
  if (avatarMatch) avatar = avatarMatch[1];
  if (avatar && avatar.startsWith('//')) avatar = 'https:' + avatar;
  
  if (!media) return null;
  
  return {
    id: postId,
    text,
    date,
    link: `https://t.me/${channelName}/${postId}`,
    media,
    mediaUrls: mediaUrls.length > 0 ? mediaUrls : null,
    avatar,
    botLink,
    profileData
  };
}

// Fetch a single post directly from Telegram (fallback when not in DB)
async function fetchSinglePost(postId, channel = 'nextwife_ai') {
  const telegramChannel = channel.replace(/_/g, '').replace('@', '');
  const url = `https://t.me/${telegramChannel}/${postId}?embed=1&single=1`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) return null;
    
    const html = await response.text();
    
    // Try single-post parser first (for ?single=1 embeds)
    const singlePost = parseSinglePostHTML(html, postId, telegramChannel);
    if (singlePost) return singlePost;
    
    // Fallback to channel feed parser
    const result = parseChannelHTML(html, telegramChannel);
    if (result.posts.length === 0) return null;
    
    return result.posts.find(p => p.id === postId) || result.posts[0];
  } catch (error) {
    console.error(`Failed to fetch single post ${postId}:`, error.message);
    return null;
  }
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
      const language = post.profileData ? getNativeLanguage(post.profileData.nationality, post.profileData.hometown) : null;
      
      // Calculate media flags
      const hasVideo = post.mediaUrls ? post.mediaUrls.some(m => m.type === 'video') : false;
      const hasMultipleMedia = post.mediaUrls ? post.mediaUrls.length > 1 : false;
      
      await pool.query(`
        INSERT INTO telegram_posts (id, channel, text, date, link, media, media_urls, avatar, bot_link, name, age, nationality, hometown, work, region, age_bracket, occupation_category, language, personality, relationship, about, has_video, has_multiple_media, updated_at, deleted_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, NOW(), NULL)
        ON CONFLICT (id) DO UPDATE SET
          text = EXCLUDED.text,
          date = EXCLUDED.date,
          link = EXCLUDED.link,
          media = EXCLUDED.media,
          media_urls = EXCLUDED.media_urls,
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
          personality = EXCLUDED.personality,
          relationship = EXCLUDED.relationship,
          about = EXCLUDED.about,
          has_video = EXCLUDED.has_video,
          has_multiple_media = EXCLUDED.has_multiple_media,
          updated_at = NOW(),
          deleted_at = NULL
      `, [
        post.id,
        channelName,
        post.text,
        post.date,
        post.link,
        post.media,
        post.mediaUrls ? JSON.stringify(post.mediaUrls) : null,
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
        language,
        post.profileData?.personality || null,
        post.profileData?.relationship || null,
        post.profileData?.about || null,
        hasVideo,
        hasMultipleMedia
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

// ============== QUICK SYNC (NEW POSTS ONLY) ==============
// Fetches only new posts from Telegram until it finds one already in DB
// Called on every page load for instant updates
async function syncNewPosts(channel = 'nextwife_ai') {
  if (!db) return { synced: 0 };
  
  const channelName = normalizeChannel(channel);
  const telegramChannel = channelName;
  
  let totalSynced = 0;
  let cursor = null;
  const maxPages = 5; // Safety limit
  
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
      
      // Check which posts already exist in DB
      const postIds = result.posts.map(p => p.id);
      const existingResult = await pool.query(
        `SELECT id FROM telegram_posts WHERE id = ANY($1) AND channel = $2`,
        [postIds, channelName]
      );
      const existingIds = new Set(existingResult.rows.map(r => r.id));
      
      // Filter to only new posts
      const newPosts = result.posts.filter(p => !existingIds.has(p.id));
      
      if (newPosts.length > 0) {
        const { synced } = await syncPostsToDatabase(newPosts, channel);
        totalSynced += synced;
        if (synced > 0) {
          console.log(`⚡ Quick sync: ${synced} new posts from page ${page + 1}`);
        }
      }
      
      // If we found any existing posts, we've caught up - stop syncing
      if (existingIds.size > 0) {
        break;
      }
      
      // Continue to next page if all posts were new
      if (result.nextCursor) {
        cursor = result.nextCursor;
      } else {
        break;
      }
      
      // Small delay between pages
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      console.error(`Quick sync page ${page + 1} failed:`, error.message);
      break;
    }
  }
  
  return { synced: totalSynced };
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

// ============== TELEGRAM BOT API UPDATES ==============
let lastUpdateId = 0;

async function pollBotUpdates() {
  if (!TELEGRAM_BOT_TOKEN || !db) return;
  
  try {
    const updates = await telegramApiCall('getUpdates', {
      offset: lastUpdateId + 1,
      allowed_updates: ['channel_post'],
      timeout: 0,
    });
    
    if (!updates || updates.length === 0) return;
    
    console.log(`📥 Received ${updates.length} Bot API updates`);
    
    for (const update of updates) {
      lastUpdateId = Math.max(lastUpdateId, update.update_id);
      
      const post = update.channel_post;
      if (!post) continue;
      
      const chatId = post.chat?.id;
      const messageId = post.message_id;
      
      if (!messageId) continue;
      
      const fileIds = [];
      
      if (post.photo && post.photo.length > 0) {
        const bestPhoto = post.photo[post.photo.length - 1];
        fileIds.push({ type: 'photo', file_id: bestPhoto.file_id });
      }
      
      if (post.video) {
        fileIds.push({ type: 'video', file_id: post.video.file_id });
      }
      
      if (fileIds.length > 0) {
        try {
          await pool.query(
            `UPDATE telegram_posts SET photo_file_ids = $1, updated_at = NOW() WHERE id = $2`,
            [JSON.stringify(fileIds), String(messageId)]
          );
          console.log(`  ✅ Stored file IDs for post ${messageId}`);
        } catch (err) {
          console.log(`  ⚠️ Could not update post ${messageId}: ${err.message}`);
        }
      }
    }
  } catch (error) {
    if (!error.message?.includes('not configured')) {
      console.error('Bot API poll error:', error.message);
    }
  }
}

// ============== BACKGROUND SCHEDULER ==============
// Runs deleted post detection automatically, independent of page visits
const SCHEDULER_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
let schedulerRunning = false;

async function runScheduledSync() {
  if (!db || schedulerRunning) return;
  
  schedulerRunning = true;
  console.log('⏰ Scheduled sync starting...');
  
  try {
    // Reset throttle to allow sync regardless of last run
    syncState.lastRun = 0;
    
    // Poll Bot API for new updates with file IDs
    await pollBotUpdates();
    
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
  
  console.log('⏰ Background sync scheduler started (every 10 minutes)');
  
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
        hometowns: {},
        personalities: [],
        relationships: []
      });
    }
    
    const channel = req.query.channel || 'nextwife_ai';
    const channelName = channel.replace('@', '').replace(/_/g, '');
    
    // Get distinct regions, occupation categories, languages, hometowns, personalities, and relationships from database
    const [regionsResult, occupationResult, languagesResult, hometownsResult, personalitiesResult, relationshipsResult] = await Promise.all([
      pool.query(`SELECT DISTINCT region FROM telegram_posts WHERE channel = $1 AND region IS NOT NULL AND deleted_at IS NULL ORDER BY region`, [channelName]),
      pool.query(`SELECT DISTINCT occupation_category FROM telegram_posts WHERE channel = $1 AND occupation_category IS NOT NULL AND deleted_at IS NULL ORDER BY occupation_category`, [channelName]),
      pool.query(`SELECT DISTINCT language FROM telegram_posts WHERE channel = $1 AND language IS NOT NULL AND deleted_at IS NULL ORDER BY language`, [channelName]),
      pool.query(`SELECT DISTINCT region, hometown FROM telegram_posts WHERE channel = $1 AND hometown IS NOT NULL AND region IS NOT NULL AND deleted_at IS NULL ORDER BY region, hometown`, [channelName]),
      pool.query(`SELECT DISTINCT personality FROM telegram_posts WHERE channel = $1 AND personality IS NOT NULL AND deleted_at IS NULL ORDER BY personality`, [channelName]),
      pool.query(`SELECT DISTINCT relationship FROM telegram_posts WHERE channel = $1 AND relationship IS NOT NULL AND deleted_at IS NULL ORDER BY relationship`, [channelName])
    ]);
    
    const regions = regionsResult.rows.map(r => r.region);
    const occupationCategories = occupationResult.rows.map(r => r.occupation_category);
    const languages = languagesResult.rows.map(r => r.language);
    const personalities = personalitiesResult.rows.map(r => r.personality);
    const relationships = relationshipsResult.rows.map(r => r.relationship);
    
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
      hometowns,
      personalities,
      relationships
    });
  } catch (error) {
    console.error('Error fetching filters:', error);
    res.status(500).json({ error: 'Failed to fetch filters' });
  }
});

// Get single profile by ID with adjacent profile IDs for navigation
app.get('/api/tg-profile/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const channel = req.query.channel || 'nextwife_ai';
    const channelName = channel.replace('@', '').replace(/_/g, '');
    
    if (!pool) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
    // First check if post exists (with or without enriched data)
    let result = await pool.query(`
      SELECT id, text, date, link, media, media_urls, photo_file_ids, avatar, bot_link as "botLink", 
             name, age, nationality, hometown, work, region, age_bracket, occupation_category, language, click_count, personality, relationship, about
      FROM telegram_posts 
      WHERE channel = $1 AND id = $2 AND deleted_at IS NULL AND media IS NOT NULL
    `, [channelName, id]);
    
    // If not found in DB at all, fetch from Telegram
    if (result.rows.length === 0) {
      const telegramPost = await fetchSinglePost(id, channel);
      
      if (telegramPost && telegramPost.media) {
        // Sync this post to database for future requests
        await syncPostsToDatabase([telegramPost], channel);
        
        // Query again after sync
        result = await pool.query(`
          SELECT id, text, date, link, media, media_urls, avatar, bot_link as "botLink", 
                 name, age, nationality, hometown, work, region, age_bracket, occupation_category, language, click_count, personality, relationship, about
          FROM telegram_posts 
          WHERE channel = $1 AND id = $2 AND deleted_at IS NULL AND media IS NOT NULL
        `, [channelName, id]);
      }
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Profile not found' });
      }
    }
    
    // If post exists but lacks enriched name, try to enrich from Telegram
    if (!result.rows[0].name) {
      const telegramPost = await fetchSinglePost(id, channel);
      
      if (telegramPost && telegramPost.media && telegramPost.profileData?.name) {
        await syncPostsToDatabase([telegramPost], channel);
        
        // Re-query to get enriched data
        result = await pool.query(`
          SELECT id, text, date, link, media, media_urls, avatar, bot_link as "botLink", 
                 name, age, nationality, hometown, work, region, age_bracket, occupation_category, language, click_count, personality, relationship, about
          FROM telegram_posts 
          WHERE channel = $1 AND id = $2 AND deleted_at IS NULL AND media IS NOT NULL
        `, [channelName, id]);
      }
      
      // If still no name after enrichment, return 404 (not a valid profile)
      if (!result.rows[0]?.name) {
        return res.status(404).json({ error: 'Profile not found' });
      }
    }
    
    const row = result.rows[0];
    
    // Parse filter parameters for next/prev navigation
    const regions = req.query.region ? (Array.isArray(req.query.region) ? req.query.region : [req.query.region]) : null;
    const ageBrackets = req.query.ageBracket ? (Array.isArray(req.query.ageBracket) ? req.query.ageBracket : [req.query.ageBracket]) : null;
    const occupationCategories = req.query.occupationCategory ? (Array.isArray(req.query.occupationCategory) ? req.query.occupationCategory : [req.query.occupationCategory]) : null;
    const languages = req.query.language ? (Array.isArray(req.query.language) ? req.query.language : [req.query.language]) : null;
    const hometowns = req.query.hometown ? (Array.isArray(req.query.hometown) ? req.query.hometown : [req.query.hometown]) : null;
    const personalities = req.query.personality ? (Array.isArray(req.query.personality) ? req.query.personality : [req.query.personality]) : null;
    const relationships = req.query.relationship ? (Array.isArray(req.query.relationship) ? req.query.relationship : [req.query.relationship]) : null;
    const hasVideo = req.query.hasVideo === 'true';
    const hasMultipleMedia = req.query.hasMultipleMedia === 'true';
    
    // Build filter conditions for navigation
    let filterConditions = '';
    const filterParams = [channelName, id];
    let paramIdx = 3;
    
    if (regions && regions.length > 0) {
      filterConditions += ` AND region = ANY($${paramIdx})`;
      filterParams.push(regions);
      paramIdx++;
    }
    if (ageBrackets && ageBrackets.length > 0) {
      filterConditions += ` AND age_bracket = ANY($${paramIdx})`;
      filterParams.push(ageBrackets);
      paramIdx++;
    }
    if (occupationCategories && occupationCategories.length > 0) {
      filterConditions += ` AND occupation_category = ANY($${paramIdx})`;
      filterParams.push(occupationCategories);
      paramIdx++;
    }
    if (languages && languages.length > 0) {
      filterConditions += ` AND language = ANY($${paramIdx})`;
      filterParams.push(languages);
      paramIdx++;
    }
    if (hometowns && hometowns.length > 0) {
      filterConditions += ` AND hometown = ANY($${paramIdx})`;
      filterParams.push(hometowns);
      paramIdx++;
    }
    if (personalities && personalities.length > 0) {
      filterConditions += ` AND personality = ANY($${paramIdx})`;
      filterParams.push(personalities);
      paramIdx++;
    }
    if (relationships && relationships.length > 0) {
      filterConditions += ` AND relationship = ANY($${paramIdx})`;
      filterParams.push(relationships);
      paramIdx++;
    }
    if (hasVideo) {
      filterConditions += ` AND has_video = true`;
    }
    if (hasMultipleMedia) {
      filterConditions += ` AND has_multiple_media = true`;
    }
    
    // Get previous profile (newer post - higher ID)
    const prevResult = await pool.query(`
      SELECT id FROM telegram_posts 
      WHERE channel = $1 AND id > $2 AND deleted_at IS NULL AND media IS NOT NULL AND name IS NOT NULL${filterConditions}
      ORDER BY id ASC LIMIT 1
    `, filterParams);
    
    // Get next profile (older post - lower ID)
    const nextResult = await pool.query(`
      SELECT id FROM telegram_posts 
      WHERE channel = $1 AND id < $2 AND deleted_at IS NULL AND media IS NOT NULL AND name IS NOT NULL${filterConditions}
      ORDER BY id DESC LIMIT 1
    `, filterParams);
    
    // Check if this post is in the global hot set (clicks, high media, or recent)
    const hotCheckQuery = `
      WITH clicked_posts AS (
        SELECT id FROM telegram_posts 
        WHERE channel = $1 AND deleted_at IS NULL AND COALESCE(click_count, 0) > 0
        ORDER BY click_count DESC LIMIT 5
      ),
      high_media_posts AS (
        SELECT id FROM telegram_posts
        WHERE channel = $1 AND deleted_at IS NULL 
          AND jsonb_array_length(COALESCE(media_urls, '[]'::jsonb)) >= 5
          AND id NOT IN (SELECT id FROM clicked_posts)
        ORDER BY jsonb_array_length(COALESCE(media_urls, '[]'::jsonb)) DESC, date DESC LIMIT 5
      ),
      recent_posts AS (
        SELECT id FROM telegram_posts
        WHERE channel = $1 AND deleted_at IS NULL 
          AND id NOT IN (SELECT id FROM clicked_posts)
          AND id NOT IN (SELECT id FROM high_media_posts)
        ORDER BY date DESC LIMIT 5
      ),
      hot_ids AS (
        SELECT id FROM clicked_posts
        UNION SELECT id FROM high_media_posts
        UNION SELECT id FROM recent_posts
      )
      SELECT EXISTS(SELECT 1 FROM hot_ids WHERE id = $2) as is_hot
    `;
    const hotResult = await pool.query(hotCheckQuery, [channelName, id]);
    const isHot = hotResult.rows[0]?.is_hot || false;
    
    const post = {
      id: row.id,
      text: row.text,
      date: row.date,
      link: row.link,
      media: row.media,
      mediaUrls: row.media_urls,
      avatar: row.avatar,
      botLink: row.botLink,
      profileData: row.name ? {
        name: row.name,
        age: row.age,
        nationality: row.nationality,
        hometown: row.hometown,
        work: row.work,
        language: row.language,
        personality: row.personality,
        relationship: row.relationship,
        about: row.about
      } : null,
      isHot,
      click_count: row.click_count
    };
    
    res.json({ 
      post,
      prevId: prevResult.rows.length > 0 ? prevResult.rows[0].id : null,
      nextId: nextResult.rows.length > 0 ? nextResult.rows[0].id : null
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
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
    
    // Trigger quick sync for new posts on every page load (fire and forget)
    // This fetches only new posts from Telegram until it finds one already in DB
    if (db && !before) {
      syncNewPosts(channel).catch(err => console.error('Quick sync error:', err));
    }
    
    // Filter parameters
    const regions = req.query.region ? (Array.isArray(req.query.region) ? req.query.region : [req.query.region]) : null;
    const ageBrackets = req.query.ageBracket ? (Array.isArray(req.query.ageBracket) ? req.query.ageBracket : [req.query.ageBracket]) : null;
    const occupationCategories = req.query.occupationCategory ? (Array.isArray(req.query.occupationCategory) ? req.query.occupationCategory : [req.query.occupationCategory]) : null;
    const languages = req.query.language ? (Array.isArray(req.query.language) ? req.query.language : [req.query.language]) : null;
    const hometowns = req.query.hometown ? (Array.isArray(req.query.hometown) ? req.query.hometown : [req.query.hometown]) : null;
    const personalities = req.query.personality ? (Array.isArray(req.query.personality) ? req.query.personality : [req.query.personality]) : null;
    const relationships = req.query.relationship ? (Array.isArray(req.query.relationship) ? req.query.relationship : [req.query.relationship]) : null;
    const hasVideo = req.query.hasVideo === 'true';
    const hasMultipleMedia = req.query.hasMultipleMedia === 'true';
    const hasFilters = regions || ageBrackets || occupationCategories || languages || hometowns || personalities || relationships || hasVideo || hasMultipleMedia;
    
    // Always use database when available (for isHot calculation and better performance)
    if (db) {
      let query = `
        SELECT id, text, date, link, media, media_urls, photo_file_ids, avatar, bot_link as "botLink", 
               name, age, nationality, hometown, work, region, age_bracket, occupation_category, language, click_count, personality, relationship, about
        FROM telegram_posts 
        WHERE channel = $1 AND media IS NOT NULL AND name IS NOT NULL AND deleted_at IS NULL
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
      
      if (personalities && personalities.length > 0) {
        query += ` AND personality = ANY($${paramIndex})`;
        params.push(personalities);
        paramIndex++;
      }
      
      if (relationships && relationships.length > 0) {
        query += ` AND relationship = ANY($${paramIndex})`;
        params.push(relationships);
        paramIndex++;
      }
      
      if (hasVideo) {
        query += ` AND has_video = true`;
      }
      
      if (hasMultipleMedia) {
        query += ` AND has_multiple_media = true`;
      }
      
      if (before) {
        query += ` AND id::bigint < $${paramIndex}::bigint`;
        params.push(before);
        paramIndex++;
      }
      
      // Always sort by recency (newest first)
      query += ` ORDER BY id::bigint DESC LIMIT $${paramIndex}`;
      params.push(limit);
      
      // First, get the GLOBAL hot IDs from entire dataset (ignoring filters)
      // Hot profiles are determined by: clicks, high media count (5+), or recency
      // This ensures Hot badge is consistent regardless of which filters are applied
      const globalHotQuery = `
        WITH clicked_posts AS (
          SELECT id, ROW_NUMBER() OVER (ORDER BY click_count DESC) as rn
          FROM telegram_posts 
          WHERE channel = $1 AND deleted_at IS NULL AND COALESCE(click_count, 0) > 0
          LIMIT 5
        ),
        high_media_posts AS (
          SELECT id, ROW_NUMBER() OVER (ORDER BY jsonb_array_length(COALESCE(media_urls, '[]'::jsonb)) DESC, date DESC) as rn
          FROM telegram_posts
          WHERE channel = $1 AND deleted_at IS NULL 
            AND jsonb_array_length(COALESCE(media_urls, '[]'::jsonb)) >= 5
            AND id NOT IN (SELECT id FROM clicked_posts)
          LIMIT 5
        ),
        recent_posts AS (
          SELECT id, ROW_NUMBER() OVER (ORDER BY date DESC) as rn
          FROM telegram_posts
          WHERE channel = $1 AND deleted_at IS NULL 
            AND id NOT IN (SELECT id FROM clicked_posts)
            AND id NOT IN (SELECT id FROM high_media_posts)
          LIMIT 5
        ),
        combined AS (
          SELECT id FROM clicked_posts
          UNION
          SELECT id FROM high_media_posts
          UNION
          SELECT id FROM recent_posts
        )
        SELECT id FROM combined
      `;
      const globalHotResult = await pool.query(globalHotQuery, [channelName]);
      const hotPostIds = new Set(globalHotResult.rows.map(r => r.id));
      
      const result = await pool.query(query, params);
      
      const posts = result.rows.map(row => ({
        id: row.id,
        text: row.text,
        date: row.date,
        link: row.link,
        media: row.media,
        mediaUrls: row.media_urls,
        avatar: row.avatar,
        botLink: row.botLink,
        profileData: row.name ? {
          name: row.name,
          age: row.age,
          nationality: row.nationality,
          hometown: row.hometown,
          work: row.work,
          language: row.language,
          personality: row.personality,
          relationship: row.relationship,
          about: row.about
        } : null,
        isHot: hotPostIds.has(row.id)
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

// Dynamic sitemap.xml endpoint
app.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = 'https://nextwife.ai';
    const today = new Date().toISOString().split('T')[0];
    
    // Get all active profile IDs from database
    const result = await pool.query(`
      SELECT id, date 
      FROM telegram_posts 
      WHERE channel = 'nextwifeai' 
        AND deleted_at IS NULL 
        AND media IS NOT NULL 
        AND name IS NOT NULL
      ORDER BY id DESC
    `);
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/discover</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`;
    
    // Add profile URLs
    for (const row of result.rows) {
      const lastmod = row.date ? new Date(row.date).toISOString().split('T')[0] : today;
      xml += `
  <url>
    <loc>${baseUrl}/profile/${row.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    }
    
    xml += `
</urlset>`;
    
    res.set('Content-Type', 'application/xml');
    res.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.send(xml);
    
  } catch (error) {
    console.error('Sitemap generation error:', error);
    res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
  }
});

// Dynamic robots.txt endpoint
app.get('/robots.txt', (req, res) => {
  const robotsTxt = `User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: facebookexternalhit
Allow: /

User-agent: *
Allow: /

Sitemap: https://nextwife.ai/sitemap.xml
`;
  res.set('Content-Type', 'text/plain');
  res.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
  res.send(robotsTxt);
});

// High-resolution image proxy endpoint (uses Bot API)
app.get('/api/tg-highres-image', async (req, res) => {
  try {
    const fileId = req.query.file_id;
    if (!fileId) {
      return res.status(400).json({ error: 'Missing file_id parameter' });
    }
    
    if (!TELEGRAM_BOT_TOKEN) {
      return res.status(503).json({ error: 'High-res images not available' });
    }
    
    const imageUrl = await getHighResImageUrl(fileId);
    const imageResponse = await fetch(imageUrl);
    
    if (!imageResponse.ok) {
      return res.status(502).json({ error: 'Failed to fetch high-res image' });
    }
    
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
    const buffer = await imageResponse.buffer();
    
    res.set({
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400', // 24 hour cache (URLs expire after ~1 hour but we refetch)
      'Access-Control-Allow-Origin': '*',
    });
    res.send(buffer);
    
  } catch (error) {
    console.error('Error fetching high-res image:', error);
    res.status(500).json({ error: 'Failed to fetch high-res image', message: error.message });
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
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.send(buffer);

  } catch (error) {
    console.error('Error proxying image:', error);
    res.status(500).json({ error: 'Failed to proxy image', message: error.message });
  }
});

// Social crawler detection for dynamic meta tags
const socialCrawlers = [
  'facebookexternalhit',
  'Facebot',
  'Twitterbot',
  'LinkedInBot',
  'WhatsApp',
  'TelegramBot',
  'Slackbot',
  'Discordbot',
  'Pinterest',
  'Googlebot',
  'bingbot',
  'Baiduspider',
  'DuckDuckBot',
];

function isSocialCrawler(userAgent) {
  if (!userAgent) return false;
  return socialCrawlers.some(crawler => userAgent.includes(crawler));
}

// Serve dynamic meta tags for profile pages when accessed by social crawlers
app.get('/profile/:id', async (req, res, next) => {
  const userAgent = req.headers['user-agent'] || '';
  
  if (!isSocialCrawler(userAgent)) {
    return next(); // Let the SPA handle it
  }
  
  // If database is not available, fall back to SPA
  if (!pool) {
    return next();
  }
  
  try {
    const profileId = req.params.id;
    const result = await pool.query(
      `SELECT * FROM telegram_posts WHERE id = $1 AND channel = 'nextwifeai' AND deleted_at IS NULL`,
      [profileId]
    );
    
    if (result.rows.length === 0) {
      return next(); // Profile not found, let SPA handle 404
    }
    
    const post = result.rows[0];
    const name = post.name || 'AI Girlfriend';
    const age = post.age || '';
    const nationality = post.nationality || '';
    const hometown = post.hometown || '';
    const work = post.work || '';
    const about = post.about || '';
    
    // Get the first media URL for the image
    let imageUrl = 'https://nextwife.ai/og-image.jpg';
    if (post.media_urls && post.media_urls.length > 0) {
      const firstMedia = post.media_urls.find(m => m.type === 'photo') || post.media_urls[0];
      if (firstMedia && firstMedia.url) {
        // Use our proxy to serve the image to avoid CORS issues
        imageUrl = `https://nextwife.ai/api/tg-image-proxy?u=${encodeURIComponent(firstMedia.url)}`;
      }
    } else if (post.media) {
      imageUrl = `https://nextwife.ai/api/tg-image-proxy?u=${encodeURIComponent(post.media)}`;
    }
    
    const title = `${name}${age ? `, ${age}` : ''} - Next Wife`;
    const description = about 
      ? about.substring(0, 200) + (about.length > 200 ? '...' : '')
      : `${nationality ? nationality + ' ' : ''}${work ? work + '. ' : ''}Meet ${name} on Telegram.`;
    const profileUrl = `https://nextwife.ai/profile/${profileId}`;
    
    // Serve HTML with dynamic meta tags
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  
  <!-- Open Graph -->
  <meta property="og:type" content="profile">
  <meta property="og:site_name" content="Next Wife">
  <meta property="og:url" content="${profileUrl}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:image:width" content="800">
  <meta property="og:image:height" content="800">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@nextwife_ai">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${imageUrl}">
  
  <!-- Redirect to actual page for users -->
  <meta http-equiv="refresh" content="0;url=${profileUrl}">
</head>
<body>
  <h1>${escapeHtml(name)}</h1>
  ${age ? `<p>Age: ${age}</p>` : ''}
  ${nationality ? `<p>Nationality: ${nationality}</p>` : ''}
  ${hometown ? `<p>From: ${escapeHtml(hometown)}</p>` : ''}
  ${work ? `<p>Work: ${escapeHtml(work)}</p>` : ''}
  ${about ? `<p>${escapeHtml(about)}</p>` : ''}
  <p><a href="${profileUrl}">View Profile on Next Wife</a></p>
</body>
</html>`;
    
    res.set('Content-Type', 'text/html');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(html);
    
  } catch (error) {
    console.error('Error serving profile meta tags:', error);
    next(); // Fall back to SPA on error
  }
});

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

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
