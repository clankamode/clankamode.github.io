'use client';

import { useEffect } from 'react';
import { useVideoContext } from '@/context/VideoContext';
import VideosList from '@/components/VideosList';
import { YouTubeVideo } from '@/lib/youtube';

interface MocksPageClientProps {
  initialVideos: YouTubeVideo[];
  initialHasMore: boolean;
}

export default function MocksPageClient({ 
  initialVideos, 
  initialHasMore 
}: MocksPageClientProps) {
  const { initializeState, isInitialized } = useVideoContext();

  useEffect(() => {
    // Only initialize if the context hasn't been initialized yet
    // This prevents re-initialization on page re-renders if context is already populated
    if (!isInitialized) {
      console.log('Initializing context from MocksPageClient...', { initialVideosCount: initialVideos.length, initialHasMore });
      initializeState(initialVideos, initialHasMore);
    }
  // Pass initialVideos and initialHasMore as dependencies to re-run if they change
  }, [initializeState, initialVideos, initialHasMore, isInitialized]); 

  // VideosList will get its data directly from the context
  return <VideosList />;
} 