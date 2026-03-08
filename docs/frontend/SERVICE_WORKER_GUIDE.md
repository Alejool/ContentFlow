# Service Worker Implementation Guide

This guide explains the Service Worker implementation for the Social Content Manager PWA.

## Overview

The Service Worker provides offline functionality, intelligent caching, and background sync capabilities. It's built using Workbox and custom strategies.

## Architecture

### Files Structure

```
public/
├── sw.js                           # Service Worker entry point
├── manifest.json                   # PWA manifest
├── icons/                          # PWA icons
│   ├── icon-192x192.png
│   └── icon-512x512.png
└── screenshots/                    # PWA screenshots
    ├── desktop.png
    └── mobile.png

resources/js/
├── utils/
│   └── registerServiceWorker.ts   # SW registration utility
├── hooks/
│   └── useServiceWorker.ts        # React hook for SW
└── components/
    └── ServiceWorkerUpdate.tsx    # Update notification component
```

## Caching Strategies

The Service Worker implements three main caching strategies:

### 1. Cache-First (Static Assets)

Used for immutable static assets with hash in filename.

**Files:**
- JavaScript bundles with hash
- CSS files with hash
- Fonts (woff, woff2, ttf, otf, eot)

**Behavior:**
1. Check cache first
2. If found, return cached version
3. If not found, fetch from network and cache

**Cache Name:** `static-v1`

**Expiration:** 1 year

### 2. Network-First (API & Dynamic Content)

Used for API calls and dynamic content that changes frequently.

**Files:**
- API endpoints (`/api/*`)
- Publications, reels, calendar data

**Behavior:**
1. Try network first with 5s timeout
2. If network succeeds, cache response
3. If network fails, return cached version
4. If no cache, show offline error

**Cache Name:** `dynamic-v1`

**Expiration:** 1-24 hours depending on content type

### 3. Stale-While-Revalidate (Images)

Used for images and media files.

**Files:**
- Images (png, jpg, jpeg, svg, gif, webp, ico)

**Behavior:**
1. Return cached version immediately if available
2. Fetch from network in background
3. Update cache with fresh version
4. Next request gets updated version

**Cache Name:** `images-v1`

**Expiration:** 30 days

## Service Worker Lifecycle

### Installation

```javascript
self.addEventListener('install', (event) => {
  // Precache critical static assets
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll([
        '/',
        '/favicon.ico',
        '/manifest.json'
      ]);
    })
  );
});
```

### Activation

```javascript
self.addEventListener('activate', (event) => {
  // Clean up old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CURRENT_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
```

### Fetch

```javascript
self.addEventListener('fetch', (event) => {
  // Apply appropriate caching strategy
  event.respondWith(
    handleFetchRequest(event.request)
  );
});
```

## React Integration

### Using the Service Worker Hook

```typescript
import { useServiceWorker } from '@/hooks/useServiceWorker';

function MyComponent() {
  const {
    isSupported,
    isRegistered,
    isActive,
    hasUpdate,
    isStandalone,
    updateServiceWorker
  } = useServiceWorker();

  if (hasUpdate) {
    return (
      <button onClick={updateServiceWorker}>
        Update Available - Click to Refresh
      </button>
    );
  }

  return <div>App is up to date</div>;
}
```

### Service Worker Update Component

The `ServiceWorkerUpdate` component automatically shows a notification when a new version is available:

```typescript
import { ServiceWorkerUpdate } from '@/components/ServiceWorkerUpdate';

function App() {
  return (
    <>
      {/* Your app content */}
      <ServiceWorkerUpdate />
    </>
  );
}
```

## Manual Service Worker Operations

### Clear All Caches

```typescript
import { clearAllCaches } from '@/utils/registerServiceWorker';

await clearAllCaches();
```

### Skip Waiting (Force Update)

```typescript
import { skipWaiting } from '@/utils/registerServiceWorker';

skipWaiting();
window.location.reload();
```

### Unregister Service Worker

```typescript
import { unregisterServiceWorker } from '@/utils/registerServiceWorker';

const success = await unregisterServiceWorker();
```

## Background Sync

The Service Worker supports background sync for offline operations:

```javascript
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-operations') {
    event.waitUntil(syncOfflineOperations());
  }
});
```

This will be fully implemented in Task 12 (Background Sync Manager).

## Debugging

### Chrome DevTools

1. Open DevTools (F12)
2. Go to Application tab
3. Select Service Workers in left sidebar
4. View registration status, update, and unregister

### Cache Inspection

1. Open DevTools (F12)
2. Go to Application tab
3. Select Cache Storage in left sidebar
4. Inspect cached resources

### Console Logging

The Service Worker logs all operations in development mode:

```
[SW] Service Worker loaded
[SW] Installing service worker...
[SW] Precaching static assets
[SW] Activating service worker...
[SW] Cache hit: /api/publications
[SW] Network success, caching: /api/reels
```

## Testing

### Test Offline Functionality

1. Open DevTools
2. Go to Network tab
3. Check "Offline" checkbox
4. Navigate the app - cached pages should load

### Test Cache Strategies

1. Open DevTools
2. Go to Network tab
3. Reload page and observe:
   - Static assets load from Service Worker
   - API calls try network first
   - Images load from cache

### Test Updates

1. Make changes to the app
2. Build new version
3. Reload page
4. Update notification should appear

## Production Deployment

### Build Process

```bash
npm run build
```

This generates:
- Optimized bundles with hashes
- Service Worker with precache manifest
- Updated manifest.json

### Verification

After deployment, verify:

1. Service Worker is registered
2. Caches are populated
3. Offline mode works
4. Updates are detected

### Monitoring

Monitor Service Worker in production:

- Registration success rate
- Cache hit/miss ratio
- Update adoption rate
- Offline usage patterns

## Troubleshooting

### Service Worker Not Registering

**Cause:** HTTPS required (except localhost)

**Solution:** Ensure site is served over HTTPS

### Caches Not Updating

**Cause:** Old service worker still active

**Solution:** 
1. Unregister old service worker
2. Clear all caches
3. Hard reload (Ctrl+Shift+R)

### Offline Mode Not Working

**Cause:** Resources not cached

**Solution:**
1. Check cache storage in DevTools
2. Verify caching strategies
3. Check network requests

### Update Not Showing

**Cause:** Service worker not detecting changes

**Solution:**
1. Check if new SW is waiting
2. Force update in DevTools
3. Close all tabs and reopen

## Best Practices

1. **Version Caches:** Always version cache names to avoid conflicts
2. **Clean Old Caches:** Remove old caches in activate event
3. **Precache Critical Assets:** Only precache essential resources
4. **Set Expiration:** Configure appropriate expiration for each cache
5. **Handle Errors:** Provide offline fallbacks
6. **Test Thoroughly:** Test all caching strategies
7. **Monitor Performance:** Track cache hit rates and load times
8. **Update Strategy:** Implement smooth update experience

## Future Enhancements

- [ ] Push notifications
- [ ] Periodic background sync
- [ ] Advanced offline queue
- [ ] Cache analytics
- [ ] Selective cache invalidation
- [ ] A/B testing for cache strategies

## References

- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Workbox Documentation](https://developers.google.com/web/tools/workbox)
- [PWA Best Practices](https://web.dev/pwa/)
- [Cache Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Cache)
