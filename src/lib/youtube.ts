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
  maxResults: number = 5,
  skip: number = 0
): Promise<YouTubeVideo[]> {
  if (!process.env.YOUTUBE_API_KEY) {
    console.error('YouTube API key is missing');
    return [];
  }

  try {
    // First get the upload playlist ID for the channel
    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${process.env.YOUTUBE_API_KEY}`
    );
    
    if (!channelResponse.ok) {
      throw new Error(`YouTube API error: ${channelResponse.statusText}`);
    }
    
    const channelData = await channelResponse.json();
    const uploadsPlaylistId = channelData.items[0]?.contentDetails?.relatedPlaylists?.uploads;
    
    if (!uploadsPlaylistId) {
      console.error('Could not find uploads playlist for channel');
      return [];
    }
    
    // Get videos from the uploads playlist with pagination
    // YouTube API uses pageToken for pagination, but we'll simulate skip/limit
    // by requesting more videos and then slicing them
    const totalToFetch = skip + maxResults;
    const fetchLimit = Math.min(totalToFetch, 50); // API limit is 50
    
    const playlistResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=${fetchLimit}&playlistId=${uploadsPlaylistId}&key=${process.env.YOUTUBE_API_KEY}`
    );
    
    if (!playlistResponse.ok) {
      throw new Error(`YouTube API error: ${playlistResponse.statusText}`);
    }
    
    const playlistData = await playlistResponse.json();
    
    // If we don't have enough videos or if requested index is out of bounds
    if (skip >= playlistData.items.length) {
      return [];
    }
    
    // Get the subset of videos we need
    const relevantItems = playlistData.items.slice(skip, skip + maxResults);
    
    // Get video IDs for detailed video info
    const videoIds = relevantItems.map((item: any) => item.contentDetails.videoId).join(',');
    
    if (!videoIds) {
      return [];
    }
    
    // Get detailed video information
    const videosResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds}&key=${process.env.YOUTUBE_API_KEY}`
    );
    
    if (!videosResponse.ok) {
      throw new Error(`YouTube API error: ${videosResponse.statusText}`);
    }
    
    const videosData = await videosResponse.json();
    
    // Format the video data
    return videosData.items.map((video: any) => ({
      id: video.id,
      title: video.snippet.title,
      description: video.snippet.description,
      thumbnailUrl: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.medium?.url || video.snippet.thumbnails.default?.url,
      publishedAt: formatDate(video.snippet.publishedAt),
      viewCount: video.statistics?.viewCount,
      videoUrl: `https://www.youtube.com/watch?v=${video.id}`
    }));
  } catch (error) {
    console.error('Error fetching YouTube videos:', error);
    return [];
  }
} 