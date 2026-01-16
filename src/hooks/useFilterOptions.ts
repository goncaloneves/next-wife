import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { PERSONALITY_LABELS, RELATIONSHIP_TYPE_LABELS } from "@/lib/girlfriends/profile-formatter";
import { 
  FilterOptions, 
  EMPTY_FILTER_OPTIONS, 
  fetchFilterOptions 
} from "@/components/filters/FilterComponents";
import { SharedFilters, getActiveFilterCount } from "@/lib/filterStorage";

const REGION_KEYS: Record<string, string> = {
  "Asian": "region.asian",
  "European": "region.european",
  "Latin American": "region.latinAmerican",
  "North American": "region.northAmerican",
  "African": "region.african",
  "Middle Eastern": "region.middleEastern",
  "Oceanian": "region.oceanian",
  "Other": "region.other",
};

const OCCUPATION_KEYS: Record<string, string> = {
  "Arts & Gallery": "occupation.artsGallery",
  "Design & Creative": "occupation.designCreative",
  "Photography & Film": "occupation.photographyFilm",
  "Architecture": "occupation.architecture",
  "Food & Hospitality": "occupation.foodHospitality",
  "Education & Academia": "occupation.educationAcademia",
  "Business & Marketing": "occupation.businessMarketing",
  "Healthcare & Wellness": "occupation.healthcareWellness",
  "Fashion & Beauty": "occupation.fashionBeauty",
  "Travel & Tourism": "occupation.travelTourism",
  "Tech & Engineering": "occupation.techEngineering",
  "Other": "occupation.other",
};

const LANGUAGE_KEYS: Record<string, string> = {
  "English": "spokenLanguage.english",
  "Spanish": "spokenLanguage.spanish",
  "French": "spokenLanguage.french",
  "Portuguese": "spokenLanguage.portuguese",
  "German": "spokenLanguage.german",
  "Italian": "spokenLanguage.italian",
  "Japanese": "spokenLanguage.japanese",
  "Korean": "spokenLanguage.korean",
  "Mandarin": "spokenLanguage.mandarin",
  "Arabic": "spokenLanguage.arabic",
  "Russian": "spokenLanguage.russian",
  "Dutch": "spokenLanguage.dutch",
  "Polish": "spokenLanguage.polish",
  "Turkish": "spokenLanguage.turkish",
  "Thai": "spokenLanguage.thai",
  "Vietnamese": "spokenLanguage.vietnamese",
  "Indonesian": "spokenLanguage.indonesian",
  "Greek": "spokenLanguage.greek",
  "Swedish": "spokenLanguage.swedish",
  "Czech": "spokenLanguage.czech",
  "Hungarian": "spokenLanguage.hungarian",
  "Romanian": "spokenLanguage.romanian",
  "Ukrainian": "spokenLanguage.ukrainian",
  "Hindi": "spokenLanguage.hindi",
  "Filipino": "spokenLanguage.filipino",
  "Persian": "spokenLanguage.persian",
  "Hebrew": "spokenLanguage.hebrew",
  "Danish": "spokenLanguage.danish",
  "Finnish": "spokenLanguage.finnish",
  "Norwegian": "spokenLanguage.norwegian",
  "Malay": "spokenLanguage.malay",
  "Croatian": "spokenLanguage.croatian",
  "Serbian": "spokenLanguage.serbian",
  "Bulgarian": "spokenLanguage.bulgarian",
  "Slovak": "spokenLanguage.slovak",
  "Slovenian": "spokenLanguage.slovenian",
  "Lithuanian": "spokenLanguage.lithuanian",
  "Latvian": "spokenLanguage.latvian",
  "Estonian": "spokenLanguage.estonian",
  "Icelandic": "spokenLanguage.icelandic",
  "Albanian": "spokenLanguage.albanian",
  "Macedonian": "spokenLanguage.macedonian",
  "Bosnian": "spokenLanguage.bosnian",
  "Georgian": "spokenLanguage.georgian",
  "Armenian": "spokenLanguage.armenian",
  "Azerbaijani": "spokenLanguage.azerbaijani",
  "Kazakh": "spokenLanguage.kazakh",
  "Uzbek": "spokenLanguage.uzbek",
  "Bengali": "spokenLanguage.bengali",
  "Sinhala": "spokenLanguage.sinhala",
  "Nepali": "spokenLanguage.nepali",
  "Mongolian": "spokenLanguage.mongolian",
  "Khmer": "spokenLanguage.khmer",
  "Lao": "spokenLanguage.lao",
  "Burmese": "spokenLanguage.burmese",
  "Swahili": "spokenLanguage.swahili",
  "Amharic": "spokenLanguage.amharic",
};

