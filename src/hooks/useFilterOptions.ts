import { useState, useEffect, useMemo } from "react";
import { PERSONALITY_LABELS, RELATIONSHIP_TYPE_LABELS } from "@/lib/girlfriends/profile-formatter";
import { 
  FilterOptions, 
  EMPTY_FILTER_OPTIONS, 
  fetchFilterOptions 
} from "@/components/filters/FilterComponents";
import { SharedFilters, getActiveFilterCount } from "@/lib/filterStorage";

const PERSONALITY_LABEL_TO_VALUE: Record<string, string> = Object.fromEntries(
  Object.entries(PERSONALITY_LABELS).map(([value, label]) => [label, value])
);

const RELATIONSHIP_LABEL_TO_VALUE: Record<string, string> = Object.fromEntries(
  Object.entries(RELATIONSHIP_TYPE_LABELS).map(([value, label]) => [label, value])
);

export interface UseFilterOptionsResult {
  filterOptions: FilterOptions;
  loading: boolean;
  personalityOptions: string[];
  relationshipOptions: string[];
  valuesToLabels: {
    personalities: (values: string[]) => string[];
    relationships: (values: string[]) => string[];
  };
  labelsToValues: {
    personality: (label: string) => string;
    relationship: (label: string) => string;
  };
  getActiveCount: (filters: SharedFilters) => number;
}

export function useFilterOptions(channel: string): UseFilterOptionsResult {
  const [filterOptions, setFilterOptions] = useState<FilterOptions>(EMPTY_FILTER_OPTIONS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFilterOptions(channel).then(data => {
      setFilterOptions(data);
      setLoading(false);
    });
  }, [channel]);

  const personalityOptions = useMemo(() => 
    (filterOptions.personalities || []).map(p => PERSONALITY_LABELS[p] || p),
    [filterOptions.personalities]
  );

  const relationshipOptions = useMemo(() => 
    (filterOptions.relationships || []).map(r => RELATIONSHIP_TYPE_LABELS[r] || r),
    [filterOptions.relationships]
  );

  const valuesToLabels = useMemo(() => ({
    personalities: (values: string[]) => values.map(p => PERSONALITY_LABELS[p] || p),
    relationships: (values: string[]) => values.map(r => RELATIONSHIP_TYPE_LABELS[r] || r),
  }), []);

  const labelsToValues = useMemo(() => ({
    personality: (label: string) => PERSONALITY_LABEL_TO_VALUE[label] || label,
    relationship: (label: string) => RELATIONSHIP_LABEL_TO_VALUE[label] || label,
  }), []);

  return {
    filterOptions,
    loading,
    personalityOptions,
    relationshipOptions,
    valuesToLabels,
    labelsToValues,
    getActiveCount: getActiveFilterCount,
  };
}
