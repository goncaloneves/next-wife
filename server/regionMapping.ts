// Import countries-list for language data
import { countries, languages, type TCountryCode, type TLanguageCode } from 'countries-list';

// Nationality to Region mapping for filtering
// Regions: Asian, European, Latin American, North American, African, Middle Eastern, Oceanian

export const nationalityToRegion: Record<string, string> = {
  // Asian
  "Japanese": "Asian",
  "Korean": "Asian",
  "Chinese": "Asian",
  "Thai": "Asian",
  "Vietnamese": "Asian",
  "Filipino": "Asian",
  "Filipina": "Asian",
  "Indonesian": "Asian",
  "Malaysian": "Asian",
  "Singaporean": "Asian",
  "Indian": "Asian",
  "Pakistani": "Asian",
  "Bangladeshi": "Asian",
  "Sri Lankan": "Asian",
  "Nepali": "Asian",
  "Taiwanese": "Asian",
  "Hong Konger": "Asian",
  "Mongolian": "Asian",
  "Cambodian": "Asian",
  "Laotian": "Asian",
  "Myanmar": "Asian",
  "Burmese": "Asian",
  "Balinese": "Asian",
  
  // European
  "British": "European",
  "English": "European",
  "Scottish": "European",
  "Welsh": "European",
  "Irish": "European",
  "French": "European",
  "German": "European",
  "Italian": "European",
  "Spanish": "European",
  "Portuguese": "European",
  "Dutch": "European",
  "Belgian": "European",
  "Swiss": "European",
  "Austrian": "European",
  "Swedish": "European",
  "Norwegian": "European",
  "Danish": "European",
  "Finnish": "European",
  "Polish": "European",
  "Czech": "European",
  "Hungarian": "European",
  "Romanian": "European",
  "Bulgarian": "European",
  "Greek": "European",
  "Croatian": "European",
  "Serbian": "European",
  "Slovenian": "European",
  "Slovak": "European",
  "Ukrainian": "European",
  "Russian": "European",
  "Belarusian": "European",
  "Lithuanian": "European",
  "Latvian": "European",
  "Estonian": "European",
  "Icelandic": "European",
  "Luxembourgish": "European",
  "Maltese": "European",
  "Cypriot": "European",
  "Albanian": "European",
  "Macedonian": "European",
  "Montenegrin": "European",
  "Bosnian": "European",
  "Moldovan": "European",
  
  // Latin American
  "Brazilian": "Latin American",
  "Mexican": "Latin American",
  "Argentine": "Latin American",
  "Argentinian": "Latin American",
  "Colombian": "Latin American",
  "Peruvian": "Latin American",
  "Venezuelan": "Latin American",
  "Chilean": "Latin American",
  "Ecuadorian": "Latin American",
  "Bolivian": "Latin American",
  "Paraguayan": "Latin American",
  "Uruguayan": "Latin American",
  "Cuban": "Latin American",
  "Dominican": "Latin American",
  "Puerto Rican": "Latin American",
  "Costa Rican": "Latin American",
  "Panamanian": "Latin American",
  "Guatemalan": "Latin American",
  "Honduran": "Latin American",
  "Salvadoran": "Latin American",
  "Nicaraguan": "Latin American",
  "Jamaican": "Latin American",
  "Haitian": "Latin American",
  "Trinidadian": "Latin American",
  
  // North American
  "American": "North American",
  "Canadian": "North American",
  
  // African
  "Nigerian": "African",
  "South African": "African",
  "Egyptian": "African",
  "Kenyan": "African",
  "Ethiopian": "African",
  "Ghanaian": "African",
  "Moroccan": "African",
  "Algerian": "African",
  "Tunisian": "African",
  "Senegalese": "African",
  "Cameroonian": "African",
  "Tanzanian": "African",
  "Ugandan": "African",
  "Zimbabwean": "African",
  "Congolese": "African",
  "Ivorian": "African",
  "Sudanese": "African",
  "Angolan": "African",
  "Mozambican": "African",
  "Rwandan": "African",
  "Cape Verdean": "African",
  
  // Middle Eastern
  "Turkish": "Middle Eastern",
  "Iranian": "Middle Eastern",
  "Iraqi": "Middle Eastern",
  "Saudi": "Middle Eastern",
  "Saudi Arabian": "Middle Eastern",
  "Emirati": "Middle Eastern",
  "Qatari": "Middle Eastern",
  "Kuwaiti": "Middle Eastern",
  "Bahraini": "Middle Eastern",
  "Omani": "Middle Eastern",
  "Yemeni": "Middle Eastern",
  "Jordanian": "Middle Eastern",
  "Lebanese": "Middle Eastern",
  "Syrian": "Middle Eastern",
  "Israeli": "Middle Eastern",
  "Palestinian": "Middle Eastern",
  "Afghan": "Middle Eastern",
  "Uzbek": "Middle Eastern",
  "Kazakh": "Middle Eastern",
  "Azerbaijani": "Middle Eastern",
  "Georgian": "Middle Eastern",
  "Armenian": "Middle Eastern",
  
  // Oceanian
  "Australian": "Oceanian",
  "New Zealander": "Oceanian",
  "Kiwi": "Oceanian",
  "Fijian": "Oceanian",
  "Samoan": "Oceanian",
  "Tongan": "Oceanian",
  "Papua New Guinean": "Oceanian",
};

