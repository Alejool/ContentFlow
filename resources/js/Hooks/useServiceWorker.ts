/**
 * useServiceWorker Hook
 * 
 * React hook for managing service worker lifecycle and updates
 */

import { useEffect, useState } from 'react';
import {
  registerServiceWorker,
  skipWaiting,
  getServiceWorkerStatus,
  isStandalone,
} from '../utils/registerServiceWorker';

interface UseServiceWorkerReturn {
  isSupported: boolean;
  isRegistered: boolean;
  isActive: boolean;
  hasUpdate: boolean;
  isStandalone: boolean;
  updateServiceWorker: () => void;
}

export function useServiceWorker(): UseServiceWorkerReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    // Check initial status
    checkStatus();

    // Register service worker
    registerServiceWorker({
      onSuccess: () => {
        checkStatus();
      },
      onUpdate: () => {
        setHasUpdate(true);
      },
      onOnline: () => {
        },
      onOffline: () => {
        },
    });

    // Check if running as standalone PWA
    setStandalone(isStandalone());

    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = (e: MediaQueryListEvent) => {
      setStandalone(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  async function checkStatus() {
    const status = await getServiceWorkerStatus();
    setIsSupported(status.supported);
    setIsRegistered(status.registered);
    setIsActive(status.active);
    setHasUpdate(status.waiting);
  }

  function updateServiceWorker() {
    skipWaiting();
    setHasUpdate(false);
    // Reload page to activate new service worker
    window.location.reload();
  }

  return {
    isSupported,
    isRegistered,
    isActive,
    hasUpdate,
    isStandalone: standalone,
    updateServiceWorker,
  };
}
