import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageCircle, BadgeCheck, MapPin, Briefcase, Globe, MessageSquare } from "lucide-react";
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
    <div className="h-screen flex flex-col bg-gradient-to-b from-[#1a0a0a] via-[#2d1810] to-[#1a0a0a] overflow-hidden">
      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full min-h-0">
        <div className="relative flex-1 min-h-[300px]">
          <button
            onClick={() => navigate("/", { state: { restoreScroll: true } })}
            className="absolute top-4 left-4 z-20 bg-black/50 backdrop-blur-sm text-white p-2.5 rounded-full hover:bg-black/70 transition-colors shadow-lg"
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {!imageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 animate-pulse" />
          )}
          <img
            src={buildImageSrc(post.media)}
            alt={profileData.name}
            className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
          />

          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/60 to-transparent pt-16 pb-4 px-4">
            {post.isHot && (
              <div className="inline-flex items-center gap-1 bg-gradient-to-r from-orange-500 to-rose-500 rounded-full px-2.5 py-0.5 mb-2 shadow-lg">
                <span className="text-xs">🔥</span>
                <span className="text-[10px] font-bold text-white uppercase tracking-wide">Hot</span>
              </div>
            )}
            
            <div className="flex items-baseline gap-2">
              <h1 className="text-2xl font-bold text-white">
                {profileData.name}
              </h1>
              <span className="text-xl font-light text-white">
                {profileData.age}
              </span>
              <BadgeCheck 
                className="w-5 h-5 text-[#1DA1F2] flex-shrink-0" 
                style={{ fill: '#1DA1F2', stroke: 'white', strokeWidth: 2.5 }} 
              />
            </div>
          </div>
        </div>

        <div className="bg-black/40 backdrop-blur-sm flex-shrink-0 overflow-y-auto border-t border-white/10" style={{ maxHeight: '45vh' }}>
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

            <div className="pt-2">
              <Link to="/" state={{ restoreScroll: true }} className="block">
                <Button 
                  variant="ghost" 
                  className="w-full text-white/40 hover:text-white/70 hover:bg-white/5 text-sm h-10" 
                  data-testid="button-browse-more"
                >
                  Browse more
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 bg-black/60 backdrop-blur-sm border-t border-white/10 p-4 pb-6">
          <Button
            onClick={handleMessageClick}
            className="w-full h-12 text-base font-semibold bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white shadow-lg rounded-full"
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
