import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Grid3x3, List } from "lucide-react";
import { TelegramChannelHeader } from "./TelegramChannelHeader";
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
  const [viewMode, setViewMode] = useState<'feed' | 'grid'>('feed');

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
    <div className="rounded-lg overflow-hidden border border-border bg-card/80 backdrop-blur">
      <TelegramChannelHeader 
        channelUsername={channelUsername}
        channelInfo={channelInfo}
      />
      
      <div className="flex items-center justify-end gap-2 px-4 py-2 border-b border-border">
        <Button
          variant={viewMode === 'feed' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('feed')}
        >
          <List className="w-4 h-4" />
        </Button>
        <Button
          variant={viewMode === 'grid' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('grid')}
        >
          <Grid3x3 className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="h-[600px]">
        {viewMode === 'feed' ? (
          <div>
            {posts.map((post, index) => (
              <TelegramPostCard
                key={post.id || index}
                post={post}
                channelInfo={channelInfo}
                index={index}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1 p-1">
            {posts.map((post, index) => (
              post.media && (
                <div
                  key={post.id || index}
                  className="aspect-square bg-muted relative overflow-hidden group cursor-pointer opacity-0 animate-fade-in"
                  style={{ animationDelay: `${index * 0.03}s`, animationFillMode: 'forwards' }}
                  onClick={() => window.open(post.link, '_blank')}
                >
                  <img
                    src={post.media}
                    alt="Post thumbnail"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                </div>
              )
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
