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
  onFiltersChange: (filters: { region?: string; ageBracket?: string; occupationCategory?: string; language?: string; hometown?: string }) => void;
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
  onSelect,
  showAll = false,
  emptyMessage
}: { 
  title: string;
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
  showAll?: boolean;
  emptyMessage?: string;
}) {
  const [expanded, setExpanded] = useState(showAll);
  const responsiveMaxVisible = useResponsiveMaxVisible();
  const maxVisible = showAll ? options.length : responsiveMaxVisible;
  const visibleOptions = expanded ? options : options.slice(0, maxVisible);
  const hasMore = options.length > maxVisible;

  return (
    <div className="space-y-3">
      {title && <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider px-1">{title}</h3>}
      {options.length === 0 && emptyMessage ? (
        <p className="text-sm text-white/40 px-1">{emptyMessage}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Chip
            label="All"
            selected={selected === "all"}
            onClick={() => onSelect("all")}
          />
          {visibleOptions.map((option) => (
            <Chip
              key={option}
              label={option}
              selected={selected === option}
              onClick={() => onSelect(option)}
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
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [selectedAgeBracket, setSelectedAgeBracket] = useState<string>("all");
  const [selectedOccupation, setSelectedOccupation] = useState<string>("all");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all");
  const [selectedHometown, setSelectedHometown] = useState<string>("all");
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
    if (selectedRegion === "all") {
      return Object.values(hometowns).flat().sort();
    }
    return hometowns[selectedRegion] || [];
  }, [selectedRegion, filterOptions.hometowns]);

  useEffect(() => {
    if (selectedHometown !== "all" && !availableHometowns.includes(selectedHometown)) {
      setSelectedHometown("all");
    }
  }, [selectedRegion, availableHometowns, selectedHometown]);

  const notifyFiltersChange = useCallback(() => {
    onFiltersChange({
      region: selectedRegion === "all" ? undefined : selectedRegion,
      ageBracket: selectedAgeBracket === "all" ? undefined : selectedAgeBracket,
      occupationCategory: selectedOccupation === "all" ? undefined : selectedOccupation,
      language: selectedLanguage === "all" ? undefined : selectedLanguage,
      hometown: selectedHometown === "all" ? undefined : selectedHometown,
    });
  }, [selectedRegion, selectedAgeBracket, selectedOccupation, selectedLanguage, selectedHometown, onFiltersChange]);

  useEffect(() => {
    if (!loading) {
      notifyFiltersChange();
    }
  }, [selectedRegion, selectedAgeBracket, selectedOccupation, selectedLanguage, selectedHometown, loading, notifyFiltersChange]);

  const activeFilters = useMemo(() => {
    const filters: { type: string; value: string; clear: () => void }[] = [];
    if (selectedRegion !== "all") filters.push({ type: "Region", value: selectedRegion, clear: () => setSelectedRegion("all") });
    if (selectedAgeBracket !== "all") filters.push({ type: "Age", value: selectedAgeBracket, clear: () => setSelectedAgeBracket("all") });
    if (selectedOccupation !== "all") filters.push({ type: "Work", value: selectedOccupation, clear: () => setSelectedOccupation("all") });
    if (selectedLanguage !== "all") filters.push({ type: "Language", value: selectedLanguage, clear: () => setSelectedLanguage("all") });
    if (selectedHometown !== "all") filters.push({ type: "City", value: selectedHometown, clear: () => setSelectedHometown("all") });
    return filters;
  }, [selectedRegion, selectedAgeBracket, selectedOccupation, selectedLanguage, selectedHometown]);

  if (loading) {
    return (
      <div className="mb-6">
        <div className="flex gap-2 overflow-hidden">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-10 w-24 bg-white/10 rounded-full animate-pulse flex-shrink-0" />
          ))}
        </div>
      </div>
    );
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
              Filters {activeFilters.length > 0 && `(${activeFilters.length})`}
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
              selected={selectedRegion}
              onSelect={setSelectedRegion}
            />

            {/* Age */}
            <FilterSection
              title="Age"
              options={filterOptions.ageBrackets}
              selected={selectedAgeBracket}
              onSelect={setSelectedAgeBracket}
              showAll
            />

            {/* Language */}
            <FilterSection
              title="Language"
              options={filterOptions.languages}
              selected={selectedLanguage}
              onSelect={setSelectedLanguage}
            />

            {/* Occupation */}
            <FilterSection
              title="Occupation"
              options={filterOptions.occupationCategories}
              selected={selectedOccupation}
              onSelect={setSelectedOccupation}
            />

            {/* City - max 4 visible for consistent 3 rows */}
            <FilterSection
              title={selectedRegion !== "all" ? `Cities in ${selectedRegion}` : "City"}
              options={availableHometowns}
              selected={selectedHometown}
              onSelect={setSelectedHometown}
              emptyMessage="Select a region to see cities"
            />
            </div>
          </div>

          {/* Close button */}
          <div className="flex justify-center py-3 border-t border-white/10">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(false)}
              className="text-white/50 hover:text-white hover:bg-white/10 rounded-full px-6"
              data-testid="close-filters"
            >
              <ChevronUp className="w-4 h-4 mr-2" />
              Hide filters
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