// Get region from nationality (case-insensitive)
export function getRegion(nationality: string | null | undefined): string | null {
  if (!nationality) return null;
  
  // Try exact match first
  if (nationalityToRegion[nationality]) {
    return nationalityToRegion[nationality];
  }
  
  // Try case-insensitive match
  const normalizedNationality = nationality.trim();
  for (const [key, region] of Object.entries(nationalityToRegion)) {
    if (key.toLowerCase() === normalizedNationality.toLowerCase()) {
      return region;
    }
  }
  
  return "Other";
}

// Calculate age bracket
export function getAgeBracket(age: number | null | undefined): string | null {
  if (!age || age < 21) return null;
  
  if (age >= 21 && age <= 25) return "21-25";
  if (age >= 26 && age <= 30) return "26-30";
  return "30+";
}

// All available regions for filtering
export const ALL_REGIONS = [
  "Asian",
  "European", 
  "Latin American",
  "North American",
  "African",
  "Middle Eastern",
  "Oceanian",
  "Other"
];

// All age brackets for filtering
export const ALL_AGE_BRACKETS = ["21-25", "26-30", "30+"];

// Demonym (nationality) to ISO country code mapping
// This maps nationality adjectives to their ISO 3166-1 alpha-2 country codes
const demonymToCountryCode: Record<string, TCountryCode> = {
  // Asian
  "Japanese": "JP",
  "Korean": "KR",
  "Chinese": "CN",
  "Taiwanese": "TW",
  "Hong Konger": "HK",
  "Thai": "TH",
  "Vietnamese": "VN",
  "Filipino": "PH",
  "Filipina": "PH",
  "Indonesian": "ID",
  "Balinese": "ID",
  "Malaysian": "MY",
  "Singaporean": "SG",
  "Indian": "IN",
  "Pakistani": "PK",
  "Bangladeshi": "BD",
  "Sri Lankan": "LK",
  "Nepali": "NP",
  "Mongolian": "MN",
  "Cambodian": "KH",
  "Laotian": "LA",
  "Myanmar": "MM",
  "Burmese": "MM",
  
  // European
  "British": "GB",
  "English": "GB",
  "Scottish": "GB",
  "Welsh": "GB",
  "Irish": "IE",
  "French": "FR",
  "German": "DE",
  "Italian": "IT",
  "Spanish": "ES",
  "Portuguese": "PT",
  "Dutch": "NL",
  "Belgian": "BE",
  "Swiss": "CH",
  "Austrian": "AT",
  "Swedish": "SE",
  "Norwegian": "NO",
  "Danish": "DK",
  "Finnish": "FI",
  "Polish": "PL",
  "Czech": "CZ",
  "Hungarian": "HU",
  "Romanian": "RO",
  "Bulgarian": "BG",
  "Greek": "GR",
  "Croatian": "HR",
  "Serbian": "RS",
  "Slovenian": "SI",
  "Slovak": "SK",
  "Ukrainian": "UA",
  "Russian": "RU",
  "Belarusian": "BY",
  "Lithuanian": "LT",
  "Latvian": "LV",
  "Estonian": "EE",
  "Icelandic": "IS",
  "Luxembourgish": "LU",
  "Maltese": "MT",
  "Cypriot": "CY",
  "Albanian": "AL",
  "Macedonian": "MK",
  "Montenegrin": "ME",
  "Bosnian": "BA",
  "Moldovan": "MD",
  
  // Latin American
  "Brazilian": "BR",
  "Mexican": "MX",
  "Argentine": "AR",
  "Argentinian": "AR",
  "Colombian": "CO",
  "Peruvian": "PE",
  "Venezuelan": "VE",
  "Chilean": "CL",
  "Ecuadorian": "EC",
  "Bolivian": "BO",
  "Paraguayan": "PY",
  "Uruguayan": "UY",
  "Cuban": "CU",
  "Dominican": "DO",
  "Puerto Rican": "PR",
  "Costa Rican": "CR",
  "Panamanian": "PA",
  "Guatemalan": "GT",
  "Honduran": "HN",
  "Salvadoran": "SV",
  "Nicaraguan": "NI",
  "Jamaican": "JM",
  "Haitian": "HT",
  "Trinidadian": "TT",
  
  // North American
  "American": "US",
  "Canadian": "CA",
  
  // African
  "Nigerian": "NG",
  "South African": "ZA",
  "Egyptian": "EG",
  "Kenyan": "KE",
  "Ethiopian": "ET",
  "Ghanaian": "GH",
  "Moroccan": "MA",
  "Algerian": "DZ",
  "Tunisian": "TN",
  "Senegalese": "SN",
  "Cameroonian": "CM",
  "Tanzanian": "TZ",
  "Ugandan": "UG",
  "Zimbabwean": "ZW",
  "Congolese": "CD",
  "Ivorian": "CI",
  "Sudanese": "SD",
  "Angolan": "AO",
  "Mozambican": "MZ",
  "Rwandan": "RW",
  "Cape Verdean": "CV",
  
  // Middle Eastern
  "Turkish": "TR",
  "Iranian": "IR",
  "Iraqi": "IQ",
  "Saudi": "SA",
  "Saudi Arabian": "SA",
  "Emirati": "AE",
  "Qatari": "QA",
  "Kuwaiti": "KW",
  "Bahraini": "BH",
  "Omani": "OM",
  "Yemeni": "YE",
  "Jordanian": "JO",
  "Lebanese": "LB",
  "Syrian": "SY",
  "Israeli": "IL",
  "Palestinian": "PS",
  "Afghan": "AF",
  "Uzbek": "UZ",
  "Kazakh": "KZ",
  "Azerbaijani": "AZ",
  "Georgian": "GE",
  "Armenian": "AM",
  
  // Oceanian
  "Australian": "AU",
  "New Zealander": "NZ",
  "Kiwi": "NZ",
  "Fijian": "FJ",
  "Samoan": "WS",
  "Tongan": "TO",
  "Papua New Guinean": "PG",
};

