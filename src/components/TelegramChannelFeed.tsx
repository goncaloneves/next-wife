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
  const [displayedPosts, setDisplayedPosts] = useState<TelegramPost[]>([]);
  const [displayCount, setDisplayCount] = useState(10);
  const [channelInfo, setChannelInfo] = useState<ChannelInfo | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isNearTop, setIsNearTop] = useState(true);
  const [pendingNewCount, setPendingNewCount] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

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
      
      // Check for new posts
      if (allPosts.length > 0 && fetchedPosts.length > 0) {
        const newPostIds = fetchedPosts.slice(0, 5).map((p: TelegramPost) => p.id);
        const existingIds = allPosts.slice(0, 5).map(p => p.id);
        const hasNewPosts = newPostIds.some((id: string) => !existingIds.includes(id));
        
        if (hasNewPosts && !isNearTop) {
          // Show banner instead of disrupting scroll
          const newCount = fetchedPosts.findIndex((p: TelegramPost) => allPosts.some(existing => existing.id === p.id));
          setPendingNewCount(newCount > 0 ? newCount : 1);
          return;
        }
      }
      
      setAllPosts(fetchedPosts);
      setDisplayedPosts(fetchedPosts.slice(0, Math.max(displayCount, displayedPosts.length)));
      setChannelInfo(data.channelInfo);
      setError(null);
      setLoading(false);
      setPendingNewCount(0);
      
      console.log(`Fetched ${fetchedPosts.length} total posts`);
    } catch (err) {
      console.error('Error fetching Telegram posts:', err);
      setError('Unable to load channel posts');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    
    // Only refetch when page becomes visible and user is near top
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isNearTop) {
        fetchPosts();
      }
    };
    
    window.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [channelUsername, isNearTop]);

  const handleScroll = () => {
    if (!listRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    const nearTop = scrollTop < 100;
    setIsNearTop(nearTop);
    
    // Load more when near bottom
    const nearBottom = scrollHeight - scrollTop - clientHeight < 500;
    if (nearBottom && displayCount < allPosts.length && !isLoadingMore) {
      loadMorePosts();
    }
  };

  const handleNewPostsClick = () => {
    fetchPosts();
    setPendingNewCount(0);
    if (listRef.current) {
      listRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };


  const loadMorePosts = () => {
    if (isLoadingMore || displayCount >= allPosts.length) return;
    
    setIsLoadingMore(true);
    
    const newCount = Math.min(displayCount + 10, allPosts.length);
    setDisplayCount(newCount);
    setDisplayedPosts(allPosts.slice(0, newCount));
    setIsLoadingMore(false);
    
    console.log(`Showing ${newCount} of ${allPosts.length} posts`);
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
        className="h-[900px] overflow-y-auto rounded-lg"
      >
        <div className="space-y-4">
          {displayedPosts.map((post) => (
            <TelegramPostCard
              key={post.id}
              post={post}
              channelInfo={channelInfo}
              animate={false}
            />
          ))}
          
          {displayCount < allPosts.length && (
            <div className="py-8 text-center">
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
      </div>
    </div>
  );
};
