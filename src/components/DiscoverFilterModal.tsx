import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
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

export type DiscoverFilters = SharedFilters;

interface DiscoverFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  channel: string;
  filters: SharedFilters;
  onFiltersChange: (filters: SharedFilters) => void;
}

export function DiscoverFilterModal({ 
  isOpen, 
  onClose, 
  channel, 
  filters, 
  onFiltersChange 
}: DiscoverFilterModalProps) {
  const { t } = useTranslation();
  const { 
    filterOptions, 
    loading, 
    personalityOptions, 
    relationshipOptions,
    valuesToLabels,
    labelsToValues,
    getActiveCount 
  } = useFilterOptions(channel);

  const [localFilters, setLocalFilters] = useState<DiscoverFilters>(filters);
  const [canScrollMore, setCanScrollMore] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setLocalFilters(filters);
      setCanScrollMore(true);
    }
  }, [isOpen, filters]);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 20;
    setCanScrollMore(!isAtBottom);
  }, []);

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
            className="fixed inset-x-0 bottom-0 md:bottom-8 z-50 flex justify-center pointer-events-none"
          >
            <div 
              className="w-full md:w-[min(90vw,768px)] max-h-[90vh] md:max-h-[80vh] flex flex-col bg-gradient-to-b from-zinc-900 to-black rounded-t-3xl md:rounded-2xl border-t md:border border-white/10 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <SlidersHorizontal className="w-5 h-5 text-white/80" />
                <div>
                  <h2 className="text-lg font-semibold text-white">{t('filters.title')}</h2>
                  <p className="text-xs text-white/50">{t('filters.subtitle')}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-white/80 hover:text-white transition-all hover:scale-110"
                data-testid="close-profile-filters"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 relative overflow-hidden">
              {canScrollMore && (
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black to-transparent pointer-events-none z-10" />
              )}
              <div 
                ref={scrollRef}
                onScroll={handleScroll}
                className="h-full overflow-y-auto p-4 space-y-6 md:space-y-0 md:grid md:grid-cols-2 md:gap-6"
              >
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  <FilterSection
                    title={t('filters.age')}
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
                    title={t('filters.language')}
                    options={filterOptions.languages}
                    selected={localFilters.languages}
                    onToggle={(value) => setLocalFilters(prev => ({
                      ...prev,
                      languages: toggleArrayValue(prev.languages, value)
                    }))}
                    onClearAll={() => setLocalFilters(prev => ({ ...prev, languages: [] }))}
                  />

                  <FilterSection
                    title={t('filters.relationship')}
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

                  <FilterSection
                    title={t('filters.personality')}
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
                    title={t('filters.occupation')}
                    options={filterOptions.occupationCategories}
                    selected={localFilters.occupationCategories}
                    onToggle={(value) => setLocalFilters(prev => ({
                      ...prev,
                      occupationCategories: toggleArrayValue(prev.occupationCategories, value)
                    }))}
                    onClearAll={() => setLocalFilters(prev => ({ ...prev, occupationCategories: [] }))}
                  />

                  <FilterSection
                    title={t('filters.region')}
                    options={filterOptions.regions}
                    selected={localFilters.regions}
                    onToggle={(value) => setLocalFilters(prev => ({
                      ...prev,
                      regions: toggleArrayValue(prev.regions, value)
                    }))}
                    onClearAll={() => setLocalFilters(prev => ({ ...prev, regions: [] }))}
                  />

                  <FilterSection
                    title={t('filters.hometown')}
                    options={Object.values(filterOptions.hometowns).flat()}
                    selected={localFilters.hometowns}
                    onToggle={(value) => setLocalFilters(prev => ({
                      ...prev,
                      hometowns: toggleArrayValue(prev.hometowns, value)
                    }))}
                    onClearAll={() => setLocalFilters(prev => ({ ...prev, hometowns: [] }))}
                  />

                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider">{t('filters.media')}</h3>
                    <div className="flex flex-wrap gap-2">
                      <Chip
                        label={t('filters.hasVideo')}
                        selected={localFilters.hasVideo}
                        onClick={() => setLocalFilters(prev => ({ ...prev, hasVideo: !prev.hasVideo }))}
                      />
                      <Chip
                        label={t('filters.multiplePhotos')}
                        selected={localFilters.hasMultipleMedia}
                        onClick={() => setLocalFilters(prev => ({ ...prev, hasMultipleMedia: !prev.hasMultipleMedia }))}
                      />
                    </div>
                  </div>
                </>
              )}
              </div>
            </div>

            <div className="flex-shrink-0 p-4 border-t border-white/10 flex gap-3 pb-8">
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="flex-1 py-3.5 rounded-full border border-white/20 text-white/70 font-medium hover:bg-white/10 transition-colors"
                  data-testid="clear-profile-filters"
                >
                  {t('common.clearAll')}
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
                {activeFilterCount > 0 ? t('filters.applyCount', { count: activeFilterCount }) : t('common.showAll')}
              </button>
            </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function DiscoverFilterButton({ 
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
        "p-2 flex items-center justify-center transition-all relative hover:scale-110 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]",
        activeCount > 0 
          ? "text-orange-400" 
          : "text-white"
      )}
      data-testid="open-profile-filters"
    >
      <SlidersHorizontal className="w-5 h-5" />
      {activeCount > 0 && (
        <span className="absolute -top-1 -right-0.5 min-w-[16px] h-[16px] rounded-full bg-gradient-to-r from-orange-500 to-rose-500 text-white text-[10px] font-bold flex items-center justify-center px-1 shadow-lg">
          {activeCount}
        </span>
      )}
    </button>
  );
}
