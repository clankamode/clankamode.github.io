'use client';

import { useState, useEffect, useRef } from 'react';
import VideoCard from '@/components/ui/VideoCard';
import { YouTubeVideo } from '@/lib/youtube';

interface VideosListProps {
  initialVideos: YouTubeVideo[];
  channelId: string;
}

export default function VideosList({ initialVideos, channelId }: VideosListProps) {
  const [videos, setVideos] = useState<YouTubeVideo[]>(initialVideos);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const loaderRef = useRef<HTMLDivElement>(null);

  // Set up intersection observer to detect when user scrolls to bottom
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !loading) {
          loadMoreVideos();
        }
      },
      { threshold: 1.0 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current);
      }
    };
  }, [hasMore, loading]);

  // Function to load more videos
  const loadMoreVideos = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    
    try {
      // Calculate how many videos to skip based on current videos length
      const skip = videos.length;
      
      // Fetch next batch of videos
      const response = await fetch(`/api/videos?channelId=${channelId}&skip=${skip}&limit=6`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch more videos');
      }
      
      const newVideos = await response.json();
      
      // If we received less videos than requested, there are no more to load
      if (newVideos.length === 0 || newVideos.length < 6) {
        setHasMore(false);
      }
      
      // Add new videos to the list
      if (newVideos.length > 0) {
        setVideos((prevVideos) => [...prevVideos, ...newVideos]);
        setPage((prevPage) => prevPage + 1);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more videos:', error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  // If no videos were found initially, show error message
  if (videos.length === 0) {
    return (
      <div className="bg-[#282828] rounded-lg p-8 text-center">
        <div className="w-16 h-16 bg-[#2cbb5d]/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-[#2cbb5d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">No Videos Found</h3>
        <p className="text-gray-400 mb-4">
          Please check your YouTube API key and channel ID in the .env.local file.
        </p>
        <a 
          href="/"
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[#2cbb5d] rounded-lg hover:bg-[#28a754] focus:ring-2 focus:ring-[#2cbb5d]/50 transition-all duration-300"
        >
          Return to Home
        </a>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {videos.map((video) => (
          <VideoCard
            key={video.id}
            title={video.title}
            description={video.description}
            thumbnailUrl={video.thumbnailUrl}
            videoUrl={video.videoUrl}
            date={video.publishedAt}
            viewCount={video.viewCount}
          />
        ))}
      </div>
      
      {/* Loading indicator and intersection observer target */}
      {hasMore && (
        <div 
          ref={loaderRef} 
          className="flex justify-center items-center mt-12"
        >
          {loading ? (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-[#2cbb5d] rounded-full animate-pulse"></div>
              <div className="w-3 h-3 bg-[#2cbb5d] rounded-full animate-pulse delay-150"></div>
              <div className="w-3 h-3 bg-[#2cbb5d] rounded-full animate-pulse delay-300"></div>
              <span className="text-gray-400 ml-2">Loading more videos...</span>
            </div>
          ) : (
            <div className="text-gray-500 py-4">Scroll for more videos</div>
          )}
        </div>
      )}
      
      {/* End of videos message */}
      {!hasMore && videos.length > 0 && (
        <div className="text-center mt-12 py-4 text-gray-400">
          <p>You've reached the end of the videos</p>
          <a 
            href={`https://youtube.com/channel/${channelId}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-4 py-2 mt-4 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            See all videos on YouTube
          </a>
        </div>
      )}
    </>
  );
} 