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
  close: () => void;
  openTelegramLink?: (url: string) => void;
  openLink?: (url: string) => void;
  disableVerticalSwipes?: () => void;
  requestSafeArea?: () => void;
  onEvent: (event: string, callback: (data: SafeAreaInsets) => void) => void;
  offEvent: (event: string, callback: (data: SafeAreaInsets) => void) => void;
  safeAreaInset?: SafeAreaInsets;
  contentSafeAreaInset?: SafeAreaInsets;
  viewportHeight?: number;
  viewportStableHeight?: number;
  isExpanded?: boolean;
  initData?: string;
  initDataUnsafe?: {
    user?: object;
  };
  platform?: string;
}

export function openTelegramLinkAndClose(url: string) {
  const tg = window.Telegram?.WebApp;
  if (tg) {
    if (url.includes('t.me') && tg.openTelegramLink) {
      tg.openTelegramLink(url);
    } else if (tg.openLink) {
      tg.openLink(url);
    } else {
      window.open(url, '_blank');
    }
    setTimeout(() => tg.close(), 100);
  } else {
    window.open(url, '_blank');
  }
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

export function useTelegram(enabled: boolean = true) {
  const [isTelegramApp, setIsTelegramApp] = useState(false);
  const [safeArea, setSafeArea] = useState<SafeAreaInsets>({ top: 0, bottom: 0, left: 0, right: 0 });
  const [contentSafeArea, setContentSafeArea] = useState<SafeAreaInsets>({ top: 0, bottom: 0, left: 0, right: 0 });

  useEffect(() => {
    if (!enabled) return;
    
    const tg = window.Telegram?.WebApp;
    
    // Only consider it a real Telegram Mini App if initData exists or platform is not "unknown"
    // This prevents false positives when the SDK is loaded but we're in a regular browser
    const isRealTelegramApp = tg && (
      (tg.initData && tg.initData.length > 0) || 
      tg.initDataUnsafe?.user ||
      (tg.platform && tg.platform !== 'unknown')
    );
    
    if (tg && isRealTelegramApp) {
      setIsTelegramApp(true);
      
      tg.expand();
      tg.ready();
      
      if (tg.disableVerticalSwipes) {
        tg.disableVerticalSwipes();
      }
      
      setTimeout(() => {
        if (!tg.isExpanded) {
          tg.expand();
        }
      }, 100);
      
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
  }, [enabled]);

  return { isTelegramApp, safeArea, contentSafeArea };
}

export function initTelegramApp() {
  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.expand();
    tg.ready();
    if (tg.disableVerticalSwipes) {
      tg.disableVerticalSwipes();
    }
  }
}
