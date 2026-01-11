import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Flame, ChevronDown, ChevronUp, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  Chip, 
  FilterSection, 
  toggleArrayValue 
} from "./filters/FilterComponents";
import { useFilters } from "@/contexts/FilterContext";
import { useFilterOptions } from "@/hooks/useFilterOptions";

interface FeedFiltersProps {
  channel: string;
  showFilters?: boolean;
  onShowFiltersChange?: (show: boolean) => void;
  hideButton?: boolean;
}

export function FeedFilters({ 
  channel, 
  showFilters: controlledShowFilters,
  onShowFiltersChange,
  hideButton = false
}: FeedFiltersProps) {
  const { filters, setFilters, activeFilterCount } = useFilters();
  const { 
    filterOptions, 
    loading, 
    personalityOptions, 
    relationshipOptions,
    valuesToLabels,
    labelsToValues,
  } = useFilterOptions(channel);
  
  const [internalShowFilters, setInternalShowFilters] = useState(false);
  
  const showFilters = controlledShowFilters !== undefined ? controlledShowFilters : internalShowFilters;
  const setShowFilters = onShowFiltersChange || setInternalShowFilters;

  const availableHometowns = useMemo(() => {
    const hometowns = filterOptions.hometowns || {};
    if (filters.regions.length === 0) {
      return Object.values(hometowns).flat().sort();
    }
    return filters.regions.flatMap(region => hometowns[region] || []).sort();
  }, [filters.regions, filterOptions.hometowns]);

  const updateFilter = useCallback(<K extends keyof typeof filters>(key: K, value: (typeof filters)[K]) => {
    const newFilters = { ...filters, [key]: value };
    
    if (key === 'regions') {
      const validHometowns = filters.hometowns.filter(h => {
        const hometowns = filterOptions.hometowns || {};
        const newRegions = value as string[];
        if (newRegions.length === 0) {
          return Object.values(hometowns).flat().includes(h);
        }
        return newRegions.some(region => (hometowns[region] || []).includes(h));
      });
      if (validHometowns.length !== filters.hometowns.length) {
        newFilters.hometowns = validHometowns;
      }
    }
    
    setFilters(newFilters);
  }, [filters, setFilters, filterOptions.hometowns]);

  const toggleRegion = useCallback((value: string) => {
    updateFilter('regions', toggleArrayValue(filters.regions, value));
  }, [filters.regions, updateFilter]);

  const toggleAgeBracket = useCallback((value: string) => {
    updateFilter('ageBrackets', toggleArrayValue(filters.ageBrackets, value));
  }, [filters.ageBrackets, updateFilter]);

  const toggleOccupation = useCallback((value: string) => {
    updateFilter('occupationCategories', toggleArrayValue(filters.occupationCategories, value));
  }, [filters.occupationCategories, updateFilter]);

  const toggleLanguage = useCallback((value: string) => {
    updateFilter('languages', toggleArrayValue(filters.languages, value));
  }, [filters.languages, updateFilter]);

  const toggleHometown = useCallback((value: string) => {
    updateFilter('hometowns', toggleArrayValue(filters.hometowns, value));
  }, [filters.hometowns, updateFilter]);

  const togglePersonality = useCallback((label: string) => {
    const value = labelsToValues.personality(label);
    if (value) {
      updateFilter('personalities', toggleArrayValue(filters.personalities, value));
    }
  }, [filters.personalities, updateFilter, labelsToValues]);

  const toggleRelationship = useCallback((label: string) => {
    const value = labelsToValues.relationship(label);
    if (value) {
      updateFilter('relationships', toggleArrayValue(filters.relationships, value));
    }
  }, [filters.relationships, updateFilter, labelsToValues]);

  const toggleHasVideo = useCallback(() => {
    updateFilter('hasVideo', !filters.hasVideo);
  }, [filters.hasVideo, updateFilter]);

  const toggleHasMultipleMedia = useCallback(() => {
    updateFilter('hasMultipleMedia', !filters.hasMultipleMedia);
  }, [filters.hasMultipleMedia, updateFilter]);

  const clearAll = useCallback(() => {
    setFilters({
      regions: [],
      ageBrackets: [],
      occupationCategories: [],
      languages: [],
      hometowns: [],
      personalities: [],
      relationships: [],
      hasVideo: false,
      hasMultipleMedia: false,
    });
  }, [setFilters]);

  const selectedPersonalityLabels = useMemo(() => 
    valuesToLabels.personalities(filters.personalities),
    [valuesToLabels, filters.personalities]
  );
  const selectedRelationshipLabels = useMemo(() => 
    valuesToLabels.relationships(filters.relationships),
    [valuesToLabels, filters.relationships]
  );

  if (loading) {
    return null;
  }
  
  if (hideButton && !showFilters) {
    return null;
  }

  return (
    <div className="space-y-3 relative" data-testid="feed-filters">
      {showFilters && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setShowFilters(false)}
        />
      )}
      
      {!hideButton && (
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-2 rounded-full border-white/20 bg-black/50 backdrop-blur-sm text-white hover:bg-white/20 transition-all",
              showFilters && "ring-2 ring-pink-500/50"
            )}
            data-testid="button-toggle-filters"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="bg-gradient-to-r from-pink-500 to-orange-400 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                {activeFilterCount}
              </span>
            )}
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      )}

      {showFilters && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[min(90vw,600px)] bg-gradient-to-b from-zinc-900/95 to-black/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-pink-500 to-orange-400 p-2 rounded-lg">
                <Flame className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Filters</h3>
                <p className="text-xs text-white/60">Find your perfect match</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  className="text-pink-400 hover:text-pink-300 hover:bg-pink-500/10 text-xs"
                  data-testid="button-clear-filters"
                >
                  Clear all
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowFilters(false)}
                className="text-white/60 hover:text-white hover:bg-white/10"
                data-testid="button-close-filters"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
            <FilterSection
              title="Region"
              options={filterOptions.regions || []}
              selected={filters.regions}
              onToggle={toggleRegion}
              onClearAll={() => updateFilter('regions', [])}
              testIdPrefix="chip-region"
            />

            {availableHometowns.length > 0 && (
              <FilterSection
                title="Hometown"
                options={availableHometowns}
                selected={filters.hometowns}
                onToggle={toggleHometown}
                onClearAll={() => updateFilter('hometowns', [])}
                testIdPrefix="chip-hometown"
              />
            )}

            <FilterSection
              title="Age"
              options={filterOptions.ageBrackets || []}
              selected={filters.ageBrackets}
              onToggle={toggleAgeBracket}
              onClearAll={() => updateFilter('ageBrackets', [])}
              testIdPrefix="chip-age"
            />

            <FilterSection
              title="Occupation"
              options={filterOptions.occupationCategories || []}
              selected={filters.occupationCategories}
              onToggle={toggleOccupation}
              onClearAll={() => updateFilter('occupationCategories', [])}
              testIdPrefix="chip-occupation"
            />

            <FilterSection
              title="Language"
              options={filterOptions.languages || []}
              selected={filters.languages}
              onToggle={toggleLanguage}
              onClearAll={() => updateFilter('languages', [])}
              testIdPrefix="chip-language"
            />

            <FilterSection
              title="Personality"
              options={personalityOptions}
              selected={selectedPersonalityLabels}
              onToggle={togglePersonality}
              onClearAll={() => updateFilter('personalities', [])}
              testIdPrefix="chip-personality"
            />

            <FilterSection
              title="Looking For"
              options={relationshipOptions}
              selected={selectedRelationshipLabels}
              onToggle={toggleRelationship}
              onClearAll={() => updateFilter('relationships', [])}
              testIdPrefix="chip-relationship"
            />

            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider px-1">Media</h3>
              <div className="flex flex-wrap gap-2">
                <Chip
                  label="Has Video"
                  selected={filters.hasVideo}
                  onClick={toggleHasVideo}
                  testIdPrefix="chip-media"
                />
                <Chip
                  label="Multiple Photos"
                  selected={filters.hasMultipleMedia}
                  onClick={toggleHasMultipleMedia}
                  testIdPrefix="chip-media"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface FilterButtonProps {
  onClick: () => void;
  activeCount: number;
}

export function FilterButton({ onClick, activeCount }: FilterButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-full border-white/20 bg-black/50 backdrop-blur-sm text-white hover:bg-white/20 transition-all",
        activeCount > 0 && "ring-2 ring-pink-500/50"
      )}
      data-testid="button-toggle-filters"
    >
      <SlidersHorizontal className="w-4 h-4" />
      <span>Filters</span>
      {activeCount > 0 && (
        <span className="bg-gradient-to-r from-pink-500 to-orange-400 text-white text-xs px-2 py-0.5 rounded-full font-medium">
          {activeCount}
        </span>
      )}
    </Button>
  );
}
