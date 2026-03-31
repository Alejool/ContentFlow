import { useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { useTimezoneStore } from '@/stores/timezoneStore';

/**
 * Componente que inicializa el timezone store desde los props de Inertia
 * Debe colocarse en el layout principal (AuthenticatedLayout)
 */
export const TimezoneInitializer: React.FC = () => {
  const { auth } = usePage<any>().props;
  const { initializeFromInertia, isLoaded } = useTimezoneStore();

  useEffect(() => {
    if (!isLoaded && auth?.current_workspace && auth?.user) {
      // Inicializar desde props de Inertia (más rápido que hacer requests)
      initializeFromInertia(auth.current_workspace?.timezone, auth.user?.timezone);
    }
  }, [auth, isLoaded, initializeFromInertia]);

  // Este componente no renderiza nada
  return null;
};
