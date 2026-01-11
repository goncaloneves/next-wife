import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { 
  SharedFilters, 
  DEFAULT_FILTERS, 
  getStoredFilters, 
  saveFilters, 
  getActiveFilterCount 
} from "@/lib/filterStorage";

interface FilterContextValue {
  filters: SharedFilters;
  setFilters: (filters: SharedFilters) => void;
  updateFilter: <K extends keyof SharedFilters>(key: K, value: SharedFilters[K]) => void;
  clearFilters: () => void;
  activeFilterCount: number;
}

const FilterContext = createContext<FilterContextValue | null>(null);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFiltersState] = useState<SharedFilters>(() => getStoredFilters());

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
