import Redis from 'ioredis';

// Initialize Redis client
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Cache TTL in seconds (24 hours)
const CACHE_TTL = 24 * 60 * 60;

// Cache keys
export const CACHE_KEYS = {
  CHANNEL_VIDEOS: (channelId: string, skip: number, limit: number) => 
    `channel:${channelId}:videos:${skip}:${limit}`,
  CHANNEL_STATS: (channelId: string) => 
    `channel:${channelId}:stats`,
  POPULAR_VIDEOS: (channelId: string, limit: number) => 
    `channel:${channelId}:popular:${limit}`,
  UPLOADS_PLAYLIST: (channelId: string) => 
    `channel:${channelId}:uploads_playlist`
};

// Generic cache get function
export async function getFromCache<T>(key: string): Promise<T | null> {
  try {
    const cached = await redis.get(key);
    if (cached) {
      return JSON.parse(cached) as T;
    }
    return null;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
}

// Generic cache set function
export async function setInCache(key: string, value: any, ttl = CACHE_TTL): Promise<void> {
  try {
    await redis.setex(key, ttl, JSON.stringify(value));
  } catch (error) {
    console.error('Redis set error:', error);
  }
}

// Clear cache for a channel
export async function clearChannelCache(channelId: string): Promise<void> {
  try {
    const pattern = `channel:${channelId}:*`;
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error('Redis clear cache error:', error);
  }
}

export default redis; 