import i18n from '@/i18n';

// Map nationality values to translation keys
const NATIONALITY_KEYS: Record<string, string> = {
  american: 'nationality.american',
  argentine: 'nationality.argentine',
  australian: 'nationality.australian',
  austrian: 'nationality.austrian',
  balinese: 'nationality.balinese',
  brazilian: 'nationality.brazilian',
  british: 'nationality.british',
  canadian: 'nationality.canadian',
  'cape verdean': 'nationality.capeVerdean',
  chinese: 'nationality.chinese',
  colombian: 'nationality.colombian',
  croatian: 'nationality.croatian',
  czech: 'nationality.czech',
  danish: 'nationality.danish',
  dutch: 'nationality.dutch',
  english: 'nationality.english',
  filipino: 'nationality.filipino',
  finnish: 'nationality.finnish',
  french: 'nationality.french',
  german: 'nationality.german',
  greek: 'nationality.greek',
  hungarian: 'nationality.hungarian',
  india: 'nationality.indian',
  indian: 'nationality.indian',
  irish: 'nationality.irish',
  israeli: 'nationality.israeli',
  italian: 'nationality.italian',
  japanese: 'nationality.japanese',
  korean: 'nationality.korean',
  lebanese: 'nationality.lebanese',
  mexican: 'nationality.mexican',
  moroccan: 'nationality.moroccan',
  norwegian: 'nationality.norwegian',
  polish: 'nationality.polish',
  portuguese: 'nationality.portuguese',
  russian: 'nationality.russian',
  scottish: 'nationality.scottish',
  spanish: 'nationality.spanish',
  swedish: 'nationality.swedish',
  swiss: 'nationality.swiss',
  telugu: 'nationality.telugu',
  thai: 'nationality.thai',
  turkish: 'nationality.turkish',
  ukrainian: 'nationality.ukrainian',
  uruguaya: 'nationality.uruguayan',
  uruguayan: 'nationality.uruguayan',
  vietnamese: 'nationality.vietnamese',
};

// Map spoken language values to translation keys
const SPOKEN_LANGUAGE_KEYS: Record<string, string> = {
  english: 'spokenLanguage.english',
  spanish: 'spokenLanguage.spanish',
  french: 'spokenLanguage.french',
  portuguese: 'spokenLanguage.portuguese',
  german: 'spokenLanguage.german',
  italian: 'spokenLanguage.italian',
  japanese: 'spokenLanguage.japanese',
  korean: 'spokenLanguage.korean',
  mandarin: 'spokenLanguage.mandarin',
  cantonese: 'spokenLanguage.cantonese',
  russian: 'spokenLanguage.russian',
  arabic: 'spokenLanguage.arabic',
  hindi: 'spokenLanguage.hindi',
  thai: 'spokenLanguage.thai',
  vietnamese: 'spokenLanguage.vietnamese',
  indonesian: 'spokenLanguage.indonesian',
  malay: 'spokenLanguage.malay',
  tagalog: 'spokenLanguage.tagalog',
  dutch: 'spokenLanguage.dutch',
  polish: 'spokenLanguage.polish',
  turkish: 'spokenLanguage.turkish',
  greek: 'spokenLanguage.greek',
  czech: 'spokenLanguage.czech',
  swedish: 'spokenLanguage.swedish',
  norwegian: 'spokenLanguage.norwegian',
  danish: 'spokenLanguage.danish',
  finnish: 'spokenLanguage.finnish',
  hungarian: 'spokenLanguage.hungarian',
  romanian: 'spokenLanguage.romanian',
  ukrainian: 'spokenLanguage.ukrainian',
  hebrew: 'spokenLanguage.hebrew',
  persian: 'spokenLanguage.persian',
  urdu: 'spokenLanguage.urdu',
  punjabi: 'spokenLanguage.punjabi',
  tamil: 'spokenLanguage.tamil',
  telugu: 'spokenLanguage.telugu',
  marathi: 'spokenLanguage.marathi',
  gujarati: 'spokenLanguage.gujarati',
  kannada: 'spokenLanguage.kannada',
  malayalam: 'spokenLanguage.malayalam',
  serbian: 'spokenLanguage.serbian',
  croatian: 'spokenLanguage.croatian',
  bulgarian: 'spokenLanguage.bulgarian',
  slovak: 'spokenLanguage.slovak',
  slovenian: 'spokenLanguage.slovenian',
  lithuanian: 'spokenLanguage.lithuanian',
  latvian: 'spokenLanguage.latvian',
  estonian: 'spokenLanguage.estonian',
  icelandic: 'spokenLanguage.icelandic',
  albanian: 'spokenLanguage.albanian',
  macedonian: 'spokenLanguage.macedonian',
  bosnian: 'spokenLanguage.bosnian',
  georgian: 'spokenLanguage.georgian',
  armenian: 'spokenLanguage.armenian',
  azerbaijani: 'spokenLanguage.azerbaijani',
  kazakh: 'spokenLanguage.kazakh',
  uzbek: 'spokenLanguage.uzbek',
  bengali: 'spokenLanguage.bengali',
  sinhala: 'spokenLanguage.sinhala',
  nepali: 'spokenLanguage.nepali',
  mongolian: 'spokenLanguage.mongolian',
  khmer: 'spokenLanguage.khmer',
  lao: 'spokenLanguage.lao',
  burmese: 'spokenLanguage.burmese',
  swahili: 'spokenLanguage.swahili',
  amharic: 'spokenLanguage.amharic',
};

