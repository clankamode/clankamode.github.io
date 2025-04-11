'use client';

import { useEffect } from 'react';
import { useVideoContext } from '@/context/VideoContext';
import VideosList from '@/components/VideosList';
import { YouTubeVideo } from '@/lib/youtube';

interface VideosPageClientProps {
  initialVideos: YouTubeVideo[];
  
  initialHasMore: boolean; // Pass whether the initial fetch indicated more videos
}

export default function VideosPageClient({ 
  initialVideos, 
  
  initialHasMore 
}: VideosPageClientProps) {
  const { initializeState, isInitialized } = useVideoContext();

  useEffect(() => {
    // Only initialize if the context hasn't been initialized yet
    // This prevents re-initialization on page re-renders if context is already populated
    if (!isInitialized) {
       console.log('Initializing context from VideosPageClient...', { initialVideosCount: initialVideos.length, initialHasMore });
      initializeState(initialVideos, initialHasMore);
    }
  // Pass initialVideos and initialHasMore as dependencies to re-run if they change
  // Although in this setup, they likely won't change after initial load on the server
  }, [initializeState, initialVideos, initialHasMore, isInitialized]); 

  // VideosList will now get its data directly from the context
  return <VideosList />;
} 