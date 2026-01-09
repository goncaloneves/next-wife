import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageCircle, BadgeCheck, MapPin, Briefcase, Globe, MessageSquare, Share2, Undo2, X } from "lucide-react";
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
}

interface Post {
  id: string;
  text: string;
  date: string;
  link: string;
  media: string;
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
    rotate: direction > 0 ? 15 : -15,
    scale: 0.9,
  }),
  center: {
    x: 0,
    opacity: 1,
    rotate: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
    rotate: direction > 0 ? 15 : -15,
    scale: 0.95,
    transition: {
      duration: 0.35,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

const Profile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [nextId, setNextId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [skipHistory, setSkipHistory] = useState<SkipHistoryEntry[]>([]);
  const [direction, setDirection] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-15, 0, 15]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 0.8, 1, 0.8, 0.5]);

  useEffect(() => {
    setSkipHistory(getSkipHistory());
  }, []);

  const goBack = useCallback(() => {
    navigate("/", { state: { restoreScroll: true } });
  }, [navigate]);

  const undoSkip = useCallback(() => {
    if (skipHistory.length === 0 || isAnimating) return;
    
    const newHistory = [...skipHistory];
    const lastSkipped = newHistory.pop();
    
    if (lastSkipped) {
      setSkipHistory(newHistory);
      saveSkipHistory(newHistory);
      setDirection(1);
      setIsAnimating(true);
      setImageLoaded(false);
      navigate(`/profile/${lastSkipped.profileId}`, { replace: true });
    }
  }, [skipHistory, navigate, isAnimating]);

  const skipProfile = useCallback(() => {
    if (!id || !nextId || isAnimating) return;
    
    const newHistory = [...skipHistory, { profileId: id, timestamp: Date.now() }];
    setSkipHistory(newHistory);
    saveSkipHistory(newHistory);
    
    setDirection(-1);
    setIsAnimating(true);
    setImageLoaded(false);
    navigate(`/profile/${nextId}`, { replace: true });
  }, [id, nextId, skipHistory, navigate, isAnimating]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        goBack();
      } else if (e.key === "ArrowLeft") {
        undoSkip();
      } else if (e.key === "ArrowRight") {
        skipProfile();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goBack, undoSkip, skipProfile]);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/tg-profile/${id}?channel=nextwife_ai`);
        if (!response.ok) {
          throw new Error('Profile not found');
        }
        const data = await response.json();
        if (data.post) {
          setPost(data.post);
          setNextId(data.nextId);
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProfile();
      x.set(0);
    }
  }, [id, x]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100;
    const velocity = info.velocity.x;
    const offset = info.offset.x;

    if (offset < -threshold || velocity < -500) {
      if (nextId) {
        skipProfile();
      }
    } else if (offset > threshold || velocity > 500) {
      if (skipHistory.length > 0) {
        undoSkip();
      }
    }
  };

  const handleMessageClick = () => {
    const url = post?.botLink || post?.link;
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Meet ${post?.profileData?.name} on Next Wife`,
          url: url,
        });
      } catch (err) {
        navigator.clipboard.writeText(url);
      }
    } else {
      navigator.clipboard.writeText(url);
    }
  };

  const buildImageSrc = (url: string) => {
    return `/api/tg-image-proxy?u=${encodeURIComponent(url)}`;
  };

  if (loading) {
    return (
      <div className="h-screen bg-gradient-to-b from-[#1a0a0a] via-[#2d1810] to-[#1a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  if (!post || !post.profileData) {
    return (
      <div className="h-screen bg-gradient-to-b from-[#1a0a0a] via-[#2d1810] to-[#1a0a0a] flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4 text-white">Profile not found</h1>
        <Button onClick={() => navigate("/")} variant="outline" className="text-white border-white/30">
          Back to Home
        </Button>
      </div>
    );
  }

  const { profileData } = post;
  const canUndo = skipHistory.length > 0;
  const canSkip = !!nextId;
  const dragX = x.get();

  return (
    <div 
      className="h-screen flex flex-col bg-gradient-to-b from-[#1a0a0a] via-[#2d1810] to-[#1a0a0a] overflow-hidden"
      onClick={goBack}
    >
      <div 
        className="flex-1 flex flex-col max-w-lg mx-auto w-full min-h-0 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <AnimatePresence mode="wait" custom={direction} onExitComplete={() => setIsAnimating(false)}>
          <motion.div
            key={post.id}
            custom={direction}
            variants={cardVariants}
            initial="enter"
            animate="center"
            exit="exit"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.9}
            onDragEnd={handleDragEnd}
            style={{ x, rotate, opacity }}
            className="flex-1 flex flex-col min-h-0 relative"
          >
            <div className="relative flex-1 min-h-[300px] select-none">
              <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center">
                <button
                  onClick={(e) => { e.stopPropagation(); goBack(); }}
                  className="bg-black/50 backdrop-blur-md text-white p-2.5 rounded-full hover:bg-black/70 transition-all shadow-lg hover:scale-105"
                  data-testid="button-back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleShare(); }}
                  className="bg-black/50 backdrop-blur-md text-white p-2.5 rounded-full hover:bg-black/70 transition-all shadow-lg hover:scale-105"
                  data-testid="button-share"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>

              {!imageLoaded && (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 animate-pulse rounded-xl" />
              )}
              <img
                src={buildImageSrc(post.media)}
                alt={profileData.name}
                className={`w-full h-full object-cover transition-opacity duration-300 rounded-t-xl ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setImageLoaded(true)}
                draggable={false}
              />

              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/70 to-transparent pt-20 pb-4 px-4">
                {post.isHot && (
                  <div className="inline-flex items-center gap-1 bg-gradient-to-r from-orange-500 to-rose-500 text-white px-2.5 py-1 rounded-full text-sm font-bold shadow-lg mb-2">
                    <span>🔥</span>
                    <span className="text-xs font-semibold">Hot</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
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
              </div>

              {dragX > 30 && canUndo && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute top-1/2 left-4 -translate-y-1/2 bg-amber-500 text-white px-4 py-2 rounded-lg font-bold transform rotate-[-15deg] border-2 border-white shadow-lg"
                >
                  UNDO
                </motion.div>
              )}
              {dragX < -30 && canSkip && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute top-1/2 right-4 -translate-y-1/2 bg-rose-500 text-white px-4 py-2 rounded-lg font-bold transform rotate-[15deg] border-2 border-white shadow-lg"
                >
                  SKIP
                </motion.div>
              )}
            </div>

            <div className="bg-black/50 backdrop-blur-md flex-shrink-0 overflow-y-auto border-t border-white/10" style={{ maxHeight: '32vh' }}>
              <div className="p-4 space-y-2.5">
                <div className="flex items-center gap-3 text-white/90">
                  <Briefcase className="w-4 h-4 text-orange-400 flex-shrink-0" />
                  <span className="text-sm">{profileData.work}</span>
                </div>

                <div className="flex items-center gap-3 text-white/90">
                  <MapPin className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span className="text-sm">{profileData.hometown}</span>
                </div>

                <div className="flex items-center gap-3 text-white/90">
                  <Globe className="w-4 h-4 text-pink-400 flex-shrink-0" />
                  <span className="text-sm">{profileData.nationality}</span>
                </div>

                <div className="flex items-center gap-3 text-white/90">
                  <MessageSquare className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span className="text-sm">{getLanguageDisplay(profileData.language)}</span>
                </div>

                {(profileData.relationship || profileData.personality) && (
                  <div className="pt-2.5 border-t border-white/10">
                    <p className="text-xs font-medium text-white/50 uppercase tracking-wide mb-2">About Me</p>
                    <div className="flex flex-wrap gap-2">
                      {profileData.relationship && (
                        <span className="inline-flex items-center gap-1 bg-gradient-to-r from-rose-500/30 to-pink-500/30 border border-rose-400/40 rounded-full px-3 py-1.5 text-sm text-rose-200 font-medium">
                          {getRelationshipLabel(profileData.relationship)}
                        </span>
                      )}
                      {profileData.personality && (
                        <span className="inline-flex items-center gap-1 bg-gradient-to-r from-purple-500/30 to-indigo-500/30 border border-purple-400/40 rounded-full px-3 py-1.5 text-sm text-purple-200 font-medium">
                          {getPersonalityLabel(profileData.personality)}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex-shrink-0 bg-black/60 backdrop-blur-lg border-t border-white/10 px-6 py-5 pb-7">
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={undoSkip}
              disabled={!canUndo || isAnimating}
              className={`w-16 h-16 rounded-full backdrop-blur-sm border-[3px] flex items-center justify-center transition-all shadow-xl ${
                canUndo && !isAnimating
                  ? 'bg-white/10 border-amber-400 text-amber-400 hover:bg-amber-400/20 hover:scale-110 shadow-amber-400/20' 
                  : 'bg-white/5 border-white/20 text-white/20 cursor-not-allowed'
              }`}
              data-testid="button-action-undo"
            >
              <Undo2 className="w-8 h-8" />
            </button>
            
            <button
              onClick={skipProfile}
              disabled={!canSkip || isAnimating}
              className={`w-16 h-16 rounded-full backdrop-blur-sm border-[3px] flex items-center justify-center transition-all shadow-xl ${
                canSkip && !isAnimating
                  ? 'bg-white/10 border-rose-500 text-rose-500 hover:bg-rose-500/20 hover:scale-110 shadow-rose-500/20' 
                  : 'bg-white/5 border-white/20 text-white/20 cursor-not-allowed'
              }`}
              data-testid="button-action-skip"
            >
              <X className="w-9 h-9 stroke-[3]" />
            </button>

            <button
              onClick={handleMessageClick}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 via-rose-500 to-pink-500 flex items-center justify-center text-white hover:scale-110 hover:shadow-2xl hover:shadow-rose-500/50 transition-all shadow-xl shadow-rose-500/30 border-[3px] border-white/30"
              data-testid="button-message-telegram"
            >
              <MessageCircle className="w-10 h-10" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
