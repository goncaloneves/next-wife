import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

// Hook to get responsive maxVisible based on screen width
// Ensures exactly 3 rows of chips at each breakpoint
// Grid column widths: mobile=full, md=50%, lg=33%
// ~2 chips fit per row in each column
function useResponsiveMaxVisible() {
  const [maxVisible, setMaxVisible] = useState(4); // mobile default
  
  useEffect(() => {
    const updateMaxVisible = () => {
      const width = window.innerWidth;
      // All breakpoints: ~2 chips per row in grid column
      // 3 rows = All + 4 chips + button = 6 items
      // So maxVisible = 4 for all sizes
      setMaxVisible(4);
    };
    
    updateMaxVisible();
    window.addEventListener('resize', updateMaxVisible);
    return () => window.removeEventListener('resize', updateMaxVisible);
  }, []);
  
  return maxVisible;
}

interface FilterOptions {
  regions: string[];
  ageBrackets: string[];
  occupationCategories: string[];
  languages: string[];
  hometowns: Record<string, string[]>;
}

interface FeedFiltersProps {
  channel: string;
  onFiltersChange: (filters: { regions: string[]; ageBrackets: string[]; occupationCategories: string[]; languages: string[]; hometowns: string[] }) => void;
  showFilters?: boolean;
  onShowFiltersChange?: (show: boolean) => void;
  hideButton?: boolean;
}

interface ChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  variant?: "default" | "accent";
}

function Chip({ label, selected, onClick, variant = "default" }: ChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-shrink-0 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap",
        "focus:outline-none focus:ring-2 focus:ring-orange-400/50",
        selected
          ? "bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg shadow-orange-500/25 scale-105"
          : variant === "accent"
          ? "bg-white/15 text-white/90 hover:bg-white/25 hover:scale-102"
          : "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white"
      )}
      data-testid={`chip-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`}
    >
      {label}
    </button>
  );
}

