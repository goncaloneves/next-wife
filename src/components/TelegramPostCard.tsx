import { useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { formatDistanceToNow } from "date-fns";
import { ExternalLink, X } from "lucide-react";

interface TelegramPostCardProps {
  post: {
    id: string;
    text: string;
    date: string;
    link: string;
    media?: string | null;
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
  const [lightboxOpen, setLightboxOpen] = useState(false);
  
  const shouldTruncate = post.text.length > 150;
  const displayText = expanded || !shouldTruncate 
    ? post.text 
    : post.text.slice(0, 150) + '...';

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking the "more" button or image
    const target = e.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.tagName === 'IMG') {
      return;
    }
    window.open(post.link, '_blank', 'noopener,noreferrer');
  };

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLightboxOpen(true);
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
      {post.media && (
        <div className="relative w-full bg-muted/30 cursor-pointer" onClick={handleImageClick}>
          {!imageLoaded && (
            <Skeleton className="w-full h-64" />
          )}
          <img
            src={post.media}
            alt="Post media"
            className={`w-full object-cover transition-opacity duration-300 hover:opacity-90 ${
              imageLoaded ? 'opacity-100' : 'opacity-0 absolute inset-0'
            }`}
            style={{ maxHeight: '400px', minHeight: '200px' }}
            onLoad={() => setImageLoaded(true)}
          />
        </div>
      )}

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 bg-black/95 border-none">
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <img
            src={post.media}
            alt="Post media fullscreen"
            className="w-auto h-auto max-w-full max-h-[95vh] object-contain"
          />
        </DialogContent>
      </Dialog>


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
