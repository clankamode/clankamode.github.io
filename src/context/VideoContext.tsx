'use client';

import React, { createContext, useState, useContext, ReactNode, useCallback, useRef } from 'react';
import { YouTubeVideo } from '@/lib/youtube';
import { usePathname } from 'next/navigation';

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
  initialLoadLimit?: number;
}

export const VideoProvider = ({ 
  children, 
  channelId, 
  initialLoadLimit = 24
}: VideoProviderProps) => {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [isInitialized, setIsInitialized] = useState(false);
  const isFetchingRef = useRef(false);
  const pathname = usePathname();

  const initializeState = useCallback((initialVideos: YouTubeVideo[], initialHasMore: boolean) => {
    if (!isInitialized) {
      setVideos(initialVideos);
      setHasMore(initialHasMore);
      setIsInitialized(true);
      setPage(1);
      console.log('VideoContext Initialized');
    }
  }, [isInitialized]);

  const loadMoreVideos = useCallback(async () => {
    if (isFetchingRef.current || loading || !hasMore || !isInitialized) {
        console.log('Load more aborted:', { loading, hasMore, isInitialized });
        return;
    }

    console.log('Loading more videos...', { currentPage: page, currentSkip: videos.length });
    isFetchingRef.current = true;
    setLoading(true);
    
    try {
      const skip = videos.length;
      const limit = initialLoadLimit;
      const apiUrl = pathname.includes('/mocks') 
        ? `/api/mocks?skip=${skip}&limit=${limit}`
        : `/api/videos?channelId=${channelId}&skip=${skip}&limit=${limit}`;
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch more videos');
      }
      
      const newVideos: YouTubeVideo[] = await response.json();
      console.log('Received new videos:', newVideos.length);
      
      setVideos((prevVideos) => [...prevVideos, ...newVideos]);

      if (newVideos.length < limit) {
        console.log('Reached end of videos.');
        setHasMore(false);
      } else {
         setPage((prevPage) => prevPage + 1);
      }

    } catch (error) {
      console.error('Error loading more videos:', error);
      setHasMore(false);
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, [loading, hasMore, videos, page, channelId, isInitialized, initialLoadLimit, pathname]);

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
