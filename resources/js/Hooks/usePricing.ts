import { useState } from 'react';
import { router } from '@inertiajs/react';
import { usePricingStore } from '@/stores/pricingStore';

interface UsePricingOptions {
  isAuthenticated: boolean;
  currentPlan?: string;
}

export function usePricing({ isAuthenticated, currentPlan }: UsePricingOptions) {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const { billingCycle, setBillingCycle } = usePricingStore();

  const handleSelectPlan = async (planId: string) => {
    // Si no está autenticado, redirigir a registro con el plan seleccionado
    if (!isAuthenticated) {
      router.visit('/register', {
        data: { plan: planId },
        method: 'get',
      });
      return;
    }

    // Si es plan gratuito o demo, activar directamente
    if (planId === 'free' || planId === 'demo') {
      setIsLoading(planId);
      router.post('/api/v1/subscription/activate-free-plan', 
        { plan: planId },
        {
          onSuccess: () => {
            window.dispatchEvent(new CustomEvent('subscription-plan-changed'));
            
            setTimeout(() => {
              router.visit('/dashboard', {
                preserveState: false,
                preserveScroll: false,
              });
            }, 500);
          },
          onError: (errors) => {
            console.error('Error activating plan:', errors);
            alert('Error al activar el plan. Por favor, intenta de nuevo.');
          },
          onFinish: () => {
            setIsLoading(null);
          },
        }
      );
      return;
    }

    // Para planes de pago, intentar cambiar directamente
    setIsLoading(planId);
    try {
      const changeResponse = await fetch('/api/v1/subscription/change-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({ plan: planId }),
      });

      const changeData = await changeResponse.json();

      // Si el cambio fue exitoso (tiene suscripción activa)
      if (changeResponse.ok && changeData.success) {
        const message = changeData.had_active_subscription 
          ? 'Plan actualizado exitosamente. Tu suscripción activa ha sido modificada.'
          : 'Plan cambiado exitosamente.';
        
        alert(message);
        window.dispatchEvent(new CustomEvent('subscription-plan-changed'));
        
        setTimeout(() => {
          router.visit('/dashboard', {
            preserveState: false,
            preserveScroll: false,
          });
        }, 500);
        return;
      }

      // Si necesita checkout (código 402), crear sesión de pago
      if (changeResponse.status === 402 && changeData.requires_checkout) {
        const response = await fetch('/api/v1/subscription/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          },
          body: JSON.stringify({ plan: planId }),
        });

        const data = await response.json();

        if (!response.ok) {
          if (data.error === 'Invalid plan configuration') {
            alert('Este plan requiere configuración de Stripe. Por favor, contacta al administrador o prueba el plan Demo gratuito.');
          } else {
            alert(data.message || data.error || 'Error al procesar el pago. Por favor, intenta de nuevo.');
          }
          setIsLoading(null);
          return;
        }

        if (data.url) {
          window.location.href = data.url;
        } else {
          alert('No se pudo crear la sesión de pago. Por favor, intenta de nuevo.');
          setIsLoading(null);
        }
        return;
      }

      // Otros errores
      alert(changeData.message || changeData.error || 'Error al cambiar el plan. Por favor, intenta de nuevo.');
      setIsLoading(null);
      
    } catch (error) {
      console.error('Error:', error);
      alert('Error de conexión. Por favor, verifica tu conexión e intenta de nuevo.');
      setIsLoading(null);
    }
  };

  // Nueva función para verificar si hay suscripción activa
  const checkActiveSubscription = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/v1/subscription/check-active', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.has_active_subscription || false;
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
    return false;
  };

  const formatPrice = (price: number) => {
    if (billingCycle === 'yearly') {
      return Math.floor(price * 12 * 0.8); // 20% descuento anual
    }
    return price;
  };

  const isPlanCurrent = (planId: string) => currentPlan === planId;

  return {
    isLoading,
    billingCycle,
    setBillingCycle,
    handleSelectPlan,
    formatPrice,
    isPlanCurrent,
    checkActiveSubscription,
  };
}
