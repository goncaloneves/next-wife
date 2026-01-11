import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  Chip,
  FilterSection, 
  toggleArrayValue 
} from "./filters/FilterComponents";
import { type SharedFilters, DEFAULT_FILTERS } from "@/lib/filterStorage";
import { useFilterOptions } from "@/hooks/useFilterOptions";

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
  const { 
    filterOptions, 
    loading, 
    personalityOptions, 
    relationshipOptions,
    valuesToLabels,
    labelsToValues,
    getActiveCount 
  } = useFilterOptions(channel);

  const [localFilters, setLocalFilters] = useState<ProfileFilters>(filters);

  useEffect(() => {
    if (isOpen) {
      setLocalFilters(filters);
    }
  }, [isOpen, filters]);

  const selectedPersonalityLabels = useMemo(() => 
    valuesToLabels.personalities(localFilters.personalities),
    [valuesToLabels, localFilters.personalities]
  );
  
  const selectedRelationshipLabels = useMemo(() => 
    valuesToLabels.relationships(localFilters.relationships),
    [valuesToLabels, localFilters.relationships]
  );

  const activeFilterCount = useMemo(() => getActiveCount(localFilters), [getActiveCount, localFilters]);

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
            className="fixed inset-x-0 bottom-0 md:bottom-8 z-50 flex justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full md:w-[min(90vw,768px)] max-h-[90vh] md:max-h-[80vh] flex flex-col bg-gradient-to-b from-zinc-900 to-black rounded-t-3xl md:rounded-2xl border-t md:border border-white/10">
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
                      const value = labelsToValues.personality(label);
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
                      const value = labelsToValues.relationship(label);
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
