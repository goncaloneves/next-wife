import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { BadgeCheck, MapPin, Flame } from "lucide-react";
import { TelegramPostCard } from "./TelegramPostCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeTime } from "@/lib/dateLocale";
import { getPersonalityLabel, getRelationshipLabel, getLanguageDisplay } from "@/lib/girlfriends/profile-formatter";
import { getStoredFilters, type SharedFilters } from "@/lib/filterStorage";
import { useFiltersOptional } from "@/contexts/FilterContext";
import { VirtualizedPostGrid } from "./VirtualizedPostGrid";

interface ProfileData {
  name: string;
  age: number;
  nationality: string;
  hometown: string;
  work: string;
  language?: string | null;
  personality?: string | null;
  relationship?: string | null;
}

interface MediaItem {
  type: 'photo' | 'video';
  url: string;
}

interface UnifiedMediaItem {
  type: 'photo' | 'video';
  url: string;
  previewUrl?: string | null;
  quality: 'high' | 'preview' | 'direct';
}

interface TelegramPost {
  id: string;
  text: string;
  date: string;
  link: string;
  media?: string | null;
  mediaItems?: UnifiedMediaItem[] | null;
  mediaUrls?: MediaItem[] | null;
  avatar?: string | null;
  botLink?: string | null;
  profileData?: ProfileData | null;
  isHot?: boolean;
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
  filters?: SharedFilters;
  onProfileOverlay?: (postId: string) => void;
  hideNotifications?: boolean;
}

