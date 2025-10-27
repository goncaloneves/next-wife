import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { ExternalLink, Loader2 } from "lucide-react";

interface TelegramPost {
  id: string;
  text: string;
  date: string;
  link: string;
  media?: string | null;
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
    <ScrollArea className="h-[600px] rounded-lg border border-border bg-card/80 backdrop-blur">
      <div className="p-6 space-y-4">
        {posts.map((post, index) => (
          <Card
            key={post.id || index}
            className="p-4 hover:shadow-lg transition-all duration-300 bg-background/60 border border-border hover:border-primary/60 opacity-0 animate-fade-in"
            style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'forwards' }}
          >
            {post.media && (
              <img
                src={post.media}
                alt="Post media"
                className="w-full rounded-lg mb-3 object-cover max-h-64"
              />
            )}
            <p className="text-foreground mb-3 whitespace-pre-wrap leading-relaxed">
              {post.text}
            </p>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {formatDistanceToNow(new Date(post.date), { addSuffix: true })}
              </span>
              {post.link && (
                <a
                  href={post.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-primary transition-colors"
                >
                  View on Telegram <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
};
