import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useParams, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTelegram, openTelegramLinkAndClose } from "@/hooks/use-telegram";
import { openTelegramDirect } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, MessageCircle, BadgeCheck, MapPin, Briefcase, Globe, MessageSquare, Share2, Undo2, X, Heart, Flame, SlidersHorizontal } from "lucide-react";
import { getPersonalityLabel, getRelationshipLabel, getLanguageDisplay, getNationalityDisplay } from "@/lib/girlfriends/profile-formatter";
import { DiscoverFilterModal, type DiscoverFilters } from "@/components/DiscoverFilterModal";
import { LanguageModal } from "@/components/LanguageModal";
import { type SharedFilters } from "@/lib/filterStorage";
import { useFilters } from "@/contexts/FilterContext";

interface ProfileData {
  name: string;
  age: number;
  nationality: string;
  hometown: string;
  work: string;
  language?: string;
  personality?: string;
  relationship?: string;
  about?: string;
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

interface Post {
  id: string;
  text: string;
  date: string;
  link: string;
  media: string;
  mediaUrls?: MediaItem[] | null;
  mediaItems?: UnifiedMediaItem[] | null;
  avatar: string;
  botLink?: string;
  profileData?: ProfileData;
  isHot?: boolean;
  click_count?: number;
}

interface SkipHistoryEntry {
  profileId: string;
  timestamp: number;
}

const SKIP_HISTORY_KEY = 'nextwife_skip_history';
const NAV_FLAG_KEY = 'nextwife_navigating_skip';

const getSkipHistory = (): SkipHistoryEntry[] => {
  try {
    const stored = sessionStorage.getItem(SKIP_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveSkipHistory = (history: SkipHistoryEntry[]) => {
  try {
    sessionStorage.setItem(SKIP_HISTORY_KEY, JSON.stringify(history));
  } catch {}
};

const cardVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
    scale: 0.9,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

interface ProfileProps {
  isOverlay?: boolean;
}

const Profile = ({ isOverlay: propIsOverlay = false }: ProfileProps = {}) => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const isAppView = searchParams.get("view") === "app";
  
  const state = location.state as { backgroundLocation?: Location; isOverlay?: boolean } | null;
  const isOverlay = propIsOverlay || (state?.isOverlay && !isMobile);
  const backgroundLocation = state?.backgroundLocation;
  
  const { isTelegramApp, safeArea } = useTelegram(isAppView);
  
  const useTelegramSafeAreas = isAppView && isTelegramApp;
  
  const [post, setPost] = useState<Post | null>(null);
  const [nextId, setNextId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [skipHistory, setSkipHistory] = useState<SkipHistoryEntry[]>([]);
  const [direction, setDirection] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [activeAction, setActiveAction] = useState<'undo' | 'skip' | null>(null);
  const [showTelegramConfirm, setShowTelegramConfirm] = useState(false);
  const [aboutExpanded, setAboutExpanded] = useState(false);
  const [mediaIndex, setMediaIndex] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [tapFeedback, setTapFeedback] = useState<'left' | 'right' | null>(null);
  const [showPlayOverlay, setShowPlayOverlay] = useState(false);
  const { filters, setFilters, activeFilterCount } = useFilters();
  
  const actionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef = useRef<number | null>(null);
  const loadedMediaRef = useRef<Set<number>>(new Set());
  const mediaIndexRef = useRef(mediaIndex);
  
  const x = useMotionValue(0);
  const dragRotate = useTransform(x, [-300, 0, 300], [-15, 0, 15]);
  const dragOpacity = useTransform(x, [-200, -100, 0], [0.3, 0.6, 1]);
  const rightSwipeGlow = useTransform(x, [0, 30, 100, 200], [0, 0.15, 0.5, 0.8]);

  useEffect(() => {
    mediaIndexRef.current = mediaIndex;
  }, [mediaIndex]);

  useEffect(() => {
    if (!showPlayOverlay) return;
    const onInteraction = () => handleVideoPlay();
    const events = ['touchstart', 'pointerdown'] as const;
    events.forEach(e => document.addEventListener(e, onInteraction, { once: true, passive: true }));
    return () => events.forEach(e => document.removeEventListener(e, onInteraction));
  }, [showPlayOverlay, handleVideoPlay]);

  useEffect(() => {
    const isFromNav = sessionStorage.getItem(NAV_FLAG_KEY) === 'true';
    if (isFromNav) {
      sessionStorage.removeItem(NAV_FLAG_KEY);
      setSkipHistory(getSkipHistory());
    } else {
      sessionStorage.removeItem(SKIP_HISTORY_KEY);
      setSkipHistory([]);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (actionTimeoutRef.current) clearTimeout(actionTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    setShowPlayOverlay(false);
  }, [post?.id, mediaIndex]);

  const handleVideoPlay = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      video.play().then(() => {
        setShowPlayOverlay(false);
      }).catch(() => {
        setShowPlayOverlay(true);
      });
    }
  }, []);

  useEffect(() => {
    let videoPlayListener: (() => void) | null = null;
    let videoElement: HTMLVideoElement | null = null;
    
    // Cancel any existing RAF immediately on effect run
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    
    if (!post || !imageLoaded) {
      return () => {
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
      };
    }
    
    const mediaList = post.mediaUrls && post.mediaUrls.length > 0 ? post.mediaUrls : [{ type: 'photo' as const, url: post.media }];
    const currentMedia = mediaList[mediaIndex];
    const progressBar = progressRefs.current[mediaIndex];
    
    // Reset all progress bars to proper state when mediaIndex changes
    progressRefs.current.forEach((bar, idx) => {
      if (bar) {
        if (idx < mediaIndex) {
          // Past media: filled
          bar.style.transform = 'scaleX(1)';
        } else if (idx > mediaIndex) {
          // Future media: empty
          bar.style.transform = 'scaleX(0)';
        }
        // Current media handled below
      }
    });
    
    if (currentMedia?.type === 'video') {
      const video = videoRef.current;
      if (!video || !progressBar) {
        return () => {
          if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
          }
        };
      }
      
      // Restart video from beginning when navigating to it
      video.currentTime = 0;
      video.play().catch(() => {});
      
      videoElement = video;
      
      const updateVideoProgress = () => {
        if (video.duration > 0) {
          const percent = video.currentTime / video.duration;
          progressBar.style.transform = `scaleX(${percent})`;
        }
        rafRef.current = requestAnimationFrame(updateVideoProgress);
      };
      
      const startVideoLoop = () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        progressBar.style.transform = 'scaleX(0)';
        rafRef.current = requestAnimationFrame(updateVideoProgress);
      };
      
      videoPlayListener = startVideoLoop;
      video.addEventListener('play', startVideoLoop);
      
      if (!video.paused) {
        startVideoLoop();
      }
    } else {
      // Photos: just show filled progress bar (no auto-advance)
      if (progressBar) {
        progressBar.style.transform = 'scaleX(1)';
      }
    }
    
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (videoElement && videoPlayListener) {
        videoElement.removeEventListener('play', videoPlayListener);
      }
    };
  }, [mediaIndex, post?.id, imageLoaded, post]);