// ISO language code to display name mapping (for nicer display)
const languageCodeToDisplayName: Record<string, string> = {
  "en": "English",
  "es": "Spanish",
  "fr": "French",
  "pt": "Portuguese",
  "de": "German",
  "it": "Italian",
  "ja": "Japanese",
  "ko": "Korean",
  "zh": "Mandarin",
  "ar": "Arabic",
  "ru": "Russian",
  "nl": "Dutch",
  "pl": "Polish",
  "tr": "Turkish",
  "th": "Thai",
  "vi": "Vietnamese",
  "id": "Indonesian",
  "ms": "Malay",
  "el": "Greek",
  "sv": "Swedish",
  "cs": "Czech",
  "hu": "Hungarian",
  "ro": "Romanian",
  "uk": "Ukrainian",
  "hi": "Hindi",
  "tl": "Filipino",
  "fa": "Persian",
  "he": "Hebrew",
  "da": "Danish",
  "fi": "Finnish",
  "no": "Norwegian",
  "nb": "Norwegian",
  "nn": "Norwegian",
  "ur": "Urdu",
  "bn": "Bengali",
  "si": "Sinhala",
  "ne": "Nepali",
  "mn": "Mongolian",
  "km": "Khmer",
  "lo": "Lao",
  "my": "Burmese",
  "bg": "Bulgarian",
  "hr": "Croatian",
  "sr": "Serbian",
  "sl": "Slovenian",
  "sk": "Slovak",
  "be": "Belarusian",
  "lt": "Lithuanian",
  "lv": "Latvian",
  "et": "Estonian",
  "is": "Icelandic",
  "lb": "Luxembourgish",
  "mt": "Maltese",
  "sq": "Albanian",
  "mk": "Macedonian",
  "bs": "Bosnian",
  "sw": "Swahili",
  "am": "Amharic",
  "az": "Azerbaijani",
  "ka": "Georgian",
  "hy": "Armenian",
  "uz": "Uzbek",
  "kk": "Kazakh",
  "ps": "Pashto",
  "sm": "Samoan",
  "to": "Tongan",
};

// Get language display name from ISO code
function getLanguageDisplayName(code: string): string {
  return languageCodeToDisplayName[code] || languages[code as TLanguageCode]?.name || code.toUpperCase();
}

// Get language from nationality using countries-list
// Returns "English, [Native Language]" for non-English speakers, just "English" for English speakers
export function getLanguage(nationality: string | null | undefined): string | null {
  if (!nationality) return null;
  
  // Find country code from demonym
  const normalizedNationality = nationality.trim();
  let countryCode: TCountryCode | null = null;
  
  // Try exact match first
  if (demonymToCountryCode[normalizedNationality]) {
    countryCode = demonymToCountryCode[normalizedNationality];
  } else {
    // Try case-insensitive match
    for (const [demonym, code] of Object.entries(demonymToCountryCode)) {
      if (demonym.toLowerCase() === normalizedNationality.toLowerCase()) {
        countryCode = code;
        break;
      }
    }
  }
  
  if (!countryCode) return "English"; // Default to English for unknown nationalities
  
  // Get country data from countries-list
  const country = countries[countryCode];
  if (!country || !country.languages || country.languages.length === 0) {
    return "English";
  }
  
  // Prefer first non-English language (for multilingual countries)
  const nonEnglishLang = country.languages.find(code => code !== 'en');
  if (!nonEnglishLang) {
    return "English"; // Only English available
  }
  
  const nativeLanguage = getLanguageDisplayName(nonEnglishLang);
  
  // All AI girlfriends speak English + their native language
  return `English, ${nativeLanguage}`;
}

