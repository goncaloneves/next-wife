import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageCircle, BadgeCheck, MapPin, Briefcase, Globe, MessageSquare, Share2, Clock, ChevronLeft, ChevronRight, X } from "lucide-react";
import { getPersonalityLabel, getRelationshipLabel, getLanguageDisplay } from "@/lib/girlfriends/profile-formatter";
import { formatDistanceToNow } from "date-fns";

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

const Profile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [prevId, setPrevId] = useState<string | null>(null);
  const [nextId, setNextId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const imageRef = useRef<HTMLDivElement>(null);

  const goBack = useCallback(() => {
    navigate("/", { state: { restoreScroll: true } });
  }, [navigate]);

  const goToPrev = useCallback(() => {
    if (prevId) {
      setSwipeDirection('right');
      setImageLoaded(false);
      setTimeout(() => {
        navigate(`/profile/${prevId}`, { replace: true });
        setSwipeDirection(null);
      }, 150);
    }
  }, [prevId, navigate]);

  const goToNext = useCallback(() => {
    if (nextId) {
      setSwipeDirection('left');
      setImageLoaded(false);
      setTimeout(() => {
        navigate(`/profile/${nextId}`, { replace: true });
        setSwipeDirection(null);
      }, 150);
    }
  }, [nextId, navigate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        goBack();
      } else if (e.key === "ArrowLeft") {
        goToPrev();
      } else if (e.key === "ArrowRight") {
        goToNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goBack, goToPrev, goToNext]);

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
          setPrevId(data.prevId);
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
    }
  }, [id]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;

    if (Math.abs(diff) > threshold) {
      if (diff > 0 && nextId) {
        goToNext();
      } else if (diff < 0 && prevId) {
        goToPrev();
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

  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return "";
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

  return (
    <div 
      className="h-screen flex flex-col bg-gradient-to-b from-[#1a0a0a] via-[#2d1810] to-[#1a0a0a] overflow-hidden"
      onClick={goBack}
    >
      <div 
        className="flex-1 flex flex-col max-w-lg mx-auto w-full min-h-0 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          ref={imageRef}
          className={`relative flex-1 min-h-[300px] transition-transform duration-150 ${
            swipeDirection === 'left' ? '-translate-x-full opacity-0' : 
            swipeDirection === 'right' ? 'translate-x-full opacity-0' : ''
          }`}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center">
            <button
              onClick={goBack}
              className="bg-black/50 backdrop-blur-sm text-white p-2.5 rounded-full hover:bg-black/70 transition-colors shadow-lg"
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleShare}
              className="bg-black/50 backdrop-blur-sm text-white p-2.5 rounded-full hover:bg-black/70 transition-colors shadow-lg"
              data-testid="button-share"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>

          {prevId && (
            <button
              onClick={goToPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-black/40 backdrop-blur-sm text-white p-2 rounded-full hover:bg-black/60 transition-colors shadow-lg opacity-60 hover:opacity-100"
              data-testid="button-prev-profile"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {nextId && (
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-black/40 backdrop-blur-sm text-white p-2 rounded-full hover:bg-black/60 transition-colors shadow-lg opacity-60 hover:opacity-100"
              data-testid="button-next-profile"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {!imageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 animate-pulse" />
          )}
          <img
            src={buildImageSrc(post.media)}
            alt={profileData.name}
            className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
            draggable={false}
          />

          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/60 to-transparent pt-16 pb-4 px-4">
            {post.isHot && (
              <div className="inline-flex items-center gap-1 bg-gradient-to-r from-orange-500 to-rose-500 text-white px-2 py-1 rounded-full text-sm font-bold shadow-lg mb-2">
                <span>🔥</span>
                <span className="text-xs">Hot</span>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold text-white drop-shadow-lg">
                {profileData.name}
              </h1>
              <span className="text-lg md:text-xl font-semibold text-white opacity-90">
                {profileData.age}
              </span>
              <BadgeCheck 
                className="w-5 h-5 md:w-6 md:h-6 text-[#0099FF] drop-shadow-lg flex-shrink-0" 
                style={{ fill: '#0099FF', stroke: 'white', strokeWidth: 2 }} 
              />
            </div>
          </div>
        </div>

        <div className="bg-black/40 backdrop-blur-sm flex-shrink-0 overflow-y-auto border-t border-white/10" style={{ maxHeight: '35vh' }}>
          <div className="p-4 space-y-3">
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

            <div className="flex items-center gap-3 text-white/90">
              <Clock className="w-4 h-4 text-white/50 flex-shrink-0" />
              <span className="text-sm text-white/60">{formatTimeAgo(post.date)}</span>
            </div>

            {(profileData.relationship || profileData.personality) && (
              <div className="pt-3 border-t border-white/10">
                <p className="text-xs font-medium text-white/50 uppercase tracking-wide mb-2">Looking for</p>
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

        <div className="flex-shrink-0 bg-black/60 backdrop-blur-sm border-t border-white/10 p-4 pb-6">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={goBack}
              className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white transition-colors"
              data-testid="button-action-back"
            >
              <X className="w-5 h-5" />
            </button>
            
            <button
              onClick={goToPrev}
              disabled={!prevId}
              className={`w-12 h-12 rounded-full border flex items-center justify-center transition-colors ${
                prevId 
                  ? 'bg-white/10 border-white/20 text-white/70 hover:bg-white/20 hover:text-white' 
                  : 'bg-white/5 border-white/10 text-white/20 cursor-not-allowed'
              }`}
              data-testid="button-action-prev"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <Button
              onClick={handleMessageClick}
              className="h-14 px-8 text-base font-semibold bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white shadow-lg rounded-full"
              data-testid="button-message-telegram"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Message
            </Button>

            <button
              onClick={goToNext}
              disabled={!nextId}
              className={`w-12 h-12 rounded-full border flex items-center justify-center transition-colors ${
                nextId 
                  ? 'bg-white/10 border-white/20 text-white/70 hover:bg-white/20 hover:text-white' 
                  : 'bg-white/5 border-white/10 text-white/20 cursor-not-allowed'
              }`}
              data-testid="button-action-next"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