  const buildFilterQueryString = useCallback((overrideFilters?: SharedFilters) => {
    const f = overrideFilters || filters;
    const params = new URLSearchParams();
    params.append('channel', 'nextwife_ai');
    f.regions.forEach(r => params.append('region', r));
    f.ageBrackets.forEach(a => params.append('ageBracket', a));
    f.occupationCategories.forEach(o => params.append('occupationCategory', o));
    f.languages.forEach(l => params.append('language', l));
    f.hometowns.forEach(h => params.append('hometown', h));
    f.personalities.forEach(p => params.append('personality', p));
    f.relationships.forEach(r => params.append('relationship', r));
    if (f.hasVideo) params.append('hasVideo', 'true');
    if (f.hasMultipleMedia) params.append('hasMultipleMedia', 'true');
    return params.toString();
  }, [filters]);

  const handleFiltersChange = useCallback(async (newFilters: SharedFilters) => {
    setFilters(newFilters);
    
    try {
      const queryString = buildFilterQueryString(newFilters);
      const response = await fetch(`/api/tg-channel-feed?${queryString}&limit=1`);
      if (!response.ok) return;
      const data = await response.json();
      const firstPost = data.posts?.[0];
      if (firstPost && firstPost.id !== id) {
        setSkipHistory([]);
        sessionStorage.removeItem(SKIP_HISTORY_KEY);
        const viewParam = isAppView ? "?view=app" : "";
        navigate(`/profile/${firstPost.id}${viewParam}`, { 
          replace: true,
          state: isOverlay ? { backgroundLocation, isOverlay: true } : undefined
        });
      }
    } catch (error) {
      console.error("Failed to fetch filtered profile:", error);
    }
  }, [buildFilterQueryString, id, isAppView, navigate, isOverlay, backgroundLocation]);

