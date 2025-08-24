import { getChannelVideos } from '@/lib/youtube';
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

// Initial load of videos
export async function getInitialVideos() {
  const channelId = process.env.YOUTUBE_CHANNEL_ID;
  if (!channelId) {
    console.error('YouTube channel ID not found in environment variables');
    return { videos: [], hasMore: false }; // Return object with hasMore
  }
  try {
    const videos = await getChannelVideos(channelId, INITIAL_LOAD_LIMIT);
    // Determine if there are potentially more videos
    const hasMore = videos.length === INITIAL_LOAD_LIMIT;
    return { videos, hasMore };
  } catch (error) {
    console.error('Error fetching YouTube videos:', error);
    return { videos: [], hasMore: false }; // Return object with hasMore
  }
} 