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
