import { NextResponse } from 'next/server';
import { getChannelVideos } from '@/lib/youtube';

export async function GET(request: Request) {
  try {
    // Get query parameters
    const url = new URL(request.url);
    const channelId = url.searchParams.get('channelId');
    const skip = parseInt(url.searchParams.get('skip') || '0');
    const limit = parseInt(url.searchParams.get('limit') || '6');
    
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
  } catch (error: any) {
    console.error('Error fetching videos:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch videos' },
      { status: 500 }
    );
  }
} 