import { useState, useEffect, useRef } from "react";
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
  const [allPosts, setAllPosts] = useState<TelegramPost[]>([]);
  const [displayedPosts, setDisplayedPosts] = useState<TelegramPost[]>([]);
  const [displayCount, setDisplayCount] = useState(10);
  const [channelInfo, setChannelInfo] = useState<ChannelInfo | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tg-channel-feed?channel=${channelUsername}`,
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
        const fetchedPosts = data.posts || [];
        
        setAllPosts(fetchedPosts);
        setDisplayedPosts(fetchedPosts.slice(0, displayCount));
        setChannelInfo(data.channelInfo);
        setError(null);
        setLoading(false);
        
        console.log(`Fetched ${fetchedPosts.length} total posts, displaying first ${displayCount}`);
      } catch (err) {
        console.error('Error fetching Telegram posts:', err);
        setError('Unable to load channel posts');
        setLoading(false);
      }
    };

    fetchPosts();
    const interval = setInterval(fetchPosts, refreshInterval);

    return () => clearInterval(interval);
  }, [channelUsername, refreshInterval]);

  useEffect(() => {
    setDisplayedPosts(allPosts.slice(0, displayCount));
  }, [allPosts, displayCount]);

  useEffect(() => {
    if (!observerTarget.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        
        if (target.isIntersecting && displayCount < allPosts.length && !isLoadingMore) {
          loadMorePosts();
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '200px'
      }
    );

    observer.observe(observerTarget.current);

    return () => {
      observer.disconnect();
    };
  }, [displayCount, allPosts.length, isLoadingMore]);

  const loadMorePosts = () => {
    if (isLoadingMore || displayCount >= allPosts.length) return;
    
    setIsLoadingMore(true);
    
    setTimeout(() => {
      const newCount = Math.min(displayCount + 10, allPosts.length);
      setDisplayCount(newCount);
      setDisplayedPosts(allPosts.slice(0, newCount));
      setIsLoadingMore(false);
      
      console.log(`Showing ${newCount} of ${allPosts.length} posts`);
    }, 300);
  };

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

  if (allPosts.length === 0 && !loading) {
    return (
      <Card className="p-8 text-center bg-card/80 backdrop-blur border border-border">
        <p className="text-muted-foreground">No posts yet in this channel</p>
      </Card>
    );
  }

  return (
    <ScrollArea className="h-[900px] rounded-lg">
      <div className="space-y-4">
        {displayedPosts.map((post, index) => (
          <TelegramPostCard
            key={post.id || index}
            post={post}
            channelInfo={channelInfo}
            index={index}
          />
        ))}
        
        {displayCount < allPosts.length && (
          <div 
            ref={observerTarget} 
            className="py-8 text-center"
          >
            {isLoadingMore && (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading more posts...</span>
              </div>
            )}
          </div>
        )}
        
        {displayCount >= allPosts.length && allPosts.length > 10 && (
          <div className="py-6 text-center">
            <p className="text-sm text-muted-foreground">
              You've reached the end • {allPosts.length} posts total
            </p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};
