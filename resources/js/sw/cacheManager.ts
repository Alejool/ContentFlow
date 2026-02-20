/**
 * Cache Manager for Service Worker
 * Handles caching strategies, LRU eviction, and cache invalidation
 */

import { errorLogger } from '../Utils/errorLogger';
import { cacheLogger } from '../Utils/cacheLogger';

// Cache configuration
const CACHE_VERSION = 'v1';
export const CACHE_NAMES = {
  STATIC: `static-${CACHE_VERSION}`,
  DYNAMIC: `dynamic-${CACHE_VERSION}`,
  IMAGES: `images-${CACHE_VERSION}`,
  API: `api-${CACHE_VERSION}`,
};

// Cache size limits (in bytes) - Optimized for performance
export const CACHE_SIZE_LIMITS = {
  STATIC: 30 * 1024 * 1024, // 30MB (reduced from 50MB)
  DYNAMIC: 10 * 1024 * 1024, // 10MB (reduced from 20MB)
  IMAGES: 50 * 1024 * 1024, // 50MB (reduced from 100MB)
  API: 5 * 1024 * 1024, // 5MB (reduced from 10MB)
};

// LRU eviction configuration - Optimized for faster eviction
export const LRU_CONFIG = {
  // Percentage of cache to evict when limit is reached
  EVICTION_PERCENTAGE: 0.25, // Remove 25% of oldest entries (increased from 20%)
  // Minimum number of entries to keep
  MIN_ENTRIES: 5, // Reduced from 10
  // Check interval for automatic eviction (ms)
  CHECK_INTERVAL: 30000, // 30 seconds (reduced from 60 seconds)
};

// Cache metadata interface
interface CacheMetadata {
  url: string;
  cachedAt: number;
  lastAccessed: number;
  accessCount: number;
  size: number;
  strategy: 'cache-first' | 'network-first' | 'stale-while-revalidate';
}

// Cache Manager class
export class CacheManager {
  private metadataStore: Map<string, CacheMetadata>;
  private readonly isDevelopment: boolean;
  private evictionCheckInterval: number | null;

  constructor() {
    this.metadataStore = new Map();
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.evictionCheckInterval = null;
    
    // Start automatic eviction checks
    this.startEvictionChecks();
  }

  /**
   * Start periodic eviction checks
   * Requirements: 7.4
   */
  private startEvictionChecks(): void {
    if (typeof self !== 'undefined' && 'setInterval' in self) {
      this.evictionCheckInterval = self.setInterval(() => {
        this.checkAllCaches();
      }, LRU_CONFIG.CHECK_INTERVAL) as unknown as number;
    }
  }

  /**
   * Stop periodic eviction checks
   */
  stopEvictionChecks(): void {
    if (this.evictionCheckInterval !== null) {
      clearInterval(this.evictionCheckInterval);
      this.evictionCheckInterval = null;
    }
  }

  /**
   * Check all caches and evict if necessary
   * Requirements: 7.4
   */
  private async checkAllCaches(): Promise<void> {
    for (const [name, limit] of Object.entries(CACHE_SIZE_LIMITS)) {
      const cacheName = CACHE_NAMES[name as keyof typeof CACHE_NAMES];
      await this.checkAndEvict(cacheName, limit);
    }
  }

  /**
   * Cache static assets (JS, CSS, fonts)
   * Requirements: 4.1, 4.2, 3.5, 10.3
   */
  async cacheStatic(urls: string[]): Promise<void> {
    try {
      const cache = await caches.open(CACHE_NAMES.STATIC);
      
      for (const url of urls) {
        try {
          const response = await fetch(url);
          if (response.ok) {
            await cache.put(url, response.clone());
            
            // Store metadata
            const size = await this.getResponseSize(response);
            this.metadataStore.set(url, {
              url,
              cachedAt: Date.now(),
              lastAccessed: Date.now(),
              accessCount: 0,
              size,
              strategy: 'cache-first',
            });
            
            if (this.isDevelopment) {
              }
          }
        } catch (error) {
          // Log comprehensive error
          // Requirements: 3.5, 10.3
          errorLogger.logError(error as Error, {
            type: 'cache',
            operation: 'cache_static',
            resource: 'static_asset',
            data: { url },
            severity: 'warning',
          });
        }
      }
    } catch (error) {
      // Log comprehensive error
      errorLogger.logError(error as Error, {
        type: 'cache',
        operation: 'open_cache',
        resource: 'static_cache',
        severity: 'error',
      });
    }
  }

