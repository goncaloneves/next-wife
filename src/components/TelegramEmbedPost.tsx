import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface TelegramEmbedPostProps {
  channelUsername: string;
  postId: string;
}

// Load Telegram widget script once
let scriptLoaded = false;
let scriptLoading = false;
const loadTelegramScript = () => {
  if (scriptLoaded || scriptLoading) return;
  
  scriptLoading = true;
  const script = document.createElement('script');
  script.src = 'https://telegram.org/js/telegram-widget.js?22';
  script.async = true;
  script.onload = () => {
    scriptLoaded = true;
    scriptLoading = false;
  };
  document.body.appendChild(script);
};

export const TelegramEmbedPost = ({ channelUsername, postId }: TelegramEmbedPostProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Load script on mount
    loadTelegramScript();

    // Set up intersection observer for lazy loading
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observerRef.current?.disconnect();
          }
        });
      },
      { rootMargin: '200px' }
    );

    if (containerRef.current) {
      observerRef.current.observe(containerRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (isVisible && scriptLoaded && containerRef.current) {
      // Re-process Telegram widgets after embed is added to DOM
      const timer = setTimeout(() => {
        if (window.Telegram?.WebView) {
          window.Telegram.WebView.initParams();
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  return (
    <Card ref={containerRef} className="overflow-hidden bg-card/80 backdrop-blur border border-border">
      {!isVisible ? (
        <div className="p-6 space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-20 w-full" />
        </div>
      ) : (
        <blockquote
          className="telegram-post"
          data-telegram-post={`${channelUsername}/${postId}`}
          data-width="100%"
          data-userpic="true"
        >
          <div className="p-6 text-sm text-muted-foreground">
            Loading post...
          </div>
        </blockquote>
      )}
    </Card>
  );
};

// Extend window type for Telegram WebView
declare global {
  interface Window {
    Telegram?: {
      WebView: {
        initParams: () => void;
      };
    };
  }
}
