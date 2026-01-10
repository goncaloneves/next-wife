import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Flame, ChevronDown, ChevronUp, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { PERSONALITY_LABELS, RELATIONSHIP_TYPE_LABELS } from "@/lib/girlfriends/profile-formatter";
import { 
  FilterOptions, 
  EMPTY_FILTER_OPTIONS, 
  Chip, 
  FilterSection, 
  fetchFilterOptions, 
  toggleArrayValue 
} from "./filters/FilterComponents";
import { getStoredFilters, saveFilters } from "@/lib/filterStorage";

interface FeedFiltersProps {
  channel: string;
  onFiltersChange: (filters: { regions: string[]; ageBrackets: string[]; occupationCategories: string[]; languages: string[]; hometowns: string[]; personalities: string[]; relationships: string[]; hasVideo: boolean; hasMultipleMedia: boolean }) => void;
  showFilters?: boolean;
  onShowFiltersChange?: (show: boolean) => void;
  hideButton?: boolean;
}

export function FeedFilters({ 
  channel, 
  onFiltersChange,
  showFilters: controlledShowFilters,
  onShowFiltersChange,
  hideButton = false
}: FeedFiltersProps) {
  const [filterOptions, setFilterOptions] = useState<FilterOptions>(EMPTY_FILTER_OPTIONS);
  
  const [selectedRegions, setSelectedRegions] = useState<string[]>(() => getStoredFilters().regions);
  const [selectedAgeBrackets, setSelectedAgeBrackets] = useState<string[]>(() => getStoredFilters().ageBrackets);
  const [selectedOccupations, setSelectedOccupations] = useState<string[]>(() => getStoredFilters().occupationCategories);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(() => getStoredFilters().languages);
  const [selectedHometowns, setSelectedHometowns] = useState<string[]>(() => getStoredFilters().hometowns);
  const [selectedPersonalities, setSelectedPersonalities] = useState<string[]>(() => getStoredFilters().personalities);
  const [selectedRelationships, setSelectedRelationships] = useState<string[]>(() => getStoredFilters().relationships);
  const [hasVideo, setHasVideo] = useState<boolean>(() => getStoredFilters().hasVideo);
  const [hasMultipleMedia, setHasMultipleMedia] = useState<boolean>(() => getStoredFilters().hasMultipleMedia);
  
  const [loading, setLoading] = useState(true);
  const [internalShowFilters, setInternalShowFilters] = useState(false);
  
  useEffect(() => {
    const syncFiltersFromStorage = () => {
      const stored = getStoredFilters();
      setSelectedRegions(stored.regions);
      setSelectedAgeBrackets(stored.ageBrackets);
      setSelectedOccupations(stored.occupationCategories);
      setSelectedLanguages(stored.languages);
      setSelectedHometowns(stored.hometowns);
      setSelectedPersonalities(stored.personalities);
      setSelectedRelationships(stored.relationships);
      setHasVideo(stored.hasVideo);
      setHasMultipleMedia(stored.hasMultipleMedia);
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
  
  const showFilters = controlledShowFilters !== undefined ? controlledShowFilters : internalShowFilters;
  const setShowFilters = onShowFiltersChange || setInternalShowFilters;

  useEffect(() => {
    fetchFilterOptions(channel).then(data => {
      setFilterOptions(data);
      setLoading(false);
    });
  }, [channel]);

  const availableHometowns = useMemo(() => {
    const hometowns = filterOptions.hometowns || {};
    if (selectedRegions.length === 0) {
      return Object.values(hometowns).flat().sort();
    }
    return selectedRegions.flatMap(region => hometowns[region] || []).sort();
  }, [selectedRegions, filterOptions.hometowns]);

  useEffect(() => {
    if (selectedHometowns.length > 0) {
      const validHometowns = selectedHometowns.filter(h => availableHometowns.includes(h));
      if (validHometowns.length !== selectedHometowns.length) {
        setSelectedHometowns(validHometowns);
      }
    }
  }, [selectedRegions, availableHometowns, selectedHometowns]);

  const notifyFiltersChange = useCallback(() => {
    // Always send explicit arrays (empty or with values) to ensure state resets properly
    onFiltersChange({
      regions: selectedRegions,
      ageBrackets: selectedAgeBrackets,
      occupationCategories: selectedOccupations,
      languages: selectedLanguages,
      hometowns: selectedHometowns,
      personalities: selectedPersonalities,
      relationships: selectedRelationships,
      hasVideo,
      hasMultipleMedia,
    });
  }, [selectedRegions, selectedAgeBrackets, selectedOccupations, selectedLanguages, selectedHometowns, selectedPersonalities, selectedRelationships, hasVideo, hasMultipleMedia, onFiltersChange]);

  useEffect(() => {
    if (!loading) {
      notifyFiltersChange();
    }
  }, [selectedRegions, selectedAgeBrackets, selectedOccupations, selectedLanguages, selectedHometowns, selectedPersonalities, selectedRelationships, hasVideo, hasMultipleMedia, loading, notifyFiltersChange]);

  useEffect(() => {
    if (loading) return;
    
    saveFilters({
      regions: selectedRegions,
      ageBrackets: selectedAgeBrackets,
      occupationCategories: selectedOccupations,
      languages: selectedLanguages,
      hometowns: selectedHometowns,
      personalities: selectedPersonalities,
      relationships: selectedRelationships,
      hasVideo,
      hasMultipleMedia,
    });
  }, [selectedRegions, selectedAgeBrackets, selectedOccupations, selectedLanguages, selectedHometowns, selectedPersonalities, selectedRelationships, hasVideo, hasMultipleMedia, loading]);

  const activeFilterCount = useMemo(() => {
    return selectedRegions.length + selectedAgeBrackets.length + selectedOccupations.length + selectedLanguages.length + selectedHometowns.length + selectedPersonalities.length + selectedRelationships.length + (hasVideo ? 1 : 0) + (hasMultipleMedia ? 1 : 0);
  }, [selectedRegions, selectedAgeBrackets, selectedOccupations, selectedLanguages, selectedHometowns, selectedPersonalities, selectedRelationships, hasVideo, hasMultipleMedia]);

  // Map personality/relationship values to emoji labels
  const personalityOptions = useMemo(() => 
    (filterOptions.personalities || []).map(p => PERSONALITY_LABELS[p] || p),
    [filterOptions.personalities]
  );
  const relationshipOptions = useMemo(() => 
    (filterOptions.relationships || []).map(r => RELATIONSHIP_TYPE_LABELS[r] || r),
    [filterOptions.relationships]
  );
  
  // Reverse map for selected values (label -> value)
  const personalityLabelToValue = useMemo(() => {
    const map: Record<string, string> = {};
    for (const [value, label] of Object.entries(PERSONALITY_LABELS)) {
      map[label] = value;
    }
    return map;
  }, []);
  const relationshipLabelToValue = useMemo(() => {
    const map: Record<string, string> = {};
    for (const [value, label] of Object.entries(RELATIONSHIP_TYPE_LABELS)) {
      map[label] = value;
    }
    return map;
  }, []);
  
  // Selected labels for display
  const selectedPersonalityLabels = useMemo(() => 
    selectedPersonalities.map(p => PERSONALITY_LABELS[p] || p),
    [selectedPersonalities]
  );
  const selectedRelationshipLabels = useMemo(() => 
    selectedRelationships.map(r => RELATIONSHIP_TYPE_LABELS[r] || r),
    [selectedRelationships]
  );

  // Return nothing while loading - no skeleton placeholders needed
  if (loading) {
    return null;
  }
  
  // If using external button and filters are closed, return nothing
  if (hideButton && !showFilters) {
    return null;
  }

  return (
    <div className="space-y-3 relative" data-testid="feed-filters">


      {/* Mobile backdrop to hide content behind filters */}
      {showFilters && (
        <div 
          className="fixed inset-0 bg-black z-40 md:hidden" 
          onClick={() => setShowFilters(false)}
        />
      )}

      {/* Expanded filter sections - absolute overlay to avoid layout shift */}
      {showFilters && (
        <div className="fixed md:absolute inset-0 md:inset-auto md:top-0 md:left-0 md:right-0 z-50 mx-0 md:mx-4 bg-black md:bg-black/95 md:backdrop-blur-md md:rounded-2xl md:border md:border-white/10 shadow-2xl animate-in slide-in-from-top-2 duration-200 flex flex-col md:max-h-[80vh]">
          <div className="p-4 flex-1 overflow-y-auto min-h-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
            {/* Region */}
            <FilterSection
              title="Region"
              options={filterOptions.regions}
              selected={selectedRegions}
              onToggle={(value) => setSelectedRegions(toggleArrayValue(selectedRegions, value))}
              onClearAll={() => setSelectedRegions([])}
            />

            {/* Age */}
            <FilterSection
              title="Age"
              options={filterOptions.ageBrackets}
              selected={selectedAgeBrackets}
              onToggle={(value) => setSelectedAgeBrackets(toggleArrayValue(selectedAgeBrackets, value))}
              onClearAll={() => setSelectedAgeBrackets([])}
              showAll
            />

            {/* Language */}
            <FilterSection
              title="Language"
              options={filterOptions.languages}
              selected={selectedLanguages}
              onToggle={(value) => setSelectedLanguages(toggleArrayValue(selectedLanguages, value))}
              onClearAll={() => setSelectedLanguages([])}
            />

            {/* Occupation */}
            <FilterSection
              title="Occupation"
              options={filterOptions.occupationCategories}
              selected={selectedOccupations}
              onToggle={(value) => setSelectedOccupations(toggleArrayValue(selectedOccupations, value))}
              onClearAll={() => setSelectedOccupations([])}
            />

            {/* City - max 4 visible for consistent 3 rows */}
            <FilterSection
              title={selectedRegions.length > 0 ? `Cities in ${selectedRegions.join(', ')}` : "City"}
              options={availableHometowns}
              selected={selectedHometowns}
              onToggle={(value) => setSelectedHometowns(toggleArrayValue(selectedHometowns, value))}
              onClearAll={() => setSelectedHometowns([])}
              emptyMessage="Select a region to see cities"
            />

            {/* Personality */}
            <FilterSection
              title="Personality"
              options={personalityOptions}
              selected={selectedPersonalityLabels}
              onToggle={(label) => {
                const value = personalityLabelToValue[label] || label;
                setSelectedPersonalities(toggleArrayValue(selectedPersonalities, value));
              }}
              onClearAll={() => setSelectedPersonalities([])}
              showAll
            />

            {/* Relationship */}
            <FilterSection
              title="Relationship"
              options={relationshipOptions}
              selected={selectedRelationshipLabels}
              onToggle={(label) => {
                const value = relationshipLabelToValue[label] || label;
                setSelectedRelationships(toggleArrayValue(selectedRelationships, value));
              }}
              onClearAll={() => setSelectedRelationships([])}
              showAll
            />

            {/* Media Type */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider px-1">Media</h3>
              <div className="flex flex-wrap gap-2">
                <Chip
                  label="Has Video"
                  selected={hasVideo}
                  onClick={() => setHasVideo(!hasVideo)}
                  variant="accent"
                />
                <Chip
                  label="Multiple Photos"
                  selected={hasMultipleMedia}
                  onClick={() => setHasMultipleMedia(!hasMultipleMedia)}
                  variant="accent"
                />
              </div>
            </div>
            </div>
          </div>

          {/* Footer with Clear all and Close buttons */}
          <div className="flex-shrink-0 flex justify-center items-center gap-3 pt-4 pb-5 md:py-4 border-t border-white/10">
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedRegions([]);
                  setSelectedAgeBrackets([]);
                  setSelectedOccupations([]);
                  setSelectedLanguages([]);
                  setSelectedHometowns([]);
                  setSelectedPersonalities([]);
                  setSelectedRelationships([]);
                  setHasVideo(false);
                  setHasMultipleMedia(false);
                }}
                className="text-orange-400 hover:text-orange-300 hover:bg-orange-400/10 rounded-full px-6"
                data-testid="clear-all-filters"
              >
                Clear all ({activeFilterCount})
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(false)}
              className="text-white/50 hover:text-white hover:bg-white/10 rounded-full px-6"
              data-testid="close-filters"
            >
              <ChevronUp className="w-4 h-4 mr-2" />
              Close
            </Button>
          </div>
        </div>
      )}

      {/* Backdrop when filters are open */}
      {showFilters && (
        <div 
          className="fixed inset-0 bg-black/50 z-40" 
          onClick={() => setShowFilters(false)}
        />
      )}
    </div>
  );
}

// Standalone filter button component for use in title row
interface FilterButtonProps {
  isOpen: boolean;
  onClick: () => void;
  activeCount: number;
}

export function FilterButton({ isOpen, onClick, activeCount }: FilterButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center transition-all relative",
        activeCount > 0 
          ? "bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg shadow-orange-500/30" 
          : isOpen
            ? "bg-orange-400/20 text-orange-400"
            : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
      )}
      data-testid="toggle-filters"
    >
      <SlidersHorizontal className="w-5 h-5" />
      {activeCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-white text-orange-500 text-xs font-bold flex items-center justify-center px-1">
          {activeCount}
        </span>
      )}
    </button>
  );
}

// Sort buttons component for Recent/Hot toggle
interface SortButtonsProps {
  sortBy: 'recent' | 'hot';
  onSortChange: (sort: 'recent' | 'hot') => void;
}

export function SortButtons({ sortBy, onSortChange }: SortButtonsProps) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-full bg-white/5 border border-white/10">
      <button
        onClick={() => onSortChange('recent')}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
          sortBy === 'recent'
            ? "bg-white/20 text-white"
            : "text-white/50 hover:text-white/80"
        )}
        data-testid="toggle-recent"
      >
        ✨ Recent
      </button>
      <button
        onClick={() => onSortChange('hot')}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
          sortBy === 'hot'
            ? "bg-gradient-to-r from-orange-500 to-rose-500 text-white"
            : "text-white/50 hover:text-white/80"
        )}
        data-testid="toggle-hot"
      >
        <Flame 
          className="w-4 h-4" 
          style={{ fill: sortBy === 'hot' ? '#FFF' : '#FF6B35', stroke: sortBy === 'hot' ? '#FFF' : '#FF4500', strokeWidth: 1.5 }}
        />
        Hot
      </button>
    </div>
  );
}
