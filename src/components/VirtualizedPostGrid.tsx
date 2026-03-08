import { useState, useRef, useCallback, useEffect, useLayoutEffect, useMemo, memo } from "react";
import { useNavigate } from "react-router-dom";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeTime } from "@/lib/dateLocale";
import { BadgeCheck, MapPin, Flame } from "lucide-react";
import { getPersonalityLabel, getRelationshipLabel } from "@/lib/girlfriends/profile-formatter";
import { type SharedFilters } from "@/lib/filterStorage";

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

interface VirtualizedPostGridProps {
  posts: TelegramPost[];
  allPosts: TelegramPost[];
  channelInfo?: ChannelInfo;
  nextCursor: string | null;
  hasMore: boolean;
  filters: SharedFilters;
  refreshKey: number;
  skipAnimation: boolean;
  imageLoadStates: Record<string, boolean>;
  setImageLoadStates: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  imageErrors: Record<string, number>;
  setImageErrors: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  hiddenIds: Set<string>;
  setHiddenIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  playingVideos: Set<string>;
  setPlayingVideos: React.Dispatch<React.SetStateAction<Set<string>>>;
  videoRefs: React.MutableRefObject<Record<string, HTMLVideoElement | null>>;
  progressCircleRefs: React.MutableRefObject<Record<string, SVGCircleElement | null>>;
  rafRefs: React.MutableRefObject<Record<string, number>>;
  setLastViewedId: (id: string | null) => void;
  onLoadMore: () => void;
  isLoadingMore: boolean;
  buildSrc: (url: string, postId: string) => string;
  onProfileOverlay?: (postId: string) => void;
}

const GAP = 2;
const MIN_OVERSCAN = 8;
const LOAD_MORE_THRESHOLD = 12;
const PRELOAD_BUFFER = 3;

function getColumns(width: number): number {
  if (width >= 1280) return 4;
  if (width >= 1024) return 3;
  return 2;
}

