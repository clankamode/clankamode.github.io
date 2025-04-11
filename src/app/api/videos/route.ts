import { NextResponse } from 'next/server';
import { getChannelVideos } from '@/lib/youtube';

export async function GET(request: Request) {
  try {
    // Get query parameters
    const url = new URL(request.url);
    const channelId = url.searchParams.get('channelId');
    const skip = parseInt(url.searchParams.get('skip') || '0');
    const limit = parseInt(url.searchParams.get('limit') || '24');
    
    // Validate channelId
    if (!channelId) {
      return NextResponse.json(
        { error: 'Channel ID is required' },
        { status: 400 }
      );
    }
    
    // Fetch videos from YouTube
    const videos = await getChannelVideos(channelId, limit, skip);
    
    return NextResponse.json(videos);
  } catch (error: unknown) {
    console.error('Error fetching videos:', error);
    let errorMessage = 'Failed to fetch videos';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 