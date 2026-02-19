import { flushSync } from "react-dom";

/**
 * Ejecuta un cambio de tema con una transición circular suave usando View Transition API
 * @param callback - Función que realiza el cambio de tema
 * @param event - Evento del mouse para capturar la posición del cursor
 * @returns Promise que se resuelve cuando la transición termina
 */
export function transitionTheme(
  callback: () => void,
  event?: React.MouseEvent
): Promise<void> {
  // Si no hay soporte para View Transition API, ejecutar directamente
  if (!(document as any).startViewTransition) {
    callback();
    return Promise.resolve();
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
