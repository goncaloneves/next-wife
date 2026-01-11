import { useState, useEffect, useMemo } from "react";
import { PERSONALITY_LABELS, RELATIONSHIP_TYPE_LABELS } from "@/lib/girlfriends/profile-formatter";
import { 
  FilterOptions, 
  EMPTY_FILTER_OPTIONS, 
  fetchFilterOptions 
} from "@/components/filters/FilterComponents";
import { SharedFilters, getActiveFilterCount } from "@/lib/filterStorage";

export interface UseFilterOptionsResult {
  filterOptions: FilterOptions;
  loading: boolean;
  personalityOptions: string[];
  relationshipOptions: string[];
  personalityLabelToValue: Record<string, string>;
  relationshipLabelToValue: Record<string, string>;
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

  const valuesToLabels = useMemo(() => ({
    personalities: (values: string[]) => values.map(p => PERSONALITY_LABELS[p] || p),
    relationships: (values: string[]) => values.map(r => RELATIONSHIP_TYPE_LABELS[r] || r),
  }), []);

  const labelsToValues = useMemo(() => ({
    personality: (label: string) => personalityLabelToValue[label] || label,
    relationship: (label: string) => relationshipLabelToValue[label] || label,
  }), [personalityLabelToValue, relationshipLabelToValue]);

  return {
    filterOptions,
    loading,
    personalityOptions,
    relationshipOptions,
    personalityLabelToValue,
    relationshipLabelToValue,
    valuesToLabels,
    labelsToValues,
    getActiveCount: getActiveFilterCount,
  };
}
