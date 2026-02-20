import { flushSync } from "react-dom";

/**
 * Theme transition options
 */
export interface ThemeTransitionOptions {
  duration?: number;
  easing?: string;
  respectReducedMotion?: boolean;
  event?: React.MouseEvent;
}

/**
 * Detects if the user prefers reduced motion
 * @returns true if user prefers reduced motion, false otherwise
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  
  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  return mediaQuery.matches;
}

/**
 * Executes an instant theme change without animation (for reduced motion)
 * @param callback - Function that performs the theme change
 */
export function instantTransition(callback: () => void): void {
  flushSync(() => {
    callback();
  });
}

/**
 * Ejecuta un cambio de tema con una transición circular suave usando View Transition API
 * @param callback - Función que realiza el cambio de tema
 * @param options - Configuration options for the transition
 * @returns Promise que se resuelve cuando la transición termina
 */
export function transitionTheme(
  callback: () => void,
  options?: ThemeTransitionOptions
): Promise<void> {
  const {
    duration = 250,
    easing = "cubic-bezier(0.4, 0, 0.2, 1)",
    respectReducedMotion = true,
    event,
  } = options || {};

  // Check if reduced motion is preferred and should be respected
  if (respectReducedMotion && prefersReducedMotion()) {
    instantTransition(callback);
    return Promise.resolve();
  }

  // Si no hay soporte para View Transition API, ejecutar directamente
  if (!(document as any).startViewTransition) {
    callback();
    return Promise.resolve();
  }

  // Apply custom duration and easing if provided
  if (duration !== 250 || easing !== "cubic-bezier(0.4, 0, 0.2, 1)") {
    document.documentElement.style.setProperty("--theme-transition-duration", `${duration}ms`);
    document.documentElement.style.setProperty("--theme-transition-easing", easing);
  }

  // Capturar posición del cursor si está disponible
  if (event) {
    const x = event.clientX;
    const y = event.clientY;

    // Convertir a porcentaje para que funcione en cualquier tamaño de pantalla
    const xPercent = (x / window.innerWidth) * 100;
    const yPercent = (y / window.innerHeight) * 100;

    document.documentElement.style.setProperty("--x", `${xPercent}%`);
    document.documentElement.style.setProperty("--y", `${yPercent}%`);
  } else {
    // Si no hay evento, usar el centro de la pantalla
    document.documentElement.style.setProperty("--x", "50%");
    document.documentElement.style.setProperty("--y", "50%");
  }

  // Iniciar la transición
  const transition = (document as any).startViewTransition(() => {
    flushSync(() => {
      callback();
    });
  });

  return transition.finished;
}
