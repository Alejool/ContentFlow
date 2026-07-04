import { checkoutService } from '@/Services/Subscription/checkoutService';
import { CreditCard, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface CheckoutButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export default function CheckoutButton({ className = '', children }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);

    try {
      const response = await checkoutService.createSession();

      // Redirigir a la página de checkout de Stripe
      if (response.url) {
        window.location.href = response.url;
      }
    } catch (error) {
      console.error('Error al crear sesión de checkout:', error);
      alert('Hubo un error al procesar tu solicitud. Por favor intenta de nuevo.');
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {loading ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          Procesando...
        </>
      ) : (
        <>
          <CreditCard className="h-5 w-5" />
          {children || 'Comprar Plan Premium'}
        </>
      )}
    </button>
  );
}
