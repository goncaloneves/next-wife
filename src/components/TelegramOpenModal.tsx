import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { buildTelegramUrl } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const TelegramOpenModal = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [redirected, setRedirected] = useState(false);
  const tgUrlRef = useRef("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const { startOrUrl } = (e as CustomEvent).detail;
      tgUrlRef.current = buildTelegramUrl(startOrUrl);
      setRedirected(false);
      setIsOpen(true);
    };

    window.addEventListener("open-telegram", handler);
    return () => window.removeEventListener("open-telegram", handler);
  }, []);

  useEffect(() => {
    if (isOpen && !redirected) {
      timerRef.current = setTimeout(() => {
        setRedirected(true);
        window.location.href = tgUrlRef.current;
      }, 1500);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isOpen, redirected]);

  const handleManualOpen = () => {
    window.location.href = tgUrlRef.current;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="bg-black/95 border-white/10 text-white max-w-sm">
        <DialogHeader>
          <div className="flex justify-center mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-14 h-14">
              <linearGradient id="tg-grad" x1="9.858" x2="38.142" y1="9.858" y2="38.142" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#33bef0" />
                <stop offset="1" stopColor="#0a85d9" />
              </linearGradient>
              <path fill="url(#tg-grad)" d="M44,24c0,11.045-8.955,20-20,20S4,35.045,4,24S12.955,4,24,4S44,12.955,44,24z" />
              <path d="M10.119,23.466c8.155-3.695,17.733-7.704,19.208-8.284c3.252-1.279,4.67,0.028,4.018,2.49 c-0.715,2.7-2.996,12.861-3.882,16.631c-0.377,1.601-1.782,2.089-3.138,1.073c-0.985-0.738-5.893-3.97-6.9-4.692 c-0.728-0.521-1.564-1.349,0.097-2.883c0.562-0.519,4.259-4.089,7.263-7.003c0.417-0.405-0.149-1.063-0.627-0.727 c-4.16,2.921-8.776,6.088-9.601,6.646c-1.26,0.851-2.44,0.584-3.476,0.287c-1.088-0.312-2.727-0.904-2.727-0.904 S8.799,25.649,10.119,23.466z" fill="#fff" />
            </svg>
          </div>
          <DialogTitle className="text-xl font-bold text-center">
            {redirected
              ? t("common.telegram.opening")
              : t("common.telegram.openApp")
            }
          </DialogTitle>
          <DialogDescription className="text-white/70 text-center">
            nextwife.ai
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={handleManualOpen}
            className="text-white/50 hover:text-white/70 text-sm transition-colors underline underline-offset-2 decoration-white/30 hover:decoration-white/60"
          >
            {t("common.telegram.manualOpen")}
          </button>
          <a
            href="https://telegram.org/apps"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/50 hover:text-white/70 text-sm transition-colors"
          >
            {t("common.telegram.getApp")}
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
};
