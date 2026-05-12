import { useAddonsSummaryStore } from '@/stores/Addons/addonsSummaryStore';
import { useEffect } from 'react';

/**
 * Hook personalizado para obtener el resumen de addons del workspace actual
 * 
 * @returns {Object} Estado del resumen de addons
 * @property {AddonsSummaryData | null} data - Datos del resumen de addons
 * @property {boolean} loading - Estado de carga
 * @property {string | null} error - Mensaje de error si existe
 * @property {Function} refetch - Función para recargar los datos
 * 
 * @example
 * ```tsx
 * const { data, loading, error, refetch } = useAddonsSummary();
 * 
 * if (loading) return <Spinner />;
 * if (error) return <Error message={error} />;
 * if (!data) return null;
 * 
 * return <AddonsSummaryView data={data} />;
 * ```
 */
export const useAddonsSummary = () => {
  const { data, loading, error, fetchSummary } = useAddonsSummaryStore();

  useEffect(() => {
    // Solo cargar si no hay datos y no está cargando
    if (!data && !loading) {
      fetchSummary();
    }
  }, [data, loading, fetchSummary]);

  return {
    data,
    loading,
    error,
    refetch: fetchSummary,
  };
};
