import { Head, router } from '@inertiajs/react';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import axios from 'axios';

interface SuccessProps {
  session: {
    id: string;
    amount_total: number;
    currency: string;
    customer_email?: string;
  };
}

export default function Success({ session }: SuccessProps) {
  const amount = (session.amount_total / 100).toFixed(2);
  const [isUpdating, setIsUpdating] = useState(true);
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 10; // Intentar durante 20 segundos (10 intentos x 2 segundos)

  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    let redirectTimer: NodeJS.Timeout;

    const checkSubscriptionUpdate = async () => {
      try {
        const response = await axios.get(route('api.v1.subscription.current-usage'), {
          params: { _t: Date.now() }
        });

        if (response.data.success) {
          // Suscripción actualizada correctamente
          setIsUpdating(false);
          
          // Disparar evento para actualizar UI
          window.dispatchEvent(new Event('subscription-plan-changed'));
          
          // Redirigir después de 2 segundos
          redirectTimer = setTimeout(() => {
            router.visit('/dashboard', {
              preserveState: false,
              preserveScroll: false,
            });
          }, 2000);
          
          return true;
        }
      } catch (error: any) {
        // Si es 404, la suscripción aún no está lista
        if (error.response?.status === 404) {
          return false;
        }
        console.error('Error checking subscription:', error);
      }
      return false;
    };

    // Polling para verificar si la suscripción se actualizó
    const startPolling = async () => {
      // Primer intento inmediato
      const updated = await checkSubscriptionUpdate();
      
      if (!updated && attempts < maxAttempts) {
        // Si no se actualizó, hacer polling cada 2 segundos
        pollInterval = setInterval(async () => {
          setAttempts(prev => prev + 1);
          
          const isUpdated = await checkSubscriptionUpdate();
          
          if (isUpdated || attempts >= maxAttempts) {
            clearInterval(pollInterval);
            
            if (!isUpdated) {
              // Si después de todos los intentos no se actualizó, redirigir de todos modos
              setIsUpdating(false);
              redirectTimer = setTimeout(() => {
                router.visit('/dashboard', {
                  preserveState: false,
                  preserveScroll: false,
                });
              }, 2000);
            }
          }
        }, 2000);
      }
    };

    // Esperar 1 segundo antes de empezar el polling para dar tiempo al webhook
    setTimeout(startPolling, 1000);

    return () => {
      if (pollInterval) clearInterval(pollInterval);
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [attempts]);

  return (
    <>
      <Head title="Pago Exitoso" />
      
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="flex justify-center mb-6">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            ¡Pago Exitoso!
          </h1>
          
          <p className="text-gray-600 mb-6">
            {isUpdating 
              ? 'Estamos activando tu suscripción...'
              : 'Tu suscripción ha sido activada correctamente.'
            }
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="text-sm text-gray-500 mb-2">Monto pagado</div>
            <div className="text-3xl font-bold text-gray-900">
              ${amount} {session.currency.toUpperCase()}
            </div>
            {session.customer_email && (
              <div className="text-sm text-gray-500 mt-2">
                Recibirás un recibo en {session.customer_email}
              </div>
            )}
          </div>
          
          <div className="text-xs text-gray-400 mb-6">
            ID de sesión: {session.id}
          </div>

          {isUpdating && (
            <div className="mb-4">
              <div className="inline-flex items-center gap-2 text-sm text-blue-600">
                <Loader2 className="animate-spin h-4 w-4" />
                Actualizando tu cuenta...
              </div>
              <div className="text-xs text-gray-400 mt-2">
                Intento {attempts + 1} de {maxAttempts}
              </div>
            </div>
          )}

          {!isUpdating && (
            <div className="mb-4">
              <div className="inline-flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                ¡Cuenta actualizada!
              </div>
            </div>
          )}
          
          <a
            href="/dashboard"
            className="inline-block w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ir al Dashboard
          </a>

          <p className="text-xs text-gray-400 mt-4">
            {isUpdating 
              ? 'Por favor espera mientras activamos tu suscripción...'
              : 'Serás redirigido automáticamente en unos segundos'
            }
          </p>
        </div>
      </div>
    </>
  );
}
