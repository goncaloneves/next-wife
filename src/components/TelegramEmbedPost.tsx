import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface TelegramEmbedPostProps {
  channelUsername: string;
  postId: string;
}

export const TelegramEmbedPost = ({ channelUsername, postId }: TelegramEmbedPostProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
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

  const embedUrl = `https://t.me/${channelUsername}/${postId}?embed=1&userpic=true`;

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
        <div className="relative w-full">
          {isLoading && (
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
          )}
          <iframe
            src={embedUrl}
            width="100%"
            height="0"
            frameBorder="0"
            scrolling="no"
            style={{ 
              minHeight: '200px',
              border: 'none',
              overflow: 'hidden',
              display: isLoading ? 'none' : 'block'
            }}
            onLoad={() => {
              setIsLoading(false);
              // Auto-resize iframe based on content
              const iframe = containerRef.current?.querySelector('iframe');
              if (iframe && iframe.contentWindow) {
                try {
                  const height = iframe.contentWindow.document.body.scrollHeight;
                  iframe.style.height = `${height}px`;
                } catch (e) {
                  // Cross-origin, use default height
                  iframe.style.height = 'auto';
                }
              }
            }}
            title={`Telegram post ${postId}`}
          />
        </div>
      )}
    </Card>
  );
}
