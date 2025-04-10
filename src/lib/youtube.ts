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

// Parse ISO 8601 duration to get video duration in readable format
function formatDuration(duration: string): string {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  
  const hours = (match?.[1] || '').replace('H', '');
  const minutes = (match?.[2] || '').replace('M', '');
  const seconds = (match?.[3] || '').replace('S', '');
  
  let result = '';
  if (hours) result += `${hours}:`;
  if (minutes) result += `${hours ? minutes.padStart(2, '0') : minutes}:`;
  else result += '0:';
  if (seconds) result += seconds.padStart(2, '0');
  else result += '00';
  
  return result;
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
    const channelData = await channelResponse.json();
    const uploadsPlaylistId = channelData.items[0]?.contentDetails?.relatedPlaylists?.uploads;

    if (!uploadsPlaylistId) {
      console.error('Could not find uploads playlist for channel');
      return [];
    }

    // 2. Fetch playlist items page by page until we have enough
    let allPlaylistItems: any[] = [];
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

      const playlistData = await playlistResponse.json();

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
      .map((item: any) => item.contentDetails?.videoId)
      .filter(Boolean) // Filter out potential null/undefined IDs
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
    const videosData = await videosResponse.json();

    // Create a map for quick lookup of video details by ID
    // Explicitly type 'video' based on expected YouTube API structure
    const videoDetailsMap = new Map(videosData.items.map((video: { id: string; snippet: any; statistics: any; contentDetails: any }) => [video.id, video]));

    // 6. Format the video data, ensuring order matches relevantItems
     // Define the intermediate type explicitly to help TypeScript before filtering
     const formattedVideos: (YouTubeVideo | null)[] = relevantItems.map((item: any) => {
       const videoId = item.contentDetails?.videoId;
       // Explicitly type 'video' obtained from the map and assert its type
       const video = videoDetailsMap.get(videoId) as { id: string; snippet: any; statistics: any; contentDetails: any } | undefined;

       if (!video) {
         // This shouldn't happen if videoIds were fetched correctly, but handle defensively
         console.warn(`Details not found for video ID: ${videoId}`);
         return null; // Return null for filtering later
       }

       return {
         id: video.id,
         title: video.snippet.title,
         description: video.snippet.description,
         thumbnailUrl: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.medium?.url || video.snippet.thumbnails.default?.url,
         publishedAt: formatDate(video.snippet.publishedAt),
         viewCount: video.statistics?.viewCount, // Optional: viewCount might not always be present
         // duration: formatDuration(video.contentDetails.duration), // Uncomment if you added duration formatting
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