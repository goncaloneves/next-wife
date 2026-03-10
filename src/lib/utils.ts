import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function openTelegram(startOrUrl: string) {
  let tgUrl: string;

  if (startOrUrl.startsWith("http")) {
    // Full URL like https://t.me/nextwifebot?start=gf_xxx
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
  }

  let opened = false;

  const onBlur = () => {
    opened = true;
  };

  window.addEventListener("blur", onBlur);

  window.location.href = tgUrl;

  setTimeout(() => {
    window.removeEventListener("blur", onBlur);
    if (!opened) {
      window.open("https://telegram.org", "_blank");
    }
  }, 1500);
}
