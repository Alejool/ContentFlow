import { Head } from '@inertiajs/react';
import { XCircle } from 'lucide-react';

export default function Cancel() {
  return (
    <>
      <Head title="Pago Cancelado" />
      
      <div className="min-h-screen text-black dark:text-white flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="flex justify-center mb-6">
            <XCircle className="w-16 h-16 text-red-500" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Pago Cancelado
          </h1>
          
          <p className="text-gray-600 mb-8">
            Has cancelado el proceso de pago. No se ha realizado ningún cargo.
          </p>
          
          <div className="space-y-3">
            <a
              href="/dashboard"
              className="block w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Volver al Dashboard
            </a>
            
            <button
              onClick={() => window.history.back()}
              className="block w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Intentar de Nuevo
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
