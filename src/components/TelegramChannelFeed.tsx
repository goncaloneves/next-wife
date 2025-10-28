import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Loader2, ArrowUp, X, ChevronLeft, ChevronRight } from "lucide-react";
import { TelegramPostCard } from "./TelegramPostCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

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
  layout?: 'list' | 'grid';
}

export const TelegramChannelFeed = ({
  channelUsername,
  refreshInterval = 3000,
  maxPosts = 20,
  layout = 'list'
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
  const [selectedPost, setSelectedPost] = useState<TelegramPost | null>(null);
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

  // Keyboard navigation for grid layout
  useEffect(() => {
    if (layout !== 'grid' || !selectedPost) return;

    const postsWithMedia = allPosts.filter(post => post.media);
    const currentIndex = postsWithMedia.findIndex(p => p.id === selectedPost.id);
    const hasPrevious = currentIndex > 0;
    const hasNext = currentIndex < postsWithMedia.length - 1;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && hasPrevious) {
        setSelectedPost(postsWithMedia[currentIndex - 1]);
      } else if (e.key === 'ArrowRight' && hasNext) {
        setSelectedPost(postsWithMedia[currentIndex + 1]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [layout, selectedPost, allPosts]);

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

  if (layout === 'grid') {
    const postsWithMedia = allPosts.filter(post => post.media);
    const currentIndex = selectedPost ? postsWithMedia.findIndex(p => p.id === selectedPost.id) : -1;
    const hasPrevious = currentIndex > 0;
    const hasNext = currentIndex < postsWithMedia.length - 1;

    const navigateToPost = (direction: 'prev' | 'next') => {
      if (direction === 'prev' && hasPrevious) {
        setSelectedPost(postsWithMedia[currentIndex - 1]);
      } else if (direction === 'next' && hasNext) {
        setSelectedPost(postsWithMedia[currentIndex + 1]);
      }
    };

    return (
      <>
        <div className="relative">
          {pendingNewCount > 0 && (
            <Button
              onClick={handleNewPostsClick}
              className="absolute -top-12 left-1/2 -translate-x-1/2 z-10 shadow-lg"
              size="sm"
            >
              <ArrowUp className="w-4 h-4 mr-2" />
              {pendingNewCount} new {pendingNewCount === 1 ? 'post' : 'posts'}
            </Button>
          )}
          
          <div
            ref={listRef}
            onScroll={handleScroll}
            className="h-[70vh] max-h-[700px] overflow-y-auto"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
              {postsWithMedia.map((post) => (
                <div
                  key={post.id}
                  className="aspect-[3/4] cursor-pointer overflow-hidden group relative"
                  onClick={() => setSelectedPost(post)}
                >
                  <img
                    src={post.media!}
                    alt="Post"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                </div>
              ))}
            </div>
            
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

        {/* Instagram-style Lightbox */}
        <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 bg-black border-none">
            <Button
              onClick={() => setSelectedPost(null)}
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-50 rounded-full hover:bg-white/10 text-white"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </Button>

            {/* Previous Button */}
            {hasPrevious && (
              <Button
                onClick={() => navigateToPost('prev')}
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 z-50 rounded-full hover:bg-white/10 text-white"
                aria-label="Previous"
              >
                <ChevronLeft className="w-8 h-8" />
              </Button>
            )}

            {/* Next Button */}
            {hasNext && (
              <Button
                onClick={() => navigateToPost('next')}
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 z-50 rounded-full hover:bg-white/10 text-white"
                aria-label="Next"
              >
                <ChevronRight className="w-8 h-8" />
              </Button>
            )}
            
            {selectedPost && (
              <div className="flex flex-col md:flex-row max-h-[95vh]">
                {/* Image */}
                <div className="flex-shrink-0 flex items-center justify-center bg-black md:max-w-[60vw]">
                  <img
                    src={selectedPost.media!}
                    alt="Post media fullscreen"
                    className="max-h-[95vh] w-auto object-contain"
                  />
                </div>
                
                {/* Content Sidebar */}
                <div className="md:w-[400px] bg-background flex flex-col max-h-[95vh]">
                  {/* Header */}
                  <div className="flex items-center gap-3 p-4 border-b border-border">
                    <Avatar className="w-10 h-10">
                      <AvatarImage 
                        src={selectedPost.avatar || channelInfo?.avatar || undefined} 
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
                    </div>
                  </div>

                  {/* Caption */}
                  <div className="flex-1 overflow-y-auto p-4">
                    {selectedPost.text && (
                      <div className="flex gap-3">
                        <Avatar className="w-10 h-10 flex-shrink-0">
                          <AvatarImage 
                            src={selectedPost.avatar || channelInfo?.avatar || undefined} 
                            alt={channelInfo?.name || 'Channel'}
                          />
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {(channelInfo?.name || 'CH').slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm">
                            <span className="font-semibold mr-2">{channelInfo?.name || 'Channel'}</span>
                            <span className="text-foreground whitespace-pre-wrap">{selectedPost.text}</span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatDistanceToNow(new Date(selectedPost.date), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </>
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
