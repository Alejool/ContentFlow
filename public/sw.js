// Service Worker Entry Point
// This file provides custom service worker functionality for the PWA

// Import Workbox libraries
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

// Cache version
const CACHE_VERSION = 'v1';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE = `images-${CACHE_VERSION}`;

// Initialize Workbox
if (workbox) {
  console.log('[SW] Workbox loaded successfully');
  
  // Enable navigation preload
  workbox.navigationPreload.enable();
  
  // Set default cache names
  workbox.core.setCacheNameDetails({
    prefix: 'social-content-manager',
    suffix: CACHE_VERSION,
    precache: 'precache',
    runtime: 'runtime'
  });
  
  // Skip waiting and claim clients
  workbox.core.skipWaiting();
  workbox.core.clientsClaim();
  
} else {
  console.error('[SW] Workbox failed to load');
}

// Install event - precache static resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Precaching static assets');
      return cache.addAll([
        '/',
        '/favicon.ico',
        '/manifest.json'
      ]);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old caches that don't match current version
          if (
            cacheName !== STATIC_CACHE &&
            cacheName !== DYNAMIC_CACHE &&
            cacheName !== IMAGE_CACHE &&
            !cacheName.includes('workbox')
          ) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Claim all clients immediately
  return self.clients.claim();
});

// Fetch event - handle network requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Apply caching strategies based on request type
  event.respondWith(
    handleFetchRequest(request)
  );
});

// Handle fetch requests with appropriate caching strategy
async function handleFetchRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Strategy 1: Cache-first for static assets with hash
    if (isStaticAsset(url)) {
      return await cacheFirst(request, STATIC_CACHE);
    }
    
    // Strategy 2: Network-first for API calls
    if (isApiRequest(url)) {
      return await networkFirst(request, DYNAMIC_CACHE);
    }
    
    // Strategy 3: Stale-while-revalidate for images
    if (isImageRequest(url)) {
      return await staleWhileRevalidate(request, IMAGE_CACHE);
    }
    
    // Default: Network-first
    return await networkFirst(request, DYNAMIC_CACHE);
    
  } catch (error) {
    console.error('[SW] Fetch error:', error);
    
    // Return offline fallback if available
    return await getOfflineFallback(request);
  }
}

// Cache-first strategy
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) {
    console.log('[SW] Cache hit:', request.url);
    return cached;
  }
  
  console.log('[SW] Cache miss, fetching:', request.url);
  const response = await fetch(request);
  
  if (response.ok) {
    cache.put(request, response.clone());
  }
  
  return response;
}

// Network-first strategy
async function networkFirst(request, cacheName, timeout = 5000) {
  const cache = await caches.open(cacheName);
  
  try {
    // Try network with timeout
    const response = await fetchWithTimeout(request, timeout);
    
    if (response.ok) {
      console.log('[SW] Network success, caching:', request.url);
      cache.put(request, response.clone());
    }
    
    return response;
    
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    const cached = await cache.match(request);
    
    if (cached) {
      return cached;
    }
    
    throw error;
  }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  // Fetch in background and update cache
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  });
  
  // Return cached version immediately if available
  if (cached) {
    console.log('[SW] Serving stale, revalidating:', request.url);
    return cached;
  }
  
  // Otherwise wait for network
  console.log('[SW] No cache, waiting for network:', request.url);
  return fetchPromise;
}

// Fetch with timeout
function fetchWithTimeout(request, timeout) {
  return Promise.race([
    fetch(request),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Network timeout')), timeout)
    )
  ]);
}

// Check if request is for static asset
function isStaticAsset(url) {
  return (
    url.pathname.match(/\.(js|css|woff|woff2|ttf|otf|eot)$/) ||
    url.pathname.includes('/_next/static/') ||
    url.pathname.includes('/build/')
  );
}

// Check if request is for API
function isApiRequest(url) {
  return (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('api.')
  );
}

// Check if request is for image
function isImageRequest(url) {
  return url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico)$/);
}

// Get offline fallback
async function getOfflineFallback(request) {
  // Try to return a cached version of the page
  const cache = await caches.open(DYNAMIC_CACHE);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }
  
  // Return a generic offline response
  return new Response(
    JSON.stringify({
      error: 'Offline',
      message: 'No network connection available'
    }),
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

// Message event - handle messages from clients
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

// Background sync event (for offline operations)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-operations') {
    event.waitUntil(syncOfflineOperations(event.tag));
  }
});

