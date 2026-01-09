import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTelegram } from "@/hooks/use-telegram";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, MessageCircle, BadgeCheck, MapPin, Briefcase, Globe, MessageSquare, Share2, Undo2, X, Heart } from "lucide-react";
import { getPersonalityLabel, getRelationshipLabel, getLanguageDisplay } from "@/lib/girlfriends/profile-formatter";

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

interface Post {
  id: string;
  text: string;
  date: string;
  link: string;
  media: string;
  mediaUrls?: MediaItem[] | null;
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

const Profile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const isAppView = searchParams.get("view") === "app";
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
  
  const isFirstLoad = useRef(true);
  const actionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const x = useMotionValue(0);
  const dragRotate = useTransform(x, [-300, 0, 300], [-15, 0, 15]);
  const dragOpacity = useTransform(x, [-200, -100, 0, 100, 200], [0.3, 0.6, 1, 0.6, 0.3]);

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
    if (!id) return;
    
    const fetchProfile = async () => {
      setLoading(true);
      setImageLoaded(false);
      setAboutExpanded(false);
      setMediaIndex(0);
      
      try {
        const response = await fetch(`/api/tg-profile/${id}?channel=nextwife_ai`);
        if (!response.ok) throw new Error('Profile not found');
        const data = await response.json();
        setPost(data.post || null);
        setNextId(data.nextId || null);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        setPost(null);
        setNextId(null);
      } finally {
        setLoading(false);
        setIsAnimating(false);
        isFirstLoad.current = false;
      }
    };
    
