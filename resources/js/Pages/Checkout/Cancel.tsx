import { Head } from '@inertiajs/react';
import { XCircle } from 'lucide-react';

export default function Cancel() {
  return (
    <>
      <Head title="Pago Cancelado" />

      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 text-black dark:text-white">
        <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-lg">
          <div className="mb-6 flex justify-center">
            <XCircle className="h-16 w-16 text-red-500" />
          </div>

          <h1 className="mb-4 text-2xl font-bold text-gray-900">Pago Cancelado</h1>

          <p className="mb-8 text-gray-600">
            Has cancelado el proceso de pago. No se ha realizado ningún cargo.
          </p>

          <div className="space-y-3">
            <a
              href="/dashboard"
              className="block w-full rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700"
            >
              Volver al Dashboard
            </a>

            <button
              onClick={() => window.history.back()}
              className="block w-full rounded-lg bg-gray-100 px-6 py-3 text-gray-700 transition-colors hover:bg-gray-200"
            >
              Intentar de Nuevo
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
