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
  currentPlan 
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
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">{msg.title}</h2>
            <p className="text-gray-600">{msg.description}</p>
          </div>
          
          {/* Plan actual */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between mb-2">
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
              <div className="border-2 border-blue-500 rounded-lg p-4 bg-blue-50 relative">
                <div className="absolute -top-3 left-4 bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
                  ⭐ Recomendado
                </div>
                
                <div className="flex items-start justify-between mb-3 mt-2">
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <Sparkles className="w-5 h-5 text-blue-600 mr-2" />
                      <span className="font-semibold text-blue-900">
                        Comprar Add-on
                      </span>
                    </div>
                    <p className="text-sm text-blue-700">
                      {msg.suggestion}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      {msg.savings} • Disponible al instante
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-2xl font-bold text-blue-900">
                      {msg.price}
                    </div>
                    <div className="text-xs text-blue-600">
                      Pago único
                    </div>
                  </div>
                </div>
                
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => {
                    onClose();
                    router.visit('/subscription/addons');
                  }}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Comprar Ahora
                </Button>
              </div>
            )}
            
            {/* Opción 2: Actualizar Plan */}
            <div className="border rounded-lg p-4 hover:border-gray-400 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center mb-1">
                    <TrendingUp className="w-5 h-5 text-gray-600 mr-2" />
                    <span className="font-semibold">
                      {canBuyAddon ? 'Actualizar Plan' : 'Actualizar a Professional'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {canBuyAddon 
                      ? 'Límites más altos permanentes' 
                      : msg.suggestion
                    }
                  </p>
                  {!canBuyAddon && (
                    <p className="text-xs text-gray-500 mt-1">
                      {msg.savings}
                    </p>
                  )}
                </div>
                {!canBuyAddon && (
                  <div className="text-right ml-4">
                    <div className="text-xl font-bold text-gray-900">
                      {msg.price}
                    </div>
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
                className="w-full text-sm text-gray-500 hover:text-gray-700 py-2 transition-colors"
              >
                Esperar hasta el próximo mes
              </button>
            )}
          </div>
          
          {/* Footer con beneficios */}
          <div className="mt-6 pt-4 border-t">
            <p className="text-xs text-gray-500 text-center">
              ✓ Sin compromisos • ✓ Cancela cuando quieras • ✓ Soporte 24/7
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
