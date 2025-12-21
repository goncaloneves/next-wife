import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface FilterOptions {
  regions: string[];
  ageBrackets: string[];
  workOptions: string[];
}

interface FeedFiltersProps {
  channel: string;
  onFiltersChange: (filters: { region?: string; ageBracket?: string; work?: string }) => void;
}

export function FeedFilters({ channel, onFiltersChange }: FeedFiltersProps) {
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    regions: [],
    ageBrackets: [],
    workOptions: [],
  });
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [selectedAgeBracket, setSelectedAgeBracket] = useState<string>("");
  const [selectedWork, setSelectedWork] = useState<string>("");
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

  useEffect(() => {
    onFiltersChange({
      region: selectedRegion || undefined,
      ageBracket: selectedAgeBracket || undefined,
      work: selectedWork || undefined,
    });
  }, [selectedRegion, selectedAgeBracket, selectedWork, onFiltersChange]);

  const hasActiveFilters = selectedRegion || selectedAgeBracket || selectedWork;

  const clearFilters = () => {
    setSelectedRegion("");
    setSelectedAgeBracket("");
    setSelectedWork("");
  };

  if (loading) {
    return (
      <div className="flex gap-2 mb-4 opacity-50">
        <div className="h-10 w-32 bg-muted rounded animate-pulse" />
        <div className="h-10 w-28 bg-muted rounded animate-pulse" />
        <div className="h-10 w-40 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 mb-4 items-center" data-testid="feed-filters">
      <Select value={selectedRegion} onValueChange={setSelectedRegion}>
        <SelectTrigger className="w-[140px] bg-background/80 backdrop-blur-sm border-border/50" data-testid="filter-region">
          <SelectValue placeholder="Region" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Regions</SelectItem>
          {filterOptions.regions.map((region) => (
            <SelectItem key={region} value={region}>{region}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedAgeBracket} onValueChange={setSelectedAgeBracket}>
        <SelectTrigger className="w-[120px] bg-background/80 backdrop-blur-sm border-border/50" data-testid="filter-age">
          <SelectValue placeholder="Age" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Ages</SelectItem>
          {filterOptions.ageBrackets.map((bracket) => (
            <SelectItem key={bracket} value={bracket}>{bracket}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedWork} onValueChange={setSelectedWork}>
        <SelectTrigger className="w-[180px] bg-background/80 backdrop-blur-sm border-border/50" data-testid="filter-work">
          <SelectValue placeholder="Work" />
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          <SelectItem value="all">All Work</SelectItem>
          {filterOptions.workOptions.map((work) => (
            <SelectItem key={work} value={work} className="truncate">
              {work.length > 40 ? work.substring(0, 40) + "..." : work}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="text-muted-foreground hover:text-foreground"
          data-testid="button-clear-filters"
        >
          <X className="w-4 h-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}
