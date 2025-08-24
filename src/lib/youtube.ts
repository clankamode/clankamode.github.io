export interface VideoData {
  id: string;
  snippet?: {
    title?: string;
    description?: string;
    publishedAt?: string;
    thumbnails?: {
      high?: {
        url?: string;
      };
    };
  };
  contentDetails?: {
    duration?: string;
  };
  liveStreamingDetails?: {
    actualStartTime?: string;
  };
}

import { getRecentVideos } from './videos';

// YouTube API types
export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  viewCount?: string;
  videoUrl: string;
}

export interface ChannelStats {
  id: string;
  title: string;
  description: string;
  customUrl?: string;
  thumbnailUrl: string;
  subscriberCount: string;
  viewCount: string;
  videoCount: string;
}

// Interfaces for YouTube API responses

interface YouTubeThumbnail {
  url: string;
  width?: number; // Optional based on API
  height?: number; // Optional based on API
}

interface YouTubeThumbnails {
  default?: YouTubeThumbnail;
  medium?: YouTubeThumbnail;
  high?: YouTubeThumbnail;
  standard?: YouTubeThumbnail;
  maxres?: YouTubeThumbnail;
}

// For playlistItems list response
interface PlaylistItemSnippet {
  publishedAt: string;
  channelId: string;
  title: string;
  description: string;
  thumbnails: YouTubeThumbnails;
  channelTitle: string;
  playlistId: string;
  position: number;
  resourceId: {
    kind: string;
    videoId: string;
  };
  videoOwnerChannelTitle?: string; // Optional
  videoOwnerChannelId?: string; // Optional
}

interface PlaylistItemContentDetails {
  videoId: string;
  videoPublishedAt?: string; // Optional
}

interface PlaylistItem {
  kind: string;
  etag: string;
  id: string;
  snippet: PlaylistItemSnippet;
  contentDetails: PlaylistItemContentDetails;
}

// For videos list response
interface VideoSnippet {
  publishedAt: string;
  channelId: string;
  title: string;
  description: string;
  thumbnails: YouTubeThumbnails;
  channelTitle: string;
  tags?: string[]; // Optional
  categoryId?: string; // Optional
  liveBroadcastContent?: string; // Optional
  defaultLanguage?: string; // Optional
  localized?: {
    title: string;
    description: string;
  };
  defaultAudioLanguage?: string; // Optional
}

interface VideoStatistics {
  viewCount?: string; // Optional because linter found it might not be present
  likeCount?: string; // Optional
  dislikeCount?: string; // Optional, deprecated
  favoriteCount?: string; // Optional
  commentCount?: string; // Optional
}

interface VideoContentDetails {
  duration: string;
  dimension: string;
  definition: string;
  caption: string;
  licensedContent: boolean;
  contentRating?: object; // Use object instead of {}
  projection?: string; // Optional
}

interface VideoItem {
  kind: string;
  etag: string;
  id: string;
  snippet: VideoSnippet;
  contentDetails: VideoContentDetails;
  statistics?: VideoStatistics; // Optional based on current usage and note
}

// For search list response
interface SearchItemId {
    kind: string;
    videoId?: string; // Optional depending on item type
    channelId?: string; // Optional
    playlistId?: string; // Optional
}

interface SearchItemSnippet {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: YouTubeThumbnails;
    channelTitle: string;
    liveBroadcastContent: string;
    publishTime?: string; // Optional
}

interface SearchItem {
    kind: string;
    etag: string;
    id: SearchItemId;
    snippet: SearchItemSnippet;
}

// YouTube API Response Structures
interface YouTubeApiResponse<T> {
    kind: string;
    etag: string;
    nextPageToken?: string;
    prevPageToken?: string; // Optional
    pageInfo: {
        totalResults: number;
        resultsPerPage: number;
    };
    items: T[];
}

// Format publishedAt date to a more readable format
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

// Format numbers for better readability
export function formatCount(count: string | number): string {
  const num = typeof count === 'string' ? parseInt(count) : count;
  
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  } else {
    return num.toString();
  }
}

