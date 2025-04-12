import { NextResponse } from 'next/server';
import { getPlaylistVideos } from '@/lib/mocks';

// The mock interviews playlist ID (same as in mocks.ts)
const DEFAULT_PLAYLIST_ID = "PL1_cEA1Q0Z88gH5ZdnKaUH55SHn6sobzW";

export async function GET(request: Request) {
  try {
    // Get query parameters
    const url = new URL(request.url);
    const playlistId = url.searchParams.get('playlistId') || DEFAULT_PLAYLIST_ID;
    const skip = parseInt(url.searchParams.get('skip') || '0');
    const limit = parseInt(url.searchParams.get('limit') || '24');
    
    // Validate playlistId
    if (!playlistId) {
      return NextResponse.json(
        { error: 'Playlist ID is required' },
        { status: 400 }
      );
    }
    
    // Fetch videos from YouTube
    const videos = await getPlaylistVideos(playlistId, limit, skip);
    
    return NextResponse.json(videos);
  } catch (error: unknown) {
    console.error('Error fetching mock videos:', error);
    let errorMessage = 'Failed to fetch mock videos';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 