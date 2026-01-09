import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageCircle, BadgeCheck, MapPin, Briefcase, Clock, Share2 } from "lucide-react";
import { getPersonalityLabel, getRelationshipLabel } from "@/lib/girlfriends/profile-formatter";
import { formatDistanceToNow } from "date-fns";

interface ProfileData {
  name: string;
  age: number;
  nationality: string;
  hometown: string;
  work: string;
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
  const [loading, setLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`/api/tg-profile/${id}?channel=nextwife_ai`);
        if (!response.ok) {
          throw new Error('Profile not found');
        }
        const data = await response.json();
        if (data.post) {
          setPost(data.post);
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

  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return "";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a0a0a] via-[#2d1810] to-[#1a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!post || !post.profileData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a0a0a] via-[#2d1810] to-[#1a0a0a] flex flex-col items-center justify-center text-white">
        <h1 className="text-2xl font-bold mb-4">Profile not found</h1>
        <Button onClick={() => navigate("/")} variant="outline">
          Back to Home
        </Button>
      </div>
    );
  }

  const { profileData } = post;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a0a0a] via-[#2d1810] to-[#1a0a0a] pb-24">
      <div className="max-w-lg mx-auto relative">
        <div className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center p-4 max-w-lg mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="bg-black/60 backdrop-blur-md text-white p-3 rounded-full hover:bg-black/80 transition-colors shadow-lg"
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleShare}
            className="bg-black/60 backdrop-blur-md text-white p-3 rounded-full hover:bg-black/80 transition-colors shadow-lg"
            data-testid="button-share"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        <div className="relative">
          <div className="aspect-[3/4] w-full overflow-hidden">
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 animate-pulse" />
            )}
            <img
              src={buildImageSrc(post.media)}
              alt={profileData.name}
              className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImageLoaded(true)}
            />
          </div>

          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent pt-20 pb-6 px-5">
            {post.isHot && (
              <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-rose-500 rounded-full px-3 py-1 mb-3 shadow-lg">
                <span className="text-sm">🔥</span>
                <span className="text-xs font-semibold text-white">Hot</span>
              </div>
            )}
            
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl font-bold text-white">
                {profileData.name}
              </h1>
              <span className="text-2xl font-light text-white/90">
                {profileData.age}
              </span>
              <BadgeCheck 
                className="w-6 h-6 text-[#1DA1F2] flex-shrink-0" 
                style={{ fill: '#1DA1F2', stroke: 'white', strokeWidth: 2 }} 
              />
            </div>

            <div className="flex items-center gap-2 text-white/70 text-sm">
              <MapPin className="w-4 h-4" />
              <span>{profileData.hometown}</span>
              <span className="text-white/40">•</span>
              <Clock className="w-4 h-4" />
              <span>{formatTimeAgo(post.date)}</span>
            </div>
          </div>
        </div>

        <div className="relative -mt-3 mx-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl p-5 space-y-5">
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5 text-sm text-white">
                🌍 {profileData.nationality}
              </span>
              {profileData.relationship && (
                <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-pink-500/20 to-rose-500/20 border border-pink-500/30 rounded-full px-3 py-1.5 text-sm text-pink-200">
                  {getRelationshipLabel(profileData.relationship)}
                </span>
              )}
              {profileData.personality && (
                <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/30 rounded-full px-3 py-1.5 text-sm text-purple-200">
                  {getPersonalityLabel(profileData.personality)}
                </span>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white/10 rounded-lg">
                  <Briefcase className="w-4 h-4 text-white/70" />
                </div>
                <div className="flex-1">
                  <p className="text-white/50 text-xs uppercase tracking-wide mb-1">Work</p>
                  <p className="text-white text-sm leading-relaxed">{profileData.work}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-white/10 rounded-lg">
                  <MapPin className="w-4 h-4 text-white/70" />
                </div>
                <div className="flex-1">
                  <p className="text-white/50 text-xs uppercase tracking-wide mb-1">Based in</p>
                  <p className="text-white text-sm">{profileData.hometown}, {profileData.nationality}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 pt-6">
          <Link to="/" state={{ restoreScroll: true }} className="block">
            <Button 
              variant="ghost" 
              className="w-full text-white/50 hover:text-white hover:bg-white/5 text-sm" 
              data-testid="button-browse-more"
            >
              Browse more women
            </Button>
          </Link>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/95 to-transparent pt-6 pb-6 px-4">
        <div className="max-w-lg mx-auto">
          <Button
            onClick={handleMessageClick}
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white shadow-xl rounded-full"
            data-testid="button-message-telegram"
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            Message {profileData.name.split(' ')[0]}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
