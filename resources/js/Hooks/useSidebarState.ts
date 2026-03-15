import { useEffect, useState } from "react";

const SIDEBAR_STORAGE_KEY = "contentflow_sidebar_open";

/**
 * Hook personalizado para manejar el estado del sidebar con persistencia en localStorage
 * @param defaultValue - Valor por defecto si no hay nada guardado en localStorage
 * @returns [isSidebarOpen, setIsSidebarOpen] - Estado y función para actualizarlo
 */
export function useSidebarState(defaultValue: boolean = true): [boolean, (value: boolean) => void] {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    // Intentar cargar el estado guardado en localStorage
    if (typeof window === "undefined") return defaultValue;

    try {
      const savedState = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (savedState !== null) {
        return JSON.parse(savedState);
      }
    } catch (error) {
      console.warn("Error al cargar el estado del sidebar desde localStorage:", error);
    }

    return defaultValue;
  });

  // Guardar en localStorage cada vez que cambie el estado
  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(isSidebarOpen));
    } catch (error) {
      console.warn("Error al guardar el estado del sidebar en localStorage:", error);
    }
  }, [isSidebarOpen]);

  return [isSidebarOpen, setIsSidebarOpen];
}
