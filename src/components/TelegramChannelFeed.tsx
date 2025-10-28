import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Loader2, ArrowUp } from "lucide-react";
import { TelegramPostCard } from "./TelegramPostCard";
import { Button } from "@/components/ui/button";

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
  const [channelInfo, setChannelInfo] = useState<ChannelInfo | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isNearTop, setIsNearTop] = useState(true);
  const [pendingNewCount, setPendingNewCount] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  const fetchInitialPosts = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tg-channel-feed?channel=${channelUsername}&limit=20`,
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
      setChannelInfo(data.channelInfo);
      setNextCursor(data.nextBefore);
      setHasMore(data.hasMore);
      setError(null);
      setLoading(false);
      setPendingNewCount(0);
      
      console.log(`Fetched initial ${fetchedPosts.length} posts, nextCursor: ${data.nextBefore}`);
    } catch (err) {
      console.error('Error fetching Telegram posts:', err);
      setError('Unable to load channel posts');
      setLoading(false);
    }
  };

  const fetchNextPage = async () => {
    if (!hasMore || isLoadingMore || !nextCursor) return;
    
    setIsLoadingMore(true);
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tg-channel-feed?channel=${channelUsername}&limit=20&before=${nextCursor}`,
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch more posts');
      }

      const data = await response.json();
      const newPosts = data.posts || [];
      
      // Deduplicate using Set
      const existingIds = new Set(allPosts.map(p => p.id));
      const uniqueNewPosts = newPosts.filter((p: TelegramPost) => !existingIds.has(p.id));
      
      setAllPosts(prev => [...prev, ...uniqueNewPosts]);
      setNextCursor(data.nextBefore);
      setHasMore(data.hasMore);
      
      console.log(`Fetched ${uniqueNewPosts.length} more posts, nextCursor: ${data.nextBefore}, hasMore: ${data.hasMore}`);
    } catch (err) {
      console.error('Error fetching more posts:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const checkForNewPosts = async () => {
    if (!isNearTop) return;
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tg-channel-feed?channel=${channelUsername}&limit=20`,
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (!response.ok) return;

      const data = await response.json();
      const fetchedPosts = data.posts || [];
      
      // Check for new posts
      if (allPosts.length > 0 && fetchedPosts.length > 0) {
        const newPostIds = fetchedPosts.slice(0, 5).map((p: TelegramPost) => p.id);
        const existingIds = allPosts.slice(0, 5).map(p => p.id);
        const hasNewPosts = newPostIds.some((id: string) => !existingIds.includes(id));
        
        if (hasNewPosts && !isNearTop) {
          const newCount = fetchedPosts.findIndex((p: TelegramPost) => allPosts.some(existing => existing.id === p.id));
          setPendingNewCount(newCount > 0 ? newCount : 1);
          return;
        }
        
        if (hasNewPosts && isNearTop) {
          setAllPosts(fetchedPosts);
          setNextCursor(data.nextBefore);
          setHasMore(data.hasMore);
          setPendingNewCount(0);
        }
      }
    } catch (err) {
      console.error('Error checking for new posts:', err);
    }
  };

  useEffect(() => {
    fetchInitialPosts();
    
    // Only refetch when page becomes visible and user is near top
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isNearTop) {
        checkForNewPosts();
      }
    };
    
    window.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [channelUsername]);

  const handleScroll = () => {
    if (!listRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    const nearTop = scrollTop < 100;
    setIsNearTop(nearTop);
    
    // Load more when near bottom
    const nearBottom = scrollHeight - scrollTop - clientHeight < 500;
    if (nearBottom && hasMore && !isLoadingMore) {
      fetchNextPage();
    }
  };

  const handleNewPostsClick = () => {
    fetchInitialPosts();
    setPendingNewCount(0);
    if (listRef.current) {
      listRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
    <div className="relative">
      {pendingNewCount > 0 && (
        <Button
          onClick={handleNewPostsClick}
          className="absolute top-4 left-1/2 -translate-x-1/2 z-10 shadow-lg"
          size="sm"
        >
          <ArrowUp className="w-4 h-4 mr-2" />
          {pendingNewCount} new {pendingNewCount === 1 ? 'post' : 'posts'}
        </Button>
      )}
      
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="h-[70vh] max-h-[700px] overflow-y-auto rounded-lg"
      >
        <div className="space-y-4">
          {allPosts.map((post) => (
            <TelegramPostCard
              key={post.id}
              post={post}
              channelInfo={channelInfo}
              animate={false}
            />
          ))}
          
          {hasMore && isLoadingMore && (
            <div className="py-8 text-center">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading more posts...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
