import i18n from '@/i18n';

export const PERSONALITY_LABELS: Record<string, string> = {
  shy: 'personality.shy',
  playful: 'personality.playful',
  caring: 'personality.caring',
  passionate: 'personality.passionate',
  submissive: 'personality.submissive',
  dominant: 'personality.dominant',
};

export const RELATIONSHIP_TYPE_LABELS: Record<string, string> = {
  stranger: 'relationship.stranger',
  classmate: 'relationship.classmate',
  coworker: 'relationship.coworker',
  'best friend': 'relationship.bestFriend',
  bestfriend: 'relationship.bestFriend',
  girlfriend: 'relationship.girlfriend',
  wife: 'relationship.wife',
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

export function getLanguageDisplay(nativeLanguage: string | null): string {
  if (!nativeLanguage) return i18n.t('language.english');
  if (nativeLanguage.toLowerCase() === 'english') return i18n.t('language.english');
  return i18n.t('language.englishWithNative', { language: nativeLanguage });
}