  const prevIdRef = useRef<string | undefined>(undefined);
  
  useEffect(() => {
    if (!id) return;
    
    const isNewProfile = prevIdRef.current !== id;
    prevIdRef.current = id;
    
    const fetchProfile = async () => {
      if (isNewProfile) {
        setLoading(true);
        setImageLoaded(false);
        setAboutExpanded(false);
        setMediaIndex(0);
        setTapFeedback(null);
        loadedMediaRef.current = new Set();
      }
      
      try {
        const queryString = buildFilterQueryString();
        const response = await fetch(`/api/tg-profile/${id}?${queryString}`);
        if (!response.ok) throw new Error('Profile not found');
        const data = await response.json();
        setPost(data.post || null);
        setNextId(data.nextId || null);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        setPost(null);
        setNextId(null);
      } finally {
        if (isNewProfile) {
          setLoading(false);
        }
        setIsAnimating(false);
      }
    };
    
    fetchProfile();
  }, [id, buildFilterQueryString]);

  const goBack = useCallback(() => {
    if (id) {
      sessionStorage.setItem('nextwife_last_viewed', id);
    }
    sessionStorage.removeItem(SKIP_HISTORY_KEY);
    sessionStorage.removeItem(NAV_FLAG_KEY);
    
    if (isOverlay) {
      navigate(-1);
    } else {
      navigate("/", { state: { restoreScroll: true } });
    }
  }, [navigate, id, isOverlay]);

