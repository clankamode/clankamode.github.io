import { NextResponse } from 'next/server';
import { handleVideoRequest } from '@/lib/videos';

export async function GET(request: Request) {
  try {
    // Get query parameters
    const url = new URL(request.url);
    const skip = parseInt(url.searchParams.get('skip') || '0');
    const limit = parseInt(url.searchParams.get('limit') || '24');
    
    // Fetch videos from Supabase
    const { videos, hasMore } = await handleVideoRequest(skip, limit);
    
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