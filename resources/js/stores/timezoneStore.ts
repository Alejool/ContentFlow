import { create } from 'zustand';
import axios from 'axios';
import { router } from '@inertiajs/react';

interface TimezoneState {
  workspaceTimezone: string | null;
  userTimezone: string | null;
  isLoaded: boolean;
  
  // Getters
  effectiveTimezone: () => string;
  timezoneLabel: () => string;
  
  // Actions
  loadTimezones: () => Promise<void>;
  initializeFromInertia: (workspaceTimezone?: string, userTimezone?: string) => void;
  updateWorkspaceTimezone: (timezone: string) => Promise<void>;
  updateUserTimezone: (timezone: string) => Promise<void>;
}

export const useTimezoneStore = create<TimezoneState>((set, get) => ({
  workspaceTimezone: null,
  userTimezone: null,
  isLoaded: false,

  // Timezone efectivo con jerarquía: Workspace > User > Browser > UTC
  effectiveTimezone: () => {
    const state = get();
    return (
      state.workspaceTimezone ||
      state.userTimezone ||
      Intl.DateTimeFormat().resolvedOptions().timeZone ||
      'UTC'
    );
  },

  // Etiqueta para mostrar en UI
  timezoneLabel: () => {
    const state = get();
    if (state.workspaceTimezone) {
      return `${state.workspaceTimezone} (Workspace)`;
    }
    if (state.userTimezone) {
      return `${state.userTimezone} (Personal)`;
    }
    return 'UTC';
  },

  // Inicializar desde props de Inertia (más rápido)
  initializeFromInertia: (workspaceTimezone?: string, userTimezone?: string) => {
    set({
      workspaceTimezone: workspaceTimezone || null,
      userTimezone: userTimezone || null,
      isLoaded: true
    });

    console.log('✅ Timezones initialized from Inertia:', {
      workspace: workspaceTimezone,
      user: userTimezone,
      effective: get().effectiveTimezone()
    });
  },

  // Cargar timezones desde API (fallback)
  loadTimezones: async () => {
    try {
      const [workspaceRes, userRes] = await Promise.all([
        axios.get('/api/v1/workspace/timezone').catch(() => ({ data: { timezone: null } })),
        axios.get('/api/v1/timezone').catch(() => ({ data: { timezone: null } }))
      ]);

      set({
        workspaceTimezone: workspaceRes.data.timezone,
        userTimezone: userRes.data.timezone,
        isLoaded: true
      });

      console.log('✅ Timezones loaded from API:', {
        workspace: workspaceRes.data.timezone,
        user: userRes.data.timezone,
        effective: get().effectiveTimezone()
      });
    } catch (error) {
      console.error('❌ Error loading timezones:', error);
      set({ isLoaded: true }); // Continuar con fallback
    }
  },

  // Actualizar timezone del workspace (solo admin)
  updateWorkspaceTimezone: async (timezone: string) => {
    try {
      await axios.patch('/api/v1/workspace/timezone', { timezone });
      set({ workspaceTimezone: timezone });
      
      // Recargar la página para aplicar cambios en toda la app
      router.reload();
    } catch (error) {
      console.error('Error updating workspace timezone:', error);
      throw error;
    }
  },

  // Actualizar timezone del usuario
  updateUserTimezone: async (timezone: string) => {
    try {
      await axios.patch('/api/v1/timezone', { timezone });
      set({ userTimezone: timezone });
    } catch (error) {
      console.error('Error updating user timezone:', error);
      throw error;
    }
  }
}));