// Fetch channel statistics
export async function getChannelStats(channelId: string): Promise<ChannelStats | null> {
  if (!process.env.YOUTUBE_API_KEY) {
    console.error('YouTube API key is missing');
    return null;
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${process.env.YOUTUBE_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      console.error('Channel not found');
      return null;
    }
    
    const channel = data.items[0];
    
    return {
      id: channel.id,
      title: channel.snippet.title,
      description: channel.snippet.description,
      customUrl: channel.snippet.customUrl,
      thumbnailUrl: channel.snippet.thumbnails.high?.url || channel.snippet.thumbnails.default?.url,
      subscriberCount: channel.statistics.subscriberCount,
      viewCount: channel.statistics.viewCount,
      videoCount: channel.statistics.videoCount
    };
  } catch (error) {
    console.error('Error fetching channel stats:', error);
    return null;
  }
}

// Fetch videos from a specific channel with pagination support
export async function getChannelVideos(
  channelId: string,
  maxResults: number = 6, // Keep the frontend's default limit
  skip: number = 0
): Promise<YouTubeVideo[]> {
  try {
    const { videos } = await getRecentVideos(maxResults, skip);
    
    // Transform Video type to YouTubeVideo type
    return videos.map(video => ({
      id: video.id,
      title: video.title,
      description: video.description,
      thumbnailUrl: video.thumbnail || '',
      publishedAt: formatDate(video.date_uploaded),
      viewCount: undefined, // We don't store this in Supabase
      videoUrl: `https://www.youtube.com/watch?v=${video.id}`
    }));
  } catch (error) {
    console.error('Error fetching videos:', error);
    return []; // Return empty array on error
  }
}

// Fetch popular videos from a specific channel
export async function getPopularChannelVideos(
  channelId: string,
  maxResults: number = 3
): Promise<YouTubeVideo[]> {
  if (!process.env.YOUTUBE_API_KEY) {
    console.error('YouTube API key is missing');
    return [];
  }

  try {
    // Use search.list to find videos for the channel, ordered by view count
    const searchUrl = new URL(`https://www.googleapis.com/youtube/v3/search`);
    searchUrl.searchParams.append('part', 'snippet');
    searchUrl.searchParams.append('channelId', channelId);
    searchUrl.searchParams.append('maxResults', maxResults.toString());
    searchUrl.searchParams.append('order', 'viewCount'); // Order by popularity
    searchUrl.searchParams.append('type', 'video'); // Only search for videos
    searchUrl.searchParams.append('key', process.env.YOUTUBE_API_KEY!);

    const searchResponse = await fetch(searchUrl.toString());
    if (!searchResponse.ok) {
        // Log the response body for more details on the error
        const errorBody = await searchResponse.text();
        console.error('YouTube API error details (Search):', errorBody);
        throw new Error(`YouTube API error (Search): ${searchResponse.statusText}`);
    }
    const searchData: YouTubeApiResponse<SearchItem> = await searchResponse.json(); // Typed response

    if (!searchData.items || searchData.items.length === 0) {
        console.warn('No popular videos found via search.');
        return [];
    }

    // Get video IDs from search results
    const videoIds = searchData.items
        .map((item: SearchItem) => item.id?.videoId) // Use SearchItem type
        .filter((id): id is string => !!id) // Type guard for filtering null/undefined
        .join(',');

    if (!videoIds) {
        console.warn('No valid video IDs found in search results.');
        return [];
    }

    // Get detailed video information (reuse the same fetch logic)
    const videosResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds}&key=${process.env.YOUTUBE_API_KEY}`
    );
    if (!videosResponse.ok) {
      throw new Error(`YouTube API error (Videos): ${videosResponse.statusText}`);
    }
    const videosData: YouTubeApiResponse<VideoItem> = await videosResponse.json(); // Typed response

    // Create a map for quick lookup
    const videoDetailsMap = new Map(videosData.items.map((video: VideoItem) => [video.id, video])); // Use VideoItem type

    // Format the video data, ensuring order matches search results
     const formattedVideos: (YouTubeVideo | null)[] = searchData.items.map((item: SearchItem) => { // Use SearchItem type
        const videoId = item.id?.videoId;
        if (!videoId) return null; // Skip if videoId is missing

        const video = videoDetailsMap.get(videoId); // Type is VideoItem | undefined

        // Ensure video and required properties exist
        if (!video || !video.snippet || !video.contentDetails) {
            console.warn(`Details not found or incomplete for video ID: ${videoId}`);
            return null;
        }

        return {
            id: video.id,
            title: video.snippet.title,
            description: video.snippet.description,
            // Provide a fallback empty string if no thumbnail is found
            thumbnailUrl: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.medium?.url || video.snippet.thumbnails.default?.url || '',
            publishedAt: formatDate(video.snippet.publishedAt),
            viewCount: video.statistics?.viewCount, // Safely access optional property
            videoUrl: `https://www.youtube.com/watch?v=${video.id}`
        };
     });

    // Filter out any nulls and assert the final type
    return formattedVideos.filter((video): video is YouTubeVideo => video !== null);

  } catch (error) {
    console.error('Error fetching popular YouTube videos:', error);
    return []; // Return empty array on error
  }
}

