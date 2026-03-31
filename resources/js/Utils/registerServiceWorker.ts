/**
 * Service Worker Registration Utility
 *
 * Handles registration, updates, and lifecycle of the service worker
 */

export interface ServiceWorkerConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onOffline?: () => void;
  onOnline?: () => void;
}

/**
 * Register the service worker
 */
export async function registerServiceWorker(config: ServiceWorkerConfig = {}): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  if (import.meta.env.DEV) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;

      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          config.onUpdate?.(registration);
        }
      });
    });

    if (registration.active) {
      config.onSuccess?.(registration);
    }

    setInterval(
      () => {
        registration.update();
      },
      60 * 60 * 1000,
    );
  } catch {
    // Service worker registration failed
  }

  window.addEventListener('online', () => {
    config.onOnline?.();
  });

  window.addEventListener('offline', () => {
    config.onOffline?.();
  });
}

/**
 * Unregister the service worker
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.unregister();
  } catch {
    return false;
  }
}

/**
 * Skip waiting and activate new service worker immediately
 */
export function skipWaiting(): void {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  navigator.serviceWorker.ready.then((registration) => {
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  });
}

/**
 * Clear all caches
 */
export async function clearAllCaches(): Promise<void> {
  if (!('caches' in window)) {
    return;
  }

  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
  } catch {
    // Failed to clear caches
  }
}

/**
 * Get service worker registration status
 */
export async function getServiceWorkerStatus(): Promise<{
  supported: boolean;
  registered: boolean;
  active: boolean;
  waiting: boolean;
}> {
  const supported = 'serviceWorker' in navigator;

  if (!supported) {
    return { supported: false, registered: false, active: false, waiting: false };
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();

    return {
      supported: true,
      registered: !!registration,
      active: !!registration?.active,
      waiting: !!registration?.waiting,
    };
  } catch {
    return { supported: true, registered: false, active: false, waiting: false };
  }
}

/**
 * Check if the app is running in standalone mode (installed as PWA)
 */
export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

/**
 * Check if the app can be installed as PWA
 */
export function canInstallPWA(): boolean {
  return 'BeforeInstallPromptEvent' in window;
}
