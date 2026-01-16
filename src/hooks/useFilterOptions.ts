import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const [filterOptions, setFilterOptions] = useState<FilterOptions>(EMPTY_FILTER_OPTIONS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFilterOptions(channel).then(data => {
      setFilterOptions(data);
      setLoading(false);
    });
  }, [channel]);

  const personalityOptions = useMemo(() => 
    (filterOptions.personalities || []).map(p => {
      const key = PERSONALITY_LABELS[p];
      return key ? t(key) : p;
    }),
    [filterOptions.personalities, t]
  );

  const relationshipOptions = useMemo(() => 
    (filterOptions.relationships || []).map(r => {
      const key = RELATIONSHIP_TYPE_LABELS[r];
      return key ? t(key) : r;
    }),
    [filterOptions.relationships, t]
  );

  const personalityLabelToValue = useMemo(() => {
    const map: Record<string, string> = {};
    Object.entries(PERSONALITY_LABELS).forEach(([value, key]) => {
      map[t(key)] = value;
    });
    return map;
  }, [t]);

  const relationshipLabelToValue = useMemo(() => {
    const map: Record<string, string> = {};
    Object.entries(RELATIONSHIP_TYPE_LABELS).forEach(([value, key]) => {
      map[t(key)] = value;
    });
    return map;
  }, [t]);

  const valuesToLabels = useMemo(() => ({
    personalities: (values: string[]) => values.map(p => {
      const key = PERSONALITY_LABELS[p];
      return key ? t(key) : p;
    }),
    relationships: (values: string[]) => values.map(r => {
      const key = RELATIONSHIP_TYPE_LABELS[r];
      return key ? t(key) : r;
    }),
  }), [t]);

  const labelsToValues = useMemo(() => ({
    personality: (label: string) => personalityLabelToValue[label] || label,
    relationship: (label: string) => relationshipLabelToValue[label] || label,
  }), [personalityLabelToValue, relationshipLabelToValue]);

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