  /**
   * Cache dynamic content (API responses, user data)
   * Requirements: 4.1, 4.2, 3.5, 10.3
   */
  async cacheDynamic(request: Request, response: Response): Promise<void> {
    try {
      const cache = await caches.open(CACHE_NAMES.DYNAMIC);
      const url = request.url;
      
      // Clone response before caching
      const responseToCache = response.clone();
      await cache.put(request, responseToCache);
      
      // Store metadata
      const size = await this.getResponseSize(response);
      this.metadataStore.set(url, {
        url,
        cachedAt: Date.now(),
        lastAccessed: Date.now(),
        accessCount: 0,
        size,
        strategy: 'network-first',
      });
      
      if (this.isDevelopment) {
        }
      
      // Check cache size and evict if necessary
      await this.checkAndEvict(CACHE_NAMES.DYNAMIC, CACHE_SIZE_LIMITS.DYNAMIC);
    } catch (error) {
      // Log comprehensive error
      // Requirements: 3.5, 10.3
      errorLogger.logError(error as Error, {
        type: 'cache',
        operation: 'cache_dynamic',
        resource: 'dynamic_content',
        data: { url: request.url },
        severity: 'warning',
      });
    }
  }

  /**
   * Get resource from cache
   * Requirements: 4.1, 4.2
   */
  async getFromCache(request: Request): Promise<Response | null> {
    try {
      const url = request.url;
      
      // Try all cache stores
      for (const cacheName of Object.values(CACHE_NAMES)) {
        const cache = await caches.open(cacheName);
        const response = await cache.match(request);
        
        if (response) {
          // Update metadata
          const metadata = this.metadataStore.get(url);
          if (metadata) {
            metadata.lastAccessed = Date.now();
            metadata.accessCount++;
            this.metadataStore.set(url, metadata);
          }
          
          if (this.isDevelopment) {
            `);
          }
          
          return response;
        }
      }
      
      if (this.isDevelopment) {
        }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get response size in bytes
   */
  private async getResponseSize(response: Response): Promise<number> {
    try {
      const blob = await response.clone().blob();
      return blob.size;
    } catch {
      return 0;
    }
  }

  /**
   * Check cache size and evict if necessary
   */
  private async checkAndEvict(cacheName: string, maxSize: number): Promise<void> {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    
    let totalSize = 0;
    const entries: CacheMetadata[] = [];
    
    for (const request of keys) {
      const metadata = this.metadataStore.get(request.url);
      if (metadata) {
        totalSize += metadata.size;
        entries.push(metadata);
      }
    }
    
    if (totalSize > maxSize) {
      await this.evictLRU(cacheName, maxSize);
    }
  }

  /**
   * Implement LRU eviction
   * Requirements: 7.4
   */
  async evictLRU(cacheName: string, maxSize: number): Promise<void> {
    try {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      
      // Collect all entries with metadata
      const entries: CacheMetadata[] = [];
      let totalSize = 0;
      
      for (const request of keys) {
        const metadata = this.metadataStore.get(request.url);
        if (metadata) {
          entries.push(metadata);
          totalSize += metadata.size;
        }
      }
      
      // Check if eviction is needed
      if (totalSize <= maxSize) {
        return;
      }
      
      // Sort by LRU (least recently used first)
      entries.sort((a, b) => {
        // Primary: lastAccessed (older first)
        if (a.lastAccessed !== b.lastAccessed) {
          return a.lastAccessed - b.lastAccessed;
        }
        // Secondary: accessCount (less accessed first)
        return a.accessCount - b.accessCount;
      });
      
      // Calculate how many entries to evict
      const targetSize = maxSize * (1 - LRU_CONFIG.EVICTION_PERCENTAGE);
      const minEntriesToKeep = Math.max(LRU_CONFIG.MIN_ENTRIES, entries.length - 100);
      
      // Evict entries until size is under target
      let evictedCount = 0;
      let evictedSize = 0;
      
      for (let i = 0; i < entries.length; i++) {
        // Stop if we've reached target size
        if (totalSize - evictedSize <= targetSize) {
          break;
        }
        
        // Keep minimum number of entries
        if (entries.length - evictedCount <= minEntriesToKeep) {
          break;
        }
        
        const entry = entries[i];
        await cache.delete(entry.url);
        this.metadataStore.delete(entry.url);
        evictedSize += entry.size;
        evictedCount++;
        
        if (this.isDevelopment) {
          : ${entry.url} (accessed: ${entry.accessCount}x, age: ${Math.round((Date.now() - entry.lastAccessed) / 1000)}s)`);
        }
      }
      
      if (evictedCount > 0) {
        const evictedMB = (evictedSize / (1024 * 1024)).toFixed(2);
        const remainingMB = ((totalSize - evictedSize) / (1024 * 1024)).toFixed(2);
        from ${cacheName}. Remaining: ${remainingMB}MB`);
      }
    } catch (error) {
      }
  }

  /**
   * Get cache statistics
   * Requirements: 7.4
   */
  async getCacheStats(cacheName: string): Promise<{
    entryCount: number;
    totalSize: number;
    oldestEntry: number | null;
    newestEntry: number | null;
  }> {
    try {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      
      let totalSize = 0;
      let oldestEntry: number | null = null;
      let newestEntry: number | null = null;
      
      for (const request of keys) {
        const metadata = this.metadataStore.get(request.url);
        if (metadata) {
          totalSize += metadata.size;
          
          if (oldestEntry === null || metadata.lastAccessed < oldestEntry) {
            oldestEntry = metadata.lastAccessed;
          }
          
          if (newestEntry === null || metadata.lastAccessed > newestEntry) {
            newestEntry = metadata.lastAccessed;
          }
        }
      }
      
      return {
        entryCount: keys.length,
        totalSize,
        oldestEntry,
        newestEntry,
      };
    } catch (error) {
      return {
        entryCount: 0,
        totalSize: 0,
        oldestEntry: null,
        newestEntry: null,
      };
    }
  }

  /**
   * Invalidate cache by resource type
   * Requirements: 7.5
   */
  async invalidateByType(type: 'static' | 'dynamic' | 'images' | 'api' | 'all'): Promise<void> {
    try {
      if (type === 'all') {
        // Clear all caches
        await this.clearAllCaches();
        return;
      }
      
      // Map type to cache name
      const cacheNameMap: Record<string, string> = {
        static: CACHE_NAMES.STATIC,
        dynamic: CACHE_NAMES.DYNAMIC,
        images: CACHE_NAMES.IMAGES,
        api: CACHE_NAMES.API,
      };
      
      const cacheName = cacheNameMap[type];
      if (!cacheName) {
        return;
      }
      
      // Delete the cache
      const deleted = await caches.delete(cacheName);
      
      if (deleted) {
        // Clear metadata for this cache
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        
        for (const request of keys) {
          this.metadataStore.delete(request.url);
        }
        
        }
    } catch (error) {
      }
  }

  /**
   * Invalidate specific URL or pattern
   * Requirements: 7.5
   */
  async invalidateByUrl(urlPattern: string | RegExp): Promise<void> {
    try {
      const pattern = typeof urlPattern === 'string' 
        ? new RegExp(urlPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        : urlPattern;
      
      let deletedCount = 0;
      
      // Check all caches
      for (const cacheName of Object.values(CACHE_NAMES)) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        
        for (const request of keys) {
          if (pattern.test(request.url)) {
            await cache.delete(request);
            this.metadataStore.delete(request.url);
            deletedCount++;
            
            if (this.isDevelopment) {
              }
          }
        }
      }
      
      if (deletedCount > 0) {
        }
    } catch (error) {
      }
  }

  /**
   * Invalidate by resource ID (e.g., /api/posts/123)
   * Requirements: 7.5
   */
  async invalidateByResource(resource: string, resourceId?: string | number): Promise<void> {
    try {
      const pattern = resourceId 
        ? new RegExp(`/${resource}/${resourceId}(/|$|\\?)`)
        : new RegExp(`/${resource}(/|$|\\?)`);
      
      await this.invalidateByUrl(pattern);
    } catch (error) {
      }
  }

  /**
   * Clear all caches
   * Requirements: 7.5
   */
  async clearAllCaches(): Promise<void> {
    try {
      const cacheNames = await caches.keys();
      
      for (const cacheName of cacheNames) {
        await caches.delete(cacheName);
      }
      
      // Clear all metadata
      this.metadataStore.clear();
      
      `);
    } catch (error) {
      }
  }

