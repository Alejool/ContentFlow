import { create } from 'zustand';

export type SyncDirection = 'import' | 'export' | 'bidirectional';
export type SyncFrequency = 'manual' | '5min' | '10min' | '30min' | '1h' | '3h' | '6h' | '24h';

export interface ExternalCalendarConnection {
  provider: 'google' | 'outlook';
  connected: boolean;
  email?: string;
  lastSync?: string;
  status: 'connected' | 'disconnected' | 'error';
  errorMessage?: string;
  syncEnabled?: boolean;
  syncDirection?: SyncDirection;
  syncFrequency?: SyncFrequency;
  syncConfig?: {
    syncCampaigns: number[];
    syncPlatforms: string[];
  };
}

interface ExternalCalendarStore {
  connections: ExternalCalendarConnection[];
  isLoading: boolean;
  error: string | null;

  setConnections: (connections: ExternalCalendarConnection[]) => void;
  updateConnection: (provider: string, updates: Partial<ExternalCalendarConnection>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useExternalCalendarStore = create<ExternalCalendarStore>((set) => ({
  connections: [],
  isLoading: false,
  error: null,

  setConnections: (connections) => set({ connections, error: null }),

  updateConnection: (provider, updates) =>
    set((state) => ({
      connections: state.connections.map((conn) =>
        conn.provider === provider ? { ...conn, ...updates } : conn,
      ),
    })),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  clearError: () => set({ error: null }),
}));
