import { useState, useEffect, useCallback, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X, MapPin, Calendar, Briefcase, Globe, Home } from "lucide-react";

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

  const hasActiveFilters = selectedRegion !== "all" || selectedAgeBracket !== "all" || selectedOccupation !== "all" || selectedLanguage !== "all" || selectedHometown !== "all";

  const clearFilters = () => {
    setSelectedRegion("all");
    setSelectedAgeBracket("all");
    setSelectedOccupation("all");
    setSelectedLanguage("all");
    setSelectedHometown("all");
  };

  if (loading) {
    return (
      <div className="flex gap-3 mb-6 opacity-50">
        <div className="h-11 w-36 bg-white/10 rounded-full animate-pulse" />
        <div className="h-11 w-28 bg-white/10 rounded-full animate-pulse" />
        <div className="h-11 w-44 bg-white/10 rounded-full animate-pulse" />
        <div className="h-11 w-32 bg-white/10 rounded-full animate-pulse" />
        <div className="h-11 w-36 bg-white/10 rounded-full animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3 mb-6 items-center" data-testid="feed-filters">
      <Select value={selectedRegion} onValueChange={setSelectedRegion}>
        <SelectTrigger 
          className="w-auto min-w-[140px] h-11 rounded-full bg-white/10 hover:bg-white/20 border-0 text-white/90 px-4 transition-colors"
          data-testid="filter-region"
        >
          <MapPin className="w-4 h-4 mr-2 opacity-70" />
          <SelectValue placeholder="Region" />
        </SelectTrigger>
        <SelectContent className="bg-zinc-900/95 backdrop-blur-xl border-white/10 rounded-xl">
          <SelectItem value="all" className="text-white/90 focus:bg-white/10 focus:text-white rounded-lg">All Regions</SelectItem>
          {filterOptions.regions.map((region) => (
            <SelectItem key={region} value={region} className="text-white/90 focus:bg-white/10 focus:text-white rounded-lg">{region}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
        <SelectTrigger 
          className="w-auto min-w-[130px] h-11 rounded-full bg-white/10 hover:bg-white/20 border-0 text-white/90 px-4 transition-colors"
          data-testid="filter-language"
        >
          <Globe className="w-4 h-4 mr-2 opacity-70" />
          <SelectValue placeholder="Language" />
        </SelectTrigger>
        <SelectContent className="bg-zinc-900/95 backdrop-blur-xl border-white/10 rounded-xl max-h-80">
          <SelectItem value="all" className="text-white/90 focus:bg-white/10 focus:text-white rounded-lg">All Languages</SelectItem>
          {filterOptions.languages.map((lang) => (
            <SelectItem key={lang} value={lang} className="text-white/90 focus:bg-white/10 focus:text-white rounded-lg">{lang}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {availableHometowns.length > 0 && (
        <Select value={selectedHometown} onValueChange={setSelectedHometown}>
          <SelectTrigger 
            className="w-auto min-w-[140px] h-11 rounded-full bg-white/10 hover:bg-white/20 border-0 text-white/90 px-4 transition-colors"
            data-testid="filter-hometown"
          >
            <Home className="w-4 h-4 mr-2 opacity-70" />
            <SelectValue placeholder="City" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900/95 backdrop-blur-xl border-white/10 rounded-xl max-h-80">
            <SelectItem value="all" className="text-white/90 focus:bg-white/10 focus:text-white rounded-lg">All Cities</SelectItem>
            {availableHometowns.map((hometown) => (
              <SelectItem key={hometown} value={hometown} className="text-white/90 focus:bg-white/10 focus:text-white rounded-lg">{hometown}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Select value={selectedAgeBracket} onValueChange={setSelectedAgeBracket}>
        <SelectTrigger 
          className="w-auto min-w-[120px] h-11 rounded-full bg-white/10 hover:bg-white/20 border-0 text-white/90 px-4 transition-colors"
          data-testid="filter-age"
        >
          <Calendar className="w-4 h-4 mr-2 opacity-70" />
          <SelectValue placeholder="Age" />
        </SelectTrigger>
        <SelectContent className="bg-zinc-900/95 backdrop-blur-xl border-white/10 rounded-xl">
          <SelectItem value="all" className="text-white/90 focus:bg-white/10 focus:text-white rounded-lg">All Ages</SelectItem>
          {filterOptions.ageBrackets.map((bracket) => (
            <SelectItem key={bracket} value={bracket} className="text-white/90 focus:bg-white/10 focus:text-white rounded-lg">{bracket}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedOccupation} onValueChange={setSelectedOccupation}>
        <SelectTrigger 
          className="w-auto min-w-[160px] h-11 rounded-full bg-white/10 hover:bg-white/20 border-0 text-white/90 px-4 transition-colors"
          data-testid="filter-occupation"
        >
          <Briefcase className="w-4 h-4 mr-2 opacity-70 flex-shrink-0" />
          <SelectValue placeholder="Occupation" />
        </SelectTrigger>
        <SelectContent className="bg-zinc-900/95 backdrop-blur-xl border-white/10 rounded-xl">
          <SelectItem value="all" className="text-white/90 focus:bg-white/10 focus:text-white rounded-lg">All Occupations</SelectItem>
          {filterOptions.occupationCategories.map((category) => (
            <SelectItem key={category} value={category} className="text-white/90 focus:bg-white/10 focus:text-white rounded-lg">
              {category}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="h-11 rounded-full px-4 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          data-testid="button-clear-filters"
        >
          <X className="w-4 h-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}
