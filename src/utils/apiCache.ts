/**
 * API Response Cache Utility
 * Implements intelligent caching strategies for API responses
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  etag?: string;
  maxAge: number;
}

interface CacheOptions {
  maxAge?: number; // Time in milliseconds
  useSessionStorage?: boolean;
  useIndexedDB?: boolean;
  cacheKey?: string;
  etag?: string;
}

class APICache {
  private memoryCache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_MAX_AGE = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_MEMORY_ENTRIES = 100;
  private dbName = 'trefa_api_cache';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  constructor() {
    this.initIndexedDB();
    this.startCacheCleanup();
  }

  /**
   * Initialize IndexedDB for persistent caching
   */
  private async initIndexedDB(): Promise<void> {
    if (typeof window === 'undefined' || !('indexedDB' in window)) return;

    try {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Failed to open IndexedDB');
      };

      request.onsuccess = () => {
        this.db = request.result;
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('cache')) {
          const store = db.createObjectStore('cache', { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    } catch (error) {
      console.error('IndexedDB initialization failed:', error);
    }
  }

  /**
   * Get cached data
   */
  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    // Check memory cache first
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && this.isValid(memoryEntry)) {
      return memoryEntry.data;
    }

    // Check session storage
    if (options.useSessionStorage) {
      const sessionEntry = this.getFromSessionStorage<T>(key);
      if (sessionEntry && this.isValid(sessionEntry)) {
        // Populate memory cache
        this.memoryCache.set(key, sessionEntry);
        return sessionEntry.data;
      }
    }

    // Check IndexedDB
    if (options.useIndexedDB && this.db) {
      const dbEntry = await this.getFromIndexedDB<T>(key);
      if (dbEntry && this.isValid(dbEntry)) {
        // Populate memory cache
        this.memoryCache.set(key, dbEntry);
        return dbEntry.data;
      }
    }

    return null;
  }

  /**
   * Set cached data
   */
  async set<T>(
    key: string,
    data: T,
    options: CacheOptions = {}
  ): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      maxAge: options.maxAge || this.DEFAULT_MAX_AGE,
      etag: options.etag,
    };

    // Save to memory cache
    this.memoryCache.set(key, entry);
    this.enforceMemoryLimit();

    // Save to session storage
    if (options.useSessionStorage) {
      this.setToSessionStorage(key, entry);
    }

    // Save to IndexedDB
    if (options.useIndexedDB && this.db) {
      await this.setToIndexedDB(key, entry);
    }
  }

  /**
   * Clear specific cache entry
   */
  async clear(key: string): Promise<void> {
    this.memoryCache.delete(key);

    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem(this.getStorageKey(key));
      } catch {}
    }

    if (this.db) {
      await this.deleteFromIndexedDB(key);
    }
  }

  /**
   * Clear all cache
   */
  async clearAll(): Promise<void> {
    this.memoryCache.clear();

    if (typeof window !== 'undefined') {
      try {
        const keys = Object.keys(sessionStorage);
        keys.forEach(key => {
          if (key.startsWith('api_cache_')) {
            sessionStorage.removeItem(key);
          }
        });
      } catch {}
    }

    if (this.db) {
      await this.clearIndexedDB();
    }
  }

  /**
   * Check if cache entry is still valid
   */
  private isValid<T>(entry: CacheEntry<T>): boolean {
    const now = Date.now();
    return now - entry.timestamp < entry.maxAge;
  }

  /**
   * Get from session storage
   */
  private getFromSessionStorage<T>(key: string): CacheEntry<T> | null {
    if (typeof window === 'undefined') return null;

    try {
      const stored = sessionStorage.getItem(this.getStorageKey(key));
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to get from sessionStorage:', error);
    }
    return null;
  }

  /**
   * Set to session storage
   */
  private setToSessionStorage<T>(key: string, entry: CacheEntry<T>): void {
    if (typeof window === 'undefined') return;

    try {
      sessionStorage.setItem(
        this.getStorageKey(key),
        JSON.stringify(entry)
      );
    } catch (error) {
      // Handle quota exceeded error
      if (error instanceof DOMException && error.code === 22) {
        this.clearOldSessionStorageEntries();
        try {
          sessionStorage.setItem(
            this.getStorageKey(key),
            JSON.stringify(entry)
          );
        } catch {}
      }
    }
  }

  /**
   * Get from IndexedDB
   */
  private async getFromIndexedDB<T>(key: string): Promise<CacheEntry<T> | null> {
    if (!this.db) return null;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        resolve(null);
      };
    });
  }

  /**
   * Set to IndexedDB
   */
  private async setToIndexedDB<T>(key: string, entry: CacheEntry<T>): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.put({ key, ...entry });

      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
    });
  }

  /**
   * Delete from IndexedDB
   */
  private async deleteFromIndexedDB(key: string): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
    });
  }

  /**
   * Clear IndexedDB
   */
  private async clearIndexedDB(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
    });
  }

  /**
   * Generate storage key
   */
  private getStorageKey(key: string): string {
    return `api_cache_${key}`;
  }

  /**
   * Enforce memory cache size limit
   */
  private enforceMemoryLimit(): void {
    if (this.memoryCache.size > this.MAX_MEMORY_ENTRIES) {
      const keysToDelete: string[] = [];
      let count = 0;

      // Delete oldest entries
      this.memoryCache.forEach((value, key) => {
        if (count < this.memoryCache.size - this.MAX_MEMORY_ENTRIES) {
          keysToDelete.push(key);
          count++;
        }
      });

      keysToDelete.forEach(key => this.memoryCache.delete(key));
    }
  }

  /**
   * Clear old session storage entries
   */
  private clearOldSessionStorageEntries(): void {
    if (typeof window === 'undefined') return;

    try {
      const entries: Array<{ key: string; timestamp: number }> = [];

      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('api_cache_')) {
          try {
            const entry = JSON.parse(sessionStorage.getItem(key) || '{}');
            entries.push({ key, timestamp: entry.timestamp || 0 });
          } catch {}
        }
      });

      // Sort by timestamp and remove oldest half
      entries.sort((a, b) => a.timestamp - b.timestamp);
      const toRemove = Math.floor(entries.length / 2);

      for (let i = 0; i < toRemove; i++) {
        sessionStorage.removeItem(entries[i].key);
      }
    } catch {}
  }

  /**
   * Start periodic cache cleanup
   */
  private startCacheCleanup(): void {
    if (typeof window === 'undefined') return;

    // Clean up expired entries every 5 minutes
    setInterval(() => {
      // Clean memory cache
      this.memoryCache.forEach((entry, key) => {
        if (!this.isValid(entry)) {
          this.memoryCache.delete(key);
        }
      });

      // Clean session storage
      try {
        Object.keys(sessionStorage).forEach(key => {
          if (key.startsWith('api_cache_')) {
            try {
              const entry = JSON.parse(sessionStorage.getItem(key) || '{}');
              if (entry.timestamp && entry.maxAge) {
                if (Date.now() - entry.timestamp > entry.maxAge) {
                  sessionStorage.removeItem(key);
                }
              }
            } catch {}
          }
        });
      } catch {}
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Create a cache key from request parameters
   */
  createKey(url: string, params?: Record<string, any>): string {
    let key = url;
    if (params) {
      const sortedParams = Object.keys(params)
        .sort()
        .map(k => `${k}=${params[k]}`)
        .join('&');
      key = `${url}?${sortedParams}`;
    }
    return btoa(key).replace(/[^a-zA-Z0-9]/g, '');
  }

  /**
   * Invalidate cache entries matching a pattern
   */
  async invalidatePattern(pattern: string | RegExp): Promise<void> {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

    // Clear from memory cache
    this.memoryCache.forEach((_, key) => {
      if (regex.test(key)) {
        this.memoryCache.delete(key);
      }
    });

    // Clear from session storage
    if (typeof window !== 'undefined') {
      try {
        Object.keys(sessionStorage).forEach(key => {
          if (key.startsWith('api_cache_') && regex.test(key)) {
            sessionStorage.removeItem(key);
          }
        });
      } catch {}
    }
  }
}

// Create singleton instance
const apiCache = new APICache();

// Export cache instance and utilities
export default apiCache;

/**
 * HOC for caching API calls
 */
export function withCache<T>(
  fetcher: () => Promise<T>,
  key: string,
  options: CacheOptions = {}
): () => Promise<T> {
  return async () => {
    // Try to get from cache
    const cached = await apiCache.get<T>(key, options);
    if (cached !== null) {
      return cached;
    }

    // Fetch fresh data
    const data = await fetcher();

    // Cache the result
    await apiCache.set(key, data, options);

    return data;
  };
}

/**
 * React Query integration
 */
export function createCachedQueryFn<T>(
  fetcher: () => Promise<T>,
  cacheKey: string,
  cacheOptions: CacheOptions = {}
) {
  return withCache(fetcher, cacheKey, cacheOptions);
}
