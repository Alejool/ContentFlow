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

export function AddonsPromotionCard({
  showCarousel = false,
  showPromoBanner = true,
}: AddonsPromotionCardProps) {
  const { t } = useTranslation();
  const { usage, loading } = useSubscriptionUsage();
  const { addons, loading: addonsLoading } = useActiveAddons();
  const [cheapestAddon, setCheapestAddon] = useState<any>(null);

  // Obtener el addon más barato para mostrar en el banner
  useEffect(() => {
    fetch('/api/v1/addons/')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          const allPackages: any[] = [];

          // Recopilar todos los paquetes
          Object.keys(data.data).forEach((type) => {
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
              (pkg.price_local || pkg.price) < (min.price_local || min.price) ? pkg : min,
            );
            setCheapestAddon(cheapest);
          }
        }
      })
      .catch((error) => {
        console.error('Error loading addons:', error);
      });
  }, []);

  if (loading || !usage) return null;

  // Calcular si alguna métrica está alta (>70%)
  const hasHighUsage =
    usage.publications.percentage > 70 ||
    usage.storage.percentage > 70 ||
    (usage.ai_requests.limit &&
      usage.ai_requests.limit > 0 &&
      (usage.ai_requests.used / usage.ai_requests.limit) * 100 > 70);

  return (
    <div className="space-y-4">
      {/* Componente de uso del plan */}
      <PlanUsageCards showCarousel={true} showTitle={true} />

      {/* Banner promocional si hay uso alto y está habilitado */}
      {showPromoBanner && hasHighUsage && (
        <div className="text-dark rounded-xl border border-primary-200 bg-gradient-to-br from-primary-50 to-primary-100 p-6 shadow-sm hover:shadow-md dark:border-primary-700/50 dark:from-primary-900/20 dark:to-primary-800/20 dark:text-white">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h3 className="mb-2 flex items-center text-xl font-bold">
                <Sparkles className="mr-2 h-6 w-6" />
                {t('subscription.addons.powerUpWorkspace', 'Potencia tu Workspace')}
              </h3>
              <p className="text-sm">
                {t(
                  'subscription.addons.highUsageMessage',
                  'Estás usando mucho tu plan. ¡Expande tu capacidad!',
                )}
              </p>
            </div>
            <Sparkles className="h-8 w-8 opacity-80" />
          </div>

          {/* Beneficios */}
          <div className="mb-4 rounded-lg border border-white/20 bg-white/10 p-3 backdrop-blur-sm">
            <div className="space-y-1.5 text-xs">
              {[
                cheapestAddon
                  ? t('subscription.addons.packagesFrom', 'Paquetes desde') +
                    ' ' +
                    (cheapestAddon.formatted_price || `$${cheapestAddon.price}`)
                  : t('subscription.addons.packagesFrom', 'Paquetes desde $9.99'),
                t('subscription.addons.upToDiscount', 'Hasta 40% de descuento'),
                t('subscription.addons.instantAvailable', 'Disponible al instante'),
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
            className="block w-full transform rounded-lg bg-primary-500 py-3 text-center font-semibold text-white shadow-lg transition-all hover:bg-primary-600"
          >
            <Sparkles className="mr-2 inline h-4 w-4" />
            {t('subscription.addons.viewPackages', 'Ver Paquetes Disponibles')}
          </Link>

          {/* Footer */}
          <p className="mt-3 text-center text-xs">
            {t('subscription.addons.noCommitment', 'Sin compromisos • Cancela cuando quieras')}
          </p>
        </div>
      )}
    </div>
  );
}
