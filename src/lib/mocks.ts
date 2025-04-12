import { YouTubeVideo } from '@/lib/youtube';

// Define the initial load limit
export const INITIAL_LOAD_LIMIT = 24;

// ID of the mock interview playlist (hardcoded)
const MOCK_INTERVIEWS_PLAYLIST_ID = "PL1_cEA1Q0Z88gH5ZdnKaUH55SHn6sobzW"; // Mock interview playlist ID

// Helper function to format date
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Type for YouTube API video
interface VideoDetails {
  id: string;
  snippet: {
    title: string;
    description: string;
    publishedAt: string;
    thumbnails: {
      high?: { url: string };
      medium?: { url: string };
      default?: { url: string };
    };
  };
  contentDetails: {
    videoId?: string;
    duration?: string;
  };
  statistics?: {
    viewCount?: string;
  };
}

// Function to fetch videos from the YouTube API
export async function getPlaylistVideos(
  playlistId: string,
  maxResults: number = 24,
  skip: number = 0
): Promise<YouTubeVideo[]> {
  if (!process.env.YOUTUBE_API_KEY) {
    console.error('YouTube API key is missing');
    return [];
  }

  try {
    // 1. Fetch playlist items page by page until we have enough
    let allPlaylistItems: {
      contentDetails?: {
        videoId?: string;
      };
      snippet?: {
        title?: string;
        description?: string;
        publishedAt?: string;
        thumbnails?: {
          high?: { url: string };
          medium?: { url: string };
          default?: { url: string };
        };
      };
    }[] = [];
    let nextPageToken: string | undefined = undefined;
    const videosToSkip = skip;
    const videosToFetch = maxResults;
    const totalVideosNeeded = videosToSkip + videosToFetch;
    let videosFetchedSoFar = 0;

    do {
      const apiLimit = Math.min(50, totalVideosNeeded - videosFetchedSoFar);

      const playlistUrl = new URL(`https://www.googleapis.com/youtube/v3/playlistItems`);
      playlistUrl.searchParams.append('part', 'snippet,contentDetails');
      playlistUrl.searchParams.append('playlistId', playlistId);
      playlistUrl.searchParams.append('maxResults', apiLimit.toString());
      playlistUrl.searchParams.append('key', process.env.YOUTUBE_API_KEY!);
      if (nextPageToken) {
        playlistUrl.searchParams.append('pageToken', nextPageToken);
      }

      const playlistResponse = await fetch(playlistUrl.toString());
      if (!playlistResponse.ok) {
        const errorBody = await playlistResponse.text();
        console.error('YouTube API error details (PlaylistItems):', errorBody);
        throw new Error(`YouTube API error (PlaylistItems): ${playlistResponse.statusText}`);
      }

      const playlistData = await playlistResponse.json();

      if (playlistData.items) {
         allPlaylistItems = allPlaylistItems.concat(playlistData.items);
         videosFetchedSoFar += playlistData.items.length;
      }

      nextPageToken = playlistData.nextPageToken;
    } while (nextPageToken && videosFetchedSoFar < totalVideosNeeded);

    // 2. Slice the collected items to get the desired page
    const relevantItems = allPlaylistItems.slice(videosToSkip, videosToSkip + videosToFetch);

    if (relevantItems.length === 0) {
      return []; // No videos found for this skip/limit combination
    }

    // 3. Get video IDs for detailed video info
    const videoIds = relevantItems
      .map(item => item.contentDetails?.videoId)
      .filter((id): id is string => !!id)
      .join(',');

    if (!videoIds) {
      console.warn('No valid video IDs found in relevant playlist items.');
      return [];
    }

    // 4. Get detailed video information (statistics, etc.)
    const videosResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds}&key=${process.env.YOUTUBE_API_KEY}`
    );
    if (!videosResponse.ok) {
      throw new Error(`YouTube API error (Videos): ${videosResponse.statusText}`);
    }
    const videosData = await videosResponse.json();

    // 5. Create a map for quick lookup of video details by ID
    const videoDetailsMap = new Map<string, VideoDetails>();
    
    for (const video of videosData.items) {
      videoDetailsMap.set(video.id, video);
    }

    // 6. Format the video data, ensuring order matches relevantItems
    const formattedVideos: YouTubeVideo[] = [];
    
    for (const item of relevantItems) {
      const videoId = item.contentDetails?.videoId;
      if (!videoId) continue;

      const video = videoDetailsMap.get(videoId);
      if (!video || !video.snippet || !video.contentDetails) {
        console.warn(`Details not found or incomplete for video ID: ${videoId}`);
        continue;
      }

      formattedVideos.push({
        id: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        thumbnailUrl: video.snippet.thumbnails.high?.url || 
                     video.snippet.thumbnails.medium?.url || 
                     video.snippet.thumbnails.default?.url || '',
        publishedAt: formatDate(video.snippet.publishedAt),
        viewCount: video.statistics?.viewCount,
        videoUrl: `https://www.youtube.com/watch?v=${video.id}`
      });
    }

    return formattedVideos;
  } catch (error) {
    console.error('Error fetching playlist videos:', error);
    return [];
  }
}

// Get initial mock interview videos
export async function getInitialMockVideos() {
  try {
    const videos = await getPlaylistVideos(MOCK_INTERVIEWS_PLAYLIST_ID, INITIAL_LOAD_LIMIT);
    // Determine if there are potentially more videos
    const hasMore = videos.length === INITIAL_LOAD_LIMIT;
    return { videos, hasMore };
  } catch (error) {
    console.error('Error fetching mock interview videos:', error);
    return { videos: [], hasMore: false };
  }
} 