  const trackConversion = useCallback(async (postId: string) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      await fetch(`${apiUrl}/api/tg-post-click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      });
    } catch (err) {
      console.error('Failed to track conversion:', err);
    }
  }, []);

  const handleOpenTelegram = useCallback(() => {
    // In Telegram Mini App (detected via SDK), skip popup and go directly to Telegram
    if (isTelegramApp) {
      const url = post?.botLink || post?.link;
      if (url) {
        if (post?.id) {
          trackConversion(post.id);
        }
        openTelegramLinkAndClose(url);
      }
    } else {
      setShowTelegramConfirm(true);
    }
  }, [isTelegramApp, post, trackConversion]);

  const confirmOpenTelegram = useCallback(() => {
    const url = post?.botLink || post?.link;
    if (url) {
      // Track conversion when user clicks to meet on Telegram
      if (post?.id) {
        trackConversion(post.id);
      }
      if (isTelegramApp) {
        openTelegramLinkAndClose(url);
      } else {
        openTelegramDirect(url);
      }
    }
    setShowTelegramConfirm(false);
  }, [post, isTelegramApp, trackConversion]);

  const undoSkip = useCallback(() => {
    if (skipHistory.length === 0 || isAnimating) return;
    
    const newHistory = [...skipHistory];
    const lastSkipped = newHistory.pop();
    if (!lastSkipped) return;
    
    setSkipHistory(newHistory);
    saveSkipHistory(newHistory);
    sessionStorage.setItem(NAV_FLAG_KEY, 'true');
    setDirection(1);
    setIsAnimating(true);
    
    const viewParam = isAppView ? "?view=app" : "";
    navigate(`/profile/${lastSkipped.profileId}${viewParam}`, { 
      replace: true,
      state: isOverlay ? { backgroundLocation, isOverlay: true } : undefined
    });
  }, [skipHistory, navigate, isAnimating, isAppView, isOverlay, backgroundLocation]);

  const skipProfile = useCallback(() => {
    if (!id || !nextId || isAnimating) return;
    
    const newHistory = [...skipHistory, { profileId: id, timestamp: Date.now() }];
    setSkipHistory(newHistory);
    saveSkipHistory(newHistory);
    sessionStorage.setItem(NAV_FLAG_KEY, 'true');
    setDirection(-1);
    setIsAnimating(true);
    
    const viewParam = isAppView ? "?view=app" : "";
    navigate(`/profile/${nextId}${viewParam}`, { 
      replace: true,
      state: isOverlay ? { backgroundLocation, isOverlay: true } : undefined
    });
  }, [id, nextId, skipHistory, navigate, isAnimating, isAppView, isOverlay, backgroundLocation]);

  const flashAction = useCallback((action: 'undo' | 'skip') => {
    if (actionTimeoutRef.current) clearTimeout(actionTimeoutRef.current);
    setActiveAction(action);
    actionTimeoutRef.current = setTimeout(() => setActiveAction(null), 150);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showTelegramConfirm) {
        if (e.key === "Escape") {
          setShowTelegramConfirm(false);
        }
        return;
      }
      
      if (e.key === "Escape" && !isAppView) {
        goBack();
      } else if (e.key === "ArrowLeft" && skipHistory.length > 0) {
        flashAction('undo');
        undoSkip();
      } else if (e.key === "ArrowRight" && nextId) {
        flashAction('skip');
        skipProfile();
      } else if (e.key === " ") {
        e.preventDefault();
        handleOpenTelegram();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goBack, undoSkip, skipProfile, handleOpenTelegram, flashAction, skipHistory.length, nextId, showTelegramConfirm, isAppView]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { offset, velocity } = info;
    
    if ((offset.x < -100 || velocity.x < -500) && nextId) {
      skipProfile();
    } else if (offset.x > 100 || velocity.x > 500) {
      handleOpenTelegram();
    }
    x.set(0);
  };

  const handleShare = async () => {
    const url = window.location.href;
    const title = t('profile.share.title', { name: post?.profileData?.name });
    const text = t('profile.share.text', { 
      name: post?.profileData?.name, 
      age: post?.profileData?.age, 
      hometown: post?.profileData?.hometown 
    });
    
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      await navigator.clipboard.writeText(url);
    }
  };

  if (loading && !post) {
    return (
      <div className="bg-black flex items-center justify-center" style={{ minHeight: '100svh' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500" />
      </div>
    );
  }

  if (!post?.profileData) {
    return (
      <div className="bg-black flex flex-col items-center justify-center" style={{ minHeight: '100svh' }}>
        <h1 className="text-2xl font-bold mb-4 text-white">{t('profile.profileNotFound')}</h1>
        {isAppView ? (
          <Button 
            onClick={() => navigate("/find?view=app", { replace: true })} 
            className="bg-gradient-to-r from-orange-500 to-rose-500 text-white border-0"
          >
            {t('profile.findSomeoneNew')}
          </Button>
        ) : (
          <Button onClick={() => navigate("/")} variant="outline" className="text-white border-white/30">
            {t('common.backToHome')}
          </Button>
        )}
      </div>
    );
  }

  const { profileData } = post;
  const canUndo = skipHistory.length > 0;
  const canSkip = !!nextId;

  return (
    <div 
      className="flex flex-col bg-black overflow-x-hidden" 
      style={{ minHeight: '100svh' }}
      onClick={!isMobile && !isAppView ? goBack : undefined}
    >
      <div 
        className="flex-1 flex flex-col max-w-lg mx-auto w-full min-h-0 cursor-default py-2 px-2"
        style={{ 
          paddingBottom: useTelegramSafeAreas 
            ? `max(0.5rem, ${safeArea.bottom}px)` 
            : 'max(0.5rem, env(safe-area-inset-bottom))',
          paddingTop: useTelegramSafeAreas ? `${safeArea.top}px` : undefined
        }}
        onClick={!isMobile ? (e) => e.stopPropagation() : undefined}
      >
        <AnimatePresence mode="popLayout" custom={direction} onExitComplete={() => x.set(0)}>
          <motion.article
            key={post.id}
            custom={direction}
            variants={cardVariants}
            initial="enter"
            animate="center"
            exit="exit"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.9}
            onDragStart={() => setIsDragging(true)}
            onDrag={(_, info) => { setDragOffset(info.offset.x); x.set(info.offset.x); }}
            onDragEnd={(e, info) => { setIsDragging(false); setDragOffset(0); handleDragEnd(e, info); }}
            className="flex-1 relative overflow-hidden rounded-2xl border border-white/10 select-none w-full"
            style={{ 
              transformOrigin: 'center center',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 40px rgba(198, 58, 75, 0.3), 0 0 60px rgba(232, 115, 85, 0.15)',
              rotate: isDragging ? dragRotate : 0,
              opacity: isDragging ? dragOpacity : 1,
            }}
          >
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500" />
              </div>
            )}
            
            {/* Warm sunset glow overlay for right swipe (like) - covers entire card */}
            <motion.div 
              className="absolute inset-0 pointer-events-none z-[50]"
              style={{ 
                background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.5) 0%, rgba(255, 154, 139, 0.4) 30%, rgba(255, 87, 87, 0.35) 60%, rgba(255, 69, 0, 0.25) 100%)',
                opacity: rightSwipeGlow,
              }}
            />
            
            {(() => {
              const mediaList = post.mediaItems && post.mediaItems.length > 0 
                ? post.mediaItems 
                : post.mediaUrls && post.mediaUrls.length > 0 
                  ? post.mediaUrls.map(m => ({ type: m.type, url: `/api/tg-image-proxy?u=${encodeURIComponent(m.url)}`, previewUrl: null, quality: 'preview' as const }))
                  : [{ type: 'photo' as const, url: `/api/tg-image-proxy?u=${encodeURIComponent(post.media)}`, previewUrl: null, quality: 'preview' as const }];
              const currentMedia = mediaList[mediaIndex] || mediaList[0];
              const hasMultipleMedia = mediaList.length > 1;
              
              return (
                <>
                  {/* Render all media items but only show the current one */}
                  {mediaList.map((media, idx) => (
                    media.type === 'video' ? (
                      <video
                        key={`video-${idx}`}
                        ref={idx === mediaIndex ? videoRef : undefined}
                        src={media.url}
                        className={`absolute inset-0 w-full h-full object-cover ${
                          idx === mediaIndex ? (imageLoaded ? 'opacity-100' : 'opacity-0') : 'hidden'
                        }`}
                        style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                        onLoadedMetadata={() => {
                          loadedMediaRef.current.add(idx);
                          if (idx === mediaIndexRef.current) setImageLoaded(true);
                        }}
                        onCanPlay={(e) => {
                          if (idx === mediaIndexRef.current) {
                            const video = e.currentTarget;
                            video.play().catch(() => setShowPlayOverlay(true));
                          }
                        }}
                        onError={() => {
                          if (idx === mediaIndexRef.current) setImageLoaded(true);
                        }}
                        muted
                        loop
                        autoPlay={idx === mediaIndex}
                        playsInline
                        controls={false}
                        preload="auto"
                      />
                    ) : (
                      <img
                        key={`img-${idx}`}
                        src={media.url}
                        alt={profileData.name}
                        className={`absolute inset-0 w-full h-full object-cover ${
                          idx === mediaIndex ? (imageLoaded ? 'opacity-100' : 'opacity-0') : 'hidden'
                        }`}
                        onLoad={() => {
                          loadedMediaRef.current.add(idx);
                          if (idx === mediaIndexRef.current) setImageLoaded(true);
                        }}
                        onError={(e) => {
                          if (media.previewUrl && (e.target as HTMLImageElement).src !== media.previewUrl) {
                            (e.target as HTMLImageElement).src = media.previewUrl;
                          } else {
                            if (idx === mediaIndexRef.current) setImageLoaded(true);
                          }
                        }}
                        draggable={false}
                      />
                    )
                  ))}
                  
                  {/* Tap to play overlay for Safari */}
                  {showPlayOverlay && currentMedia?.type === 'video' && (
                    <div 
                      className="absolute inset-0 z-20 flex items-center justify-center bg-black/30 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVideoPlay();
                      }}
                      data-testid="video-play-overlay"
                    >
                      <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                        <svg className="w-8 h-8 text-black ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                    </div>
                  )}
                  
                  {/* Navigation tap zones - only for multiple media */}
                  {hasMultipleMedia && (
                    <>
                      <motion.div 
                        className="absolute left-0 top-0 w-1/2 h-2/3 z-10 cursor-pointer select-none"
                        style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
                        onTapStart={() => setTapFeedback('left')}
                        onTap={(e) => { 
                          e.stopPropagation(); 
                          setTapFeedback(null);
                          if (mediaIndex > 0) {
                            const nextIdx = mediaIndex - 1;
                            if (!loadedMediaRef.current.has(nextIdx)) {
                              setImageLoaded(false);
                            }
                            setMediaIndex(nextIdx);
                          }
                        }}
                        onTapCancel={() => setTapFeedback(null)}
                        data-testid="media-prev"
                      />
                      <motion.div 
                        className="absolute right-0 top-0 w-1/2 h-2/3 z-10 cursor-pointer select-none"
                        style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
                        onTapStart={() => setTapFeedback('right')}
                        onTap={(e) => { 
                          e.stopPropagation(); 
                          setTapFeedback(null);
                          if (mediaIndex < mediaList.length - 1) {
                            const nextIdx = mediaIndex + 1;
                            if (!loadedMediaRef.current.has(nextIdx)) {
                              setImageLoaded(false);
                            }
                            setMediaIndex(nextIdx);
                          }
                        }}
                        onTapCancel={() => setTapFeedback(null)}
                        data-testid="media-next"
                      />
                    </>
                  )}
                  
                  
                  {/* Tap feedback overlays */}
                  <AnimatePresence>
                    {tapFeedback === 'left' && (
                      <motion.div
                        key="tap-left"
                        className="absolute left-0 top-0 w-1/3 h-full pointer-events-none z-5 rounded-l-2xl"
                        style={{
                          background: 'linear-gradient(to right, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 100%)'
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, transition: { duration: 0.05, ease: 'easeOut' } }}
                        exit={{ opacity: 0, transition: { duration: 0.05, ease: 'easeOut' } }}
                      />
                    )}
                    {tapFeedback === 'right' && (
                      <motion.div
                        key="tap-right"
                        className="absolute right-0 top-0 w-1/3 h-full pointer-events-none z-5 rounded-r-2xl"
                        style={{
                          background: 'linear-gradient(to left, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 100%)'
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, transition: { duration: 0.05, ease: 'easeOut' } }}
                        exit={{ opacity: 0, transition: { duration: 0.05, ease: 'easeOut' } }}
                      />
                    )}
                  </AnimatePresence>
                  
                  {/* Progress bar - always show for all profiles */}
                  <div className="absolute top-1 left-2 right-2 z-30 flex gap-1 pointer-events-none">
                    {mediaList.map((media, idx) => (
                      <div 
                        key={idx}
                        className="flex-1 h-1 rounded-sm bg-white/30 overflow-hidden"
                      >
                        {idx < mediaIndex ? (
                          // Past segments - fully filled
                          <div className="h-full bg-white/90 w-full" />
                        ) : idx === mediaIndex ? (
                          // Current segment - for photos show filled, for videos animate
                          media.type === 'photo' ? (
                            <div className="h-full bg-white/90 w-full" />
                          ) : (
                            <div 
                              ref={el => progressRefs.current[idx] = el}
                              className="h-full bg-white/90 origin-left will-change-transform"
                              style={{ transform: 'scaleX(0)' }}
                            />
                          )
                        ) : null}
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}

            <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center pointer-events-none">
              {!isAppView ? (
                <button
                  onClick={(e) => { e.stopPropagation(); goBack(); }}
                  onPointerDownCapture={(e) => e.stopPropagation()}
                  className="text-white p-2 transition-all hover:scale-110 pointer-events-auto [filter:drop-shadow(0_0_2px_rgba(0,0,0,0.5))_drop-shadow(0_0_3px_rgba(0,0,0,0.3))_drop-shadow(0_2px_4px_rgba(0,0,0,0.25))]"
                  data-testid="button-back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              ) : (
                <div />
              )}
              <div 
                className="flex items-center gap-2 pointer-events-auto"
                onPointerDownCapture={(e) => e.stopPropagation()} 
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setShowFilters(true)}
                  className={`relative p-2 transition-all hover:scale-110 [filter:drop-shadow(0_0_2px_rgba(0,0,0,0.5))_drop-shadow(0_0_3px_rgba(0,0,0,0.3))_drop-shadow(0_2px_4px_rgba(0,0,0,0.25))] ${
                    activeFilterCount > 0 
                      ? 'text-orange-400' 
                      : 'text-white'
                  }`}
                  data-testid="open-profile-filters"
                >
                  <SlidersHorizontal className="w-5 h-5" />
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1 -right-0.5 min-w-[16px] h-[16px] rounded-full bg-gradient-to-r from-orange-500 to-rose-500 text-white text-[10px] font-bold flex items-center justify-center px-1 shadow-lg">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setShowLanguageModal(true)}
                  className="p-2 text-white transition-all hover:scale-110 [filter:drop-shadow(0_0_2px_rgba(0,0,0,0.5))_drop-shadow(0_0_3px_rgba(0,0,0,0.3))_drop-shadow(0_2px_4px_rgba(0,0,0,0.25))]"
                  data-testid="open-language-modal"
                >
                  <Globe className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleShare()}
                  className="p-2 text-white transition-all hover:scale-110 [filter:drop-shadow(0_0_2px_rgba(0,0,0,0.5))_drop-shadow(0_0_3px_rgba(0,0,0,0.3))_drop-shadow(0_2px_4px_rgba(0,0,0,0.25))]"
                  data-testid="button-share"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className={`absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black via-black/90 to-transparent flex flex-col pointer-events-none transition-all duration-300 ${aboutExpanded ? 'max-h-full' : 'max-h-[65%]'}`}>
              <div className="h-16 flex-shrink-0" />
              <div ref={contentContainerRef} className="flex-1 overflow-y-auto min-h-0 pointer-events-auto">
                <div className="px-4 pb-2">
                  <div 
                    className="cursor-pointer"
                    onClick={() => {
                      const newExpanded = !aboutExpanded;
                      setAboutExpanded(newExpanded);
                      if (newExpanded && contentContainerRef.current) {
                        setTimeout(() => {
                          contentContainerRef.current?.scrollTo({ top: contentContainerRef.current.scrollHeight, behavior: 'smooth' });
                        }, 50);
                      }
                    }}
                    data-testid="profile-info-toggle"
                  >
                    <h1 className="text-[1.75rem] font-bold text-white drop-shadow-lg mb-1 leading-snug">
                      {(() => {
                        const nameParts = profileData.name.split(' ');
                        const lastName = nameParts.pop() || '';
                        const firstName = nameParts.join(' ');
                        return (
                          <>
                            {firstName && <span>{firstName} </span>}
                            <span className="inline-flex items-center gap-[5px] whitespace-nowrap">
                              <span>{lastName}</span>
                              <span className="text-[1.5rem] font-normal text-white ml-[6px] mt-[0.1rem]">
                                {profileData.age}
                              </span>
                              <BadgeCheck 
                                className="w-[23px] h-[23px] text-[#0099FF] drop-shadow-lg flex-shrink-0" 
                                style={{ fill: '#0099FF', stroke: 'white', strokeWidth: 2 }} 
                              />
                              {post.isHot && (
                                <Flame 
                                  className="w-[23px] h-[23px] drop-shadow-lg flex-shrink-0" 
                                  style={{ fill: '#FF6B35', stroke: '#FF4500', strokeWidth: 1.5 }}
                                />
                              )}
                            </span>
                          </>
                        );
                      })()}
                    </h1>

                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3 text-white">
                        <MapPin className="w-4 h-4 text-rose-400 flex-shrink-0" />
                        <span className="text-sm">{profileData.hometown?.replace(/\.$/, '')}</span>
                      </div>
                      {(profileData.relationship || profileData.personality) && (
                        <div className="flex flex-wrap gap-2">
                          {profileData.personality && (
                            <span className="bg-white/15 backdrop-blur-sm px-3 py-1 rounded-full text-[13px] font-medium text-white shadow-sm">
                              {getPersonalityLabel(profileData.personality)}
                            </span>
                          )}
                          {profileData.relationship && (
                            <span className="bg-white/15 backdrop-blur-sm px-3 py-1 rounded-full text-[13px] font-medium text-white shadow-sm">
                              {getRelationshipLabel(profileData.relationship)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div 
                      className="pt-2 mt-2 border-t border-white/[0.08] cursor-pointer"
                      onClick={() => {
                        const newExpanded = !aboutExpanded;
                        setAboutExpanded(newExpanded);
                        if (newExpanded && contentContainerRef.current) {
                          setTimeout(() => {
                            contentContainerRef.current?.scrollTo({ top: contentContainerRef.current.scrollHeight, behavior: 'smooth' });
                          }, 50);
                        }
                      }}
                      data-testid="button-about-me-toggle"
                    >
                      <div className="flex items-start gap-3">
                        {/* Sunset Gradient Button */}
                        <div 
                          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
                            aboutExpanded
                              ? 'text-white shadow-lg shadow-rose-500/50'
                              : 'text-white/80 shadow-md shadow-rose-400/30'
                          }`}
                          style={{ 
                            background: aboutExpanded ? 'var(--gradient-sunset-80)' : 'var(--gradient-sunset-60)',
                            transition: 'background 100ms ease-in-out'
                          }}
                        >
                          <span className="text-3xl leading-none font-light">
                            {aboutExpanded ? '−' : '+'}
                          </span>
                        </div>
                        <AnimatePresence initial={false}>
                          {aboutExpanded && (
                            <motion.div 
                              className="flex-1 overflow-hidden"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.1, ease: 'easeInOut' }}
                            >
                              <div className="space-y-2">
                                <div className="flex items-center gap-3 text-white">
                                  <Briefcase className="w-4 h-4 text-orange-400 flex-shrink-0" />
                                  <span className="text-sm">{profileData.work?.replace(/\.$/, '')}</span>
                                </div>
                                <div className="flex items-center gap-3 text-white">
                                  <Globe className="w-4 h-4 text-pink-400 flex-shrink-0" />
                                  <span className="text-sm">{getNationalityDisplay(profileData.nationality)}</span>
                                </div>
                                <div className="flex items-center gap-3 text-white">
                                  <MessageSquare className="w-4 h-4 text-amber-400 flex-shrink-0" />
                                  <span className="text-sm">{getLanguageDisplay(profileData.language)?.replace(/\.$/, '')}</span>
                                </div>

                                {profileData.about && (
                                  <div className="pt-2 mt-2 border-t border-white/[0.08]">
                                    <span className="text-xs font-medium text-white/50 uppercase tracking-wide block mb-2">
                                      {t('profile.aboutMe')}
                                    </span>
                                    <p className="text-[15px] text-white/80 leading-relaxed">
                                      {profileData.about}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                </div>
              </div>
              
              <div 
                className="flex-shrink-0 relative flex items-center justify-center pt-3 pb-2 px-4 border-t border-white/[0.08] bg-black/80 pointer-events-auto"
                style={{ paddingBottom: useTelegramSafeAreas ? `max(8px, ${safeArea.bottom}px)` : '8px' }}
              >
                {canUndo && (
                  <button
                    onClick={undoSkip}
                    onPointerDownCapture={(e) => e.stopPropagation()}
                    disabled={isAnimating}
                    className={`absolute left-1/2 -translate-x-[140px] w-12 h-12 rounded-full backdrop-blur-sm border-[3px] flex items-center justify-center transition-all shadow-xl ${
                      activeAction === 'undo'
                        ? 'bg-amber-400/30 border-amber-400 text-amber-400 scale-110 shadow-amber-400/40'
                        : 'bg-white/10 border-amber-400 text-amber-400 hover:bg-amber-400/20 hover:scale-110 shadow-amber-400/20'
                    }`}
                    data-testid="button-action-undo"
                  >
                    <Undo2 className="w-6 h-6" />
                  </button>
                )}

                <div className="flex items-center gap-4">
                  <button
                    onClick={skipProfile}
                    onPointerDownCapture={(e) => e.stopPropagation()}
                    disabled={!canSkip || isAnimating}
                    className={`w-16 h-16 rounded-full backdrop-blur-sm border-[3px] flex items-center justify-center transition-all shadow-xl ${
                      (isDragging && dragOffset < -30 && canSkip) || activeAction === 'skip'
                        ? 'bg-rose-500/30 border-rose-500 text-rose-500 scale-110 shadow-rose-500/40'
                        : 'bg-white/10 border-rose-500 text-rose-500 hover:bg-rose-500/20 hover:scale-110 shadow-rose-500/20'
                    }`}
                    data-testid="button-action-skip"
                  >
                    <X className="w-9 h-9 stroke-[3]" />
                  </button>

                  <button
                    onClick={handleOpenTelegram}
                    onPointerDownCapture={(e) => e.stopPropagation()}
                    className={`w-16 h-16 rounded-full flex items-center justify-center text-white transition-all shadow-xl border-[3px] ${
                      isDragging && dragOffset > 30
                        ? 'scale-110 shadow-2xl shadow-rose-500/50 border-white/50'
                        : 'hover:scale-110 hover:shadow-2xl hover:shadow-rose-500/50 shadow-rose-500/30 border-white/30'
                    }`}
                    style={{ background: 'var(--gradient-sunset)' }}
                    data-testid="button-message-telegram"
                  >
                    <Heart className="w-9 h-9" />
                  </button>
                </div>
              </div>
            </div>
          </motion.article>
        </AnimatePresence>
      </div>
      
      <div className="hidden md:flex fixed bottom-4 right-4 items-center gap-3 text-white/40 text-xs bg-black/40 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10">
        <div className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white/60 font-mono">←</kbd>
          <span>{t('profile.keyboardHints.back')}</span>
        </div>
        <div className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white/60 font-mono">→</kbd>
          <span>{t('profile.keyboardHints.skip')}</span>
        </div>
        <div className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white/60 font-mono">Space</kbd>
          <span>{t('profile.keyboardHints.meet')}</span>
        </div>
      </div>

      <Dialog open={showTelegramConfirm} onOpenChange={setShowTelegramConfirm}>
        <DialogContent className="bg-black/95 border-white/10 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">
              {t('profile.readyToMeet', { name: post?.profileData?.name })}
            </DialogTitle>
            <DialogDescription className="text-white/70 text-center">
              {t('profile.waitingForYou')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button 
              onClick={confirmOpenTelegram}
              className="bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 text-white hover:brightness-110 border-0 w-full sm:w-auto"
            >
              <Heart className="w-4 h-4 mr-2" />
              {t('profile.meetOnTelegram')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DiscoverFilterModal
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        channel="nextwife_ai"
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      <LanguageModal
        isOpen={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
      />
    </div>
  );
};

export default Profile;
