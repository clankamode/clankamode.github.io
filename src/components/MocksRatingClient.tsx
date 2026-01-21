'use client';

import { useState, useEffect } from 'react';
import { useVideoContext } from '@/context/VideoContext';
import { YouTubeVideo } from '@/lib/youtube';
import VideoRatingCard from './ui/VideoRatingCard';

interface MocksRatingClientProps {
  initialVideos: YouTubeVideo[];
  initialHasMore: boolean;
}

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function MocksRatingClient({ 
  initialVideos, 
  initialHasMore 
}: MocksRatingClientProps) {
  const { initializeState, isInitialized, loadMoreVideos, videos, hasMore, loading } = useVideoContext();
  const [currentVideoIndex, setCurrentVideoIndex] = useState<number>(0);
  const [ratings, setRatings] = useState<Record<string, string>>({});

  useEffect(() => {
    // Only initialize if the context hasn't been initialized yet
    if (!isInitialized) {
      // Shuffle the videos before initializing
      const shuffledVideos = shuffleArray(initialVideos);
      console.log('Initializing context from MocksRatingClient with shuffled videos...', { 
        initialVideosCount: shuffledVideos.length, 
        initialHasMore 
      });
      initializeState(shuffledVideos, initialHasMore);
    }
  }, [initializeState, initialVideos, initialHasMore, isInitialized]);

  // Load more videos when we're approaching the end of the current list
  useEffect(() => {
    if (videos.length > 0 && hasMore && !loading && videos.length - currentVideoIndex <= 3) {
      loadMoreVideos();
    }
  }, [videos.length, currentVideoIndex, hasMore, loading, loadMoreVideos]);

  const handleRating = (videoId: string, rating: string) => {
    // Store the rating
    setRatings(prev => ({
      ...prev,
      [videoId]: rating
    }));
    
    // Move to the next video
    setCurrentVideoIndex(prevIndex => {
      if (prevIndex < videos.length - 1) {
        return prevIndex + 1;
      }
      return prevIndex;
    });
  };

  if (videos.length === 0) {
    return (
      <div className="frame bg-surface-workbench p-8 text-center">
        <div className="w-16 h-16 bg-brand-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-foreground mb-2">No Videos Found</h3>
        <p className="text-muted-foreground mb-4">
          Could not fetch videos. Please check the channel ID or API key.
        </p>
      </div>
    );
  }

  const currentVideo = videos[currentVideoIndex];
  const isLastVideo = currentVideoIndex === videos.length - 1 && !hasMore;

  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-3xl">
        {currentVideo && (
          <VideoRatingCard
            key={currentVideo.id}
            video={currentVideo}
            onRate={handleRating}
            currentRating={ratings[currentVideo.id]}
          />
        )}
      </div>
      
      {isLastVideo && (
        <div className="mt-8 text-center p-6 bg-surface-workbench rounded-lg border border-border-subtle">
          <h2 className="text-3xl font-bold text-foreground mb-4">All Done!</h2>
          <p className="text-muted-foreground">You&apos;ve rated all available mock interview videos.</p>
          
          {Object.keys(ratings).length > 0 && (
            <div className="mt-6">
              <h3 className="text-2xl text-foreground mb-4">Your Ratings Summary:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                {Object.entries(ratings).map(([videoId, rating]) => {
                  const video = videos.find(v => v.id === videoId);
                  return video ? (
                    <div key={videoId} className="bg-surface-interactive p-4 rounded-lg border border-border-subtle">
                      <p className="text-foreground font-medium mb-2 line-clamp-1">{video.title}</p>
                      <p className="text-brand-green">Rating: {rating}</p>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 