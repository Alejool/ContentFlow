import { Sparkles } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { useSubscriptionUsage } from '@/Hooks/useSubscriptionUsage';
import { PlanUsageCards } from '@/Components/Subscription/PlanUsageCards';
import { useActiveAddons } from '@/Hooks/useActiveAddons';
import { AddonCard } from '@/Components/Subscription/AddonCard';

interface AddonsPromotionCardProps {
  showCarousel?: boolean;
  showPromoBanner?: boolean;
}

export function AddonsPromotionCard({ showCarousel = false, showPromoBanner = true }: AddonsPromotionCardProps) {
  const { t } = useTranslation();
  const { usage, loading } = useSubscriptionUsage();
  const { addons, loading: addonsLoading } = useActiveAddons();
  const [cheapestAddon, setCheapestAddon] = useState<any>(null);
  
  // Obtener el addon más barato para mostrar en el banner
  useEffect(() => {
    fetch('/api/workspace/addons')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          const allPackages: any[] = [];
          
          // Recopilar todos los paquetes
          Object.keys(data.data).forEach(type => {
            if (data.data[type] && typeof data.data[type] === 'object') {
              Object.values(data.data[type]).forEach((pkg: any) => {
                if (pkg.enabled) {
                  allPackages.push(pkg);
                }
              });
            }
          });
          
          // Encontrar el más barato por precio local
          if (allPackages.length > 0) {
            const cheapest = allPackages.reduce((min, pkg) => 
              (pkg.price_local || pkg.price) < (min.price_local || min.price) ? pkg : min
            );
            setCheapestAddon(cheapest);
          }
        }
      })
      .catch(error => {
        console.error('Error loading addons:', error);
      });
  }, []);
  
  if (loading || !usage) return null;
  
  // Calcular si alguna métrica está alta (>70%)
  const hasHighUsage = 
    usage.publications.percentage > 70 || 
    usage.storage.percentage > 70 ||
    (usage.ai_requests.limit && usage.ai_requests.limit > 0 && (usage.ai_requests.used / usage.ai_requests.limit * 100) > 70);

  return (
    <div className="space-y-4">
      {/* Componente de uso del plan */}
      <PlanUsageCards showCarousel={true} showTitle={true} />
      
      {/* Banner promocional si hay uso alto y está habilitado */}
      {showPromoBanner && hasHighUsage && (
        <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl p-6 border border-primary-200 dark:border-primary-700/50 shadow-sm hover:shadow-md text-dark dark:text-white shadow-xl">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold mb-2 flex items-center">
                <Sparkles className="w-6 h-6 mr-2" />
                {t('subscription.addons.powerUpWorkspace', 'Potencia tu Workspace')}
              </h3>
              <p className="text-sm">
                {t('subscription.addons.highUsageMessage', 'Estás usando mucho tu plan. ¡Expande tu capacidad!')}
              </p>
            </div>
            <Sparkles className="w-8 h-8 opacity-80" />
          </div>
          
          {/* Beneficios */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 mb-4 border border-white/20">
            <div className="text-xs space-y-1.5">
              {[
                cheapestAddon 
                  ? t('subscription.addons.packagesFrom', 'Paquetes desde') + ' ' + (cheapestAddon.formatted_price || `$${cheapestAddon.price}`)
                  : t('subscription.addons.packagesFrom', 'Paquetes desde $9.99'),
                t('subscription.addons.upToDiscount', 'Hasta 40% de descuento'),
                t('subscription.addons.instantAvailable', 'Disponible al instante')
              ].map((benefit, index) => (
                <div key={index} className="flex items-center">
                  <span className="mr-2">✓</span>
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* CTA */}
          <Link 
            href="/subscription/addons"
            className="block w-full bg-primary-500 text-white text-center py-3 rounded-lg font-semibold hover:bg-primary-600 transition-all transform shadow-lg"
          >
            <Sparkles className="w-4 h-4 inline mr-2" />
            {t('subscription.addons.viewPackages', 'Ver Paquetes Disponibles')}
          </Link>
          
          {/* Footer */}
          <p className="text-xs text-center mt-3">
            {t('subscription.addons.noCommitment', 'Sin compromisos • Cancela cuando quieras')}
          </p>
        </div>
      )}
    </div>
  );
}
