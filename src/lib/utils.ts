import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function openTelegram(start: string) {
  const tgUrl = `tg://resolve?domain=nextwifebot&start=${start}`;
  const webUrl = "https://telegram.org";

  let opened = false;

  const onBlur = () => {
    opened = true;
  };

  window.addEventListener("blur", onBlur);

  window.location.href = tgUrl;

  setTimeout(() => {
    window.removeEventListener("blur", onBlur);
    if (!opened) {
      window.open(webUrl, "_blank");
    }
  }, 1500);
}
