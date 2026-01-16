import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en.json';
import pt from './locales/pt.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import it from './locales/it.json';
import ru from './locales/ru.json';
import uk from './locales/uk.json';
import ar from './locales/ar.json';
import ko from './locales/ko.json';
import ms from './locales/ms.json';
import nl from './locales/nl.json';

const resources = {
  en: { translation: en },
  pt: { translation: pt },
  es: { translation: es },
  fr: { translation: fr },
  de: { translation: de },
  it: { translation: it },
  ru: { translation: ru },
  uk: { translation: uk },
  ar: { translation: ar },
  ko: { translation: ko },
  ms: { translation: ms },
  nl: { translation: nl },
};

const RTL_LANGUAGES = ['ar'];
const SUPPORTED_LANGUAGES = ['en', 'pt', 'es', 'fr', 'de', 'it', 'ru', 'uk', 'ar', 'ko', 'ms', 'nl'];

const updateDocumentDirection = (language: string) => {
  const baseLanguage = language.split('-')[0].toLowerCase();
  const dir = RTL_LANGUAGES.includes(baseLanguage) ? 'rtl' : 'ltr';
  document.documentElement.dir = dir;
  document.documentElement.lang = language;
};

const getLanguageFromUrl = (): string | null => {
  const urlParams = new URLSearchParams(window.location.search);
  const langParam = urlParams.get('lang')?.toLowerCase();
  if (langParam && SUPPORTED_LANGUAGES.includes(langParam)) {
    return langParam;
  }
  return null;
};

const STORAGE_KEY = 'nextwife-language';

const getStoredLanguage = (): string | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED_LANGUAGES.includes(stored)) {
      return stored;
    }
  } catch (e) {
    // localStorage may not be available
  }
  return null;
};

const storeLanguage = (language: string) => {
  try {
    const baseLanguage = language.split('-')[0].toLowerCase();
    if (SUPPORTED_LANGUAGES.includes(baseLanguage)) {
      localStorage.setItem(STORAGE_KEY, baseLanguage);
    }
  } catch (e) {
    // localStorage may not be available
  }
};

const urlLang = getLanguageFromUrl();
const storedLang = getStoredLanguage();

// If URL has lang param, store it
if (urlLang) {
  storeLanguage(urlLang);
}

// Priority: URL param > localStorage > browser detection
const initialLang = urlLang || storedLang || undefined;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLang,
    fallbackLng: 'en',
    load: 'languageOnly',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: initialLang ? [] : ['navigator', 'htmlTag'],
      caches: [],
    },
  });

// Store language whenever it changes (from picker or any other source)
i18n.on('languageChanged', (language) => {
  updateDocumentDirection(language);
  storeLanguage(language);
});

if (i18n.language) {
  updateDocumentDirection(i18n.language);
}

export default i18n;
