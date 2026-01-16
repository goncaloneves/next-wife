import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { X, Globe, Check } from "lucide-react";
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

interface LanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LanguageModal({ isOpen, onClose }: LanguageModalProps) {
  const { i18n, t } = useTranslation();
  const currentLanguage = i18n.language?.split('-')[0] || 'en';

  const handleLanguageChange = (code: string) => {
    i18n.changeLanguage(code);
    onClose();
  };

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
              className="w-full md:w-[min(90vw,400px)] max-h-[70vh] flex flex-col bg-gradient-to-b from-zinc-900 to-black rounded-t-3xl md:rounded-2xl border-t md:border border-white/10 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-white/80" />
                  <span className="text-white font-semibold">{t('common.language')}</span>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-white/60 hover:text-white transition-colors"
                  data-testid="close-language-modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-2">
                <div className="grid grid-cols-2 gap-2">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => handleLanguageChange(lang.code)}
                      className={cn(
                        "flex items-center justify-between px-4 py-3 rounded-xl transition-all",
                        lang.code === currentLanguage
                          ? "bg-gradient-to-r from-orange-500/20 to-rose-500/20 border border-orange-500/30"
                          : "bg-white/5 hover:bg-white/10 border border-transparent"
                      )}
                      data-testid={`language-modal-option-${lang.code}`}
                    >
                      <span className={cn(
                        "font-semibold",
                        lang.code === currentLanguage ? "text-orange-400" : "text-white/80"
                      )}>
                        {lang.native}
                      </span>
                      {lang.code === currentLanguage && (
                        <Check className="w-4 h-4 text-orange-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
