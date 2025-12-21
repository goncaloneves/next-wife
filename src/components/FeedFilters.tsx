import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

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
  maxVisible = 6,
  scrollable = false,
  emptyMessage
}: { 
  title: string;
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
  showAll?: boolean;
  maxVisible?: number;
  scrollable?: boolean;
  emptyMessage?: string;
}) {
  const [expanded, setExpanded] = useState(showAll);
  const visibleOptions = expanded ? options : options.slice(0, maxVisible);
  const hasMore = options.length > maxVisible;

  return (
    <div className="space-y-3 min-h-[120px]">
      {title && <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider px-1">{title}</h3>}
      {options.length === 0 && emptyMessage ? (
        <p className="text-sm text-white/40 px-1">{emptyMessage}</p>
      ) : (
        <div className={cn(
          "flex flex-wrap gap-2",
          scrollable && "max-h-[140px] overflow-y-auto pr-1"
        )}>
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
          {hasMore && !scrollable && (
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

export function FeedFilters({ channel, onFiltersChange }: FeedFiltersProps) {
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
  const [showFilters, setShowFilters] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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

  const clearAllFilters = () => {
    setSelectedRegion("all");
    setSelectedAgeBracket("all");
    setSelectedOccupation("all");
    setSelectedLanguage("all");
    setSelectedHometown("all");
  };

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
    <div className="mb-6 space-y-4" data-testid="feed-filters">
      {/* Quick filter chips - horizontal scroll */}
      <div className="relative">
        <div 
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* Filter toggle button */}
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

          {/* Popular region chips - always visible */}
          {filterOptions.regions.slice(0, 4).map((region) => (
            <Chip
              key={region}
              label={region}
              selected={selectedRegion === region}
              onClick={() => setSelectedRegion(selectedRegion === region ? "all" : region)}
              variant="accent"
            />
          ))}

          {/* Popular age chips */}
          {filterOptions.ageBrackets.map((age) => (
            <Chip
              key={age}
              label={age}
              selected={selectedAgeBracket === age}
              onClick={() => setSelectedAgeBracket(selectedAgeBracket === age ? "all" : age)}
            />
          ))}
        </div>

        {/* Fade edges for scroll indication */}
        <div className="absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none" />
      </div>

      {/* Active filter tags */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-white/50 font-medium">Active:</span>
          {activeFilters.map((filter) => (
            <button
              key={`${filter.type}-${filter.value}`}
              onClick={filter.clear}
              className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium 
                         bg-gradient-to-r from-orange-500/20 to-rose-500/20 text-orange-300
                         hover:from-orange-500/30 hover:to-rose-500/30 transition-all"
              data-testid={`active-filter-${filter.type.toLowerCase()}`}
            >
              <span className="text-white/50">{filter.type}:</span>
              {filter.value}
              <X className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-7 px-3 text-xs text-white/50 hover:text-white hover:bg-white/10 rounded-full"
            data-testid="clear-all-filters"
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Expanded filter sections */}
      {showFilters && (
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 space-y-6 border border-white/10 animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
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
              maxVisible={8}
            />

            {/* Occupation */}
            <FilterSection
              title="Occupation"
              options={filterOptions.occupationCategories}
              selected={selectedOccupation}
              onSelect={setSelectedOccupation}
            />

            {/* City - with expand button to show more cities */}
            <FilterSection
              title={selectedRegion !== "all" ? `Cities in ${selectedRegion}` : "City"}
              options={availableHometowns}
              selected={selectedHometown}
              onSelect={setSelectedHometown}
              maxVisible={8}
              emptyMessage="Select a region to see cities"
            />
          </div>

          {/* Close button */}
          <div className="flex justify-center pt-2">
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
    </div>
  );
}
