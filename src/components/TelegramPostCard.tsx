import { useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { ExternalLink } from "lucide-react";

interface TelegramPostCardProps {
  post: {
    id: string;
    text: string;
    date: string;
    link: string;
    media?: string | null;
    mediaType?: 'image' | 'video' | null;
    videoUrl?: string | null;
    avatar?: string | null;
  };
  channelInfo?: {
    name: string;
    avatar: string | null;
  };
  index?: number;
  animate?: boolean;
}

export const TelegramPostCard = ({ post, channelInfo, index, animate = true }: TelegramPostCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [expanded, setExpanded] = useState(false);
  
  const shouldTruncate = post.text.length > 150;
  const displayText = expanded || !shouldTruncate 
    ? post.text 
    : post.text.slice(0, 150) + '...';

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking the "more" button
    if ((e.target as HTMLElement).tagName === 'BUTTON') {
      return;
    }
    window.open(post.link, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card
      onClick={handleCardClick}
      className={`telegram-card overflow-hidden border border-border rounded-lg bg-card/80 backdrop-blur transition-all duration-300 hover:border-primary cursor-pointer w-full max-w-[600px] mx-auto ${animate ? 'opacity-0 animate-fade-in' : ''}`}
      style={animate ? { animationDelay: `${(index || 0) * 0.1 + 0.3}s`, animationFillMode: 'forwards' } : undefined}
    >
      {/* Post Header */}
      <div className="flex items-center gap-3 p-6">
        <Avatar className="w-10 h-10">
          <AvatarImage 
            src={post.avatar || channelInfo?.avatar || undefined} 
            alt={channelInfo?.name || 'Channel'}
          />
          <AvatarFallback className="bg-primary/10 text-primary text-sm">
            {(channelInfo?.name || 'CH').slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <p className="font-semibold text-sm text-foreground">
            {channelInfo?.name || 'Channel'}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(post.date), { addSuffix: true })}
          </p>
        </div>

        <a
          href={post.link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors group"
          aria-label="View on Telegram"
        >
          <ExternalLink className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
        </a>
      </div>

      {/* Media Section */}
      {post.media && post.mediaType === 'image' && (
        <div className="relative w-full bg-muted/30">
          {!imageLoaded && (
            <Skeleton className="w-full h-64" />
          )}
          <img
            src={post.media}
            alt="Post media"
            className={`w-full object-contain transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0 absolute inset-0'
            }`}
            style={{ maxHeight: '800px', minHeight: '200px' }}
            onLoad={() => setImageLoaded(true)}
          />
        </div>
      )}

      {post.media && post.mediaType === 'video' && (
        <div className="relative w-full bg-muted/30">
          {post.videoUrl ? (
            <video
              poster={post.media}
              src={post.videoUrl}
              controls
              className="w-full object-contain"
              style={{ maxHeight: '800px', minHeight: '200px' }}
            >
              <source src={post.videoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="relative cursor-pointer" aria-label="Play on Telegram">
              <img 
                src={post.media} 
                alt="Video thumbnail" 
                className="w-full object-contain"
                style={{ maxHeight: '800px', minHeight: '200px' }}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-800 ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-2 py-1 rounded border border-border bg-background/80 text-foreground text-xs">
                  Play on Telegram
                </div>
              </div>
            </div>
          )}
        </div>
      )}


      {/* Content Section */}
      {post.text && (
        <div className="px-6 pb-6">
          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
            {displayText}
            {shouldTruncate && !expanded && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(true);
                }}
                className="text-muted-foreground hover:text-foreground ml-1"
              >
                more
              </button>
            )}
          </p>
        </div>
      )}
    </Card>
  );
};