export const VirtualizedPostGrid = ({
  posts,
  allPosts,
  channelInfo,
  nextCursor,
  hasMore,
  filters,
  refreshKey,
  skipAnimation,
  imageLoadStates,
  setImageLoadStates,
  imageErrors,
  setImageErrors,
  hiddenIds,
  setHiddenIds,
  playingVideos,
  setPlayingVideos,
  videoRefs,
  progressCircleRefs,
  rafRefs,
  setLastViewedId,
  onLoadMore,
  isLoadingMore,
  buildSrc,
  onProfileOverlay,
}: VirtualizedPostGridProps) => {
  const navigate = useNavigate();
  const listRef = useRef<HTMLDivElement>(null);
  const preloadedRows = useRef<Set<number>>(new Set());
  
  // Initialize with cached dimensions for instant restoration
  const [rowHeight, setRowHeight] = useState<number | null>(() => {
    try {
      const cached = sessionStorage.getItem('feedGridDimensions');
      if (cached) {
        const { rowHeight: cachedHeight } = JSON.parse(cached);
        return cachedHeight ?? null;
      }
    } catch {}
    return null;
  });
  const [columns, setColumns] = useState<number | null>(() => {
    try {
      const cached = sessionStorage.getItem('feedGridDimensions');
      if (cached) {
        const { columns: cachedCols } = JSON.parse(cached);
        return cachedCols ?? null;
      }
    } catch {}
    return null;
  });
  const [layoutReady, setLayoutReady] = useState(() => {
    // If we have cached dimensions, we can be ready immediately
    try {
      const cached = sessionStorage.getItem('feedGridDimensions');
      return cached !== null;
    } catch {}
    return false;
  });

  const effectiveColumns = columns ?? 4;
  const effectiveRowHeight = rowHeight ?? 320;

  const visiblePosts = useMemo(
    () => posts.filter(post => !hiddenIds.has(post.id)),
    [posts, hiddenIds]
  );
  const rowCount = Math.ceil(visiblePosts.length / effectiveColumns);

  useLayoutEffect(() => {
    const calculateDimensions = () => {
      if (listRef.current) {
        const containerWidth = listRef.current.offsetWidth;
        
        // Bail out if container has no width yet (e.g., during navigation)
        // This prevents negative row heights that collapse the grid
        if (containerWidth <= 0) {
          // Schedule a re-measure on next frame
          requestAnimationFrame(calculateDimensions);
          return;
        }
        
        const newColumns = getColumns(containerWidth);
        const cardWidth = (containerWidth - (GAP * (newColumns - 1))) / newColumns;
        const calculatedHeight = cardWidth * (4 / 3);
        
        setColumns(prev => prev !== newColumns ? newColumns : prev);
        const newRowHeight = calculatedHeight + GAP;
        setRowHeight(prev => prev !== newRowHeight ? newRowHeight : prev);
        
        if (!layoutReady) {
          setLayoutReady(true);
        }
      }
    };
    
    calculateDimensions();
    const resizeObserver = new ResizeObserver(calculateDimensions);
    if (listRef.current) {
      resizeObserver.observe(listRef.current);
    }
    
    return () => resizeObserver.disconnect();
  }, [layoutReady]);

  const dynamicOverscan = useMemo(
    () => Math.max(MIN_OVERSCAN, Math.ceil(window.innerHeight / effectiveRowHeight)),
    [effectiveRowHeight]
  );

  const virtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: () => effectiveRowHeight,
    overscan: dynamicOverscan,
  });

  // Re-measure virtualizer when row height changes to sync internal state
  useEffect(() => {
    if (rowHeight !== null && layoutReady) {
      virtualizer.measure();
    }
  }, [rowHeight, layoutReady, virtualizer]);

  const virtualItems = virtualizer.getVirtualItems();

  useEffect(() => {
    if (virtualItems.length === 0 || !layoutReady) return;
    
    const firstRowIndex = virtualItems[0]?.index ?? 0;
    const lastRowIndex = virtualItems[virtualItems.length - 1]?.index ?? 0;
    
    const preloadStart = Math.max(0, firstRowIndex - PRELOAD_BUFFER);
    const preloadEnd = Math.min(rowCount - 1, lastRowIndex + PRELOAD_BUFFER);
    
    for (let rowIdx = preloadStart; rowIdx <= preloadEnd; rowIdx++) {
      if (preloadedRows.current.has(rowIdx)) continue;
      preloadedRows.current.add(rowIdx);
      
      const startIdx = rowIdx * effectiveColumns;
      const endIdx = Math.min(startIdx + effectiveColumns, visiblePosts.length);
      
      for (let i = startIdx; i < endIdx; i++) {
        const post = visiblePosts[i];
        const firstMedia = post?.mediaItems?.[0];
        if (firstMedia?.type === 'photo' && firstMedia.url) {
          const img = new Image();
          img.src = firstMedia.url;
        }
      }
    }
  }, [virtualItems, effectiveColumns, visiblePosts, rowCount, layoutReady]);

  useEffect(() => {
    if (rowCount === 0) return;
    
    const lastItem = virtualItems[virtualItems.length - 1];
    
    if (!lastItem && hasMore && !isLoadingMore && rowCount > 0) {
      onLoadMore();
      return;
    }
    
    if (lastItem && lastItem.index >= rowCount - LOAD_MORE_THRESHOLD && hasMore && !isLoadingMore) {
      onLoadMore();
    }
  }, [virtualItems, rowCount, hasMore, isLoadingMore, onLoadMore]);

  const handleCardClick = useCallback((post: TelegramPost) => {
    setLastViewedId(post.id);
    sessionStorage.setItem('nextwife_last_viewed', post.id);
    
    // If overlay callback is provided (desktop), use overlay instead of navigation
    if (onProfileOverlay) {
      onProfileOverlay(post.id);
      return;
    }
    
    // Otherwise, navigate (mobile fallback or direct access)
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
    // Save grid dimensions for instant restoration
    if (rowHeight !== null && columns !== null) {
      sessionStorage.setItem('feedGridDimensions', JSON.stringify({ rowHeight, columns }));
    }
    navigate('/find');
  }, [allPosts, channelInfo, nextCursor, hasMore, filters, refreshKey, navigate, setLastViewedId, imageLoadStates, rowHeight, columns, onProfileOverlay]);

  const renderPostCard = useCallback((post: TelegramPost, index: number) => {
    const firstMediaItem = post.mediaItems?.[0];
    const firstMediaLegacy = post.mediaUrls?.[0];
    const isVideo = firstMediaItem?.type === 'video' || firstMediaLegacy?.type === 'video';
    const isLoaded = imageLoadStates[post.id] ?? false;
    const errorCount = imageErrors[post.id] ?? 0;
    const isPlaying = playingVideos.has(post.id);

    return (
      <div
        key={`${post.id}-${refreshKey}`}
        data-post-id={post.id}
        className={`
          aspect-[3/4] cursor-pointer overflow-hidden group relative
          ${skipAnimation ? 'opacity-100' : 'opacity-0 animate-fade-in'}
        `}
        onClick={() => handleCardClick(post)}
        style={skipAnimation ? undefined : { 
          animationDelay: `${(index % 20) * 0.05}s`,
          animationFillMode: "forwards"
        }}
      >
        {!isLoaded && (
          <Skeleton className="absolute inset-0 w-full h-full z-10" />
        )}
        
        {isVideo ? (
          <VideoCard
            post={post}
            isLoaded={isLoaded}
            errorCount={errorCount}
            isPlaying={isPlaying}
            setImageLoadStates={setImageLoadStates}
            setImageErrors={setImageErrors}
            setHiddenIds={setHiddenIds}
            setPlayingVideos={setPlayingVideos}
            videoRefs={videoRefs}
            progressCircleRefs={progressCircleRefs}
            rafRefs={rafRefs}
            buildSrc={buildSrc}
          />
        ) : (
          <ImageCard
            post={post}
            isLoaded={isLoaded}
            errorCount={errorCount}
            setImageLoadStates={setImageLoadStates}
            setImageErrors={setImageErrors}
            setHiddenIds={setHiddenIds}
            buildSrc={buildSrc}
          />
        )}
        
        {isLoaded && (
          <>
            <div 
              className="absolute top-3 left-3 z-20 pointer-events-none"
              data-testid={`badge-date-${post.id}`}
            >
              <div className="bg-black/60 backdrop-blur-sm text-white/90 px-2 py-1 rounded-full text-xs font-medium shadow-lg">
                {formatRelativeTime(post.date)}
              </div>
            </div>
            
            {post.profileData && (
              <ProfileBadge post={post} />
            )}
          </>
        )}
      </div>
    );
  }, [
    refreshKey, skipAnimation, imageLoadStates, imageErrors, playingVideos,
    setImageLoadStates, setImageErrors, setHiddenIds, setPlayingVideos, 
    videoRefs, progressCircleRefs, rafRefs, buildSrc, handleCardClick
  ]);

  const [paddingTop, paddingBottom] = virtualItems.length > 0
    ? [
        virtualItems[0].start,
        virtualizer.getTotalSize() - virtualItems[virtualItems.length - 1].end,
      ]
    : [0, 0];

  return (
    <div ref={listRef} className="w-full">
      {!layoutReady ? (
        <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(4, 1fr)` }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4]" />
          ))}
        </div>
      ) : (
        <>
          <div
            style={{
              paddingTop: `${paddingTop}px`,
              paddingBottom: `${paddingBottom}px`,
            }}
          >
            {virtualItems.map((virtualRow) => {
              const startIndex = virtualRow.index * effectiveColumns;
              const rowPosts = visiblePosts.slice(startIndex, startIndex + effectiveColumns);

              return (
                <div
                  key={virtualRow.key}
                  style={{
                    height: `${virtualRow.size}px`,
                  }}
                >
                  <div 
                    className="gap-0.5 h-full"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: `repeat(${effectiveColumns}, 1fr)`,
                    }}
                  >
                    {rowPosts.map((post, colIndex) => 
                      renderPostCard(post, startIndex + colIndex)
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {hasMore && isLoadingMore && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

interface VideoCardProps {
  post: TelegramPost;
  isLoaded: boolean;
  errorCount: number;
  isPlaying: boolean;
  setImageLoadStates: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setImageErrors: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  setHiddenIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  setPlayingVideos: React.Dispatch<React.SetStateAction<Set<string>>>;
  videoRefs: React.MutableRefObject<Record<string, HTMLVideoElement | null>>;
  progressCircleRefs: React.MutableRefObject<Record<string, SVGCircleElement | null>>;
  rafRefs: React.MutableRefObject<Record<string, number>>;
  buildSrc: (url: string, postId: string) => string;
}

const VideoCard = memo(({
  post,
  isLoaded,
  errorCount,
  isPlaying: _isPlaying,
  setImageLoadStates,
  setImageErrors,
  setHiddenIds,
  setPlayingVideos,
  videoRefs,
  progressCircleRefs,
  rafRefs,
  buildSrc,
}: VideoCardProps) => {
  const circumference = 75.4;
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localCircleRef = useRef<SVGCircleElement>(null);
  const localRafRef = useRef<number | null>(null);
  
  const getVideoSrc = () => {
    const firstMedia = post.mediaItems?.[0];
    const firstMediaLegacy = post.mediaUrls?.[0];
    
    if (firstMedia) {
      if (errorCount === 0) {
        return firstMedia.url;
      } else if (firstMedia.previewUrl) {
        return firstMedia.previewUrl;
      }
      return firstMedia.url;
    }
    
    if (firstMediaLegacy) {
      return buildSrc(firstMediaLegacy.url, post.id);
    }
    
    return '';
  };

  return (
    <div 
      className="w-full h-full relative"
      onMouseEnter={() => {
        setPlayingVideos(prev => new Set(prev).add(post.id));
        const video = localVideoRef.current;
        if (video) {
          // Reset and play - handle edge cases from fast scrolling
          video.pause();
          video.currentTime = 0;
          // Small delay to ensure video is ready after virtualization recycle
          requestAnimationFrame(() => {
            video.play().catch(() => {});
          });
        }
      }}
      onMouseLeave={() => {
        setPlayingVideos(prev => {
          const next = new Set(prev);
          next.delete(post.id);
          return next;
        });
        const video = localVideoRef.current;
        if (video) {
          video.pause();
          video.currentTime = 0;
        }
      }}
    >
      <video
        ref={localVideoRef}
        onPlay={() => {
          const circle = localCircleRef.current;
          if (circle) circle.style.opacity = '1';
          if (localRafRef.current) cancelAnimationFrame(localRafRef.current);
          const video = localVideoRef.current;
          const updateProgress = () => {
            const circle = localCircleRef.current;
            if (circle && video && video.duration > 0) {
              const progress = video.currentTime / video.duration;
              circle.style.strokeDasharray = `${progress * circumference} ${circumference}`;
            }
            localRafRef.current = requestAnimationFrame(updateProgress);
          };
          localRafRef.current = requestAnimationFrame(updateProgress);
        }}
        onPause={() => {
          const circle = localCircleRef.current;
          if (circle) {
            circle.style.strokeDasharray = `0 ${circumference}`;
            circle.style.opacity = '0';
          }
          if (localRafRef.current) {
            cancelAnimationFrame(localRafRef.current);
            localRafRef.current = null;
          }
        }}
        onEnded={() => {
          const circle = localCircleRef.current;
          if (circle) {
            circle.style.strokeDasharray = `0 ${circumference}`;
            circle.style.opacity = '0';
          }
        }}
        src={getVideoSrc()}
        muted
        loop
        playsInline
        preload="none"
        className={`w-full h-full object-cover transition-all duration-300 ${
          isLoaded ? "opacity-70 group-hover:opacity-100 group-hover:scale-105" : "opacity-0"
        }`}
        onLoadedData={() => setImageLoadStates((prev) => ({ ...prev, [post.id]: true }))}
        onError={() => {
          if (errorCount >= 2) {
            setHiddenIds(s => new Set(s).add(post.id));
            return;
          }
          const delay = errorCount === 0 ? 100 : 300;
          setImageLoadStates((prev) => ({ ...prev, [post.id]: false }));
          setTimeout(() => {
            setImageErrors(prev => ({ ...prev, [post.id]: (prev[post.id] || 0) + 1 }));
          }, delay);
        }}
      />
      {isLoaded && (
        <div className="absolute top-[11px] right-3 pointer-events-none opacity-90 group-hover:opacity-100 transition-opacity duration-300">
          <svg className="w-7 h-7" viewBox="0 0 36 36">
            <circle
              ref={localCircleRef}
              cx="18"
              cy="18"
              r="12"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="0 75.4"
              transform="rotate(-90 18 18)"
              style={{ willChange: 'stroke-dasharray', opacity: 0 }}
            />
            <path d="M14 10v16l12-8z" fill="white" stroke="rgba(0,0,0,0.4)" strokeWidth="1" strokeLinejoin="round" />
          </svg>
        </div>
      )}
    </div>
  );
});

interface ImageCardProps {
  post: TelegramPost;
  isLoaded: boolean;
  errorCount: number;
  setImageLoadStates: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setImageErrors: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  setHiddenIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  buildSrc: (url: string, postId: string) => string;
}

const ImageCard = memo(({
  post,
  isLoaded,
  errorCount,
  setImageLoadStates,
  setImageErrors,
  setHiddenIds,
  buildSrc,
}: ImageCardProps) => {
  if (!post.media && !post.mediaItems?.length) return null;

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth === 0 || img.naturalHeight === 0) {
      handleError();
      return;
    }
    setImageLoadStates((prev) => ({ ...prev, [post.id]: true }));
  };

  const handleError = () => {
    if (errorCount >= 2) {
      setHiddenIds(s => new Set(s).add(post.id));
      return;
    }
    
    const delay = errorCount === 0 ? 100 : 300;
    setImageLoadStates((prev) => ({ ...prev, [post.id]: false }));
    
    setTimeout(() => {
      setImageErrors(prev => ({ ...prev, [post.id]: (prev[post.id] || 0) + 1 }));
    }, delay);
  };

  const getImageSrc = () => {
    const firstMedia = post.mediaItems?.[0];
    
    if (firstMedia) {
      if (errorCount === 0) {
        return firstMedia.url;
      } else if (firstMedia.previewUrl) {
        return firstMedia.previewUrl;
      }
      return firstMedia.url;
    }
    
    return buildSrc(post.media!, post.id);
  };

  return (
    <img
      key={`img-${post.id}-${errorCount}`}
      src={getImageSrc()}
      alt=""
      loading="eager"
      decoding="async"
      referrerPolicy="no-referrer"
      className={`w-full h-full object-cover transition-all duration-300 ${
        isLoaded ? "opacity-70 group-hover:opacity-100 group-hover:scale-105" : "opacity-0"
      }`}
      onLoad={handleLoad}
      onError={handleError}
    />
  );
});

interface ProfileBadgeProps {
  post: TelegramPost;
}

const ProfileBadge = memo(({ post }: ProfileBadgeProps) => {
  if (!post.profileData) return null;

  const nameParts = post.profileData.name.split(' ');
  const lastName = nameParts.pop() || '';
  const firstName = nameParts.join(' ');

  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/70 to-transparent transition-[background] duration-300 group-hover:from-black/95 group-hover:via-black/85 pointer-events-none opacity-100">
      <div className="text-white">
        <p className="mb-1 text-2xl font-bold drop-shadow-lg leading-snug">
          {firstName && <>{firstName} </>}
          <span className="inline-flex items-center gap-1 whitespace-nowrap">
            <span>{lastName}</span>
            <span className="text-[22px] font-normal ml-2 mt-[0.1rem]">
              {post.profileData.age}
            </span>
            <BadgeCheck className="w-5 h-5 text-[#0099FF] drop-shadow-lg" style={{ fill: '#0099FF', stroke: 'white', strokeWidth: 2 }} />
            {post.isHot && (
              <Flame 
                className="w-5 h-5 drop-shadow-lg" 
                style={{ fill: '#FF6B35', stroke: '#FF4500', strokeWidth: 1.5 }}
                data-testid={`badge-hot-${post.id}`}
              />
            )}
          </span>
        </p>
        <div className="flex flex-col gap-3 text-sm max-h-0 opacity-0 overflow-hidden group-hover:max-h-40 group-hover:opacity-100 transition-all duration-300">
          <p className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
            <span className="flex-1">{post.profileData.hometown}</span>
          </p>
          {(post.profileData.personality || post.profileData.relationship) && (
            <div className="flex flex-wrap gap-2">
              {post.profileData.personality && (
                <span className="bg-white/15 backdrop-blur-sm px-3 py-1 rounded-full text-[13px] font-medium shadow-sm">
                  {getPersonalityLabel(post.profileData.personality)}
                </span>
              )}
              {post.profileData.relationship && (
                <span className="bg-white/15 backdrop-blur-sm px-3 py-1 rounded-full text-[13px] font-medium shadow-sm">
                  {getRelationshipLabel(post.profileData.relationship)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
