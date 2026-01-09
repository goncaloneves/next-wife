import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageCircle, BadgeCheck, MapPin, Briefcase, Heart, Users } from "lucide-react";
import { getPersonalityLabel, getRelationshipLabel } from "@/lib/girlfriends/profile-formatter";

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
    if (post?.botLink) {
      window.open(post.botLink, "_blank", "noopener,noreferrer");
    }
  };

  const buildImageSrc = (url: string) => {
    return `/api/tg-image-proxy?u=${encodeURIComponent(url)}`;
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
    <div className="min-h-screen bg-gradient-to-b from-[#1a0a0a] via-[#2d1810] to-[#1a0a0a]">
      <div className="max-w-lg mx-auto relative">
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-50 bg-black/50 backdrop-blur-sm text-white p-2 rounded-full hover:bg-black/70 transition-colors"
          data-testid="button-back"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <div className="relative">
          <div className="aspect-[3/4] w-full overflow-hidden">
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gray-800 animate-pulse" />
            )}
            <img
              src={buildImageSrc(post.media)}
              alt={profileData.name}
              className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImageLoaded(true)}
            />
          </div>

          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-6">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-white drop-shadow-lg">
                {profileData.name}
              </h1>
              <span className="text-2xl font-semibold text-white/90">
                {profileData.age}
              </span>
              <BadgeCheck 
                className="w-7 h-7 text-[#0099FF] drop-shadow-lg flex-shrink-0" 
                style={{ fill: '#0099FF', stroke: 'white', strokeWidth: 2 }} 
              />
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6 text-white">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-primary/80" />
              <div>
                <p className="text-white/60 text-sm">Location</p>
                <p className="font-medium">{profileData.nationality} • {profileData.hometown}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Briefcase className="w-5 h-5 text-primary/80 mt-0.5" />
              <div>
                <p className="text-white/60 text-sm">Work</p>
                <p className="font-medium">{profileData.work}</p>
              </div>
            </div>

            {profileData.personality && (
              <div className="flex items-center gap-3">
                <Heart className="w-5 h-5 text-primary/80" />
                <div>
                  <p className="text-white/60 text-sm">Personality</p>
                  <p className="font-medium">{getPersonalityLabel(profileData.personality)}</p>
                </div>
              </div>
            )}

            {profileData.relationship && (
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-primary/80" />
                <div>
                  <p className="text-white/60 text-sm">Relationship</p>
                  <p className="font-medium">{getRelationshipLabel(profileData.relationship)}</p>
                </div>
              </div>
            )}
          </div>

          {post.isHot && (
            <div className="flex items-center gap-2 bg-gradient-to-r from-orange-500/20 to-rose-500/20 border border-orange-500/30 rounded-lg px-4 py-3">
              <span className="text-xl">🔥</span>
              <span className="font-medium text-orange-300">Popular Profile</span>
            </div>
          )}

          <Button
            onClick={handleMessageClick}
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white shadow-lg"
            data-testid="button-message-telegram"
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            Message on Telegram
          </Button>

          <p className="text-center text-white/40 text-sm">
            Start chatting with {profileData.name.split(' ')[0]} on Telegram
          </p>
        </div>

        <div className="p-6 pt-0">
          <Link to="/" className="block">
            <Button variant="ghost" className="w-full text-white/60 hover:text-white" data-testid="button-browse-more">
              Browse more girlfriends
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Profile;
