import { useState, useEffect, useCallback } from "react";
import { 
  SharedFilters, 
  DEFAULT_FILTERS, 
  getStoredFilters, 
  saveFilters, 
  getActiveFilterCount 
} from "@/lib/filterStorage";

export interface UseSharedFiltersResult {
  filters: SharedFilters;
  setFilters: (filters: SharedFilters) => void;
  updateFilter: <K extends keyof SharedFilters>(key: K, value: SharedFilters[K]) => void;
  clearFilters: () => void;
  activeFilterCount: number;
}

export function useSharedFilters(): UseSharedFiltersResult {
  const [filters, setFiltersState] = useState<SharedFilters>(() => getStoredFilters());

  useEffect(() => {
    const syncFiltersFromStorage = () => {
      const stored = getStoredFilters();
      setFiltersState(prev => {
        if (JSON.stringify(prev) !== JSON.stringify(stored)) {
          return stored;
        }
        return prev;
      });
    };
    
    window.addEventListener('focus', syncFiltersFromStorage);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncFiltersFromStorage();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    
    return () => {
      window.removeEventListener('focus', syncFiltersFromStorage);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const setFilters = useCallback((newFilters: SharedFilters) => {
    setFiltersState(newFilters);
    saveFilters(newFilters);
  }, []);

  const updateFilter = useCallback(<K extends keyof SharedFilters>(key: K, value: SharedFilters[K]) => {
    setFiltersState(prev => {
      const updated = { ...prev, [key]: value };
      saveFilters(updated);
      return updated;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState({ ...DEFAULT_FILTERS });
    saveFilters({ ...DEFAULT_FILTERS });
  }, []);

  const activeFilterCount = getActiveFilterCount(filters);

  return {
    filters,
    setFilters,
    updateFilter,
    clearFilters,
    activeFilterCount,
  };
}