export interface UseFilterOptionsResult {
  filterOptions: FilterOptions;
  loading: boolean;
  personalityOptions: string[];
  relationshipOptions: string[];
  regionOptions: string[];
  occupationOptions: string[];
  languageOptions: string[];
  valuesToLabels: {
    personalities: (values: string[]) => string[];
    relationships: (values: string[]) => string[];
    regions: (values: string[]) => string[];
    occupations: (values: string[]) => string[];
    languages: (values: string[]) => string[];
  };
  labelsToValues: {
    personality: (label: string) => string;
    relationship: (label: string) => string;
    region: (label: string) => string;
    occupation: (label: string) => string;
    language: (label: string) => string;
  };
  getActiveCount: (filters: SharedFilters) => number;
}

export function useFilterOptions(channel: string): UseFilterOptionsResult {
  const { t } = useTranslation();
  const [filterOptions, setFilterOptions] = useState<FilterOptions>(EMPTY_FILTER_OPTIONS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFilterOptions(channel).then(data => {
      setFilterOptions(data);
      setLoading(false);
    });
  }, [channel]);

  const personalityOptions = useMemo(() => 
    (filterOptions.personalities || []).map(p => {
      const key = PERSONALITY_LABELS[p];
      return key ? t(key) : p;
    }),
    [filterOptions.personalities, t]
  );

  const relationshipOptions = useMemo(() => 
    (filterOptions.relationships || []).map(r => {
      const key = RELATIONSHIP_TYPE_LABELS[r];
      return key ? t(key) : r;
    }),
    [filterOptions.relationships, t]
  );

  const regionOptions = useMemo(() => 
    (filterOptions.regions || []).map(r => {
      const key = REGION_KEYS[r];
      return key ? t(key) : r;
    }),
    [filterOptions.regions, t]
  );

  const occupationOptions = useMemo(() => 
    (filterOptions.occupationCategories || []).map(o => {
      const key = OCCUPATION_KEYS[o];
      return key ? t(key) : o;
    }),
    [filterOptions.occupationCategories, t]
  );

  const languageOptions = useMemo(() => 
    (filterOptions.languages || []).map(l => {
      const key = LANGUAGE_KEYS[l];
      return key ? t(key) : l;
    }),
    [filterOptions.languages, t]
  );

  const personalityLabelToValue = useMemo(() => {
    const map: Record<string, string> = {};
    Object.entries(PERSONALITY_LABELS).forEach(([value, key]) => {
      map[t(key)] = value;
    });
    return map;
  }, [t]);

  const relationshipLabelToValue = useMemo(() => {
    const map: Record<string, string> = {};
    Object.entries(RELATIONSHIP_TYPE_LABELS).forEach(([value, key]) => {
      map[t(key)] = value;
    });
    return map;
  }, [t]);

  const regionLabelToValue = useMemo(() => {
    const map: Record<string, string> = {};
    Object.entries(REGION_KEYS).forEach(([value, key]) => {
      map[t(key)] = value;
    });
    return map;
  }, [t]);

  const occupationLabelToValue = useMemo(() => {
    const map: Record<string, string> = {};
    Object.entries(OCCUPATION_KEYS).forEach(([value, key]) => {
      map[t(key)] = value;
    });
    return map;
  }, [t]);

  const languageLabelToValue = useMemo(() => {
    const map: Record<string, string> = {};
    Object.entries(LANGUAGE_KEYS).forEach(([value, key]) => {
      map[t(key)] = value;
    });
    return map;
  }, [t]);

  const valuesToLabels = useMemo(() => ({
    personalities: (values: string[]) => values.map(p => {
      const key = PERSONALITY_LABELS[p];
      return key ? t(key) : p;
    }),
    relationships: (values: string[]) => values.map(r => {
      const key = RELATIONSHIP_TYPE_LABELS[r];
      return key ? t(key) : r;
    }),
    regions: (values: string[]) => values.map(r => {
      const key = REGION_KEYS[r];
      return key ? t(key) : r;
    }),
    occupations: (values: string[]) => values.map(o => {
      const key = OCCUPATION_KEYS[o];
      return key ? t(key) : o;
    }),
    languages: (values: string[]) => values.map(l => {
      const key = LANGUAGE_KEYS[l];
      return key ? t(key) : l;
    }),
  }), [t]);

  const labelsToValues = useMemo(() => ({
    personality: (label: string) => personalityLabelToValue[label] || label,
    relationship: (label: string) => relationshipLabelToValue[label] || label,
    region: (label: string) => regionLabelToValue[label] || label,
    occupation: (label: string) => occupationLabelToValue[label] || label,
    language: (label: string) => languageLabelToValue[label] || label,
  }), [personalityLabelToValue, relationshipLabelToValue, regionLabelToValue, occupationLabelToValue, languageLabelToValue]);

  return {
    filterOptions,
    loading,
    personalityOptions,
    relationshipOptions,
    regionOptions,
    occupationOptions,
    languageOptions,
    valuesToLabels,
    labelsToValues,
    getActiveCount: getActiveFilterCount,
  };
}
