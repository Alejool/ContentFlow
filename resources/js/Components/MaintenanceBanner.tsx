import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';

interface Props {
  message?: string;
}

export default function MaintenanceBanner({ message }: Props) {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="bg-yellow-500 px-4 py-3 text-white shadow-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <p className="font-semibold">
            {message || 'Modo Mantenimiento Activo - Solo super admins pueden acceder'}
          </p>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="text-white transition-colors hover:text-yellow-100"
          aria-label="Cerrar banner"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
