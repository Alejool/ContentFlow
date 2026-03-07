import { Head } from '@inertiajs/react';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const [isUpdating, setIsUpdating] = useState(true);
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 10; // Intentar durante 20 segundos (10 intentos x 2 segundos)

  useEffect(() => {
    let pollInterval: NodeJS.Timeout;

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
              // Si después de todos los intentos no se actualizó, marcar como completado de todos modos
              setIsUpdating(false);
            }
          }
        }, 2000);
      }
    };

    // Esperar 1 segundo antes de empezar el polling para dar tiempo al webhook
    setTimeout(startPolling, 1000);

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [attempts]);

  return (
    <>
      <Head title={t('checkout.success.title', 'Pago Exitoso')} />
      
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="flex justify-center mb-6">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {t('checkout.success.title', '¡Pago Exitoso!')}
          </h1>
          
          <p className="text-gray-600 mb-8">
            {isUpdating 
              ? t('checkout.success.activating', 'Estamos activando tu suscripción...')
              : t('checkout.success.activated', 'Tu suscripción ha sido activada correctamente.')
            }
          </p>

          {isUpdating && (
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 text-sm text-blue-600">
                <Loader2 className="animate-spin h-4 w-4" />
                {t('checkout.success.updating', 'Actualizando tu cuenta...')}
              </div>
            </div>
          )}
          
          <div className="space-y-3">
            <a
              href="/dashboard"
              className="block w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('checkout.success.goToDashboard', 'Ir al Dashboard')}
            </a>
          </div>

          {isUpdating && (
            <p className="text-xs text-gray-400 mt-4">
              {t('checkout.success.pleaseWait', 'Por favor espera mientras activamos tu suscripción...')}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
