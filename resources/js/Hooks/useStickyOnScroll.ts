import { useEffect, useState } from 'react';

interface UseStickyOnScrollOptions {
  threshold?: number; // Porcentaje del scroll (0-100) donde se activa el sticky
  enabled?: boolean; // Si el hook está habilitado
}

/**
 * Hook para hacer un elemento sticky después de cierto porcentaje de scroll
 * @param threshold - Porcentaje del scroll (0-100) donde se activa el sticky. Default: 50
 * @param enabled - Si el hook está habilitado. Default: true
 * @returns isSticky - Boolean que indica si el elemento debe ser sticky
 */
export function useStickyOnScroll({
  threshold = 50,
  enabled = true,
}: UseStickyOnScrollOptions = {}) {
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setIsSticky(false);
      return;
    }

    const handleScroll = () => {
      // Calcular el porcentaje de scroll
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / docHeight) * 100;

      // Activar sticky si se supera el threshold
      setIsSticky(scrollPercent >= threshold);
    };

    // Ejecutar al montar para verificar posición inicial
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold, enabled]);

  return isSticky;
}
