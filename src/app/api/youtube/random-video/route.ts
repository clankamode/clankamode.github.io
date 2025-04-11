import { NextResponse } from 'next/server';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID; // Your YouTube Channel ID
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

async function getUploadsPlaylistId(channelId: string): Promise<string | null> {
  const url = `${BASE_URL}/channels?part=contentDetails&id=${channelId}&key=${YOUTUBE_API_KEY}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error('YouTube API Error (Channels):', await response.text());
      return null;
    }
    const data = await response.json();
    return data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads || null;
  } catch (error) {
    console.error('Error fetching uploads playlist ID:', error);
    return null;
  }
}

async function getRandomVideoIdFromPlaylist(playlistId: string): Promise<string | null> {
  let allVideoIds: string[] = [];
  let nextPageToken: string | undefined = undefined;

  try {
    // Fetch all videos from the playlist, handling pagination
    do {
      let url = `${BASE_URL}/playlistItems?part=contentDetails&playlistId=${playlistId}&key=${YOUTUBE_API_KEY}&maxResults=50`;
      if (nextPageToken) {
        url += `&pageToken=${nextPageToken}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        console.error('YouTube API Error (PlaylistItems):', await response.text());
        return null; // Stop if any page fetch fails
      }
      const data = await response.json();

      const videoIds = data.items
        ?.map((item: any) => item.contentDetails?.videoId)
        .filter(Boolean) || []; // Filter out any potential nulls/undefined
      allVideoIds = [...allVideoIds, ...videoIds];

      nextPageToken = data.nextPageToken;

    } while (nextPageToken);

    if (allVideoIds.length === 0) {
      console.error('No videos found in the playlist.');
      return null;
    }

    // Select a random video ID
    const randomIndex = Math.floor(Math.random() * allVideoIds.length);
    return allVideoIds[randomIndex];

  } catch (error) {
    console.error('Error fetching playlist items:', error);
    return null;
  }
}

export async function GET() {
  if (!YOUTUBE_API_KEY) {
    return NextResponse.json({ error: 'YouTube API key is not configured.' }, { status: 500 });
  }
  if (!YOUTUBE_CHANNEL_ID) {
    return NextResponse.json({ error: 'YouTube Channel ID is not configured.' }, { status: 500 });
  }

  const uploadsPlaylistId = await getUploadsPlaylistId(YOUTUBE_CHANNEL_ID);

  if (!uploadsPlaylistId) {
    return NextResponse.json({ error: 'Could not find uploads playlist ID for the channel.' }, { status: 500 });
  }

  const randomVideoId = await getRandomVideoIdFromPlaylist(uploadsPlaylistId);

  if (!randomVideoId) {
    return NextResponse.json({ error: 'Could not retrieve a random video ID from the playlist.' }, { status: 500 });
  }

  return NextResponse.json({ videoId: randomVideoId });
} 