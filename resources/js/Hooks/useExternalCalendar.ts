import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useExternalCalendarStore } from '@/stores/externalCalendarStore';
import type { ExternalCalendarConnection } from '@/stores/externalCalendarStore';

interface SyncSettings {
  syncEnabled: boolean;
  syncCampaigns: number[];
  syncPlatforms: string[];
}

// Fetch connection status
export function useExternalCalendarStatus() {
  const { setConnections, setLoading, setError } = useExternalCalendarStore();

  return useQuery({
    queryKey: ['external-calendar-status'],
    queryFn: async () => {
      try {
        const response = await axios.get('/api/v1/external-calendar/status');
        const connections = (response.data.connections || []).map((conn: any) => ({
          provider: conn.provider,
          connected: conn.connected,
          email: conn.email,
          lastSync: conn.lastSync || conn.last_sync,
          status: conn.status,
          errorMessage: conn.errorMessage || conn.error_message,
          syncEnabled: conn.syncEnabled ?? conn.sync_enabled ?? false,
          syncConfig: conn.syncConfig || conn.sync_config || {
            syncCampaigns: [],
            syncPlatforms: [],
          },
        }));
        setConnections(connections);
        return connections;
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 'Failed to fetch connection status';
        setError(errorMessage);
        throw error;
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
  });
}

// Connect to external calendar
// Connect to external calendar
export function useConnectCalendar() {
  const queryClient = useQueryClient();
  const { setError } = useExternalCalendarStore();

  return useMutation({
    mutationFn: async (provider: 'google' | 'outlook') => {
      const response = await axios.post(`/api/v1/external-calendar/${provider}/connect`);
      return response.data;
    },
    onSuccess: (data) => {
      // Open OAuth window in popup (like social networks)
      if (data.auth_url) {
        const authWindow = window.open(
          data.auth_url,
          'oauth',
          'width=600,height=700'
        );

        // Listen for messages from the popup
        const handleMessage = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          
          if (event.data.type === 'external_calendar_callback') {
            // Refetch connection status
            queryClient.invalidateQueries({ queryKey: ['external-calendar-status'] });
            
            // Clean up listener
            window.removeEventListener('message', handleMessage);
          }
        };

        window.addEventListener('message', handleMessage);

        // Fallback: Poll for window close (in case postMessage fails)
        const pollTimer = setInterval(() => {
          if (authWindow?.closed) {
            clearInterval(pollTimer);
            window.removeEventListener('message', handleMessage);
            // Refetch connection status after OAuth completes
            queryClient.invalidateQueries({ queryKey: ['external-calendar-status'] });
          }
        }, 500);
      }
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to connect calendar';
      setError(errorMessage);
    },
  });
}

// Disconnect from external calendar
export function useDisconnectCalendar() {
  const queryClient = useQueryClient();
  const { setError } = useExternalCalendarStore();

  return useMutation({
    mutationFn: async (provider: 'google' | 'outlook') => {
      await axios.delete(`/api/v1/external-calendar/${provider}/disconnect`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['external-calendar-status'] });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to disconnect calendar';
      setError(errorMessage);
    },
  });
}

// Update sync settings
export function useUpdateSyncSettings() {
  const queryClient = useQueryClient();
  const { setError } = useExternalCalendarStore();

  return useMutation({
    mutationFn: async ({ provider, settings }: { provider: string; settings: SyncSettings }) => {
      const response = await axios.put(`/api/v1/external-calendar/${provider}/sync-settings`, {
        sync_enabled: settings.syncEnabled,
        sync_campaigns: settings.syncCampaigns,
        sync_platforms: settings.syncPlatforms,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['external-calendar-status'] });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to save sync settings';
      setError(errorMessage);
    },
  });
}

// Trigger full sync
export function useRetrySync() {
  const queryClient = useQueryClient();
  const { setError } = useExternalCalendarStore();

  return useMutation({
    mutationFn: async (provider: string) => {
      const response = await axios.post(`/api/v1/external-calendar/${provider}/full-sync`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['external-calendar-status'] });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to trigger sync';
      setError(errorMessage);
    },
  });
}
