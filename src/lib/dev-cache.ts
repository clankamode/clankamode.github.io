interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class DevCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private readonly isDev = process.env.NODE_ENV === 'development';
  
  private readonly defaultTTL = 24 * 60 * 60 * 1000;
  private readonly maxEntries = 100;
  
  get<T>(key: string): T | null {
    if (!this.isDev) return null;
    
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }
  
  set<T>(key: string, data: T, ttl?: number): void {
    if (!this.isDev) return;
    
    if (this.cache.size >= this.maxEntries && !this.cache.has(key)) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  generateKey(functionName: string, ...params: unknown[]): string {
    try {
      const paramsStr = JSON.stringify(params);
      return `${functionName}:${paramsStr}`;
    } catch {
      return `${functionName}:${params.length}`;
    }
  }
  
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export const devCache = new DevCache();

export function clearDevCache(): void {
  devCache.clear();
}

export function getCacheStats(): { size: number; keys: string[] } {
  return devCache.getStats();
}