// Get just the native language (for filter purposes - store this in DB for filtering)
// Prefers the first non-English language if available, falls back to English
export function getNativeLanguage(nationality: string | null | undefined): string | null {
  if (!nationality) return null;
  
  const normalizedNationality = nationality.trim();
  let countryCode: TCountryCode | null = null;
  
  if (demonymToCountryCode[normalizedNationality]) {
    countryCode = demonymToCountryCode[normalizedNationality];
  } else {
    for (const [demonym, code] of Object.entries(demonymToCountryCode)) {
      if (demonym.toLowerCase() === normalizedNationality.toLowerCase()) {
        countryCode = code;
        break;
      }
    }
  }
  
  if (!countryCode) return "English";
  
  const country = countries[countryCode];
  if (!country || !country.languages || country.languages.length === 0) {
    return "English";
  }
  
  // Prefer first non-English language (for multilingual countries like Nigeria, Singapore)
  const nonEnglishLang = country.languages.find(code => code !== 'en');
  if (nonEnglishLang) {
    return getLanguageDisplayName(nonEnglishLang);
  }
  
  // If only English is available, return English
  return "English";
}

// All languages for filtering (sorted by popularity)
export const ALL_LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "Portuguese",
  "German",
  "Italian",
  "Japanese",
  "Korean",
  "Mandarin",
  "Arabic",
  "Russian",
  "Dutch",
  "Polish",
  "Turkish",
  "Thai",
  "Vietnamese",
  "Indonesian",
  "Greek",
  "Swedish",
  "Czech",
  "Hungarian",
  "Romanian",
  "Ukrainian",
  "Hindi",
  "Filipino",
  "Persian",
  "Hebrew",
  "Danish",
  "Finnish",
  "Norwegian"
];

// Occupation categories - keywords that map to broader categories
// Order matters: more specific categories should come first
const occupationKeywords: Record<string, string[]> = {
  "Food & Hospitality": [
    "chocolatier", "chef", "baker", "pastry", "barista", "sommelier", "restaurant",
    "hotel", "hospitality", "café", "cafe", "tea house", "wine",
    "culinary", "food", "cook", "kitchen", "confection"
  ],
  "Healthcare & Wellness": [
    "pharmacy", "pharmacist", "technician", "therapist", "nurse", "doctor", 
    "medical", "health", "wellness", "yoga", "fitness", "counselor", "chemist"
  ],
  "Arts & Gallery": [
    "curator", "gallery", "artist", "painter", "sculptor", "art conservator",
    "art restorer", "museum", "exhibition", "fine art"
  ],
  "Design & Creative": [
    "graphic design", "illustrator", "designer", "visual", "digital artist",
    "creative", "branding", "ui design", "ux design", "pattern", "textile"
  ],
  "Photography & Film": [
    "photographer", "photography", "cinematographer", "videographer", "film"
  ],
  "Architecture": [
    "architect", "architecture", "urban planning", "interior design"
  ],
  "Education & Academia": [
    "teacher", "instructor", "professor", "tutor", "student", "university",
    "school", "education", "lecturer", "researcher"
  ],
  "Business & Marketing": [
    "marketing", "manager", "business", "executive", "consultant",
    "entrepreneur", "startup", "agency", "director"
  ],
  "Fashion & Beauty": [
    "fashion", "model", "stylist", "makeup", "beauty", "boutique",
    "jewelry", "jeweler", "leather", "watchmaker", "timepiece"
  ],
  "Travel & Tourism": [
    "tour guide", "travel", "tourism", "adventure"
  ],
  "Tech & Engineering": [
    "software engineer", "software developer", "programmer", "software",
    "data scientist", "data analyst", "web developer", "mechanical engineer",
    "electrical engineer", "computer", "coding", "automotive engineer"
  ]
};

// Get occupation category from work description
export function getOccupationCategory(work: string | null | undefined): string | null {
  if (!work) return null;
  
  const workLower = work.toLowerCase();
  
  for (const [category, keywords] of Object.entries(occupationKeywords)) {
    for (const keyword of keywords) {
      if (workLower.includes(keyword)) {
        return category;
      }
    }
  }
  
  return "Other";
}

// All occupation categories for filtering
export const ALL_OCCUPATION_CATEGORIES = [
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
