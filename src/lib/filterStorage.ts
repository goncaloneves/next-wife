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

export const filtersToUrlParams = (filters: SharedFilters): URLSearchParams => {
  const params = new URLSearchParams();
  
  if (filters.regions.length > 0) params.set('regions', filters.regions.join(','));
  if (filters.ageBrackets.length > 0) params.set('age', filters.ageBrackets.join(','));
  if (filters.occupationCategories.length > 0) params.set('occupation', filters.occupationCategories.join(','));
  if (filters.languages.length > 0) params.set('languages', filters.languages.join(','));
  if (filters.hometowns.length > 0) params.set('hometowns', filters.hometowns.join(','));
  if (filters.personalities.length > 0) params.set('personality', filters.personalities.join(','));
  if (filters.relationships.length > 0) params.set('relationship', filters.relationships.join(','));
  if (filters.hasVideo) params.set('video', '1');
  if (filters.hasMultipleMedia) params.set('multi', '1');
  
  return params;
};

export const urlParamsToFilters = (params: URLSearchParams): SharedFilters | null => {
  const hasAnyFilter = params.has('regions') || params.has('age') || params.has('occupation') ||
    params.has('languages') || params.has('hometowns') || params.has('personality') ||
    params.has('relationship') || params.has('video') || params.has('multi');
  
  if (!hasAnyFilter) return null;
  
  return {
    regions: params.get('regions')?.split(',').filter(Boolean) || [],
    ageBrackets: params.get('age')?.split(',').filter(Boolean) || [],
    occupationCategories: params.get('occupation')?.split(',').filter(Boolean) || [],
    languages: params.get('languages')?.split(',').filter(Boolean) || [],
    hometowns: params.get('hometowns')?.split(',').filter(Boolean) || [],
    personalities: params.get('personality')?.split(',').filter(Boolean) || [],
    relationships: params.get('relationship')?.split(',').filter(Boolean) || [],
    hasVideo: params.get('video') === '1',
    hasMultipleMedia: params.get('multi') === '1',
  };
};

export const updateUrlWithFilters = (filters: SharedFilters): void => {
  const params = filtersToUrlParams(filters);
  const currentUrl = new URL(window.location.href);
  
  // Preserve non-filter params (like lang, view)
  const preserveParams = ['lang', 'view'];
  preserveParams.forEach(key => {
    const value = currentUrl.searchParams.get(key);
    if (value) params.set(key, value);
  });
  
  const newSearch = params.toString();
  const newUrl = `${window.location.pathname}${newSearch ? '?' + newSearch : ''}`;
  
  if (newUrl !== window.location.pathname + window.location.search) {
    window.history.replaceState(null, '', newUrl);
  }
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
