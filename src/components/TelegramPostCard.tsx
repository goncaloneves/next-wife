import { useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { Heart, MessageCircle, Send, Bookmark, ExternalLink } from "lucide-react";

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
  index: number;
}

export const TelegramPostCard = ({ post, channelInfo, index }: TelegramPostCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [expanded, setExpanded] = useState(false);
  
  const shouldTruncate = post.text.length > 150;
  const displayText = expanded || !shouldTruncate 
    ? post.text 
    : post.text.slice(0, 150) + '...';

  return (
    <Card
      className="overflow-hidden border-0 rounded-none border-b border-border bg-card opacity-0 animate-fade-in"
      style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'forwards' }}
    >
      {/* Post Header */}
      <div className="flex items-center gap-3 p-4">
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
      </div>

      {/* Media Section */}
      {post.media && (
        <div className="relative w-full bg-muted">
          {!imageLoaded && (
            <Skeleton className="w-full aspect-square" />
          )}
          <img
            src={post.media}
            alt="Post media"
            className={`w-full object-cover transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0 absolute inset-0'
            }`}
            style={{ aspectRatio: '1/1' }}
            onLoad={() => setImageLoaded(true)}
          />
        </div>
      )}

      {/* Action Bar */}
      <div className="flex items-center gap-4 px-4 py-3">
        <button className="hover:text-destructive transition-colors">
          <Heart className="w-6 h-6" />
        </button>
        <button className="hover:text-primary transition-colors">
          <MessageCircle className="w-6 h-6" />
        </button>
        <button className="hover:text-primary transition-colors">
          <Send className="w-6 h-6" />
        </button>
        <button className="ml-auto hover:text-primary transition-colors">
          <Bookmark className="w-6 h-6" />
        </button>
      </div>

      {/* Content Section */}
      {post.text && (
        <div className="px-4 pb-3">
          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
            <span className="font-semibold">{channelInfo?.name || 'Channel'}</span>{' '}
            {displayText}
            {shouldTruncate && !expanded && (
              <button
                onClick={() => setExpanded(true)}
                className="text-muted-foreground hover:text-foreground ml-1"
              >
                more
              </button>
            )}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 pb-4">
        <a
          href={post.link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
        >
          View on Telegram <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </Card>
  );
};
