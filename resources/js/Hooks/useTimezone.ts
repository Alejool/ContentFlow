import { useTimezoneStore } from '@/stores/timezoneStore';
import { formatDate, toUTC, toLocalDate, getNow, DATE_FORMATS } from '@/Utils/timezoneUtils';

/**
 * Hook personalizado para manejar timezones de manera fácil
 *
 * @example
 * const { formatDate, toUTC, effectiveTimezone } = useTimezone();
 *
 * // Formatear fecha del backend
 * const formatted = formatDate(publication.scheduled_at);
 *
 * // Convertir fecha local a UTC para enviar
 * const utcDate = toUTC(new Date());
 */
export const useTimezone = () => {
  const store = useTimezoneStore();

  return {
    // State
    workspaceTimezone: store.workspaceTimezone,
    userTimezone: store.userTimezone,
    isLoaded: store.isLoaded,

    // Getters
    effectiveTimezone: store.effectiveTimezone(),
    timezoneLabel: store.timezoneLabel(),

    // Actions
    loadTimezones: store.loadTimezones,
    updateWorkspaceTimezone: store.updateWorkspaceTimezone,
    updateUserTimezone: store.updateUserTimezone,

    // Utility functions
    formatDate,
    toUTC,
    toLocalDate,
    getNow,
    DATE_FORMATS,
  };
};
