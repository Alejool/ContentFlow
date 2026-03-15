import { useEffect, useState } from "react";

/**
 * Hook genérico para persistir cualquier estado en localStorage
 * @param key - Clave única para identificar el valor en localStorage
 * @param defaultValue - Valor por defecto si no hay nada guardado
 * @returns [state, setState] - Estado y función para actualizarlo
 */
export function usePersistedState<T>(
  key: string,
  defaultValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    // Intentar cargar el estado guardado en localStorage
    if (typeof window === "undefined") return defaultValue;

    try {
      const savedState = localStorage.getItem(key);
      if (savedState !== null) {
        return JSON.parse(savedState);
      }
    } catch (error) {
      console.warn(`Error al cargar el estado desde localStorage (${key}):`, error);
    }

    return defaultValue;
  });

  // Guardar en localStorage cada vez que cambie el estado
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.warn(`Error al guardar el estado en localStorage (${key}):`, error);
    }
  }, [key, state]);

  return [state, setState];
}

/**
 * Hook para persistir el estado de vista del calendario
 */
export function useCalendarViewState(defaultView: "month" | "week" | "day" = "month") {
  return usePersistedState<"month" | "week" | "day">("contentflow_calendar_view", defaultView);
}

/**
 * Hook para persistir el estado de filtros visibles
 */
export function useFiltersVisibilityState(defaultVisible: boolean = false) {
  return usePersistedState<boolean>("contentflow_filters_visible", defaultVisible);
}

/**
 * Hook para persistir el estado de ordenamiento en tablas
 */
export function useSortState<T extends string>(
  storageKey: string,
  defaultField: T,
  defaultDirection: "asc" | "desc" = "desc",
) {
  const [sortField, setSortField] = usePersistedState<T>(`${storageKey}_sort_field`, defaultField);
  const [sortDirection, setSortDirection] = usePersistedState<"asc" | "desc">(
    `${storageKey}_sort_direction`,
    defaultDirection,
  );

  return {
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
  };
}