export const PERSONALITY_LABELS: Record<string, string> = {
  shy: 'personality.shy',
  playful: 'personality.playful',
  caring: 'personality.caring',
  passionate: 'personality.passionate',
  submissive: 'personality.submissive',
  dominant: 'personality.dominant',
  'турботлива': 'personality.caring',
};

export const RELATIONSHIP_TYPE_LABELS: Record<string, string> = {
  stranger: 'relationship.stranger',
  classmate: 'relationship.classmate',
  coworker: 'relationship.coworker',
  'best friend': 'relationship.bestFriend',
  bestfriend: 'relationship.bestFriend',
  girlfriend: 'relationship.girlfriend',
  wife: 'relationship.wife',
  'дівчина': 'relationship.girlfriend',
};

export function getPersonalityLabel(personality: string | null): string | null {
  if (!personality) return null;
  const key = PERSONALITY_LABELS[personality.toLowerCase()];
  if (key) {
    return i18n.t(key);
  }
  return personality;
}

export function getRelationshipLabel(relationship: string | null): string | null {
  if (!relationship) return null;
  const key = RELATIONSHIP_TYPE_LABELS[relationship.toLowerCase()];
  if (key) {
    return i18n.t(key);
  }
  return relationship;
}

function translateSpokenLanguage(language: string): string {
  const key = SPOKEN_LANGUAGE_KEYS[language.toLowerCase()];
  if (key) {
    return i18n.t(key);
  }
  // Fallback to original if no translation key found
  return language;
}

export function getLanguageDisplay(nativeLanguage: string | null): string {
  if (!nativeLanguage) return i18n.t('language.english');
  if (nativeLanguage.toLowerCase() === 'english') return i18n.t('language.english');
  const translatedLanguage = translateSpokenLanguage(nativeLanguage);
  return i18n.t('language.englishWithNative', { language: translatedLanguage });
}

export function getNationalityDisplay(nationality: string | null): string {
  if (!nationality) return '';
  const cleanNationality = nationality.replace(/\.$/, '').trim();
  const key = NATIONALITY_KEYS[cleanNationality.toLowerCase()];
  if (key) {
    return i18n.t(key);
  }
  // Fallback to original if no translation key found
  return cleanNationality;
}
