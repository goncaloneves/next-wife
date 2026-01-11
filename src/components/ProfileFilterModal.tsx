import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, SlidersHorizontal } from "lucide-react";
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
import { type SharedFilters, DEFAULT_FILTERS } from "@/lib/filterStorage";

export type ProfileFilters = SharedFilters;

interface ProfileFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  channel: string;
  filters: SharedFilters;
  onFiltersChange: (filters: SharedFilters) => void;
}

export function ProfileFilterModal({ 
  isOpen, 
  onClose, 
  channel, 
  filters, 
  onFiltersChange 
}: ProfileFilterModalProps) {
  const [filterOptions, setFilterOptions] = useState<FilterOptions>(EMPTY_FILTER_OPTIONS);
  const [loading, setLoading] = useState(true);

  const [localFilters, setLocalFilters] = useState<ProfileFilters>(filters);

  useEffect(() => {
    if (isOpen) {
      setLocalFilters(filters);
    }
  }, [isOpen, filters]);

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
  
  const selectedPersonalityLabels = useMemo(() => 
    localFilters.personalities.map(p => PERSONALITY_LABELS[p] || p),
    [localFilters.personalities]
  );
  
  const selectedRelationshipLabels = useMemo(() => 
    localFilters.relationships.map(r => RELATIONSHIP_TYPE_LABELS[r] || r),
    [localFilters.relationships]
  );

  const activeFilterCount = useMemo(() => {
    return localFilters.regions.length + 
           localFilters.ageBrackets.length + 
           localFilters.occupationCategories.length + 
           localFilters.personalities.length + 
           localFilters.relationships.length + 
           (localFilters.hasVideo ? 1 : 0) + 
           (localFilters.hasMultipleMedia ? 1 : 0);
  }, [localFilters]);

  const handleApply = useCallback(() => {
    onFiltersChange(localFilters);
    onClose();
  }, [localFilters, onFiltersChange, onClose]);

  const handleClearAll = useCallback(() => {
    setLocalFilters({ ...DEFAULT_FILTERS });
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={(e) => { e.stopPropagation(); onClose(); }}
          />
          
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed left-0 right-0 bottom-0 md:left-1/2 md:right-auto md:-translate-x-1/2 md:bottom-8 md:w-[min(90vw,768px)] z-50 max-h-[90vh] md:max-h-[80vh] flex flex-col bg-gradient-to-b from-zinc-900 to-black rounded-t-3xl md:rounded-2xl border-t md:border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-rose-500 flex items-center justify-center">
                  <SlidersHorizontal className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Filters</h2>
                  <p className="text-xs text-white/50">Find your perfect match</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                data-testid="close-profile-filters"
              >
                <X className="w-5 h-5 text-white/70" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 md:space-y-0 md:grid md:grid-cols-2 md:gap-6">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  <FilterSection
                    title="Region"
                    options={filterOptions.regions}
                    selected={localFilters.regions}
                    onToggle={(value) => setLocalFilters(prev => ({
                      ...prev,
                      regions: toggleArrayValue(prev.regions, value)
                    }))}
                    onClearAll={() => setLocalFilters(prev => ({ ...prev, regions: [] }))}
                  />

                  <FilterSection
                    title="Age"
                    options={filterOptions.ageBrackets}
                    selected={localFilters.ageBrackets}
                    onToggle={(value) => setLocalFilters(prev => ({
                      ...prev,
                      ageBrackets: toggleArrayValue(prev.ageBrackets, value)
                    }))}
                    onClearAll={() => setLocalFilters(prev => ({ ...prev, ageBrackets: [] }))}
                    showAll
                  />

                  <FilterSection
                    title="Occupation"
                    options={filterOptions.occupationCategories}
                    selected={localFilters.occupationCategories}
                    onToggle={(value) => setLocalFilters(prev => ({
                      ...prev,
                      occupationCategories: toggleArrayValue(prev.occupationCategories, value)
                    }))}
                    onClearAll={() => setLocalFilters(prev => ({ ...prev, occupationCategories: [] }))}
                  />

                  <FilterSection
                    title="Personality"
                    options={personalityOptions}
                    selected={selectedPersonalityLabels}
                    onToggle={(label) => {
                      const value = personalityLabelToValue[label] || label;
                      setLocalFilters(prev => ({
                        ...prev,
                        personalities: toggleArrayValue(prev.personalities, value)
                      }));
                    }}
                    onClearAll={() => setLocalFilters(prev => ({ ...prev, personalities: [] }))}
                    showAll
                  />

                  <FilterSection
                    title="Relationship"
                    options={relationshipOptions}
                    selected={selectedRelationshipLabels}
                    onToggle={(label) => {
                      const value = relationshipLabelToValue[label] || label;
                      setLocalFilters(prev => ({
                        ...prev,
                        relationships: toggleArrayValue(prev.relationships, value)
                      }));
                    }}
                    onClearAll={() => setLocalFilters(prev => ({ ...prev, relationships: [] }))}
                    showAll
                  />

                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider">Media</h3>
                    <div className="flex flex-wrap gap-2">
                      <Chip
                        label="Has Video"
                        selected={localFilters.hasVideo}
                        onClick={() => setLocalFilters(prev => ({ ...prev, hasVideo: !prev.hasVideo }))}
                      />
                      <Chip
                        label="Multiple Photos"
                        selected={localFilters.hasMultipleMedia}
                        onClick={() => setLocalFilters(prev => ({ ...prev, hasMultipleMedia: !prev.hasMultipleMedia }))}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex-shrink-0 p-4 border-t border-white/10 flex gap-3 pb-8">
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="flex-1 py-3.5 rounded-full border border-white/20 text-white/70 font-medium hover:bg-white/10 transition-colors"
                  data-testid="clear-profile-filters"
                >
                  Clear All
                </button>
              )}
              <button
                type="button"
                onClick={handleApply}
                className={cn(
                  "py-3.5 rounded-full font-semibold text-white transition-all",
                  "bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600",
                  "shadow-lg shadow-orange-500/30",
                  activeFilterCount > 0 ? "flex-1" : "flex-1"
                )}
                data-testid="apply-profile-filters"
              >
                {activeFilterCount > 0 ? `Apply (${activeFilterCount})` : "Show All"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function ProfileFilterButton({ 
  activeCount, 
  onClick 
}: { 
  activeCount: number; 
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center transition-all relative",
        activeCount > 0 
          ? "bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg shadow-orange-500/30" 
          : "bg-black/40 backdrop-blur-sm text-white/80 hover:bg-black/60"
      )}
      data-testid="open-profile-filters"
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
