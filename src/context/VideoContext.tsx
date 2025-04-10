'use client';

import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { YouTubeVideo } from '@/lib/youtube';

interface VideoContextState {
  videos: YouTubeVideo[];
  loading: boolean;
  hasMore: boolean;
  page: number;
  isInitialized: boolean;
  loadMoreVideos: () => Promise<void>;
  initializeState: (initialVideos: YouTubeVideo[], initialHasMore: boolean) => void;
}

const VideoContext = createContext<VideoContextState | undefined>(undefined);

interface VideoProviderProps {
  children: ReactNode;
  channelId: string;
  initialLoadLimit?: number; // How many videos to load per page
}

export const VideoProvider = ({ 
  children, 
  channelId, 
  initialLoadLimit = 6 // Default limit per fetch
}: VideoProviderProps) => {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1); // Keep track of logical page number if needed
  const [isInitialized, setIsInitialized] = useState(false);

  const initializeState = useCallback((initialVideos: YouTubeVideo[], initialHasMore: boolean) => {
    if (!isInitialized) {
      setVideos(initialVideos);
      setHasMore(initialHasMore); // Set based on initial fetch result
      setIsInitialized(true);
      setPage(1); // Reset page number on initialization
      console.log('VideoContext Initialized');
    }
  }, [isInitialized]); // Dependency ensures this only runs once effectively

  const loadMoreVideos = useCallback(async () => {
    if (loading || !hasMore || !isInitialized) {
        console.log('Load more aborted:', { loading, hasMore, isInitialized });
        return;
    }

    console.log('Loading more videos...', { currentPage: page, currentSkip: videos.length });
    setLoading(true);
    
    try {
      const skip = videos.length; // Calculate skip based on current state
      const limit = initialLoadLimit;
      
      const response = await fetch(`/api/videos?channelId=${channelId}&skip=${skip}&limit=${limit}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch more videos');
      }
      
      const newVideos: YouTubeVideo[] = await response.json();
      console.log('Received new videos:', newVideos.length);
      
      setVideos((prevVideos) => [...prevVideos, ...newVideos]);
      
      // Update hasMore based on the number of videos received
      if (newVideos.length < limit) {
        console.log('Reached end of videos.');
        setHasMore(false);
      } else {
         setPage((prevPage) => prevPage + 1); // Increment page conceptually
      }

    } catch (error) {
      console.error('Error loading more videos:', error);
      setHasMore(false); // Stop trying if there's an error
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, videos, page, channelId, isInitialized, initialLoadLimit]);

  const contextValue: VideoContextState = {
    videos,
    loading,
    hasMore,
    page,
    isInitialized,
    loadMoreVideos,
    initializeState,
  };

  return (
    <VideoContext.Provider value={contextValue}>
      {children}
    </VideoContext.Provider>
  );
};

export const useVideoContext = (): VideoContextState => {
  const context = useContext(VideoContext);
  if (context === undefined) {
    throw new Error('useVideoContext must be used within a VideoProvider');
  }
  return context;
}; 