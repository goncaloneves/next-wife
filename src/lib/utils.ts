import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function buildTelegramUrl(startOrUrl: string): string {
  if (startOrUrl.startsWith("http")) {
    try {
      const url = new URL(startOrUrl);
      const domain = url.pathname.replace("/", "");
      const start = url.searchParams.get("start") || "";
      return `tg://resolve?domain=${domain}${start ? `&start=${start}` : ""}`;
    } catch {
      return `tg://resolve?domain=nextwifebot&start=${startOrUrl}`;
    }
  }
  return `tg://resolve?domain=nextwifebot&start=${startOrUrl}`;
}

export function openTelegramDirect(startOrUrl: string) {
  window.location.href = buildTelegramUrl(startOrUrl);
}

export function openTelegram(startOrUrl: string) {
  window.dispatchEvent(
    new CustomEvent("open-telegram", { detail: { startOrUrl } })
  );
}