  /**
   * Invalidate expired entries
   * Requirements: 7.5
   */
  async invalidateExpired(): Promise<void> {
    try {
      const now = Date.now();
      let deletedCount = 0;
      
      // Check all caches
      for (const cacheName of Object.values(CACHE_NAMES)) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        
        for (const request of keys) {
          const metadata = this.metadataStore.get(request.url);
          
          // Check if entry has expired (older than 7 days for dynamic content)
          if (metadata) {
            const age = now - metadata.cachedAt;
            const maxAge = metadata.strategy === 'cache-first' 
              ? 30 * 24 * 60 * 60 * 1000 // 30 days for static
              : 7 * 24 * 60 * 60 * 1000;  // 7 days for dynamic
            
            if (age > maxAge) {
              await cache.delete(request);
              this.metadataStore.delete(request.url);
              deletedCount++;
              
              if (this.isDevelopment) {
                )} days)`);
              }
            }
          }
        }
      }
      
      if (deletedCount > 0) {
        }
    } catch (error) {
      }
  }

  /**
   * Clear old caches (for version updates)
   */
  async clearOldCaches(currentCaches: string[]): Promise<void> {
    try {
      const cacheNames = await caches.keys();
      
      for (const cacheName of cacheNames) {
        if (!currentCaches.includes(cacheName)) {
          await caches.delete(cacheName);
          }
      }
    } catch (error) {
      }
  }

  /**
   * Cache-first strategy: Check cache first, fallback to network
   * Used for static assets with hash (JS, CSS)
   * Requirements: 4.3, 7.1, 10.4
   */
  async cacheFirst(request: Request): Promise<Response> {
    const startTime = Date.now();
    
    try {
      // Try cache first
      const cachedResponse = await this.getFromCache(request);
      
      if (cachedResponse) {
        const responseTime = Date.now() - startTime;
        const metadata = this.metadataStore.get(request.url);
        
        // Log cache decision
        // Requirements: 10.4
        cacheLogger.logDecision({
          url: request.url,
          method: request.method,
          strategy: 'cache-first',
          result: 'cache-hit',
          responseTime,
          cacheAge: metadata ? Date.now() - metadata.cachedAt : undefined,
          size: metadata?.size,
        });
        
        if (this.isDevelopment) {
          const duration = Date.now() - startTime;
          `);
        }
        return cachedResponse;
      }
      
