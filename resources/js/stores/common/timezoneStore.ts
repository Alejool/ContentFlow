import { router } from '@inertiajs/react';
import axios from 'axios';
import { create } from 'zustand';

/**
 * Normalize a timezone string: strip diacritics and validate against Intl.
 * Handles DB values like "América/Bogota" → "America/Bogota".
 * Falls back to UTC for completely invalid strings.
 */
function sanitizeTimezone(tz: string | null | undefined): string | null {
  if (!tz) return null;
  // Strip diacritics: NFD decomposition + remove combining marks
  const normalized = tz.normalize('NFD').replace(/[̀-ͯ]/g, '');
  try {
    // Intl throws RangeError for invalid IANA zone identifiers
    Intl.DateTimeFormat(undefined, { timeZone: normalized });
    return normalized;
  } catch {
    console.warn(`Invalid timezone "${tz}" → falling back to UTC`);
    return null; // caller will fall through to browser/UTC
  }
}

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

  // Timezone efectivo con jerarquía: User > Browser > UTC
  // IMPORTANTE: Siempre prioriza el timezone del usuario para mostrar fechas
  // El workspace timezone solo se usa para seguimiento interno, no para visualización
  effectiveTimezone: () => {
    const state = get();
    return (
      sanitizeTimezone(state.userTimezone) ||
      Intl.DateTimeFormat().resolvedOptions().timeZone ||
      'UTC'
    );
  },

  // Etiqueta para mostrar en UI
  timezoneLabel: () => {
    const state = get();
    if (state.userTimezone) {
      return `${state.userTimezone}`;
    }
    const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (browserTz) {
      return `${browserTz} (Auto-detectado)`;
    }
    return 'UTC';
  },

  // Inicializar desde props de Inertia (más rápido)
  initializeFromInertia: (workspaceTimezone?: string, userTimezone?: string) => {
    set({
      workspaceTimezone: sanitizeTimezone(workspaceTimezone) || null,
      userTimezone: sanitizeTimezone(userTimezone) || null,
      isLoaded: true,
    });

    console.log('✅ Timezones initialized from Inertia:', {
      workspace: workspaceTimezone,
      user: userTimezone,
      effective: get().effectiveTimezone(),
    });
  },

  // Cargar timezones desde API (fallback)
  loadTimezones: async () => {
    try {
      const [workspaceRes, userRes] = await Promise.all([
        axios.get('/api/v1/workspace/timezone').catch(() => ({ data: { timezone: null } })),
        axios.get('/api/v1/timezone').catch(() => ({ data: { timezone: null } })),
      ]);

      set({
        workspaceTimezone: sanitizeTimezone(workspaceRes.data.timezone) || null,
        userTimezone: sanitizeTimezone(userRes.data.timezone) || null,
        isLoaded: true,
      });

      console.log('✅ Timezones loaded from API:', {
        workspace: workspaceRes.data.timezone,
        user: userRes.data.timezone,
        effective: get().effectiveTimezone(),
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
  },
}));
