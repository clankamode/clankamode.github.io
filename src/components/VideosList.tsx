'use client';

import { useEffect, useRef } from 'react';
import { useVideoContext } from '@/context/VideoContext';
import VideoCard from '@/components/ui/VideoCard';

export default function VideosList() {
  const { videos, loading, hasMore, loadMoreVideos } = useVideoContext();
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !loading) {
          console.log('Intersection observer triggered loadMoreVideos');
          loadMoreVideos();
        }
      },
      { threshold: 1.0 }
    );

    const currentLoaderRef = loaderRef.current;
    if (currentLoaderRef) {
      observer.observe(currentLoaderRef);
    }

    return () => {
      if (currentLoaderRef) {
        observer.unobserve(currentLoaderRef);
      }
    };
  }, [hasMore, loading, loadMoreVideos]);

  if (!loading && videos.length === 0 && hasMore === false) {
    return (
      <div className="bg-[#282828] rounded-lg p-8 text-center">
        <div className="w-16 h-16 bg-[#2cbb5d]/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-[#2cbb5d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">No Videos Found</h3>
        <p className="text-gray-400 mb-4">
          Could not fetch videos. Please check the channel ID or API key.
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
      
      {!hasMore && videos.length > 0 && (
        <div className="text-center mt-12 py-4 text-gray-400">
          <p>You've reached the end of the videos</p>
        </div>
      )}
    </>
  );
} 