      // Fallback to network
      const networkResponse = await fetch(request);
      const responseTime = Date.now() - startTime;
      
      if (networkResponse.ok) {
        // Cache for future use
        const cache = await caches.open(CACHE_NAMES.STATIC);
        await cache.put(request, networkResponse.clone());
        
        // Store metadata
        const size = await this.getResponseSize(networkResponse);
        this.metadataStore.set(request.url, {
          url: request.url,
          cachedAt: Date.now(),
          lastAccessed: Date.now(),
          accessCount: 0,
          size,
          strategy: 'cache-first',
        });
        
        // Log cache decision
        cacheLogger.logDecision({
          url: request.url,
          method: request.method,
          strategy: 'cache-first',
          result: 'cache-miss',
          responseTime,
          size,
        });
      }
      
      if (this.isDevelopment) {
        const duration = Date.now() - startTime;
        `);
      }
      
      return networkResponse;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // Log cache decision with error
      cacheLogger.logDecision({
        url: request.url,
        method: request.method,
        strategy: 'cache-first',
        result: 'network-error',
        responseTime,
        error: (error as Error).message,
      });
      
      throw error;
    }
  }

  /**
   * Network-first strategy: Try network first, fallback to cache
   * Used for API calls and dynamic data
   * Requirements: 4.3, 7.2, 10.4
   */
  async networkFirst(request: Request): Promise<Response> {
    const startTime = Date.now();
    
    try {
      // Try network first
      const networkResponse = await fetch(request);
      const responseTime = Date.now() - startTime;
      
      if (networkResponse.ok) {
        // Update cache with fresh data
        await this.cacheDynamic(request, networkResponse.clone());
        
        // Log cache decision
        // Requirements: 10.4
        const size = await this.getResponseSize(networkResponse);
        cacheLogger.logDecision({
          url: request.url,
          method: request.method,
          strategy: 'network-first',
          result: 'network-success',
          responseTime,
          size,
        });
        
        if (this.isDevelopment) {
          const duration = Date.now() - startTime;
          `);
        }
      }
      
      return networkResponse;
    } catch (error) {
      // Network failed, try cache
      const cachedResponse = await this.getFromCache(request);
      const responseTime = Date.now() - startTime;
      
      if (cachedResponse) {
        const metadata = this.metadataStore.get(request.url);
        
        // Log cache decision
        cacheLogger.logDecision({
          url: request.url,
          method: request.method,
          strategy: 'network-first',
          result: 'fallback',
          responseTime,
          cacheAge: metadata ? Date.now() - metadata.cachedAt : undefined,
          size: metadata?.size,
        });
        
        if (this.isDevelopment) {
          const duration = Date.now() - startTime;
          `);
        }
        return cachedResponse;
      }
      
      // Log cache decision with error
      cacheLogger.logDecision({
        url: request.url,
        method: request.method,
        strategy: 'network-first',
        result: 'network-error',
        responseTime,
        error: (error as Error).message,
      });
      
      :', error);
      throw error;
    }
  }

  /**
   * Stale-while-revalidate strategy: Return cache immediately, update in background
   * Used for images and media files
   * Requirements: 4.3, 7.3, 10.4
   */
  async staleWhileRevalidate(request: Request): Promise<Response> {
    const startTime = Date.now();
    
    try {
      // Get from cache immediately
      const cachedResponse = await this.getFromCache(request);
      
      // Start network request in background
      const networkPromise = fetch(request).then(async (networkResponse) => {
        if (networkResponse.ok) {
          // Update cache with fresh data
          const cache = await caches.open(CACHE_NAMES.IMAGES);
          await cache.put(request, networkResponse.clone());
          
          // Update metadata
          const size = await this.getResponseSize(networkResponse);
          this.metadataStore.set(request.url, {
            url: request.url,
            cachedAt: Date.now(),
            lastAccessed: Date.now(),
            accessCount: this.metadataStore.get(request.url)?.accessCount || 0,
            size,
            strategy: 'stale-while-revalidate',
          });
          
          if (this.isDevelopment) {
            }
        }
        return networkResponse;
      }).catch((error) => {
        return null;
      });
      
      // Return cached response if available
      if (cachedResponse) {
        const responseTime = Date.now() - startTime;
        const metadata = this.metadataStore.get(request.url);
        
        // Log cache decision
        // Requirements: 10.4
        cacheLogger.logDecision({
          url: request.url,
          method: request.method,
          strategy: 'stale-while-revalidate',
          result: 'cache-hit',
          responseTime,
          cacheAge: metadata ? Date.now() - metadata.cachedAt : undefined,
          size: metadata?.size,
        });
        
        if (this.isDevelopment) {
          const duration = Date.now() - startTime;
          `);
        }
        return cachedResponse;
      }
      
      // Wait for network if no cache
      const networkResponse = await networkPromise;
      const responseTime = Date.now() - startTime;
      
      if (networkResponse) {
        const size = await this.getResponseSize(networkResponse);
        
        // Log cache decision
        cacheLogger.logDecision({
          url: request.url,
          method: request.method,
          strategy: 'stale-while-revalidate',
          result: 'cache-miss',
          responseTime,
          size,
        });
        
        if (this.isDevelopment) {
          const duration = Date.now() - startTime;
          `);
        }
        return networkResponse;
      }
      
      throw new Error('No cached response and network failed');
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // Log cache decision with error
      cacheLogger.logDecision({
        url: request.url,
        method: request.method,
        strategy: 'stale-while-revalidate',
        result: 'network-error',
        responseTime,
        error: (error as Error).message,
      });
      
      throw error;
    }
  }

  /**
   * Determine which strategy to use based on request
   * Requirements: 4.3, 7.1, 7.2, 7.3
   */
  async handleRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    // Static assets with hash (JS, CSS, fonts)
    if (this.isStaticAsset(url)) {
      return this.cacheFirst(request);
    }
    
    // API calls
    if (this.isApiRequest(url)) {
      return this.networkFirst(request);
    }
    
    // Images and media
    if (this.isImageOrMedia(url)) {
      return this.staleWhileRevalidate(request);
    }
    
    // Default: network-first
    return this.networkFirst(request);
  }

  /**
   * Check if request is for static asset
   */
  private isStaticAsset(url: URL): boolean {
    const staticExtensions = ['.js', '.css', '.woff', '.woff2', '.ttf', '.eot'];
    const pathname = url.pathname.toLowerCase();
    
    // Check if has hash in filename (e.g., app.abc123.js)
    const hasHash = /\.[a-f0-9]{8,}\.(js|css)$/i.test(pathname);
    
    return hasHash || staticExtensions.some(ext => pathname.endsWith(ext));
  }

  /**
   * Check if request is for API
   */
  private isApiRequest(url: URL): boolean {
    return url.pathname.startsWith('/api/') || 
           url.pathname.startsWith('/sanctum/') ||
           url.pathname.includes('/api/');
  }

  /**
   * Check if request is for image or media
   */
  private isImageOrMedia(url: URL): boolean {
    const mediaExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.mp4', '.webm', '.mp3'];
    const pathname = url.pathname.toLowerCase();
    
    return mediaExtensions.some(ext => pathname.endsWith(ext));
  }
}

// Export singleton instance
export const cacheManager = new CacheManager();
