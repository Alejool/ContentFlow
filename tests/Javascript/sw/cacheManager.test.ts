import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CacheManager, CACHE_NAMES, CACHE_SIZE_LIMITS } from '@/sw/cacheManager';

// Mock Cache API
const mockCaches = new Map<string, Map<string, Response>>();

global.caches = {
  open: vi.fn(async (cacheName: string) => {
    if (!mockCaches.has(cacheName)) {
      mockCaches.set(cacheName, new Map());
    }
    const cache = mockCaches.get(cacheName)!;
    
    return {
      match: vi.fn(async (request: Request) => {
        return cache.get(request.url) || null;
      }),
      put: vi.fn(async (request: Request, response: Response) => {
        cache.set(request.url, response);
      }),
      delete: vi.fn(async (request: Request | string) => {
        const url = typeof request === 'string' ? request : request.url;
        return cache.delete(url);
      }),
      keys: vi.fn(async () => {
        return Array.from(cache.keys()).map(url => ({ url } as Request));
      }),
    };
  }),
  delete: vi.fn(async (cacheName: string) => {
    return mockCaches.delete(cacheName);
  }),
  keys: vi.fn(async () => {
    return Array.from(mockCaches.keys());
  }),
} as any;

describe('CacheManager', () => {
  let cacheManager: CacheManager;

  beforeEach(() => {
    mockCaches.clear();
    cacheManager = new CacheManager();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cacheManager.stopEvictionChecks();
  });

  describe('cacheStatic', () => {
    it('should cache static assets', async () => {
      const urls = [
        'https://example.com/app.abc123.js',
        'https://example.com/styles.def456.css',
      ];

      // Mock fetch
      global.fetch = vi.fn(async (url: string) => {
        return new Response('content', {
          status: 200,
          headers: { 'Content-Type': 'text/javascript' },
        });
      }) as any;

      await cacheManager.cacheStatic(urls);

      expect(global.caches.open).toHaveBeenCalledWith(CACHE_NAMES.STATIC);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should handle fetch errors gracefully', async () => {
      const urls = ['https://example.com/missing.js'];

      global.fetch = vi.fn(async () => {
        throw new Error('Network error');
      }) as any;

      await expect(cacheManager.cacheStatic(urls)).resolves.not.toThrow();
    });
  });

  describe('getFromCache', () => {
    it('should return cached response', async () => {
      const request = new Request('https://example.com/test.js');
      const response = new Response('cached content');

      // Add to cache
      const cache = await caches.open(CACHE_NAMES.STATIC);
      await cache.put(request, response);

      const result = await cacheManager.getFromCache(request);
      expect(result).toBeTruthy();
    });

    it('should return null for cache miss', async () => {
      const request = new Request('https://example.com/missing.js');
      const result = await cacheManager.getFromCache(request);
      expect(result).toBeNull();
    });
  });

  describe('Cache Strategies', () => {
    beforeEach(() => {
      global.fetch = vi.fn(async (url: string) => {
        return new Response('network content', {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }) as any;
    });

    it('should use cache-first for static assets', async () => {
      const request = new Request('https://example.com/app.abc123.js');
      
      // First call - should fetch from network
      const response1 = await cacheManager.cacheFirst(request);
      expect(global.fetch).toHaveBeenCalledTimes(1);
      
      // Second call - should use cache
      const response2 = await cacheManager.cacheFirst(request);
      expect(global.fetch).toHaveBeenCalledTimes(1); // Still 1, not called again
    });

    it('should use network-first for API requests', async () => {
      const request = new Request('https://example.com/api/posts');
      
      const response = await cacheManager.networkFirst(request);
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(response).toBeTruthy();
    });

    it('should fallback to cache when network fails', async () => {
      const request = new Request('https://example.com/api/posts');
      
      // First call - cache the response
      await cacheManager.networkFirst(request);
      
      // Second call - network fails
      global.fetch = vi.fn(async () => {
        throw new Error('Network error');
      }) as any;
      
      const response = await cacheManager.networkFirst(request);
      expect(response).toBeTruthy();
    });
  });

  describe('invalidateByType', () => {
    it('should invalidate specific cache type', async () => {
      await cacheManager.invalidateByType('static');
      expect(global.caches.delete).toHaveBeenCalledWith(CACHE_NAMES.STATIC);
    });

    it('should clear all caches when type is "all"', async () => {
      await cacheManager.invalidateByType('all');
      expect(global.caches.keys).toHaveBeenCalled();
    });
  });

  describe('invalidateByUrl', () => {
    it('should invalidate entries matching URL pattern', async () => {
      const request1 = new Request('https://example.com/api/posts/1');
      const request2 = new Request('https://example.com/api/posts/2');
      const request3 = new Request('https://example.com/api/users/1');
      
      // Add to cache
      const cache = await caches.open(CACHE_NAMES.API);
      await cache.put(request1, new Response('post 1'));
      await cache.put(request2, new Response('post 2'));
      await cache.put(request3, new Response('user 1'));
      
      // Invalidate posts
      await cacheManager.invalidateByUrl(/\/api\/posts\//);
      
      // Verify posts are deleted
      const result1 = await cache.match(request1);
      const result2 = await cache.match(request2);
      const result3 = await cache.match(request3);
      
      expect(result1).toBeNull();
      expect(result2).toBeNull();
      expect(result3).toBeTruthy(); // User should still be cached
    });
  });

  describe('clearAllCaches', () => {
    it('should clear all caches', async () => {
      // Add some caches
      await caches.open(CACHE_NAMES.STATIC);
      await caches.open(CACHE_NAMES.DYNAMIC);
      
      await cacheManager.clearAllCaches();
      
      expect(global.caches.keys).toHaveBeenCalled();
    });
  });
});
