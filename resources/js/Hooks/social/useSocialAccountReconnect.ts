import axios from 'axios';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface ReconnectOptions {
  onRefreshed?: () => void;
  onOAuthOpened?: () => void;
  onError?: (error: string) => void;
}

interface ReconnectState {
  isReconnecting: boolean;
  reconnect: (accountId: number, platform: string) => Promise<void>;
}

/**
 * Smart reconnect hook.
 *
 * Flow:
 *   1. POST /api/v1/social-accounts/{id}/refresh-token  (silent refresh)
 *   2a. If refreshed  → toast success, call onRefreshed()
 *   2b. If needs_reconnect → GET auth-url → open OAuth popup
 *
 * The user only sees the OAuth popup when automatic refresh is impossible.
 */
export function useSocialAccountReconnect(options: ReconnectOptions = {}): ReconnectState {
  const [isReconnecting, setIsReconnecting] = useState(false);

  const openOAuthPopup = (url: string, onSuccess?: () => void) => {
    const w = 600, h = 700;
    const left = window.screen.width / 2 - w / 2;
    const top  = window.screen.height / 2 - h / 2;
    const popup = window.open(url, 'oauth', `width=${w},height=${h},left=${left},top=${top}`);

    // Poll for popup close to trigger a data refresh
    const timer = setInterval(() => {
      if (popup?.closed) {
        clearInterval(timer);
        onSuccess?.();
      }
    }, 500);
  };

  const reconnect = async (accountId: number, platform: string) => {
    if (isReconnecting) return;
    setIsReconnecting(true);

    const loadingToast = toast.loading('Verificando credenciales…');

    try {
      // Step 1 — try silent token refresh
      const { data } = await axios.post(`/api/v1/social-accounts/${accountId}/refresh-token`);

      if (data.refreshed) {
        toast.success('Credenciales renovadas automáticamente ✓', { id: loadingToast });
        options.onRefreshed?.();
        return;
      }

      // Step 2 — silent refresh failed, need full OAuth
      toast.loading('Abriendo ventana de autorización…', { id: loadingToast });

      const authRes = await axios.get(`/api/v1/social-accounts/auth-url/${platform}`);
      if (!authRes.data?.url) {
        throw new Error(authRes.data?.message ?? 'No se pudo obtener la URL de autorización.');
      }

      toast.dismiss(loadingToast);
      options.onOAuthOpened?.();
      openOAuthPopup(authRes.data.url, options.onRefreshed);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Error desconocido';
      toast.error(`Error al reconectar: ${msg}`, { id: loadingToast });
      options.onError?.(msg);
    } finally {
      setIsReconnecting(false);
    }
  };

  return { isReconnecting, reconnect };
}
