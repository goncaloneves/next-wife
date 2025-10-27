import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { TelegramPostCard } from "./TelegramPostCard";

interface TelegramPost {
  id: string;
  text: string;
  date: string;
  link: string;
  media?: string | null;
  avatar?: string | null;
}

interface ChannelInfo {
  name: string;
  avatar: string | null;
  description: string | null;
  subscribers: string | null;
}

interface TelegramChannelFeedProps {
  channelUsername: string;
  refreshInterval?: number;
  maxPosts?: number;
}

export const TelegramChannelFeed = ({
  channelUsername,
  refreshInterval = 3000,
  maxPosts = 20
}: TelegramChannelFeedProps) => {
  const [posts, setPosts] = useState<TelegramPost[]>([]);
  const [channelInfo, setChannelInfo] = useState<ChannelInfo | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tg-channel-feed?channel=${channelUsername}&limit=${maxPosts}`,
          {
            headers: {
              'Content-Type': 'application/json',
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch posts');
        }

        const data = await response.json();
        setPosts(data.posts || []);
        setChannelInfo(data.channelInfo);
        setError(null);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching Telegram posts:', err);
        setError('Unable to load channel posts');
        setLoading(false);
      }
    };

    fetchPosts();
    const interval = setInterval(fetchPosts, refreshInterval);

    return () => clearInterval(interval);
  }, [channelUsername, refreshInterval, maxPosts]);

  if (loading) {
    return (
      <Card className="p-8 text-center bg-card/80 backdrop-blur border border-border">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
        <p className="text-muted-foreground">Loading channel posts...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center bg-card/80 backdrop-blur border border-border">
        <p className="text-destructive mb-2">{error}</p>
        <p className="text-sm text-muted-foreground">Please check the channel name and try again</p>
      </Card>
    );
  }

  if (posts.length === 0) {
    return (
      <Card className="p-8 text-center bg-card/80 backdrop-blur border border-border">
        <p className="text-muted-foreground">No posts yet in this channel</p>
      </Card>
    );
  }

  return (
    <ScrollArea className="h-[900px] rounded-lg">
      <div className="space-y-4 feed-posts">
        {posts.map((post, index) => (
          <div
            key={post.id || index}
            className="feed-post opacity-0"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <TelegramPostCard
              post={post}
              channelInfo={channelInfo}
              index={index}
            />
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};
