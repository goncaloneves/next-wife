import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { 
  SharedFilters, 
  DEFAULT_FILTERS, 
  getStoredFilters, 
  saveFilters, 
  getActiveFilterCount,
  urlParamsToFilters,
  updateUrlWithFilters
} from "@/lib/filterStorage";

interface FilterContextValue {
  filters: SharedFilters;
  setFilters: (filters: SharedFilters) => void;
  updateFilter: <K extends keyof SharedFilters>(key: K, value: SharedFilters[K]) => void;
  clearFilters: () => void;
  activeFilterCount: number;
}

const FilterContext = createContext<FilterContextValue | null>(null);

const getInitialFilters = (): SharedFilters => {
  const urlFilters = urlParamsToFilters(new URLSearchParams(window.location.search));
  if (urlFilters) {
    saveFilters(urlFilters);
    return urlFilters;
  }
  return getStoredFilters();
};

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFiltersState] = useState<SharedFilters>(() => getInitialFilters());

  const setFilters = useCallback((newFilters: SharedFilters) => {
    setFiltersState(newFilters);
    saveFilters(newFilters);
    updateUrlWithFilters(newFilters);
  }, []);

  const updateFilter = useCallback(<K extends keyof SharedFilters>(key: K, value: SharedFilters[K]) => {
    setFiltersState(prev => {
      const updated = { ...prev, [key]: value };
      saveFilters(updated);
      updateUrlWithFilters(updated);
      return updated;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState({ ...DEFAULT_FILTERS });
    saveFilters({ ...DEFAULT_FILTERS });
    updateUrlWithFilters({ ...DEFAULT_FILTERS });
  }, []);

  useEffect(() => {
    updateUrlWithFilters(filters);
  }, []);

  const activeFilterCount = getActiveFilterCount(filters);

  return (
    <FilterContext.Provider value={{ filters, setFilters, updateFilter, clearFilters, activeFilterCount }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters(): FilterContextValue {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error("useFilters must be used within a FilterProvider");
  }
  return context;
}

export function useFiltersOptional(): FilterContextValue | null {
  return useContext(FilterContext);
}
