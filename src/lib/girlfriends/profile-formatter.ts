export const PERSONALITY_LABELS: Record<string, string> = {
  shy: '🙈 Shy',
  playful: '🤭 Playful',
  caring: '💕 Caring',
  passionate: '🔥 Passionate',
  submissive: '🌸 Submissive',
  dominant: '😈 Dominant',
};

export const RELATIONSHIP_TYPE_LABELS: Record<string, string> = {
  stranger: '❓ Stranger',
  classmate: '📚 Classmate',
  coworker: '💼 Coworker',
  'best friend': '🤝 Best Friend',
  bestfriend: '🤝 Best Friend',
  girlfriend: '💕 Girlfriend',
  wife: '💍 Wife',
};

export function getPersonalityLabel(personality: string | null): string | null {
  if (!personality) return null;
  return PERSONALITY_LABELS[personality.toLowerCase()] || personality;
}

export function getRelationshipLabel(relationship: string | null): string | null {
  if (!relationship) return null;
  return RELATIONSHIP_TYPE_LABELS[relationship.toLowerCase()] || relationship;
}

// Format language display: "English" for English speakers, "English, [Native]" for others
export function getLanguageDisplay(nativeLanguage: string | null): string {
  if (!nativeLanguage) return 'English';
  if (nativeLanguage.toLowerCase() === 'english') return 'English';
  return `English, ${nativeLanguage}`;
}
