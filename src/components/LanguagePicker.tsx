import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";

const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'pt', name: 'Portuguese', native: 'Português' },
  { code: 'es', name: 'Spanish', native: 'Español' },
  { code: 'fr', name: 'French', native: 'Français' },
  { code: 'de', name: 'German', native: 'Deutsch' },
  { code: 'it', name: 'Italian', native: 'Italiano' },
  { code: 'nl', name: 'Dutch', native: 'Nederlands' },
  { code: 'ru', name: 'Russian', native: 'Русский' },
  { code: 'uk', name: 'Ukrainian', native: 'Українська' },
  { code: 'ar', name: 'Arabic', native: 'العربية' },
  { code: 'ko', name: 'Korean', native: '한국어' },
  { code: 'ms', name: 'Malay', native: 'Bahasa Melayu' },
];

export function LanguagePicker() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [canScrollMore, setCanScrollMore] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const currentLanguage = i18n.language?.split('-')[0] || 'en';
  const isNonEnglish = currentLanguage !== 'en';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && scrollRef.current) {
      const el = scrollRef.current;
      const checkScroll = () => {
        const canScroll = el.scrollHeight > el.clientHeight;
        const isAtBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 10;
        setCanScrollMore(canScroll && !isAtBottom);
      };
      checkScroll();
    }
  }, [isOpen]);

  const handleScroll = () => {
    if (scrollRef.current) {
      const el = scrollRef.current;
      const isAtBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 10;
      setCanScrollMore(!isAtBottom);
    }
  };

  const handleLanguageChange = (code: string) => {
    i18n.changeLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "p-2 flex items-center justify-center transition-all hover:scale-110 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]",
          isOpen || isNonEnglish ? "text-orange-400" : "text-white"
        )}
        data-testid="language-picker-button"
        aria-label="Select language"
      >
        <Globe className="w-5 h-5" />
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 top-full mt-2 w-48 py-2 rounded-xl bg-black/90 backdrop-blur-xl border border-white/10 shadow-2xl z-50 overflow-hidden"
        >
          <div className="relative">
            {canScrollMore && (
              <div className="absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-black via-black/70 to-transparent pointer-events-none z-10" />
            )}
            <div 
              ref={scrollRef}
              onScroll={handleScroll}
              className="max-h-[280px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
            >
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleLanguageChange(lang.code)}
                  className={cn(
                    "w-full px-4 py-2.5 text-left flex items-center justify-between transition-colors",
                    lang.code === currentLanguage
                      ? "bg-gradient-to-r from-orange-500/20 to-rose-500/20 text-orange-400"
                      : "text-white/80 hover:bg-white/5 hover:text-white"
                  )}
                  data-testid={`language-option-${lang.code}`}
                >
                  <span className="font-medium">{lang.native}</span>
                  {lang.code === currentLanguage && (
                    <span className="text-xs text-orange-400">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
