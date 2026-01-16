import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterOptions {
  regions: string[];
  ageBrackets: string[];
  occupationCategories: string[];
  languages: string[];
  hometowns: Record<string, string[]>;
  personalities: string[];
  relationships: string[];
}

export const EMPTY_FILTER_OPTIONS: FilterOptions = {
  regions: [],
  ageBrackets: [],
  occupationCategories: [],
  languages: [],
  hometowns: {},
  personalities: [],
  relationships: [],
};

export interface ChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  variant?: "default" | "accent";
  testIdPrefix?: string;
}

export function Chip({ label, selected, onClick, variant = "default", testIdPrefix = "chip" }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-shrink-0 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap",
        "focus:outline-none focus:ring-2 focus:ring-orange-400/50",
        "active:scale-95",
        selected
          ? "bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg shadow-orange-500/25 scale-105"
          : variant === "accent"
          ? "bg-white/15 text-white/90 hover:bg-white/25 hover:scale-102"
          : "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white"
      )}
      data-testid={`${testIdPrefix}-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`}
    >
      {label}
    </button>
  );
}

function useResponsiveMaxVisible() {
  const [maxVisible, setMaxVisible] = useState(4);
  
  useEffect(() => {
    const updateMaxVisible = () => {
      setMaxVisible(4);
    };
    
    updateMaxVisible();
    window.addEventListener('resize', updateMaxVisible);
    return () => window.removeEventListener('resize', updateMaxVisible);
  }, []);
  
  return maxVisible;
}

export interface FilterSectionProps {
  title: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  onClearAll: () => void;
  showAll?: boolean;
  maxVisible?: number;
  emptyMessage?: string;
  testIdPrefix?: string;
}

export function FilterSection({ 
  title, 
  options, 
  selected, 
  onToggle,
  onClearAll,
  showAll = false,
  maxVisible: maxVisibleProp,
  emptyMessage,
  testIdPrefix = "chip"
}: FilterSectionProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(showAll);
  const responsiveMaxVisible = useResponsiveMaxVisible();
  const maxVisible = maxVisibleProp ?? (showAll ? options.length : responsiveMaxVisible);
  const visibleOptions = expanded ? options : options.slice(0, maxVisible);
  const hasMore = options.length > maxVisible;
  const isAllSelected = selected.length === 0;

  return (
    <div className="space-y-3">
      {title && <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider px-1">{title}</h3>}
      {options.length === 0 && emptyMessage ? (
        <p className="text-sm text-white/40 px-1">{emptyMessage}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Chip
            label={t('common.all')}
            selected={isAllSelected}
            onClick={onClearAll}
            testIdPrefix={testIdPrefix}
          />
          {visibleOptions.map((option) => (
            <Chip
              key={option}
              label={option}
              selected={selected.includes(option)}
              onClick={() => onToggle(option)}
              variant="accent"
              testIdPrefix={testIdPrefix}
            />
          ))}
          {hasMore && !showAll && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 px-3 py-2.5 rounded-full text-sm text-white/60 hover:text-white/90 transition-colors"
              data-testid={`expand-${title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`}
            >
              {expanded ? (
                <>{t('common.showLess')} <ChevronUp className="w-4 h-4" /></>
              ) : (
                <>{options.length - maxVisible} {t('common.more')} <ChevronDown className="w-4 h-4" /></>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export async function fetchFilterOptions(channel: string): Promise<FilterOptions> {
  try {
    const response = await fetch(`/api/tg-channel-filters?channel=${channel}`);
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.error("Failed to fetch filter options:", err);
  }
  return EMPTY_FILTER_OPTIONS;
}

export function parseUrlArrayParam(value: string | null): string[] {
  if (!value) return [];
  return value.split(',').map(v => decodeURIComponent(v.trim())).filter(Boolean);
}

export function toggleArrayValue<T>(array: T[], value: T): T[] {
  return array.includes(value) 
    ? array.filter(v => v !== value) 
    : [...array, value];
}