    fetchProfile();
  }, [id]);

  const goBack = useCallback(() => {
    if (id) {
      sessionStorage.setItem('nextwife_last_viewed', id);
    }
    // Save current history so it can be restored when re-entering
    saveSkipHistory(skipHistory);
    sessionStorage.setItem(NAV_FLAG_KEY, 'true');
    navigate("/", { state: { restoreScroll: true } });
  }, [navigate, id, skipHistory]);

  const openTelegram = useCallback(() => {
    setShowTelegramConfirm(true);
  }, []);

  const confirmOpenTelegram = useCallback(() => {
    const url = post?.botLink || post?.link;
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
    setShowTelegramConfirm(false);
  }, [post]);

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
    navigate(`/profile/${lastSkipped.profileId}${viewParam}`, { replace: true });
  }, [skipHistory, navigate, isAnimating, isAppView]);

  const skipProfile = useCallback(() => {
    if (!id || !nextId || isAnimating) return;
    
    const newHistory = [...skipHistory, { profileId: id, timestamp: Date.now() }];
    setSkipHistory(newHistory);
    saveSkipHistory(newHistory);
    sessionStorage.setItem(NAV_FLAG_KEY, 'true');
    setDirection(-1);
    setIsAnimating(true);
    const viewParam = isAppView ? "?view=app" : "";
    navigate(`/profile/${nextId}${viewParam}`, { replace: true });
  }, [id, nextId, skipHistory, navigate, isAnimating, isAppView]);

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
        openTelegram();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goBack, undoSkip, skipProfile, openTelegram, flashAction, skipHistory.length, nextId, showTelegramConfirm, isAppView]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { offset, velocity } = info;
    
    if ((offset.x < -100 || velocity.x < -500) && nextId) {
      skipProfile();
    } else if (offset.x > 100 || velocity.x > 500) {
      openTelegram();
    }
    x.set(0);
  };

  const handleShare = async () => {
    const url = window.location.href;
    const title = `Meet ${post?.profileData?.name} on Next Wife`;
    const text = `Check out ${post?.profileData?.name}, ${post?.profileData?.age} from ${post?.profileData?.hometown}`;
    
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

  if (loading && isFirstLoad.current) {
    return (
      <div className="bg-black flex items-center justify-center" style={{ minHeight: '100svh' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500" />
      </div>
    );
  }

  if (!post?.profileData) {
    return (
      <div className="bg-black flex flex-col items-center justify-center" style={{ minHeight: '100svh' }}>
        <h1 className="text-2xl font-bold mb-4 text-white">Profile not found</h1>
        {isAppView ? (
          <Button 
            onClick={() => navigate("/discover?view=app", { replace: true })} 
            className="bg-gradient-to-r from-orange-500 to-rose-500 text-white border-0"
          >
            Find Someone New
          </Button>
        ) : (
          <Button onClick={() => navigate("/")} variant="outline" className="text-white border-white/30">
            Back to Home
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
            {(() => {
              const mediaList = post.mediaUrls && post.mediaUrls.length > 0 ? post.mediaUrls : [{ type: 'photo' as const, url: post.media }];
              const currentMedia = mediaList[mediaIndex] || mediaList[0];
              const hasMultipleMedia = mediaList.length > 1;
              
              return (
                <>
                  {currentMedia.type === 'video' ? (
                    <video
                      src={currentMedia.url}
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                      onLoadedMetadata={() => setImageLoaded(true)}
                      onError={() => setImageLoaded(true)}
                      autoPlay
                      loop
                      muted
                      playsInline
                      controls={false}
                    />
                  ) : (
                    <img
                      src={`/api/tg-image-proxy?u=${encodeURIComponent(currentMedia.url)}`}
                      alt={profileData.name}
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                      onLoad={() => setImageLoaded(true)}
                      onError={() => setImageLoaded(true)}
                      draggable={false}
                    />
                  )}
                  
                  {hasMultipleMedia && (
                    <>
                      <div 
                        className="absolute left-0 top-0 w-1/3 h-2/3 z-10 cursor-pointer"
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          if (mediaIndex > 0) {
                            setImageLoaded(false);
                            setMediaIndex(prev => prev - 1);
                          }
                        }}
                        onPointerDownCapture={(e) => e.stopPropagation()}
                        data-testid="media-prev"
                      />
                      <div 
                        className="absolute right-0 top-0 w-1/3 h-2/3 z-10 cursor-pointer"
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          if (mediaIndex < mediaList.length - 1) {
                            setImageLoaded(false);
                            setMediaIndex(prev => prev + 1);
                          }
                        }}
                        onPointerDownCapture={(e) => e.stopPropagation()}
                        data-testid="media-next"
                      />
                      
                      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 pointer-events-none">
                        {mediaList.map((_, idx) => (
                          <div 
                            key={idx}
                            className={`h-1 rounded-full transition-all duration-200 ${
                              idx === mediaIndex 
                                ? 'w-6 bg-white' 
                                : 'w-1.5 bg-white/50'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              );
            })()}

            <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center pointer-events-none">
              {!isAppView ? (
                <button
                  onClick={(e) => { e.stopPropagation(); goBack(); }}
                  onPointerDownCapture={(e) => e.stopPropagation()}
                  className="bg-black/50 backdrop-blur-md text-white p-2.5 rounded-full hover:bg-black/70 transition-all shadow-lg hover:scale-105 pointer-events-auto"
                  data-testid="button-back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              ) : (
                <div />
              )}
              <button
                onClick={(e) => { e.stopPropagation(); handleShare(); }}
                onPointerDownCapture={(e) => e.stopPropagation()}
                className="bg-black/50 backdrop-blur-md text-white p-2.5 rounded-full hover:bg-black/70 transition-all shadow-lg hover:scale-105 pointer-events-auto"
                data-testid="button-share"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>

            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/90 to-transparent max-h-[60%] overflow-y-auto">
              <div className="px-4 pt-16 pb-4">
                {post.isHot && (
                  <div className="inline-flex items-center gap-1 bg-gradient-to-r from-orange-500 to-rose-500 text-white px-2.5 py-1 rounded-full text-sm font-bold shadow-lg mb-2">
                    <span>🔥</span>
                    <span className="text-xs font-semibold">Hot</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2 mb-3">
                  <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
                    {profileData.name}
                  </h1>
                  <span className="text-xl md:text-2xl font-semibold text-white/90">
                    {profileData.age}
                  </span>
                  <BadgeCheck 
                    className="w-6 h-6 md:w-7 md:h-7 text-[#0099FF] drop-shadow-lg flex-shrink-0" 
                    style={{ fill: '#0099FF', stroke: 'white', strokeWidth: 2 }} 
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-white/90">
                    <Briefcase className="w-4 h-4 text-orange-400 flex-shrink-0" />
                    <span className="text-sm truncate md:whitespace-normal md:line-clamp-2">{profileData.work?.replace(/\.$/, '')}</span>
                  </div>
                  <div className="flex items-center gap-3 text-white/90">
                    <MapPin className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    <span className="text-sm">{profileData.hometown?.replace(/\.$/, '')}</span>
                  </div>
                  <div className="flex items-center gap-3 text-white/90">
                    <Globe className="w-4 h-4 text-pink-400 flex-shrink-0" />
                    <span className="text-sm">{profileData.nationality?.replace(/\.$/, '')}</span>
                  </div>
                  <div className="flex items-center gap-3 text-white/90">
                    <MessageSquare className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span className="text-sm">{getLanguageDisplay(profileData.language)?.replace(/\.$/, '')}</span>
                  </div>

                  {(profileData.relationship || profileData.personality) && (
                    <div className="pt-2 mt-2 border-t border-white/[0.08]">
                      <div className="flex flex-wrap gap-2">
                        {profileData.relationship && (
                          <span className="bg-white/15 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium shadow-sm">
                            {getRelationshipLabel(profileData.relationship)}
                          </span>
                        )}
                        {profileData.personality && (
                          <span className="bg-white/15 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium shadow-sm">
                            {getPersonalityLabel(profileData.personality)}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {profileData.about && (
                    <div 
                      className="pt-2 mt-2 border-t border-white/[0.08] cursor-pointer"
                      onClick={() => setAboutExpanded(!aboutExpanded)}
                      data-testid="button-about-me-toggle"
                    >
                      <p className={`flex items-center gap-1 text-xs font-medium text-white/50 uppercase tracking-wide ${aboutExpanded ? 'mb-2' : ''}`}>
                        About Me
                        <span className="text-rose-400">{aboutExpanded ? '−' : '+'}</span>
                      </p>
                      {aboutExpanded && (
                        <p className="text-sm text-white/80 leading-relaxed">
                          {profileData.about}
                        </p>
                      )}
                    </div>
                  )}

                  <div 
                    className="relative flex items-center justify-center pt-3 mt-2 border-t border-white/[0.08] pointer-events-none min-h-[80px]"
                    style={{ paddingBottom: useTelegramSafeAreas ? `max(8px, ${safeArea.bottom}px)` : '8px' }}
                  >
                    {canUndo && (
                      <button
                        onClick={undoSkip}
                        onPointerDownCapture={(e) => e.stopPropagation()}
                        disabled={isAnimating}
                        className={`absolute left-1/2 -translate-x-[140px] w-12 h-12 rounded-full backdrop-blur-sm border-[3px] flex items-center justify-center transition-all shadow-xl pointer-events-auto ${
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
                        className={`w-16 h-16 rounded-full backdrop-blur-sm border-[3px] flex items-center justify-center transition-all shadow-xl pointer-events-auto ${
                          (isDragging && dragOffset < -30 && canSkip) || activeAction === 'skip'
                            ? 'bg-rose-500/30 border-rose-500 text-rose-500 scale-110 shadow-rose-500/40'
                            : 'bg-white/10 border-rose-500 text-rose-500 hover:bg-rose-500/20 hover:scale-110 shadow-rose-500/20'
                        }`}
                        data-testid="button-action-skip"
                      >
                        <X className="w-9 h-9 stroke-[3]" />
                      </button>

                      <button
                        onClick={openTelegram}
                        onPointerDownCapture={(e) => e.stopPropagation()}
                        className={`w-16 h-16 rounded-full flex items-center justify-center text-white transition-all shadow-xl border-[3px] pointer-events-auto ${
                          isDragging && dragOffset > 30
                            ? 'bg-gradient-to-br from-orange-400 via-rose-400 to-pink-400 scale-110 shadow-2xl shadow-rose-500/50 border-white/50'
                            : 'bg-gradient-to-br from-orange-500 via-rose-500 to-pink-500 hover:scale-110 hover:shadow-2xl hover:shadow-rose-500/50 shadow-rose-500/30 border-white/30'
                        }`}
                        data-testid="button-message-telegram"
                      >
                        <Heart className="w-9 h-9" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.article>
        </AnimatePresence>
      </div>
      
      <div className="hidden md:flex fixed bottom-4 right-4 items-center gap-3 text-white/40 text-xs bg-black/40 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10">
        <div className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white/60 font-mono">←</kbd>
          <span>Back</span>
        </div>
        <div className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white/60 font-mono">→</kbd>
          <span>Skip</span>
        </div>
        <div className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white/60 font-mono">Space</kbd>
          <span>Meet</span>
        </div>
      </div>

      <Dialog open={showTelegramConfirm} onOpenChange={setShowTelegramConfirm}>
        <DialogContent className="bg-black/95 border-white/10 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">
              Ready to meet {post?.profileData?.name}?
            </DialogTitle>
            <DialogDescription className="text-white/70 text-center">
              She's waiting for you on Telegram.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button 
              onClick={confirmOpenTelegram}
              className="bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 text-white hover:brightness-110 border-0 w-full sm:w-auto"
            >
              <Heart className="w-4 h-4 mr-2" />
              Meet on Telegram
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
