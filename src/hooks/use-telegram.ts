import { useEffect, useState } from "react";

interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  requestSafeArea?: () => void;
  onEvent: (event: string, callback: (data: SafeAreaInsets) => void) => void;
  offEvent: (event: string, callback: (data: SafeAreaInsets) => void) => void;
  safeAreaInset?: SafeAreaInsets;
  contentSafeAreaInset?: SafeAreaInsets;
  viewportHeight?: number;
  viewportStableHeight?: number;
  isExpanded?: boolean;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

export function useTelegram() {
  const [isTelegramApp, setIsTelegramApp] = useState(false);
  const [safeArea, setSafeArea] = useState<SafeAreaInsets>({ top: 0, bottom: 0, left: 0, right: 0 });
  const [contentSafeArea, setContentSafeArea] = useState<SafeAreaInsets>({ top: 0, bottom: 0, left: 0, right: 0 });

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    
    if (tg) {
      setIsTelegramApp(true);
      
      tg.ready();
      tg.expand();
      
      if (tg.safeAreaInset) {
        setSafeArea(tg.safeAreaInset);
      }
      if (tg.contentSafeAreaInset) {
        setContentSafeArea(tg.contentSafeAreaInset);
      }
      
      const handleSafeAreaChange = (data: SafeAreaInsets) => {
        setSafeArea(data);
        document.documentElement.style.setProperty('--tg-safe-area-top', `${data.top}px`);
        document.documentElement.style.setProperty('--tg-safe-area-bottom', `${data.bottom}px`);
        document.documentElement.style.setProperty('--tg-safe-area-left', `${data.left}px`);
        document.documentElement.style.setProperty('--tg-safe-area-right', `${data.right}px`);
      };

      const handleContentSafeAreaChange = (data: SafeAreaInsets) => {
        setContentSafeArea(data);
        document.documentElement.style.setProperty('--tg-content-safe-area-top', `${data.top}px`);
        document.documentElement.style.setProperty('--tg-content-safe-area-bottom', `${data.bottom}px`);
      };

      tg.onEvent('safeAreaChanged', handleSafeAreaChange);
      tg.onEvent('contentSafeAreaChanged', handleContentSafeAreaChange);
      
      if (tg.requestSafeArea) {
        tg.requestSafeArea();
      }

      return () => {
        tg.offEvent('safeAreaChanged', handleSafeAreaChange);
        tg.offEvent('contentSafeAreaChanged', handleContentSafeAreaChange);
      };
    }
  }, []);

  return { isTelegramApp, safeArea, contentSafeArea };
}

export function initTelegramApp() {
  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.ready();
    tg.expand();
  }
}
