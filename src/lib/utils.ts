import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function openTelegram(startOrUrl: string) {
  let tgUrl: string;
  let webFallback: string;

  if (startOrUrl.startsWith("http")) {
    // Full URL like https://t.me/nextwifebot?start=gf_xxx
    webFallback = startOrUrl;
    try {
      const url = new URL(startOrUrl);
      const domain = url.pathname.replace("/", "");
      const start = url.searchParams.get("start") || "";
      tgUrl = `tg://resolve?domain=${domain}${start ? `&start=${start}` : ""}`;
    } catch {
      tgUrl = `tg://resolve?domain=nextwifebot&start=${startOrUrl}`;
    }
  } else {
    tgUrl = `tg://resolve?domain=nextwifebot&start=${startOrUrl}`;
    webFallback = `https://t.me/nextwifebot?start=${startOrUrl}`;
  }

  let opened = false;

  const cleanup = () => {
    window.removeEventListener("blur", onBlur);
    document.removeEventListener("visibilitychange", onVisibility);
  };

  const onBlur = () => {
    opened = true;
    cleanup();
  };

  const onVisibility = () => {
    if (document.hidden) {
      opened = true;
      cleanup();
    }
  };

  window.addEventListener("blur", onBlur);
  document.addEventListener("visibilitychange", onVisibility);

  window.location.href = tgUrl;

  setTimeout(() => {
    cleanup();
    if (!opened) {
      window.open(webFallback, "_blank");
    }
  }, 2500);
}
