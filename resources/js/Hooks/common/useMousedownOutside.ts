import { useEffect, useRef, type RefObject } from 'react';

/** Ref o `id` de elemento (útil con `createPortal`, donde un ref al hijo también sirve). */
export type MousedownOutsideBoundary = RefObject<HTMLElement | null> | string;

export type UseMousedownOutsideOptions = {
  triggerRef: RefObject<HTMLElement | null>;
  /**
   * Nodos adicionales que cuentan como “dentro”. Si un `id` no existe aún en el documento,
   * no se llama a `onOutside` (misma lógica que dropdown en portal antes de montar).
   */
  boundaries?: MousedownOutsideBoundary[];
};

function resolveBoundary(b: MousedownOutsideBoundary): HTMLElement | null {
  return typeof b === 'string' ? document.getElementById(b) : b.current;
}

/**
 * `mousedown` en document: llama `onOutside` solo si el target queda fuera del trigger
 * y fuera de cada boundary resuelto; boundary ausente bloquea el cierre.
 */
export function useMousedownOutside(
  active: boolean,
  onOutside: () => void,
  options: UseMousedownOutsideOptions,
): void {
  const { triggerRef, boundaries } = options;
  const onOutsideRef = useRef(onOutside);
  const boundariesRef = useRef(boundaries);
  onOutsideRef.current = onOutside;
  boundariesRef.current = boundaries;

  useEffect(() => {
    if (!active) return;

    const handler = (e: MouseEvent) => {
      const target = e.target as Node;

      if (!triggerRef.current || triggerRef.current.contains(target)) {
        return;
      }

      for (const b of boundariesRef.current ?? []) {
        const el = resolveBoundary(b);
        if (!el || el.contains(target)) {
          return;
        }
      }

      onOutsideRef.current();
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [active, triggerRef]);
}
