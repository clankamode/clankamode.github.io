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
  if (!process.env.YOUTUBE_API_KEY) {
    console.error('YouTube API key is missing');
    return [];
  }

  try {
    // 1. Get the uploads playlist ID
    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${process.env.YOUTUBE_API_KEY}`
    );
    if (!channelResponse.ok) {
      throw new Error(`YouTube API error (Channel): ${channelResponse.statusText}`);
    }
    // Consider adding a type for this response too for full type safety
    const channelData = await channelResponse.json();
    const uploadsPlaylistId = channelData.items[0]?.contentDetails?.relatedPlaylists?.uploads;

    if (!uploadsPlaylistId) {
      console.error('Could not find uploads playlist for channel');
      return [];
    }

    // 2. Fetch playlist items page by page until we have enough
    let allPlaylistItems: PlaylistItem[] = []; // Typed array
    let nextPageToken: string | undefined = undefined;
    const videosToSkip = skip;
    const videosToFetch = maxResults;
    const totalVideosNeeded = videosToSkip + videosToFetch;
    let videosFetchedSoFar = 0;

    do {
      const apiLimit = Math.min(50, totalVideosNeeded - videosFetchedSoFar); // Request up to 50, but no more than needed

      const playlistUrl = new URL(`https://www.googleapis.com/youtube/v3/playlistItems`);
      playlistUrl.searchParams.append('part', 'snippet,contentDetails');
      playlistUrl.searchParams.append('playlistId', uploadsPlaylistId);
      playlistUrl.searchParams.append('maxResults', apiLimit.toString());
      playlistUrl.searchParams.append('key', process.env.YOUTUBE_API_KEY!);
      if (nextPageToken) {
        playlistUrl.searchParams.append('pageToken', nextPageToken);
      }

      const playlistResponse = await fetch(playlistUrl.toString());
      if (!playlistResponse.ok) {
        // Log the response body for more details on the error
        const errorBody = await playlistResponse.text();
        console.error('YouTube API error details (PlaylistItems):', errorBody);
        throw new Error(`YouTube API error (PlaylistItems): ${playlistResponse.statusText}`);
      }

      const playlistData: YouTubeApiResponse<PlaylistItem> = await playlistResponse.json(); // Typed response

      if (playlistData.items) {
         allPlaylistItems = allPlaylistItems.concat(playlistData.items);
         videosFetchedSoFar += playlistData.items.length;
      }

      nextPageToken = playlistData.nextPageToken;

      // Stop if we have enough videos OR if there's no next page token
    } while (nextPageToken && videosFetchedSoFar < totalVideosNeeded);


    // 3. Slice the collected items to get the desired page
    const relevantItems = allPlaylistItems.slice(videosToSkip, videosToSkip + videosToFetch);

    if (relevantItems.length === 0) {
      return []; // No videos found for this skip/limit combination
    }

    // 4. Get video IDs for detailed video info
    const videoIds = relevantItems
      .map((item: PlaylistItem) => item.contentDetails?.videoId) // Use PlaylistItem type
      .filter((id): id is string => !!id) // Type guard for filtering null/undefined
      .join(',');

    if (!videoIds) {
      console.warn('No valid video IDs found in relevant playlist items.');
      return [];
    }

    // 5. Get detailed video information (statistics, etc.)
    const videosResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds}&key=${process.env.YOUTUBE_API_KEY}`
    );
    if (!videosResponse.ok) {
      throw new Error(`YouTube API error (Videos): ${videosResponse.statusText}`);
    }
    const videosData: YouTubeApiResponse<VideoItem> = await videosResponse.json(); // Typed response

    // Create a map for quick lookup of video details by ID
    const videoDetailsMap = new Map(videosData.items.map((video: VideoItem) => [video.id, video])); // Use VideoItem type

    // 6. Format the video data, ensuring order matches relevantItems
     const formattedVideos: (YouTubeVideo | null)[] = relevantItems.map((item: PlaylistItem) => { // Use PlaylistItem type
       const videoId = item.contentDetails?.videoId;
       if (!videoId) return null; // Skip if videoId is missing

       const video = videoDetailsMap.get(videoId); // Type is VideoItem | undefined

       // Ensure video and required properties exist before trying to access them
       if (!video || !video.snippet || !video.contentDetails) {
         console.warn(`Details not found or incomplete for video ID: ${videoId}`);
         return null; // Return null for filtering later
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
    console.error('Error fetching YouTube videos:', error);
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