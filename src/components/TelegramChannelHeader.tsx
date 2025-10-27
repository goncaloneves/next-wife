import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface TelegramChannelHeaderProps {
  channelUsername: string;
  channelInfo?: {
    name: string;
    avatar: string | null;
    description: string | null;
    subscribers: string | null;
  };
}

export const TelegramChannelHeader = ({ 
  channelUsername, 
  channelInfo 
}: TelegramChannelHeaderProps) => {
  return (
    <div className="flex items-center gap-4 p-6 bg-card/80 backdrop-blur border-b border-border">
      <Avatar className="w-20 h-20">
        <AvatarImage 
          src={channelInfo?.avatar || undefined} 
          alt={channelInfo?.name || channelUsername}
        />
        <AvatarFallback className="bg-primary/10 text-primary text-xl">
          {(channelInfo?.name || channelUsername).slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1">
        <h2 className="text-xl font-semibold text-foreground mb-1">
          {channelInfo?.name || `@${channelUsername}`}
        </h2>
        {channelInfo?.description && (
          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
            {channelInfo.description}
          </p>
        )}
        {channelInfo?.subscribers && (
          <p className="text-xs text-muted-foreground">
            {channelInfo.subscribers}
          </p>
        )}
      </div>
      
      <Button 
        variant="outline"
        size="sm"
        asChild
        className="gap-2"
      >
        <a
          href={`https://t.me/${channelUsername}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          View Channel <ExternalLink className="w-4 h-4" />
        </a>
      </Button>
    </div>
  );
};
