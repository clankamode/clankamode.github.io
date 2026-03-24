import { NextRequest, NextResponse } from 'next/server';
import { getChannelAnalytics } from '@/lib/youtube';
import { getFromCache, setInCache } from '@/lib/redis';
import { getAuthToken } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const channelId = url.searchParams.get('channelId');
    const forceRefresh = url.searchParams.get('refresh') === 'true';

    if (forceRefresh) {
      const token = await getAuthToken(request);
      if (!token) {
        return NextResponse.json(
          { error: 'Authentication required for refresh' },
          { status: 401 }
        );
      }
    }

    if (!channelId) {
      return NextResponse.json(
        { error: 'Channel ID is required' },
        { status: 400 }
      );
    }

    const cacheKey = `analytics:${channelId}`;

    if (!forceRefresh) {
      const cachedData = await getFromCache(cacheKey);
      if (cachedData) {
        return NextResponse.json(cachedData);
      }
    }
    
    const analytics = await getChannelAnalytics(channelId);

    if (!analytics) {
      return NextResponse.json(
        { error: 'Failed to fetch analytics' },
        { status: 500 }
      );
    }

    await setInCache(cacheKey, analytics, 86400);

    return NextResponse.json(analytics);
  } catch (error: unknown) {
    console.error('Error fetching analytics:', error);
    let errorMessage = 'Failed to fetch analytics';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 