function FilterSection({ 
  title, 
  options, 
  selected, 
  onToggle,
  onClearAll,
  showAll = false,
  emptyMessage
}: { 
  title: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  onClearAll: () => void;
  showAll?: boolean;
  emptyMessage?: string;
}) {
  const [expanded, setExpanded] = useState(showAll);
  const responsiveMaxVisible = useResponsiveMaxVisible();
  const maxVisible = showAll ? options.length : responsiveMaxVisible;
  const visibleOptions = expanded ? options : options.slice(0, maxVisible);
  const hasMore = options.length > maxVisible;
  const isAllSelected = selected.length === 0;

  return (
    <div className="space-y-3">
      {title && <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider px-1">{title}</h3>}
      {options.length === 0 && emptyMessage ? (
        <p className="text-sm text-white/40 px-1">{emptyMessage}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Chip
            label="All"
            selected={isAllSelected}
            onClick={onClearAll}
          />
          {visibleOptions.map((option) => (
            <Chip
              key={option}
              label={option}
              selected={selected.includes(option)}
              onClick={() => onToggle(option)}
              variant="accent"
            />
          ))}
          {hasMore && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 px-3 py-2.5 rounded-full text-sm text-white/60 hover:text-white/90 transition-colors"
              data-testid={`expand-${title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`}
            >
              {expanded ? (
                <>Show less <ChevronUp className="w-4 h-4" /></>
              ) : (
                <>{options.length - maxVisible} more <ChevronDown className="w-4 h-4" /></>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function FeedFilters({ 
  channel, 
  onFiltersChange,
  showFilters: controlledShowFilters,
  onShowFiltersChange,
  hideButton = false
}: FeedFiltersProps) {
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    regions: [],
    ageBrackets: [],
    occupationCategories: [],
    languages: [],
    hometowns: {},
  });
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedAgeBrackets, setSelectedAgeBrackets] = useState<string[]>([]);
  const [selectedOccupations, setSelectedOccupations] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedHometowns, setSelectedHometowns] = useState<string[]>([]);
  
  const toggleSelection = (current: string[], value: string): string[] => {
    return current.includes(value) 
      ? current.filter(v => v !== value)
      : [...current, value];
  };
  const [loading, setLoading] = useState(true);
  const [internalShowFilters, setInternalShowFilters] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Support both controlled and uncontrolled modes
  const showFilters = controlledShowFilters !== undefined ? controlledShowFilters : internalShowFilters;
  const setShowFilters = onShowFiltersChange || setInternalShowFilters;

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${apiUrl}/api/tg-channel-filters?channel=${channel}`);
        if (response.ok) {
          const data = await response.json();
          setFilterOptions(data);
        }
      } catch (err) {
        console.error("Failed to fetch filter options:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFilters();
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
    });
  }, [selectedRegions, selectedAgeBrackets, selectedOccupations, selectedLanguages, selectedHometowns, onFiltersChange]);

  useEffect(() => {
    if (!loading) {
      notifyFiltersChange();
    }
  }, [selectedRegions, selectedAgeBrackets, selectedOccupations, selectedLanguages, selectedHometowns, loading, notifyFiltersChange]);

  const activeFilterCount = useMemo(() => {
    return selectedRegions.length + selectedAgeBrackets.length + selectedOccupations.length + selectedLanguages.length + selectedHometowns.length;
  }, [selectedRegions, selectedAgeBrackets, selectedOccupations, selectedLanguages, selectedHometowns]);

  // Return nothing while loading - no skeleton placeholders needed
  if (loading) {
    return null;
  }

  return (
    <div className="space-y-3 relative" data-testid="feed-filters">
      {/* Quick filter chips - only show if hideButton is false */}
      {!hideButton && (
        <div className="relative">
          <div 
            ref={scrollRef}
            className="flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {/* Filter toggle button - only shows "Filters" */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200",
                "border-2 border-dashed",
                showFilters 
                  ? "border-orange-400 text-orange-400 bg-orange-400/10" 
                  : "border-white/30 text-white/70 hover:border-white/50 hover:text-white"
              )}
              data-testid="toggle-filters"
            >
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
            </button>
          </div>
        </div>
      )}


      {/* Expanded filter sections - absolute overlay to avoid layout shift */}
      {showFilters && (
        <div className="absolute left-0 right-0 z-50 mx-4 bg-black/95 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl animate-in slide-in-from-top-2 duration-200">
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
            {/* Region */}
            <FilterSection
              title="Region"
              options={filterOptions.regions}
              selected={selectedRegions}
              onToggle={(value) => setSelectedRegions(toggleSelection(selectedRegions, value))}
              onClearAll={() => setSelectedRegions([])}
            />

            {/* Age */}
            <FilterSection
              title="Age"
              options={filterOptions.ageBrackets}
              selected={selectedAgeBrackets}
              onToggle={(value) => setSelectedAgeBrackets(toggleSelection(selectedAgeBrackets, value))}
              onClearAll={() => setSelectedAgeBrackets([])}
              showAll
            />

            {/* Language */}
            <FilterSection
              title="Language"
              options={filterOptions.languages}
              selected={selectedLanguages}
              onToggle={(value) => setSelectedLanguages(toggleSelection(selectedLanguages, value))}
              onClearAll={() => setSelectedLanguages([])}
            />

            {/* Occupation */}
            <FilterSection
              title="Occupation"
              options={filterOptions.occupationCategories}
              selected={selectedOccupations}
              onToggle={(value) => setSelectedOccupations(toggleSelection(selectedOccupations, value))}
              onClearAll={() => setSelectedOccupations([])}
            />

            {/* City - max 4 visible for consistent 3 rows */}
            <FilterSection
              title={selectedRegions.length > 0 ? `Cities in ${selectedRegions.join(', ')}` : "City"}
              options={availableHometowns}
              selected={selectedHometowns}
              onToggle={(value) => setSelectedHometowns(toggleSelection(selectedHometowns, value))}
              onClearAll={() => setSelectedHometowns([])}
              emptyMessage="Select a region to see cities"
            />
            </div>
          </div>

          {/* Footer with Clear all and Close buttons */}
          <div className="flex justify-center gap-3 py-3 border-t border-white/10">
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
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
        "border-2 border-dashed",
        isOpen 
          ? "border-orange-400 text-orange-400 bg-orange-400/10" 
          : "border-white/30 text-white/70 hover:border-white/50 hover:text-white"
      )}
      data-testid="toggle-filters"
    >
      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      Filters
      {activeCount > 0 && (
        <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-gradient-to-r from-orange-500 to-rose-500 text-white">
          {activeCount}
        </span>
      )}
    </button>
  );
}
