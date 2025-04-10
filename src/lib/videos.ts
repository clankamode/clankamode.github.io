import { getChannelVideos } from '@/lib/youtube';

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