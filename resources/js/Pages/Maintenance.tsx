import { Head } from '@inertiajs/react';
import { Construction, Clock, RefreshCw } from 'lucide-react';

interface Props {
  message?: string;
  estimatedTime?: string;
}

export default function Maintenance({ message, estimatedTime }: Props) {
  return (
    <>
      <Head title="Mantenimiento" />

      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4 dark:from-gray-900 dark:to-gray-800">
        <div className="w-full max-w-md">
          <div className="rounded-2xl bg-white p-8 text-center shadow-xl dark:bg-gray-800">
            {/* Icono animado */}
            <div className="mb-6 flex justify-center">
              <div className="relative">
                <Construction className="h-20 w-20 animate-bounce text-yellow-500" />
                <div className="absolute -right-2 -top-2">
                  <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              </div>
            </div>

            {/* Título */}
            <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
              Modo Mantenimiento
            </h1>

            {/* Mensaje */}
            <p className="mb-6 text-lg text-gray-600 dark:text-gray-300">
              {message || 'Estamos realizando mejoras en el sistema.'}
            </p>

            {/* Tiempo estimado */}
            {estimatedTime && (
              <div className="mb-6 flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
                <Clock className="h-5 w-5" />
                <span>{estimatedTime}</span>
              </div>
            )}

            {/* Información adicional */}
            <div className="mb-6 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Estamos trabajando para mejorar tu experiencia. Por favor, vuelve a intentarlo en
                unos minutos.
              </p>
            </div>

            {/* Botón de recarga */}
            <button
              onClick={() => window.location.reload()}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors duration-200 hover:bg-blue-700"
            >
              <RefreshCw className="h-5 w-5" />
              Reintentar
            </button>

            {/* Footer */}
            <p className="mt-6 text-xs text-gray-400 dark:text-gray-500">
              Si el problema persiste, contacta con soporte
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
