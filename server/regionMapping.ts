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

// Nationality to Language mapping
export const nationalityToLanguage: Record<string, string> = {
  // Asian languages
  "Japanese": "Japanese",
  "Korean": "Korean",
  "Chinese": "Mandarin",
  "Taiwanese": "Mandarin",
  "Hong Konger": "Cantonese",
  "Thai": "Thai",
  "Vietnamese": "Vietnamese",
  "Filipino": "Filipino",
  "Filipina": "Filipino",
  "Indonesian": "Indonesian",
  "Malaysian": "Malay",
  "Singaporean": "English",
  "Indian": "Hindi",
  "Pakistani": "Urdu",
  "Bangladeshi": "Bengali",
  "Sri Lankan": "Sinhala",
  "Nepali": "Nepali",
  "Mongolian": "Mongolian",
  "Cambodian": "Khmer",
  "Laotian": "Lao",
  "Myanmar": "Burmese",
  "Burmese": "Burmese",
  
  // European languages
  "British": "English",
  "English": "English",
  "Scottish": "English",
  "Welsh": "English",
  "Irish": "English",
  "French": "French",
  "German": "German",
  "Italian": "Italian",
  "Spanish": "Spanish",
  "Portuguese": "Portuguese",
  "Dutch": "Dutch",
  "Belgian": "Dutch",
  "Swiss": "German",
  "Austrian": "German",
  "Swedish": "Swedish",
  "Norwegian": "Norwegian",
  "Danish": "Danish",
  "Finnish": "Finnish",
  "Polish": "Polish",
  "Czech": "Czech",
  "Hungarian": "Hungarian",
  "Romanian": "Romanian",
  "Bulgarian": "Bulgarian",
  "Greek": "Greek",
  "Croatian": "Croatian",
  "Serbian": "Serbian",
  "Slovenian": "Slovenian",
  "Slovak": "Slovak",
  "Ukrainian": "Ukrainian",
  "Russian": "Russian",
  "Belarusian": "Belarusian",
  "Lithuanian": "Lithuanian",
  "Latvian": "Latvian",
  "Estonian": "Estonian",
  "Icelandic": "Icelandic",
  "Luxembourgish": "Luxembourgish",
  "Maltese": "Maltese",
  "Cypriot": "Greek",
  "Albanian": "Albanian",
  "Macedonian": "Macedonian",
  "Montenegrin": "Serbian",
  "Bosnian": "Bosnian",
  "Moldovan": "Romanian",
  
  // Latin American - mostly Spanish/Portuguese
  "Brazilian": "Portuguese",
  "Mexican": "Spanish",
  "Argentine": "Spanish",
  "Argentinian": "Spanish",
  "Colombian": "Spanish",
  "Peruvian": "Spanish",
  "Venezuelan": "Spanish",
  "Chilean": "Spanish",
  "Ecuadorian": "Spanish",
  "Bolivian": "Spanish",
  "Paraguayan": "Spanish",
  "Uruguayan": "Spanish",
  "Cuban": "Spanish",
  "Dominican": "Spanish",
  "Puerto Rican": "Spanish",
  "Costa Rican": "Spanish",
  "Panamanian": "Spanish",
  "Guatemalan": "Spanish",
  "Honduran": "Spanish",
  "Salvadoran": "Spanish",
  "Nicaraguan": "Spanish",
  "Jamaican": "English",
  "Haitian": "French",
  "Trinidadian": "English",
  
  // North American
  "American": "English",
  "Canadian": "English",
  
  // African
  "Nigerian": "English",
  "South African": "English",
  "Egyptian": "Arabic",
  "Kenyan": "Swahili",
  "Ethiopian": "Amharic",
  "Ghanaian": "English",
  "Moroccan": "Arabic",
  "Algerian": "Arabic",
  "Tunisian": "Arabic",
  "Senegalese": "French",
  "Cameroonian": "French",
  "Tanzanian": "Swahili",
  "Ugandan": "English",
  "Zimbabwean": "English",
  "Congolese": "French",
  "Ivorian": "French",
  "Sudanese": "Arabic",
  "Angolan": "Portuguese",
  "Mozambican": "Portuguese",
  "Rwandan": "French",
  
  // Middle Eastern
  "Turkish": "Turkish",
  "Iranian": "Persian",
  "Iraqi": "Arabic",
  "Saudi": "Arabic",
  "Saudi Arabian": "Arabic",
  "Emirati": "Arabic",
  "Qatari": "Arabic",
  "Kuwaiti": "Arabic",
  "Bahraini": "Arabic",
  "Omani": "Arabic",
  "Yemeni": "Arabic",
  "Jordanian": "Arabic",
  "Lebanese": "Arabic",
  "Syrian": "Arabic",
  "Israeli": "Hebrew",
  "Palestinian": "Arabic",
  "Afghan": "Dari",
  "Uzbek": "Uzbek",
  "Kazakh": "Kazakh",
  "Azerbaijani": "Azerbaijani",
  "Georgian": "Georgian",
  "Armenian": "Armenian",
  
  // Oceanian
  "Australian": "English",
  "New Zealander": "English",
  "Kiwi": "English",
  "Fijian": "English",
  "Samoan": "Samoan",
  "Tongan": "Tongan",
  "Papua New Guinean": "English",
};

// Get language from nationality
export function getLanguage(nationality: string | null | undefined): string | null {
  if (!nationality) return null;
  
  // Try exact match first
  if (nationalityToLanguage[nationality]) {
    return nationalityToLanguage[nationality];
  }
  
  // Try case-insensitive match
  const normalizedNationality = nationality.trim();
  for (const [key, language] of Object.entries(nationalityToLanguage)) {
    if (key.toLowerCase() === normalizedNationality.toLowerCase()) {
      return language;
    }
  }
  
  return null;
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
