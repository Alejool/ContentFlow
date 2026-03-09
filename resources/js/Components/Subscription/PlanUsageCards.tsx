import { Sparkles, Zap, HardDrive, FileText, Share2, Users } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useSubscriptionUsage } from '@/Hooks/useSubscriptionUsage';
import { useState } from 'react';
import { CarouselPagination, CarouselDots } from '@/Components/common/CarouselPagination';

interface PlanUsageCardsProps {
  showCarousel?: boolean;
  showTitle?: boolean;
}

export function PlanUsageCards({ showCarousel = false, showTitle = true }: PlanUsageCardsProps) {
  const { t } = useTranslation();
  const { usage, loading } = useSubscriptionUsage();
  const [currentSlide, setCurrentSlide] = useState(0);
  
  if (loading || !usage) return null;
  
  // Preparar métricas para mostrar - TODAS
  const metrics = [
    {
      key: 'publications',
      label: t('subscription.addons.publications', 'Publicaciones'),
      icon: FileText,
      percentage: usage.publications.percentage,
      used: usage.publications.used,
      limit: usage.publications.limit,
      remaining: usage.publications.remaining,
      show: true,
      canBuy: false,
      upgradeUrl: '/pricing',
    },
    {
      key: 'ai_requests',
      label: t('subscription.addons.aiCredits', 'Créditos IA'),
      icon: Sparkles,
      percentage: usage.ai_requests.limit ? (usage.ai_requests.used / usage.ai_requests.limit * 100) : 0,
      used: usage.ai_requests.used,
      limit: usage.ai_requests.limit || '∞',
      remaining: usage.ai_requests.limit ? usage.ai_requests.limit - usage.ai_requests.used : '∞',
      show: true,
      canBuy: usage.ai_requests.limit !== null && usage.ai_requests.limit !== -1,
      addonType: 'ai_credits',
    },
    {
      key: 'storage',
      label: t('subscription.usage.storage', 'Almacenamiento'),
      icon: HardDrive,
      percentage: usage.storage.percentage,
      used: `${usage.storage.used_gb.toFixed(1)} GB`,
      limit: `${usage.storage.limit_gb} GB`,
      remaining: `${(usage.storage.remaining_bytes / 1024 / 1024 / 1024).toFixed(1)} GB`,
      show: true,
      canBuy: true,
      addonType: 'storage',
    },
    {
      key: 'social_accounts',
      label: t('subscription.addons.socialAccounts', 'Cuentas Sociales'),
      icon: Share2,
      percentage: usage.social_accounts.limit > 0 ? (usage.social_accounts.used / usage.social_accounts.limit * 100) : 0,
      used: usage.social_accounts.used,
      limit: usage.social_accounts.limit === -1 ? '∞' : usage.social_accounts.limit,
      remaining: usage.social_accounts.limit === -1 ? '∞' : usage.social_accounts.limit - usage.social_accounts.used,
      show: true,
      canBuy: false,
      upgradeUrl: '/pricing',
    },
    {
      key: 'team_members',
      label: t('subscription.addons.teamMembers', 'Miembros del Equipo'),
      icon: Users,
      percentage: 0,
      used: 0,
      limit: '∞',
      remaining: '∞',
      show: true,
      canBuy: false,
      upgradeUrl: '/pricing',
    },
  ];

  const visibleMetrics = metrics.filter(m => m.show);
  
  const getProgressBarColor = (percentage: number) => {
    if (percentage > 90) return 'bg-red-500';
    if (percentage > 80) return 'bg-orange-500';
    if (percentage > 70) return 'bg-yellow-500';
    return 'bg-primary-500';
  };

  const getBadgeColor = (percentage: number) => {
    if (percentage > 90) return 'bg-red-500';
    if (percentage > 80) return 'bg-orange-500';
    if (percentage > 70) return 'bg-yellow-500';
    return '';
  };

  const getBadgeText = (percentage: number) => {
    if (percentage > 90) return t('subscription.addons.critical', '¡Crítico!');
    if (percentage > 80) return t('subscription.addons.high', 'Muy Alto');
    if (percentage > 70) return t('subscription.addons.warning', 'Alto');
    return '';
  };

  const renderCard = (metric: typeof metrics[0]) => {
    const Icon = metric.icon;
    const isCritical = metric.percentage > 90;
    const isHigh = metric.percentage > 80 && metric.percentage <= 90;
    const isWarning = metric.percentage > 70 && metric.percentage <= 80;
    const shouldShowBuyButton = metric.canBuy && metric.percentage > 70;
    const shouldShowUpgradeButton = !metric.canBuy && metric.percentage > 70;
    
    return (
      <div 
        className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl p-5 border border-primary-200 dark:border-primary-700/50 shadow-sm hover:shadow-md transition-all min-w-[280px]"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-800/50">
              <Icon className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            </div>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {metric.label}
            </span>
          </div>
          {(isCritical || isHigh || isWarning) && (
            <span className={`text-xs text-white px-2 py-1 rounded-full font-semibold ${getBadgeColor(metric.percentage)}`}>
              {getBadgeText(metric.percentage)}
            </span>
          )}
        </div>

        <div className="mb-2">
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {metric.limit === '∞' ? metric.used : `${Math.round(metric.percentage)}%`}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {metric.limit === '∞' 
              ? t('subscription.usage.unlimited', 'Ilimitado')
              : `${metric.used} / ${metric.limit}`
            }
          </div>
        </div>

        {metric.limit !== '∞' && (
          <div className="mb-3">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${getProgressBarColor(metric.percentage)}`}
                style={{ width: `${Math.min(metric.percentage, 100)}%` }}
              />
            </div>
          </div>
        )}

        <div className="text-xs text-gray-600 dark:text-gray-400 mb-3">
          {metric.limit === '∞' 
            ? t('subscription.addons.noLimits', 'Sin límites')
            : (
              <>
                <span className="font-semibold text-primary-600 dark:text-primary-400">
                  {metric.remaining}
                </span>
                {' '}{t('subscription.addons.remaining', 'restantes')}
              </>
            )
          }
        </div>

        {shouldShowBuyButton && (
          <Link
            href={`/subscription/addons?tab=${metric.addonType}`}
            className="block w-full text-center bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white text-sm font-semibold py-2 px-3 rounded-lg transition-colors"
          >
            <Sparkles className="w-3 h-3 inline mr-1" />
            {t('subscription.addons.buyMore', 'Comprar Más')}
          </Link>
        )}

        {shouldShowUpgradeButton && (
          <Link
            href={metric.upgradeUrl || '/pricing'}
            className="block w-full text-center bg-gray-600 hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-600 text-white text-sm font-semibold py-2 px-3 rounded-lg transition-colors"
          >
            <Zap className="w-3 h-3 inline mr-1" />
            {t('subscription.addons.upgradePlan', 'Actualizar Plan')}
          </Link>
        )}
      </div>
    );
  };

  const itemsPerSlide = 4;
  const totalSlides = Math.ceil(visibleMetrics.length / itemsPerSlide);
  
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };
  
  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const getCurrentSlideMetrics = () => {
    const start = currentSlide * itemsPerSlide;
    return visibleMetrics.slice(start, start + itemsPerSlide);
  };

  return (
    <div className="space-y-4">
      {showTitle && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Zap className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              {t('subscription.addons.planUsage', 'Uso del Plan')}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t('subscription.addons.monitorMonthlyUsage', 'Monitorea tu consumo mensual')}
            </p>
          </div>
          
          {showCarousel && visibleMetrics.length > itemsPerSlide && (
            <CarouselPagination
              currentSlide={currentSlide}
              totalSlides={totalSlides}
              onPrevious={prevSlide}
              onNext={nextSlide}
            />
          )}
        </div>
      )}

      {showCarousel && visibleMetrics.length > itemsPerSlide ? (
        <div className="relative overflow-hidden">
          <div className="flex gap-4 transition-transform duration-300 ease-in-out">
            {getCurrentSlideMetrics().map(metric => (
              <div key={metric.key}>
                {renderCard(metric)}
              </div>
            ))}
          </div>
          
          <CarouselDots
            totalSlides={totalSlides}
            currentSlide={currentSlide}
            onDotClick={(index) => setCurrentSlide(index)}
            className="mt-4"
          />
        </div>
      ) : (
        <div className={`grid ${visibleMetrics.length === 2 ? 'grid-cols-1 md:grid-cols-2' : visibleMetrics.length === 3 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'} gap-4`}>
          {visibleMetrics.map(metric => (
            <div key={metric.key}>
              {renderCard(metric)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
