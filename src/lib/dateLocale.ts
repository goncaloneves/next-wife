import { formatDistanceToNow, type Locale } from "date-fns";
import {
  enUS,
  ptBR,
  es,
  fr,
  de,
  it,
  nl,
  ru,
  uk,
  ar,
  ko,
  ms,
} from "date-fns/locale";
import i18n from "@/i18n";

const localeMap: Record<string, Locale> = {
  en: enUS,
  pt: ptBR,
  es: es,
  fr: fr,
  de: de,
  it: it,
  nl: nl,
  ru: ru,
  uk: uk,
  ar: ar,
  ko: ko,
  ms: ms,
};

export function getDateLocale(): Locale {
  const lang = i18n.language?.split("-")[0] || "en";
  return localeMap[lang] || enUS;
}

export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(dateObj, {
    addSuffix: true,
    locale: getDateLocale(),
  });
}
