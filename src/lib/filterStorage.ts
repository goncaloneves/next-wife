export interface SharedFilters {
  regions: string[];
  ageBrackets: string[];
  occupationCategories: string[];
  languages: string[];
  hometowns: string[];
  personalities: string[];
  relationships: string[];
  hasVideo: boolean;
  hasMultipleMedia: boolean;
}

const FILTERS_STORAGE_KEY = 'nextwife_filters';

export const DEFAULT_FILTERS: SharedFilters = {
  regions: [],
  ageBrackets: [],
  occupationCategories: [],
  languages: [],
  hometowns: [],
  personalities: [],
  relationships: [],
  hasVideo: false,
  hasMultipleMedia: false,
};

export const getStoredFilters = (): SharedFilters => {
  try {
    const stored = localStorage.getItem(FILTERS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_FILTERS, ...parsed };
    }
  } catch {}
  return { ...DEFAULT_FILTERS };
};

export const saveFilters = (filters: SharedFilters): void => {
  try {
    localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
  } catch {}
};

export const getActiveFilterCount = (filters: SharedFilters): number => {
  return (
    filters.regions.length +
    filters.ageBrackets.length +
    filters.occupationCategories.length +
    filters.languages.length +
    filters.hometowns.length +
    filters.personalities.length +
    filters.relationships.length +
    (filters.hasVideo ? 1 : 0) +
    (filters.hasMultipleMedia ? 1 : 0)
  );
};