// Sync offline operations using BackgroundSyncManager
async function syncOfflineOperations(tag) {
  console.log('[SW] Syncing offline operations...');
  
  try {
    // Initialize BackgroundSyncManager in Service Worker context
    const syncManager = await initBackgroundSyncManager();
    
    // Execute sync operations in FIFO order
    await syncManager.executeSync(tag);
    
    console.log('[SW] Sync completed successfully');
  } catch (error) {
    console.error('[SW] Sync failed:', error);
    throw error; // Retry sync
  }
}

// Initialize BackgroundSyncManager for Service Worker context
async function initBackgroundSyncManager() {
  const DB_NAME = 'background-sync-db';
  const DB_VERSION = 1;
  const STORE_NAME = 'sync-operations';
  
  // Open IndexedDB
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        objectStore.createIndex('timestamp', 'timestamp', { unique: false });
        objectStore.createIndex('retryCount', 'retryCount', { unique: false });
      }
    };
  });
  
  return {
    // Execute sync operations
    executeSync: async (tag) => {
      if (tag !== 'sync-operations') {
        return;
      }
      
      // Get all pending operations sorted by timestamp (FIFO)
      const operations = await new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index('timestamp');
        const request = index.getAll();
        
        request.onsuccess = () => {
          const ops = request.result;
          ops.sort((a, b) => a.timestamp - b.timestamp);
          resolve(ops);
        };
        request.onerror = () => reject(request.error);
      });
      
      if (operations.length === 0) {
        console.log('[SW] No operations to sync');
        return;
      }
      
      console.log(`[SW] Processing ${operations.length} operations...`);
      
      // Execute operations in FIFO order
      for (const operation of operations) {
        try {
          // Execute the operation
          const response = await fetch(operation.url, {
            method: operation.method,
            headers: operation.headers,
            body: operation.body ? JSON.stringify(operation.body) : undefined,
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          // Remove successful operation
          await new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(operation.id);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
          });
          
          console.log('[SW] Operation completed:', operation.id);
          
        } catch (error) {
          console.error('[SW] Operation failed:', operation.id, error);
          
          // Handle retry with exponential backoff
          const maxRetries = 3;
          const updatedOperation = {
            ...operation,
            retryCount: operation.retryCount + 1,
          };
          
          if (updatedOperation.retryCount >= maxRetries) {
            // Max retries reached - remove and notify
            await new Promise((resolve, reject) => {
              const transaction = db.transaction([STORE_NAME], 'readwrite');
              const store = transaction.objectStore(STORE_NAME);
              const request = store.delete(operation.id);
              
              request.onsuccess = () => resolve();
              request.onerror = () => reject(request.error);
            });
            
            console.error('[SW] Max retries reached for operation:', operation.id);
            
            // Notify clients about failed operation
            const clients = await self.clients.matchAll();
            clients.forEach((client) => {
              client.postMessage({
                type: 'SYNC_OPERATION_FAILED',
                operation,
                error: {
                  message: error.message,
                  stack: error.stack,
                },
              });
            });
            
          } else {
            // Update retry count
            await new Promise((resolve, reject) => {
              const transaction = db.transaction([STORE_NAME], 'readwrite');
              const store = transaction.objectStore(STORE_NAME);
              const request = store.put(updatedOperation);
              
              request.onsuccess = () => resolve();
              request.onerror = () => reject(request.error);
            });
            
            // Calculate exponential backoff delay: 1s, 2s, 4s
            const delay = Math.pow(2, updatedOperation.retryCount - 1) * 1000;
            
            console.log(
              `[SW] Retry ${updatedOperation.retryCount}/${maxRetries} for operation:`,
              operation.id,
              `(delay: ${delay}ms)`
            );
            
            // Schedule retry
            setTimeout(() => {
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.ready.then((registration) => {
                  return registration.sync.register('sync-operations');
                }).catch((err) => {
                  console.error('[SW] Failed to schedule retry:', err);
                });
              }
            }, delay);
          }
        }
      }
    }
  };
}

console.log('[SW] Service Worker loaded');