// Analytics interfaces
export interface VideoAnalytics {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  viewCount: string;
  likeCount?: string;
  commentCount?: string;
  duration: string;
  category?: string; 
  videoUrl: string;
}

export interface ChannelAnalytics extends ChannelStats {
  topVideos: VideoAnalytics[];
  videoCategoryDistribution: Record<string, number>;
  uploadFrequency: Record<string, number>;
  videoDurationDistribution: Record<string, number>;
  averageViewsPerVideo: number;
  mostRecentUploadDate: string;
}

// Base URL for YouTube API
const YT_BASE = 'https://www.googleapis.com/youtube/v3';

// Helper function to make YouTube API requests
async function ytGet<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${YT_BASE}/${path}`);
  params.key = process.env.YOUTUBE_API_KEY!;
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`YouTube API error ${res.status}: ${text}`);
  }
  return res.json();
}

// Fetch playlist items with pagination
interface PlaylistItemsResponse {
  items: Array<{
    contentDetails?: {
      videoId?: string;
    };
  }>;
  nextPageToken?: string;
}

export async function fetchPlaylistItems(playlistId: string, pageToken?: string, numResults: string = '50'): Promise<PlaylistItemsResponse> {
  return ytGet<PlaylistItemsResponse>('playlistItems', {
    part: 'contentDetails',
    playlistId,
    maxResults: numResults,
    ...(pageToken ? { pageToken } : {}),
  });
}

// Get uploads playlist ID for a channel
export async function getUploadsPlaylistId(channelId: string): Promise<string> {
  const data = await ytGet<{
    items: Array<{
      contentDetails: {
        relatedPlaylists: {
          uploads: string;
        };
      };
    }>;
  }>('channels', {
    part: 'contentDetails',
    id: channelId,
    maxResults: '1',
  });
  const item = data.items?.[0];
  if (!item) throw new Error('Channel not found or no contentDetails available.');
  return item.contentDetails.relatedPlaylists.uploads;
}

// Iterate through all video IDs in a playlist
export async function* iteratePlaylistVideoIds(playlistId: string): AsyncGenerator<string> {
  let pageToken;
  do {
    const data = await fetchPlaylistItems(playlistId, pageToken, '50');
    for (const it of data.items || []) {
      const vid = it.contentDetails?.videoId;
      if (vid) yield vid;
    }
    pageToken = data.nextPageToken;
  } while (pageToken);
}

// Fetch detailed video data for a list of video IDs
export async function fetchVideosByIds(videoIds: string[]): Promise<VideoData[]> {
  if (videoIds.length === 0) return [];
  const data = await ytGet<{
    items: VideoData[];
  }>('videos', {
    part: 'snippet,statistics,contentDetails,liveStreamingDetails',
    id: videoIds.join(','),
    maxResults: '50',
  });
  return data.items || [];
}

// Helper function to parse ISO 8601 duration to minutes
export function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  const hours = parseInt(match?.[1] || '0');
  const minutes = parseInt(match?.[2] || '0');
  const seconds = parseInt(match?.[3] || '0');
  return hours * 60 + minutes + (seconds / 60);
}

// Group durations into categories for visualization
export function categorizeDuration(durationMinutes: number): string {
  if (durationMinutes < 5) return 'Under 5 min';
  if (durationMinutes < 10) return '5-10 min';
  if (durationMinutes < 20) return '10-20 min';
  if (durationMinutes < 30) return '20-30 min';
  if (durationMinutes < 60) return '30-60 min';
  return 'Over 60 min';
}

// Format a date to YYYY-MM for upload frequency analysis
export function formatYearMonth(dateString: string): string {
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

// Get channel analytics
export async function getChannelAnalytics(channelId: string): Promise<ChannelAnalytics | null> {
  if (!process.env.YOUTUBE_API_KEY) {
    console.error('YouTube API key is missing');
    return null;
  }

  try {
    // Get basic channel stats
    const channelStats = await getChannelStats(channelId);
    if (!channelStats) {
      return null;
    }

    // Get videos for analytics (larger quantity)
    const allVideos = await getChannelVideos(channelId, 50, 0);
    if (!allVideos || allVideos.length === 0) {
      return null;
    }

    // Get detailed video information for analytics
    const videoIds = allVideos.map(video => video.id).join(',');
    const videosResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds}&key=${process.env.YOUTUBE_API_KEY}`
    );

    if (!videosResponse.ok) {
      throw new Error(`YouTube API error: ${videosResponse.statusText}`);
    }

    const videosData = await videosResponse.json();
    
    if (!videosData.items || videosData.items.length === 0) {
      console.error('No video details found');
      return null;
    }

    // Process videos for analytics
    const videoAnalytics: VideoAnalytics[] = videosData.items.map((video: VideoItem) => {
      // Parse duration but don't store in a variable since it's not used
      parseDuration(video.contentDetails.duration);
      
      return {
        id: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        thumbnailUrl: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default?.url || '',
        publishedAt: video.snippet.publishedAt,
        viewCount: video.statistics?.viewCount || '0',
        likeCount: video.statistics?.likeCount,
        commentCount: video.statistics?.commentCount,
        duration: video.contentDetails.duration,
        category: video.snippet.categoryId, // This is a numeric ID that needs to be mapped later
        videoUrl: `https://www.youtube.com/watch?v=${video.id}`
      };
    });

    // Sort by view count for top videos
    const topVideos = [...videoAnalytics].sort((a, b) => 
      parseInt(b.viewCount) - parseInt(a.viewCount)
    ).slice(0, 10);

    // Calculate video category distribution
    const videoCategoryDistribution: Record<string, number> = {};
    videoAnalytics.forEach(video => {
      const category = video.category || 'Unknown';
      videoCategoryDistribution[category] = (videoCategoryDistribution[category] || 0) + 1;
    });

    // Calculate upload frequency
    const uploadFrequency: Record<string, number> = {};
    videoAnalytics.forEach(video => {
      const yearMonth = formatYearMonth(video.publishedAt);
      uploadFrequency[yearMonth] = (uploadFrequency[yearMonth] || 0) + 1;
    });

    // Calculate duration distribution
    const videoDurationDistribution: Record<string, number> = {};
    videoAnalytics.forEach(video => {
      const durationMinutes = parseDuration(video.duration);
      const category = categorizeDuration(durationMinutes);
      videoDurationDistribution[category] = (videoDurationDistribution[category] || 0) + 1;
    });

    // Calculate average views per video
    const totalViews = videoAnalytics.reduce((sum, video) => sum + parseInt(video.viewCount || '0'), 0);
    const averageViewsPerVideo = Math.round(totalViews / videoAnalytics.length);

    // Find most recent upload date
    const sortedByDate = [...videoAnalytics].sort((a, b) => 
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
    const mostRecentUploadDate = sortedByDate[0]?.publishedAt || '';

    return {
      ...channelStats,
      topVideos,
      videoCategoryDistribution,
      uploadFrequency,
      videoDurationDistribution,
      averageViewsPerVideo,
      mostRecentUploadDate
    };
  } catch (error) {
    console.error('Error fetching channel analytics:', error);
    return null;
  }
} 