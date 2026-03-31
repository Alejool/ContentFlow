import Button from '@/Components/common/Modern/Button';
import { Dialog, DialogContent } from '@/Components/ui/dialog';
import { router } from '@inertiajs/react';
import { AlertCircle, Sparkles, TrendingUp } from 'lucide-react';

interface LimitReachedModalProps {
  isOpen: boolean;
  onClose: () => void;
  limitType: 'ai_credits' | 'storage' | 'publications' | 'social_accounts';
  currentPlan: string;
}

export function LimitReachedModal({
  isOpen,
  onClose,
  limitType,
  currentPlan,
}: LimitReachedModalProps) {
  const messages = {
    ai_credits: {
      title: 'Créditos de IA Agotados',
      description: 'Has usado todos tus créditos de IA este mes.',
      planLimit: '10 créditos/mes',
      suggestion: '500 créditos adicionales',
      price: '$39.99',
      savings: 'Ahorra 20%',
    },
    storage: {
      title: 'Almacenamiento Lleno',
      description: 'Has alcanzado tu límite de almacenamiento.',
      planLimit: '1 GB',
      suggestion: '50 GB adicionales',
      price: '$19.99',
      savings: 'Ahorra 20%',
    },
    publications: {
      title: 'Límite de Publicaciones Alcanzado',
      description: 'Has alcanzado el límite de publicaciones de tu plan.',
      planLimit: '10 publicaciones/mes',
      suggestion: 'Plan Professional',
      price: '$49/mes',
      savings: '200 publicaciones/mes',
    },
    social_accounts: {
      title: 'Límite de Cuentas Sociales',
      description: 'Has conectado el máximo de cuentas sociales permitidas.',
      planLimit: '3 cuentas',
      suggestion: 'Plan Professional',
      price: '$49/mes',
      savings: '8 cuentas sociales',
    },
  };

  const msg = messages[limitType];
  const canBuyAddon = limitType === 'ai_credits' || limitType === 'storage';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="mb-2 text-2xl font-bold">{msg.title}</h2>
            <p className="text-gray-600">{msg.description}</p>
          </div>

          {/* Plan actual */}
          <div className="mb-6 rounded-lg bg-gray-50 p-4">
            <div className="mb-2 flex justify-between">
              <span className="text-sm text-gray-600">Plan actual:</span>
              <span className="font-semibold capitalize">{currentPlan}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Límite:</span>
              <span className="font-semibold">{msg.planLimit}</span>
            </div>
          </div>

          {/* Opciones */}
          <div className="space-y-3">
            {/* Opción 1: Comprar Add-on (solo para IA y Storage) */}
            {canBuyAddon && (
              <div className="relative rounded-lg border-2 border-blue-500 bg-blue-50 p-4">
                <div className="absolute -top-3 left-4 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                  ⭐ Recomendado
                </div>

                <div className="mb-3 mt-2 flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-1 flex items-center">
                      <Sparkles className="mr-2 h-5 w-5 text-blue-600" />
                      <span className="font-semibold text-blue-900">Comprar Add-on</span>
                    </div>
                    <p className="text-sm text-blue-700">{msg.suggestion}</p>
                    <p className="mt-1 text-xs text-blue-600">
                      {msg.savings} • Disponible al instante
                    </p>
                  </div>
                  <div className="ml-4 text-right">
                    <div className="text-2xl font-bold text-blue-900">{msg.price}</div>
                    <div className="text-xs text-blue-600">Pago único</div>
                  </div>
                </div>

                <Button
                  className="w-full bg-blue-600 text-white hover:bg-blue-700"
                  onClick={() => {
                    onClose();
                    router.visit('/subscription/addons');
                  }}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Comprar Ahora
                </Button>
              </div>
            )}

            {/* Opción 2: Actualizar Plan */}
            <div className="rounded-lg border p-4 transition-colors hover:border-gray-400">
              <div className="mb-3 flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-1 flex items-center">
                    <TrendingUp className="mr-2 h-5 w-5 text-gray-600" />
                    <span className="font-semibold">
                      {canBuyAddon ? 'Actualizar Plan' : 'Actualizar a Professional'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {canBuyAddon ? 'Límites más altos permanentes' : msg.suggestion}
                  </p>
                  {!canBuyAddon && <p className="mt-1 text-xs text-gray-500">{msg.savings}</p>}
                </div>
                {!canBuyAddon && (
                  <div className="ml-4 text-right">
                    <div className="text-xl font-bold text-gray-900">{msg.price}</div>
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  onClose();
                  router.visit('/subscription/pricing');
                }}
              >
                Ver Planes
              </Button>
            </div>

            {/* Opción 3: Esperar (solo para límites mensuales) */}
            {(limitType === 'ai_credits' || limitType === 'publications') && (
              <button
                onClick={onClose}
                className="w-full py-2 text-sm text-gray-500 transition-colors hover:text-gray-700"
              >
                Esperar hasta el próximo mes
              </button>
            )}
          </div>

          {/* Footer con beneficios */}
          <div className="mt-6 border-t pt-4">
            <p className="text-center text-xs text-gray-500">
              ✓ Sin compromisos • ✓ Cancela cuando quieras • ✓ Soporte 24/7
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
