// Simple in-memory cache implementation
const memoryCache: Record<string, { data: unknown; expiry: number }> = {};

export async function getFromCache<T>(key: string): Promise<T | null> {
  try {
    // Check memory cache
    const item = memoryCache[key];
    if (item && item.expiry > Date.now()) {
      return item.data as T;
    } else if (item) {
      // Remove expired items
      delete memoryCache[key];
    }
    return null;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

export async function setInCache(key: string, data: unknown, expiryInSeconds = 86400): Promise<void> {
  try {
    // Use memory cache
    memoryCache[key] = {
      data,
      expiry: Date.now() + (expiryInSeconds * 1000)
    };
  } catch (error) {
    console.error('Cache set error:', error);
  }
}

export async function invalidateCache(key: string): Promise<void> {
  try {
    // Clear from memory cache
    delete memoryCache[key];
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
}

// Export a default object to avoid import errors in existing code
const redisClient = {};
export default redisClient; 