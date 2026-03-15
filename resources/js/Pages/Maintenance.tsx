import { Head } from "@inertiajs/react";
import { Construction, Clock, RefreshCw } from "lucide-react";

interface Props {
  message?: string;
  estimatedTime?: string;
}

export default function Maintenance({ message, estimatedTime }: Props) {
  return (
    <>
      <Head title="Mantenimiento" />

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
            {/* Icono animado */}
            <div className="mb-6 flex justify-center">
              <div className="relative">
                <Construction className="h-20 w-20 text-yellow-500 animate-bounce" />
                <div className="absolute -top-2 -right-2">
                  <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
                </div>
              </div>
            </div>

            {/* Título */}
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Modo Mantenimiento
            </h1>

            {/* Mensaje */}
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
              {message || "Estamos realizando mejoras en el sistema."}
            </p>

            {/* Tiempo estimado */}
            {estimatedTime && (
              <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 mb-6">
                <Clock className="h-5 w-5" />
                <span>{estimatedTime}</span>
              </div>
            )}

            {/* Información adicional */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Estamos trabajando para mejorar tu experiencia. Por favor,
                vuelve a intentarlo en unos minutos.
              </p>
            </div>

            {/* Botón de recarga */}
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
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
