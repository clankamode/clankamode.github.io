import { supabase } from '@/lib/supabase';

/**
 * Calculates the total duration of all videos in the Videos table
 * @returns Promise<number> Total duration in seconds
 */
export async function getTotalVideosDuration(): Promise<number> {
  try {
    // Just get all durations and sum them up in code
    const { data, error } = await supabase
      .from('Videos')
      .select('duration');

    if (error) {
      console.error('Error fetching video durations:', error);
      return 0;
    }

    // Sum up all non-null durations
    return data.reduce((sum, video) => sum + (video.duration || 0), 0);
  } catch (error) {
    console.error('Error calculating total duration:', error);
    return 0;
  }
}

// Define the initial load limit
export const INITIAL_LOAD_LIMIT = 24;

// Get recent videos from Supabase
export async function getRecentVideos(limit: number = 6, offset: number = 0) {
  try {
    const { data, error, count } = await supabase
      .from('Videos')
      .select('*', { count: 'exact' })
      .order('date_uploaded', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching videos from Supabase:', error);
      return { videos: [], hasMore: false };
    }

    const videos = data as Video[];
    const hasMore = count ? offset + limit < count : false;

    return { videos, hasMore };
  } catch (error) {
    console.error('Error fetching videos:', error);
    return { videos: [], hasMore: false };
  }
}

// Transform Video to YouTubeVideo format
function transformToYouTubeVideo(video: Video) {
  return {
    id: video.id,
    title: video.title,
    description: video.description,
    thumbnailUrl: video.thumbnail || '',
    publishedAt: new Date(video.date_uploaded).toLocaleDateString(),
    videoUrl: `https://www.youtube.com/watch?v=${video.id}`
  };
}

// Initial load of videos
export async function getInitialVideos() {
  const { videos, hasMore } = await getRecentVideos(INITIAL_LOAD_LIMIT);
  return {
    videos: videos.map(transformToYouTubeVideo),
    hasMore
  };
}

// Load more videos after initial load
export async function loadMoreVideos(skip: number) {
  const { videos, hasMore } = await getRecentVideos(INITIAL_LOAD_LIMIT, skip);
  return {
    videos: videos.map(transformToYouTubeVideo),
    hasMore
  };
}

// API route handler for videos
export async function handleVideoRequest(skip: number = 0, limit: number = INITIAL_LOAD_LIMIT) {
  try {
    const { videos, hasMore } = await getRecentVideos(limit, skip);
    return { 
      videos: videos.map(transformToYouTubeVideo), 
      hasMore 
    };
  } catch (error) {
    console.error('Error handling video request:', error);
    throw error;
  }
} 