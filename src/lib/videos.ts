import { supabase } from './supabase';

export interface Video {
  id: string;
  title: string;
  description: string;
  duration: number | null;
  date_uploaded: string;
  thumbnail: string;
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

// Initial load of videos
export async function getInitialVideos() {
  return getRecentVideos(INITIAL_LOAD_LIMIT);
} 