export const TelegramChannelFeed = ({
  channelUsername,
  refreshInterval = 30000,
  maxPosts = 20,
  layout = "list",
  feedSectionRef,
  filters: externalFilters,
  onProfileOverlay,
  hideNotifications = false,
}: TelegramChannelFeedProps) => {
  const { t } = useTranslation();
  const [allPosts, setAllPosts] = useState<TelegramPost[]>([]);
  const [channelInfo, setChannelInfo] = useState<ChannelInfo | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isNearTop, setIsNearTop] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [refreshKey, setRefreshKey] = useState(Date.now());
  const [imageLoadStates, setImageLoadStates] = useState<Record<string, boolean>>({});
  const [imageErrors, setImageErrors] = useState<Record<string, number>>({});
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [skipAnimation, setSkipAnimation] = useState(false);
  const navigate = useNavigate();
  const [centeredPostId, setCenteredPostId] = useState<string | null>(null);
  const filterContext = useFiltersOptional();
  
  const filters = externalFilters || getStoredFilters();
  const listRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const observerTarget = useRef<HTMLDivElement>(null);
  const topFingerprintRef = useRef<string>('');
  const postsRef = useRef<TelegramPost[]>([]);
  const nearTopRef = useRef(true);
  const fetchInFlightRef = useRef(false);
  const loadingMoreRef = useRef(false);
  const isFilterChangeRef = useRef(false);
  const hasInitializedRef = useRef(false);
  const [isMobile, setIsMobile] = useState(false);
  const [lastViewedId, setLastViewedId] = useState<string | null>(null);
  const [playingVideos, setPlayingVideos] = useState<Set<string>>(new Set());
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const progressCircleRefs = useRef<Record<string, SVGCircleElement | null>>({});
  const rafRefs = useRef<Record<string, number>>({});

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const stored = sessionStorage.getItem('nextwife_last_viewed');
    if (stored) {
      setLastViewedId(stored);
      sessionStorage.removeItem('nextwife_last_viewed');
    }
  }, []);

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
    
    // Third attempt: use proxy - use relative path for Replit compatibility
    const apiUrl = import.meta.env.VITE_API_URL || '';
    return `${apiUrl}/api/tg-image-proxy?u=${encodeURIComponent(normalized)}`;
  }, [imageErrors]);

  const abortControllerRef = useRef<AbortController | null>(null);
  
  const fetchInitialPosts = useCallback(async () => {
    // Abort any previous in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;
    fetchInFlightRef.current = true;
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const filterParams = new URLSearchParams();
      filterParams.set('channel', channelUsername);
      filterParams.set('limit', '20');
      if (filters.regions?.length) filters.regions.forEach(r => filterParams.append('region', r));
      if (filters.ageBrackets?.length) filters.ageBrackets.forEach(a => filterParams.append('ageBracket', a));
      if (filters.occupationCategories?.length) filters.occupationCategories.forEach(o => filterParams.append('occupationCategory', o));
      if (filters.languages?.length) filters.languages.forEach(l => filterParams.append('language', l));
      if (filters.hometowns?.length) filters.hometowns.forEach(h => filterParams.append('hometown', h));
      if (filters.personalities?.length) filters.personalities.forEach(p => filterParams.append('personality', p));
      if (filters.relationships?.length) filters.relationships.forEach(r => filterParams.append('relationship', r));
      if (filters.hasVideo) filterParams.append('hasVideo', 'true');
      if (filters.hasMultipleMedia) filterParams.append('hasMultipleMedia', 'true');
      
      const url = `${apiUrl}/api/tg-channel-feed?${filterParams.toString()}`;
      
      const response = await fetch(
        url,
        {
          headers: {
            "Content-Type": "application/json",
          },
          signal: controller.signal,
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
      
      // Always reset refreshKey to ensure unique keys for React
      setRefreshKey(Date.now());
      setImageLoadStates({});
      setImageErrors({});
      setHiddenIds(new Set());
      
      // Only reset animation on initial load, not filter changes
      if (!isFilterChangeRef.current) {
        setSkipAnimation(false);
      }
      isFilterChangeRef.current = false;
      
      topFingerprintRef.current = fingerprint(fetchedPosts);

      console.log(`Fetched initial ${fetchedPosts.length} posts, nextCursor: ${data.nextBefore}`);
    } catch (err) {
      // Ignore aborted requests - they're intentional
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      console.error("Error fetching Telegram posts:", err);
      setError("Unable to load channel posts");
      setLoading(false);
    } finally {
      fetchInFlightRef.current = false;
    }
  }, [channelUsername, filters.regions, filters.ageBrackets, filters.occupationCategories, filters.languages, filters.hometowns, filters.personalities, filters.relationships, filters.hasVideo, filters.hasMultipleMedia, fingerprint]);

  const fetchNextPage = useCallback(async () => {
    if (!hasMore || loadingMoreRef.current || !nextCursor) return;

    loadingMoreRef.current = true;
    setIsLoadingMore(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const filterParams = new URLSearchParams();
      filterParams.set('channel', channelUsername);
      filterParams.set('limit', '20');
      filterParams.set('before', nextCursor);
      if (filters.regions?.length) filters.regions.forEach(r => filterParams.append('region', r));
      if (filters.ageBrackets?.length) filters.ageBrackets.forEach(a => filterParams.append('ageBracket', a));
      if (filters.occupationCategories?.length) filters.occupationCategories.forEach(o => filterParams.append('occupationCategory', o));
      if (filters.languages?.length) filters.languages.forEach(l => filterParams.append('language', l));
      if (filters.hometowns?.length) filters.hometowns.forEach(h => filterParams.append('hometown', h));
      if (filters.personalities?.length) filters.personalities.forEach(p => filterParams.append('personality', p));
      if (filters.relationships?.length) filters.relationships.forEach(r => filterParams.append('relationship', r));
      if (filters.hasVideo) filterParams.append('hasVideo', 'true');
      if (filters.hasMultipleMedia) filterParams.append('hasMultipleMedia', 'true');
      
      const response = await fetch(
        `${apiUrl}/api/tg-channel-feed?${filterParams.toString()}`,
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

      setAllPosts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const uniqueNewPosts = newPosts.filter((p: TelegramPost) => !existingIds.has(p.id));
        console.log(
          `Fetched ${uniqueNewPosts.length} more posts (${newPosts.length - uniqueNewPosts.length} dupes filtered), nextCursor: ${data.nextBefore}, hasMore: ${data.hasMore}`,
        );
        return [...prev, ...uniqueNewPosts];
      });
      setNextCursor(data.nextBefore);
      setHasMore(data.hasMore);
    } catch (err) {
      console.error("Error fetching more posts:", err);
    } finally {
      loadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
  }, [hasMore, nextCursor, channelUsername, filters]);

  const checkForNewPosts = useCallback(async () => {
    // Skip checking for new posts when filters are active
    // (filtered views don't need auto-refresh since user is browsing a subset)
    const hasFilters = (filters.regions?.length) ||
                       (filters.ageBrackets?.length) ||
                       (filters.occupationCategories?.length) ||
                       (filters.languages?.length) ||
                       (filters.hometowns?.length);
    if (hasFilters) return;
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(
        `${apiUrl}/api/tg-channel-feed?channel=${channelUsername}&limit=20`,
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
          
          // Find truly new posts (not already in current list)
          const existingIds = new Set(currentPosts.map(p => p.id));
          const newPosts = fetchedPosts.filter((p: TelegramPost) => !existingIds.has(p.id));
          
          if (currentNearTop) {
            // User is near top: refresh everything including images
            console.log('[checkForNewPosts] -> Refreshing with NEW IDs (changing refreshKey)');
            setLastViewedId(null);
            setAllPosts(fetchedPosts);
            setNextCursor(data.nextBefore);
            setHasMore(data.hasMore);
            setRefreshKey(Date.now());
            setImageLoadStates({});
            setImageErrors({});
            setHiddenIds(new Set());
            topFingerprintRef.current = newFp;
          } else {
            // User scrolled down: silently prepend new posts without changing scroll position
            console.log('[checkForNewPosts] -> Silently prepending', newPosts.length, 'new posts');
            if (newPosts.length > 0) {
              setAllPosts(prev => {
                const existingIds = new Set(prev.map(p => p.id));
                const unique = newPosts.filter((p: TelegramPost) => !existingIds.has(p.id));
                return unique.length > 0 ? [...unique, ...prev] : prev;
              });
              topFingerprintRef.current = newFp;
            }
          }
          return;
        }

        // Branch 2: Content changed but same IDs (edited posts)
        if (fpChanged) {
          console.log('[checkForNewPosts] Branch: Content CHANGED (same IDs)');
          // Silently update content without changing scroll position
          console.log('[checkForNewPosts] -> Updating content silently');
          setAllPosts(fetchedPosts);
          setNextCursor(data.nextBefore);
          setHasMore(data.hasMore);
          // DO NOT call setRefreshKey - prevents image blinking
          // DO NOT reset imageLoadStates - keeps existing images
          topFingerprintRef.current = newFp;
          return;
        }

        // Branch 3: No changes
        console.log('[checkForNewPosts] Branch: NO CHANGES');
      }
    } catch (err) {
      console.error("Error checking for new posts:", err);
    }
  }, [channelUsername, fingerprint, filters.regions, filters.ageBrackets, filters.occupationCategories, filters.languages, filters.hometowns, filters.personalities, filters.relationships, filters.hasVideo, filters.hasMultipleMedia]);

  // Initial mount effect - runs once only
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;
    
    const cachedData = sessionStorage.getItem('feedCache');
    const scrollContext = sessionStorage.getItem('feedScrollContext');
    let restoredFromCache = false;
    
    if (cachedData && scrollContext) {
      try {
        const cache = JSON.parse(cachedData);
        // Normalize filter arrays by sorting for order-independent comparison
        const normalizeFilters = (f: typeof filters) => ({
          regions: [...(f.regions || [])].sort(),
          ageBrackets: [...(f.ageBrackets || [])].sort(),
          occupationCategories: [...(f.occupationCategories || [])].sort(),
          languages: [...(f.languages || [])].sort(),
          hometowns: [...(f.hometowns || [])].sort(),
          personalities: [...(f.personalities || [])].sort(),
          relationships: [...(f.relationships || [])].sort(),
        });
        const filtersMatch = 
          JSON.stringify(normalizeFilters(cache.filters)) === JSON.stringify(normalizeFilters(filters)) &&
          true; // Filters match check
        
        if (filtersMatch && cache.posts?.length > 0) {
          setAllPosts(cache.posts);
          setChannelInfo(cache.channelInfo);
          setNextCursor(cache.nextCursor);
          setHasMore(cache.hasMore);
          setLoading(false);
          if (cache.refreshKey) setRefreshKey(cache.refreshKey);
          
          // Don't restore imageLoadStates from cache - let images trigger their own onLoad
          // This prevents showing black cards when browser cache is cleared
          sessionStorage.removeItem('feedLoadedImages');
          
          setSkipAnimation(true);
          topFingerprintRef.current = fingerprint(cache.posts);
          
          // Restore scroll position after React renders the cached posts
          const { scrollY } = JSON.parse(scrollContext);
          // Use multiple RAFs to ensure virtualizer has rendered content
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                window.scrollTo(0, scrollY);
                sessionStorage.removeItem('feedScrollContext');
                // Clean up grid dimensions after successful restoration
                sessionStorage.removeItem('feedGridDimensions');
              });
            });
          });
          
          // Clear cache after successful restoration (delay for StrictMode)
          setTimeout(() => sessionStorage.removeItem('feedCache'), 100);
          restoredFromCache = true;
        } else {
          sessionStorage.removeItem('feedCache');
        }
      } catch {
        sessionStorage.removeItem('feedCache');
      }
    }
    
    if (!restoredFromCache) {
      fetchInitialPosts();
    }
    
    // Cleanup: clear cache on unmount (fresh navigation, not back navigation)
    return () => {
      // Only clear if not navigating to profile (profile click sets cache just before unmount)
      // Use a small delay to allow profile navigation to set cache first
      setTimeout(() => {
        const scrollContext = sessionStorage.getItem('feedScrollContext');
        if (!scrollContext) {
          sessionStorage.removeItem('feedCache');
        }
      }, 50);
    };
  }, []);

  // Separate effect for polling - doesn't trigger refetch
  // Pause polling when profile overlay is active (hideNotifications=true)
  useEffect(() => {
    if (hideNotifications) return;
    
    const pollInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        checkForNewPosts();
      }
    }, refreshInterval);

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
  }, [refreshInterval, checkForNewPosts, hideNotifications]);

  // Refetch when filters change (skip initial mount)
  const filtersInitialized = useRef(false);
  const prevFiltersRef = useRef<string>('');
    
  useEffect(() => {
    // Include channelUsername in key for future multi-channel support
    const currentFiltersKey = JSON.stringify([channelUsername, filters.regions, filters.ageBrackets, filters.occupationCategories, filters.languages, filters.hometowns, filters.personalities, filters.relationships, filters.hasVideo, filters.hasMultipleMedia]);
    
    // Skip if nothing actually changed (prevents re-fetch on callback recreation)
    if (prevFiltersRef.current === currentFiltersKey) {
      return;
    }
    
    // Skip initial mount
    if (!filtersInitialized.current) {
      filtersInitialized.current = true;
      prevFiltersRef.current = currentFiltersKey;
      return;
    }
    
    prevFiltersRef.current = currentFiltersKey;
    
    // Clear last viewed profile so preview shows first result from new filters
    setLastViewedId(null);
    
    // Mark this as a filter change to preserve existing posts visible
    isFilterChangeRef.current = true;
    
    // Show loading state but keep existing posts visible
    setLoading(true);
    
    // Reset cursor for new filter query
    setNextCursor(null);
    setHasMore(true);
    
    // Fetch with new filters - fetchInitialPosts will replace posts atomically
    fetchInitialPosts();
  }, [filters.regions, filters.ageBrackets, filters.occupationCategories, filters.languages, filters.hometowns, filters.personalities, filters.relationships, filters.hasVideo, filters.hasMultipleMedia, fetchInitialPosts]);

  
  // Horizontal scroll handler for mobile carousel
  const handleHorizontalScroll = useCallback((e: Event) => {
    const container = e.target as HTMLDivElement;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    const nearEnd = scrollWidth - scrollLeft - clientWidth < 300;
    
    if (nearEnd && hasMore && !isLoadingMore) {
      fetchNextPage();
    }
  }, [hasMore, isLoadingMore, fetchNextPage]);

  const handleScroll = useCallback(() => {
    if (layout === "grid") {
      // For grid, use window scroll (desktop only - mobile uses horizontal scroll)
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
      
      setIsNearTop(nearTop);

      const nearBottom = scrollHeight - scrollTop - clientHeight < 500;
      if (nearBottom && hasMore && !isLoadingMore) {
        fetchNextPage();
      }
    }
  }, [layout, hasMore, isLoadingMore, fetchNextPage]);

  // Scroll listeners for grid layout
  useEffect(() => {
    if (layout !== "grid") return;

    // Desktop: vertical window scroll
    const isDesktop = window.matchMedia('(min-width: 768px)').matches;
    
    if (isDesktop) {
      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    } else {
      // Mobile/Tablet: horizontal carousel scroll
      const gridElement = gridRef.current;
      if (gridElement) {
        gridElement.addEventListener("scroll", handleHorizontalScroll);
        return () => gridElement.removeEventListener("scroll", handleHorizontalScroll);
      }
    }
  }, [layout, handleScroll, handleHorizontalScroll]);

  // IntersectionObserver to highlight centered card on mobile/tablet
  useEffect(() => {
    if (layout !== "grid") return;
    
    const isDesktop = window.matchMedia('(min-width: 768px)').matches;
    if (isDesktop) return; // Only for mobile/tablet
    
    const options = {
      root: gridRef.current,
      threshold: 0.5, // Card is considered "centered" when 50% visible
      rootMargin: '0px',
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          const postId = entry.target.getAttribute('data-post-id');
          if (postId) {
            setCenteredPostId(postId);
          }
        }
      });
    }, options);
    
    // Observe all post cards
    const cards = gridRef.current?.querySelectorAll('[data-post-id]');
    cards?.forEach((card) => observer.observe(card));
    
    return () => observer.disconnect();
  }, [layout, allPosts.length]);

  const postsWithMedia = allPosts.filter((post) => post.media);
  const activePost = useMemo(() => 
    (lastViewedId && postsWithMedia.find(p => p.id === lastViewedId)) || postsWithMedia[0],
    [lastViewedId, postsWithMedia]
  );
  const hasActiveFilters = (filters.regions?.length) ||
                           (filters.ageBrackets?.length) ||
                           (filters.occupationCategories?.length) ||
                           (filters.languages?.length) ||
                           (filters.hometowns?.length) ||
                           filters.hasVideo ||
                           filters.hasMultipleMedia;

  if (layout === "grid") {
    return (
      <>

        <div className="relative">
        {/* Container with min-height to prevent layout collapse during filter changes */}
        <div className="min-h-[50vh]">
        
        {/* Loading state - only show when no posts exist yet */}
        {loading && allPosts.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}
        
        {/* Empty state for filtered results - only after loading completes */}
        {!loading && postsWithMedia.length === 0 && hasActiveFilters && (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <div className="text-center">
              <p className="text-lg">{t('feed.noMatchingFilters')}</p>
              <p className="text-sm mt-2">{t('feed.tryAdjustingFilters')}</p>
              {filterContext && (
                <Button
                  variant="ghost"
                  onClick={filterContext.clearFilters}
                  className="mt-4 text-white/60 hover:text-white hover:bg-white/10"
                  data-testid="button-clear-filters-empty"
                >
                  {t('filters.clearFilters')}
                </Button>
              )}
            </div>
          </div>
        )}
        
        {/* Empty state for no posts at all */}
        {!loading && allPosts.length === 0 && !hasActiveFilters && (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <p>{t('feed.loadingGirlfriends')}</p>
          </div>
        )}
        
        {/* Posts grid - show whenever we have posts, even while loading new ones */}
        {postsWithMedia.length > 0 && (
          <>
            {/* Mobile: Show only first post */}
            <div className="md:hidden flex flex-col items-center gap-6 pb-4">
              {postsWithMedia.slice(0, 1).map((post) => {
                if (hiddenIds.has(post.id)) return null;
                const firstMedia = post.mediaUrls?.[0];
                const isVideo = firstMedia?.type === 'video';
                
                return (
                  <div
                    key={`${post.id}-${refreshKey}`}
                    data-post-id={post.id}
                    className={`
                      aspect-[3/4] cursor-pointer overflow-hidden group relative w-full max-w-sm
                      ${skipAnimation ? 'opacity-100' : 'opacity-0 animate-fade-in'}
                    `}
                    onClick={() => {
                      setLastViewedId(post.id);
                      sessionStorage.setItem('nextwife_last_viewed', post.id);
                      sessionStorage.setItem('feedScrollContext', JSON.stringify({
                        postId: post.id,
                        scrollY: window.scrollY
                      }));
                      sessionStorage.setItem('feedCache', JSON.stringify({
                        posts: allPosts,
                        channelInfo,
                        nextCursor,
                        hasMore,
                        filters,
                        refreshKey
                      }));
                      const loadedIds = Object.keys(imageLoadStates).filter(id => imageLoadStates[id]);
                      sessionStorage.setItem('feedLoadedImages', JSON.stringify(loadedIds));
                      navigate('/find');
                    }}
                    style={skipAnimation ? undefined : { animationFillMode: "forwards" }}
                  >
                    {!imageLoadStates[post.id] && (
                      <Skeleton className="absolute inset-0 w-full h-full z-10" />
                    )}
                    {isVideo ? (
                      <video
                        src={buildSrc(firstMedia.url, post.id)}
                        muted
                        loop
                        playsInline
                        preload="auto"
                        className={`w-full h-full object-cover ${imageLoadStates[post.id] ? "opacity-70" : "opacity-0"}`}
                        onLoadedData={() => setImageLoadStates((prev) => ({ ...prev, [post.id]: true }))}
                      />
                    ) : (
                      <img
                        src={buildSrc(post.media!, post.id)}
                        alt=""
                        loading="lazy"
                        className={`w-full h-full object-cover ${imageLoadStates[post.id] ? "opacity-70" : "opacity-0"}`}
                        onLoad={() => setImageLoadStates((prev) => ({ ...prev, [post.id]: true }))}
                      />
                    )}
                    <div className="absolute top-3 left-3 z-20 pointer-events-none">
                      <div className="bg-black/60 backdrop-blur-sm text-white/90 px-2 py-1 rounded-full text-xs font-medium shadow-lg">
                        {formatRelativeTime(post.date)}
                      </div>
                    </div>
                    {post.profileData && (
                      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/70 to-transparent pointer-events-none">
                        <div className="text-white">
                          <p className="mb-1 text-2xl font-bold drop-shadow-lg">
                            {post.profileData.name} <span className="text-[22px] font-normal ml-2">{post.profileData.age}</span>
                            <BadgeCheck className="inline w-5 h-5 text-[#0099FF] ml-1 relative top-[-2px]" style={{ fill: '#0099FF', stroke: 'white', strokeWidth: 2 }} />
                          </p>
                          <p className="flex items-center gap-1.5 text-sm">
                            <MapPin className="w-3.5 h-3.5 text-rose-400" />
                            {post.profileData.hometown}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Desktop: Virtualized grid */}
            <div className="hidden md:block">
              <VirtualizedPostGrid
                posts={postsWithMedia}
                allPosts={allPosts}
                channelInfo={channelInfo}
                nextCursor={nextCursor}
                hasMore={hasMore}
                filters={filters}
                refreshKey={refreshKey}
                skipAnimation={skipAnimation}
                imageLoadStates={imageLoadStates}
                setImageLoadStates={setImageLoadStates}
                imageErrors={imageErrors}
                setImageErrors={setImageErrors}
                hiddenIds={hiddenIds}
                setHiddenIds={setHiddenIds}
                playingVideos={playingVideos}
                setPlayingVideos={setPlayingVideos}
                videoRefs={videoRefs}
                progressCircleRefs={progressCircleRefs}
                rafRefs={rafRefs}
                setLastViewedId={setLastViewedId}
                onLoadMore={fetchNextPage}
                isLoadingMore={isLoadingMore}
                buildSrc={buildSrc}
                onProfileOverlay={onProfileOverlay}
              />
            </div>
          </>
        )}
        </div>
        </div>
      </>
    );
  }

  return (
    <div className="relative">
      <div ref={listRef} onScroll={handleScroll} className="h-[70vh] max-h-[700px] overflow-y-auto rounded-lg">
        <div className="space-y-4">
          {allPosts.map((post) => (
            <TelegramPostCard key={`${post.id}-${refreshKey}`} post={post} channelInfo={channelInfo} animate={false} cacheBuster={refreshKey} />
          ))}

          {hasMore && isLoadingMore && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
