import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Card } from "@/components/ui/card";
import { Loader2, ArrowUp, RefreshCw } from "lucide-react";
import { TelegramPostCard } from "./TelegramPostCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface TelegramPost {
  id: string;
  text: string;
  date: string;
  link: string;
  media?: string | null;
  avatar?: string | null;
}

interface ChannelInfo {
  name: string;
  avatar: string | null;
  description: string | null;
  subscribers: string | null;
}

interface TelegramChannelFeedProps {
  channelUsername: string;
  refreshInterval?: number;
  maxPosts?: number;
  layout?: "list" | "grid";
  feedSectionRef?: React.RefObject<HTMLElement | HTMLDivElement>;
}

export const TelegramChannelFeed = ({
  channelUsername,
  refreshInterval = 30000,
  maxPosts = 20,
  layout = "list",
  feedSectionRef,
}: TelegramChannelFeedProps) => {
  const [allPosts, setAllPosts] = useState<TelegramPost[]>([]);
  const [channelInfo, setChannelInfo] = useState<ChannelInfo | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isNearTop, setIsNearTop] = useState(true);
  const [pendingNewCount, setPendingNewCount] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [refreshKey, setRefreshKey] = useState(Date.now());
  const [imageLoadStates, setImageLoadStates] = useState<Record<string, boolean>>({});
  const [imageErrors, setImageErrors] = useState<Record<string, number>>({});
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const listRef = useRef<HTMLDivElement>(null);
  const observerTarget = useRef<HTMLDivElement>(null);
  const topFingerprintRef = useRef<string>('');
  const postsRef = useRef<TelegramPost[]>([]);
  const nearTopRef = useRef(true);

  // Sync refs with state for stable access in callbacks
  useEffect(() => {
    postsRef.current = allPosts;
  }, [allPosts]);

  useEffect(() => {
    nearTopRef.current = isNearTop;
  }, [isNearTop]);

  // Helper to create fingerprint of top posts
  const fingerprint = useCallback((posts: TelegramPost[]) =>
    JSON.stringify(posts.slice(0, 5).map(p => [p.id, p.media, p.text, p.date])), []);

  // Helper to build image src with retry logic
  const buildSrc = useCallback((url: string, postId: string) => {
    // Normalize protocol-relative URLs
    const normalized = url.startsWith('//') ? `https:${url}` : url;
    const tries = imageErrors[postId] || 0;
    
    if (tries === 0 || tries === 1) {
      // First two attempts: use original URL
      return normalized;
    }
    
    // Third attempt: use proxy
    return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tg-image-proxy?u=${encodeURIComponent(normalized)}`;
  }, [imageErrors]);

  const fetchInitialPosts = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tg-channel-feed?channel=${channelUsername}&limit=20`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch posts");
      }

      const data = await response.json();
      const fetchedPosts = data.posts || [];

      setAllPosts(fetchedPosts);
      setChannelInfo(data.channelInfo);
      setNextCursor(data.nextBefore);
      setHasMore(data.hasMore);
      setError(null);
      setLoading(false);
      setPendingNewCount(0);
      setRefreshKey(Date.now());
      setImageLoadStates({});
      setImageErrors({});
      setHiddenIds(new Set());
      topFingerprintRef.current = fingerprint(fetchedPosts);

      console.log(`Fetched initial ${fetchedPosts.length} posts, nextCursor: ${data.nextBefore}`);
    } catch (err) {
      console.error("Error fetching Telegram posts:", err);
      setError("Unable to load channel posts");
      setLoading(false);
    }
  };

  const fetchNextPage = useCallback(async () => {
    if (!hasMore || isLoadingMore || !nextCursor) return;

    setIsLoadingMore(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tg-channel-feed?channel=${channelUsername}&limit=20&before=${nextCursor}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch more posts");
      }

      const data = await response.json();
      const newPosts = data.posts || [];

      // Deduplicate using Set
      const existingIds = new Set(allPosts.map((p) => p.id));
      const uniqueNewPosts = newPosts.filter((p: TelegramPost) => !existingIds.has(p.id));

      setAllPosts((prev) => [...prev, ...uniqueNewPosts]);
      setNextCursor(data.nextBefore);
      setHasMore(data.hasMore);

      console.log(
        `Fetched ${uniqueNewPosts.length} more posts, nextCursor: ${data.nextBefore}, hasMore: ${data.hasMore}`,
      );
    } catch (err) {
      console.error("Error fetching more posts:", err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoadingMore, nextCursor, channelUsername, allPosts]);

  const checkForNewPosts = useCallback(async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tg-channel-feed?channel=${channelUsername}&limit=20`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) return;

      const data = await response.json();
      const fetchedPosts = data.posts || [];

      // Read current state from refs (stable access)
      const currentPosts = postsRef.current;
      const currentNearTop = nearTopRef.current;

      console.log('[checkForNewPosts]', {
        cached: data.cached,
        topIds: fetchedPosts.slice(0, 3).map((p: TelegramPost) => p.id),
        currentTopIds: currentPosts.slice(0, 3).map(p => p.id),
      });

      // Check for content changes using fingerprint
      if (currentPosts.length > 0 && fetchedPosts.length > 0) {
        const newFp = fingerprint(fetchedPosts);
        const fpChanged = newFp !== topFingerprintRef.current;

        // Check for new post IDs (NEW posts, not just content updates)
        const newTopIds = fetchedPosts.slice(0, 5).map((p: TelegramPost) => p.id);
        const currentTopIds = currentPosts.slice(0, 5).map((p) => p.id);
        const hasNewPostIds = newTopIds.some((id: string) => !currentTopIds.includes(id));

        console.log('[checkForNewPosts] Decision:', {
          fpChanged,
          hasNewPostIds,
          currentNearTop,
          willChangeRefreshKey: hasNewPostIds && currentNearTop,
        });

        // Branch 1: New post IDs detected (genuine new posts)
        if (hasNewPostIds) {
          console.log('[checkForNewPosts] Branch: NEW IDs detected');
          if (currentNearTop) {
            // User is near top: refresh everything including images
            console.log('[checkForNewPosts] -> Refreshing with NEW IDs (changing refreshKey)');
            setAllPosts(fetchedPosts);
            setNextCursor(data.nextBefore);
            setHasMore(data.hasMore);
            setPendingNewCount(0);
            setRefreshKey(Date.now()); // ONLY change refreshKey for NEW posts
            setImageLoadStates({});
            setImageErrors({});
            setHiddenIds(new Set());
            topFingerprintRef.current = newFp;
          } else {
            // User scrolled down: show "new posts" button
            const newCount = fetchedPosts.findIndex((p: TelegramPost) =>
              currentPosts.some((existing) => existing.id === p.id),
            );
            console.log('[checkForNewPosts] -> Showing new posts button');
            setPendingNewCount(newCount > 0 ? newCount : 1);
          }
          return;
        }

        // Branch 2: Content changed but same IDs (edited posts)
        if (fpChanged) {
          console.log('[checkForNewPosts] Branch: Content CHANGED (same IDs)');
          if (currentNearTop) {
            // Update content but DON'T reload images
            console.log('[checkForNewPosts] -> Updating content ONLY (NOT changing refreshKey)');
            setAllPosts(fetchedPosts);
            setNextCursor(data.nextBefore);
            setHasMore(data.hasMore);
            setPendingNewCount(0);
            // DO NOT call setRefreshKey - prevents image blinking
            // DO NOT reset imageLoadStates - keeps existing images
            topFingerprintRef.current = newFp;
          } else {
            console.log('[checkForNewPosts] -> Showing update button');
            setPendingNewCount(1);
          }
          return;
        }

        // Branch 3: No changes
        console.log('[checkForNewPosts] Branch: NO CHANGES');
      }
    } catch (err) {
      console.error("Error checking for new posts:", err);
    }
  }, [channelUsername, fingerprint]);

  useEffect(() => {
    fetchInitialPosts();

    // Check for new posts at specified interval (stable - won't reset constantly)
    const pollInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        checkForNewPosts();
      }
    }, refreshInterval);

    // Refetch when page becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkForNewPosts();
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [channelUsername, refreshInterval, checkForNewPosts]);

  const handleScroll = useCallback(() => {
    if (layout === "grid") {
      // For grid, use window scroll
      const scrollTop = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;

      // Check if we're near the top of the FEED SECTION, not the page
      const feedElement = feedSectionRef?.current ?? document.querySelector('section.relative.py-12.bg-black');
      
      let nearTop = scrollTop < 100; // fallback
      
      if (feedElement) {
        const feedRect = (feedElement as HTMLElement).getBoundingClientRect();
        // Near top means: feed section is within 200px of the viewport top
        nearTop = feedRect.top <= 200 && feedRect.top >= -100;
      }
      
      // If user scrolls back to top AND there are pending new posts, auto-refresh
      if (nearTop && pendingNewCount > 0) {
        fetchInitialPosts();
        setPendingNewCount(0);
      }
      
      setIsNearTop(nearTop);

      const nearBottom = scrollHeight - scrollTop - clientHeight < 500;
      if (nearBottom && hasMore && !isLoadingMore) {
        fetchNextPage();
      }
    } else {
      // For list, use container scroll
      if (!listRef.current) return;

      const { scrollTop, scrollHeight, clientHeight } = listRef.current;
      const nearTop = scrollTop < 100;
      
      // If user scrolls back to top AND there are pending new posts, auto-refresh
      if (nearTop && pendingNewCount > 0) {
        fetchInitialPosts();
        setPendingNewCount(0);
      }
      
      setIsNearTop(nearTop);

      const nearBottom = scrollHeight - scrollTop - clientHeight < 500;
      if (nearBottom && hasMore && !isLoadingMore) {
        fetchNextPage();
      }
    }
  }, [layout, hasMore, isLoadingMore, fetchNextPage, pendingNewCount, fetchInitialPosts]);

  // Window scroll listener for grid layout
  useEffect(() => {
    if (layout !== "grid") return;

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [layout, handleScroll]);

  const handleNewPostsClick = () => {
    if (layout === "grid") {
      const feedElement = feedSectionRef?.current ?? document.querySelector('section.relative.py-12.bg-black');
      if (feedElement) {
        const rect = (feedElement as HTMLElement).getBoundingClientRect();
        const y = window.scrollY + rect.top - 80;
        window.scrollTo({ top: y, behavior: "smooth" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else if (listRef.current) {
      listRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
    // Do not fetch here; nearTop logic will refresh and clear the badge.
  };

  if (loading) {
    return null;
  }

  if (error) {
    return (
      <Card className="p-8 text-center bg-card/80 backdrop-blur border border-border">
        <p className="text-destructive mb-2">{error}</p>
        <p className="text-sm text-muted-foreground">Please check the channel name and try again</p>
      </Card>
    );
  }

  if (allPosts.length === 0 && !loading) {
    return null;
  }

  if (layout === "grid") {
    const postsWithMedia = allPosts.filter((post) => post.media);

    return (
      <>
        {pendingNewCount > 0 && !isNearTop && createPortal(
          <Button
            onClick={handleNewPostsClick}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] text-lg px-8 py-6 font-bold transition-all duration-300 animate-in fade-in slide-in-from-top-4"
            size="lg"
            style={{
              background: "var(--gradient-sunset)",
              boxShadow: "var(--shadow-warm)",
            }}
          >
            <ArrowUp className="w-5 h-5 mr-2" />
            {pendingNewCount} new {pendingNewCount === 1 ? "post" : "posts"} 🌻
          </Button>,
          document.body
        )}

        <div className="relative">
        <div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0.5">
            {postsWithMedia.map((post, index) => {
              // Skip rendering if image failed too many times
              if (hiddenIds.has(post.id)) {
                return null;
              }
              
              return (
                <div
                  key={`${post.id}-${refreshKey}`}
                  className="aspect-[3/4] cursor-pointer overflow-hidden group relative opacity-0 animate-fade-in"
                  onClick={() => window.open(post.link, "_blank", "noopener,noreferrer")}
                  style={{ 
                    animationDelay: `${(index % 20) * 0.05}s`,
                    animationFillMode: "forwards"
                  }}
                >
                  {!imageLoadStates[post.id] && (
                    <Skeleton className="absolute inset-0 w-full h-full" />
                  )}
                  <img
                    src={buildSrc(post.media!, post.id)}
                    alt="Post"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className={`w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-all duration-300 group-hover:scale-105 ${
                      imageLoadStates[post.id] ? "" : "opacity-0"
                    }`}
                    onLoad={() => setImageLoadStates((prev) => ({ ...prev, [post.id]: true }))}
                    onError={() => {
                      const currentTries = imageErrors[post.id] || 0;
                      const delay = currentTries === 0 ? 200 : 500;
                      
                      console.log(`Image load failed for post ${post.id}, attempt ${currentTries + 1}`);
                      
                      setTimeout(() => {
                        setImageErrors(prev => {
                          const tries = (prev[post.id] || 0) + 1;
                          
                          if (tries >= 3) {
                            console.log(`Hiding post ${post.id} after 3 failed attempts`);
                            setHiddenIds(s => new Set(s).add(post.id));
                          }
                          
                          return { ...prev, [post.id]: tries };
                        });
                      }, delay);
                    }}
                  />
                </div>
              );
            })}
          </div>

          {hasMore && isLoadingMore && (
            <div className="py-8 text-center">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading more posts...</span>
              </div>
            </div>
          )}
        </div>
        </div>
      </>
    );
  }

  return (
    <div className="relative">
      {pendingNewCount > 0 && createPortal(
        <Button
          onClick={handleNewPostsClick}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] shadow-xl animate-in fade-in slide-in-from-top-4"
          size="sm"
        >
          <ArrowUp className="w-4 h-4 mr-2" />
          {pendingNewCount} new {pendingNewCount === 1 ? "post" : "posts"}
        </Button>,
        document.body
      )}

      <div ref={listRef} onScroll={handleScroll} className="h-[70vh] max-h-[700px] overflow-y-auto rounded-lg">
        <div className="space-y-4">
          {allPosts.map((post) => (
            <TelegramPostCard key={`${post.id}-${refreshKey}`} post={post} channelInfo={channelInfo} animate={false} cacheBuster={refreshKey} />
          ))}

          {hasMore && isLoadingMore && (
            <div className="py-8 text-center">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading more posts...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
