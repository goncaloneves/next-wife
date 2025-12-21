import { useState, useEffect, useCallback } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X, MapPin, Calendar } from "lucide-react";

interface FilterOptions {
  regions: string[];
  ageBrackets: string[];
}

interface FeedFiltersProps {
  channel: string;
  onFiltersChange: (filters: { region?: string; ageBracket?: string }) => void;
}

export function FeedFilters({ channel, onFiltersChange }: FeedFiltersProps) {
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    regions: [],
    ageBrackets: [],
  });
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [selectedAgeBracket, setSelectedAgeBracket] = useState<string>("all");
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

  const notifyFiltersChange = useCallback(() => {
    onFiltersChange({
      region: selectedRegion === "all" ? undefined : selectedRegion,
      ageBracket: selectedAgeBracket === "all" ? undefined : selectedAgeBracket,
    });
  }, [selectedRegion, selectedAgeBracket, onFiltersChange]);

  useEffect(() => {
    if (!loading) {
      notifyFiltersChange();
    }
  }, [selectedRegion, selectedAgeBracket, loading, notifyFiltersChange]);

  const hasActiveFilters = selectedRegion !== "all" || selectedAgeBracket !== "all";

  const clearFilters = () => {
    setSelectedRegion("all");
    setSelectedAgeBracket("all");
  };

  if (loading) {
    return (
      <div className="flex gap-3 mb-6 opacity-50">
        <div className="h-11 w-36 bg-white/10 rounded-full animate-pulse" />
        <div className="h-11 w-28 bg-white/10 rounded-full animate-pulse" />
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
