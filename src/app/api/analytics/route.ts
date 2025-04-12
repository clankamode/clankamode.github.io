import { NextResponse } from 'next/server';
import { getChannelAnalytics } from '@/lib/youtube';
import { getFromCache, setInCache } from '@/lib/redis';

// Rate limiting tracker (in-memory for simplicity)
const requestCounts: Record<string, { count: number; timestamp: number }> = {};

// Rate limit of 5 requests per minute
const RATE_LIMIT = 5;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds

export async function GET(request: Request) {
  try {
    // Get query parameters
    const url = new URL(request.url);
    const channelId = url.searchParams.get('channelId');
    const forceRefresh = url.searchParams.get('refresh') === 'true';
    
    // IP-based rate limiting (for a real app, use more robust solution)
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    
    // Check rate limit
    if (requestCounts[clientIp]) {
      const { count, timestamp } = requestCounts[clientIp];
      const now = Date.now();
      
      if (now - timestamp < RATE_LIMIT_WINDOW) {
        if (count >= RATE_LIMIT) {
          return NextResponse.json(
            { error: 'Rate limit exceeded. Try again later.' },
            { status: 429 }
          );
        }
        
        requestCounts[clientIp].count += 1;
      } else {
        // Reset for new time window
        requestCounts[clientIp] = { count: 1, timestamp: now };
      }
    } else {
      requestCounts[clientIp] = { count: 1, timestamp: Date.now() };
    }
    
    // Validate channelId
    if (!channelId) {
      return NextResponse.json(
        { error: 'Channel ID is required' },
        { status: 400 }
      );
    }
    
    // Generate cache key
    const cacheKey = `analytics:${channelId}`;
    
    // Try to get data from cache first if not forcing refresh
    if (!forceRefresh) {
      const cachedData = await getFromCache(cacheKey);
      if (cachedData) {
        return NextResponse.json(cachedData);
      }
    }
    
    // Fetch analytics data
    const analytics = await getChannelAnalytics(channelId);
    
    if (!analytics) {
      return NextResponse.json(
        { error: 'Failed to fetch analytics' },
        { status: 500 }
      );
    }
    
    // Store in cache for 24 hours (86400 seconds)
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