import { CarouselPagination } from '@/Components/common/CarouselPagination';
import AnimatedPagination from '@/Components/common/ui/AnimatedPagination';
import { useSubscriptionUsage } from '@/Hooks/useSubscriptionUsage';
import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import { usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { FileText, HardDrive, Share2, Sparkles, Users, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UsageCard } from './UsageCard';

interface PlanUsageCardsProps {
  showCarousel?: boolean;
  showTitle?: boolean;
}

interface PageProps extends InertiaPageProps {
  visibleUsageMetrics: {
    publications: boolean;
    social_accounts: boolean;
    storage: boolean;
    ai_requests: boolean;
    team_members: boolean;
  };
  systemAddons: {
    ai_credits: boolean;
    storage: boolean;
    team_members: boolean;
    publications: boolean;
  };
}

export function PlanUsageCards({ showCarousel = false, showTitle = true }: PlanUsageCardsProps) {
  const { t } = useTranslation();
  const { usage, loading } = useSubscriptionUsage();
  const { visibleUsageMetrics, systemAddons } = usePage<PageProps>().props;
  const [currentSlide, setCurrentSlide] = useState(0);
  const [itemsPerSlide, setItemsPerSlide] = useState(4);

  useEffect(() => {
    const getItemsPerSlide = () => {
      if (typeof window === 'undefined') return 4;
      const width = window.innerWidth;
      if (width < 640) return 1; // mobile
      if (width < 1024) return 2; // tablet
      return 4; // desktop
    };

    const handleResize = () => {
      setItemsPerSlide(getItemsPerSlide());
      setCurrentSlide(0); // Reset al cambiar tamaño
    };

    // Set initial value
    setItemsPerSlide(getItemsPerSlide());

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Preparar métricas para mostrar - FILTRADAS según configuración del sistema
  const metrics = !usage
    ? []
    : [
        {
          key: 'publications',
          label: t('subscription.addons.publications', 'Publicaciones'),
          icon: FileText,
          percentage: usage.publications.percentage,
          used: usage.publications.used,
          limit: usage.publications.limit,
          remaining: usage.publications.remaining,
          show: visibleUsageMetrics?.publications !== false,
          canBuy: systemAddons?.publications !== false,
          upgradeUrl: '/pricing',
        },
        {
          key: 'ai_requests',
          label: t('subscription.addons.aiCredits', 'Créditos IA'),
          icon: Sparkles,
          percentage: usage.ai_requests.percentage || 0,
          used: usage.ai_requests.used,
          limit: usage.ai_requests.limit || '∞',
          total_available: usage.ai_requests.total_available || usage.ai_requests.limit || '∞',
          remaining: usage.ai_requests.remaining || '∞',
          addon_info: usage.ai_requests.addon_info,
          show: visibleUsageMetrics?.ai_requests !== false,
          canBuy:
            usage.ai_requests.limit !== null &&
            usage.ai_requests.limit !== -1 &&
            systemAddons?.ai_credits !== false,
          addonType: 'ai_credits',
        },
        {
          key: 'storage',
          label: t('subscription.usage.storage', 'Almacenamiento'),
          icon: HardDrive,
          percentage: usage.storage.percentage,
          used: `${usage.storage.used_gb.toFixed(1)} GB`,
          limit: `${usage.storage.limit_gb} GB`,
          total_available: `${usage.storage.total_available_gb} GB`,
          remaining: `${(usage.storage.remaining_bytes / 1024 / 1024 / 1024).toFixed(1)} GB`,
          addon_info: usage.storage.addon_info,
          show: visibleUsageMetrics?.storage !== false,
          canBuy: systemAddons?.storage !== false,
          addonType: 'storage',
        },
        {
          key: 'social_accounts',
          label: t('subscription.addons.socialAccounts', 'Cuentas Sociales'),
          icon: Share2,
          percentage: usage.social_accounts.percentage,
          used: usage.social_accounts.used,
          limit: usage.social_accounts.limit === -1 ? '∞' : usage.social_accounts.limit,
          total_available:
            usage.social_accounts.total_available === -1
              ? '∞'
              : usage.social_accounts.total_available,
          remaining: usage.social_accounts.remaining === -1 ? '∞' : usage.social_accounts.remaining,
          show: visibleUsageMetrics?.social_accounts !== false,
          canBuy: false,
          upgradeUrl: '/pricing',
        },
        {
          key: 'team_members',
          label: t('subscription.addons.teamMembers', 'Miembros del Equipo'),
          icon: Users,
          percentage: usage.team_members?.percentage || 0,
          used: usage.team_members?.used || 0,
          limit:
            usage.team_members?.limit === -1 || !usage.team_members?.limit
              ? '∞'
              : usage.team_members.limit,
          total_available:
            usage.team_members?.total_available === -1 || !usage.team_members?.total_available
              ? '∞'
              : usage.team_members.total_available,
          remaining:
            usage.team_members?.remaining === -1 || usage.team_members?.remaining === null
              ? '∞'
              : usage.team_members.remaining,
          show: visibleUsageMetrics?.team_members !== false,
          canBuy: systemAddons?.team_members !== false,
          addonType: 'team_members',
        },
      ];

  const visibleMetrics = metrics.filter((m) => m.show);

  const totalSlides = Math.ceil(visibleMetrics.length / itemsPerSlide);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // Obtener las métricas del slide actual
  const getCurrentSlideMetrics = () => {
    const start = currentSlide * itemsPerSlide;
    const end = start + itemsPerSlide;
    return visibleMetrics.slice(start, end);
  };

  // Si está cargando o no hay datos, no renderizar nada
  if (loading || !usage) {
    return null;
  }

  return (
    <div className="space-y-4">
      {showTitle && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
              <Zap className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              {t('subscription.addons.planUsage', 'Uso del Plan')}
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
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
        <div className="relative">
          <div className="overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{
                  duration: 0.3,
                  ease: 'easeInOut',
                }}
                className={`grid gap-4 ${
                  itemsPerSlide === 1
                    ? 'grid-cols-1'
                    : itemsPerSlide === 2
                      ? 'grid-cols-2'
                      : 'grid-cols-4'
                }`}
              >
                {getCurrentSlideMetrics().map((metric, index) => (
                  <motion.div
                    key={metric.key}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      duration: 0.3,
                      delay: index * 0.1,
                      ease: 'easeOut',
                    }}
                  >
                    <UsageCard
                      label={metric.label}
                      icon={metric.icon}
                      percentage={metric.percentage}
                      used={metric.used}
                      limit={metric.limit}
                      total_available={metric.total_available}
                      remaining={metric.remaining}
                      addon_info={metric.addon_info}
                      canBuy={metric.canBuy}
                      addonType={metric.addonType}
                      upgradeUrl={metric.upgradeUrl}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-6">
            <AnimatedPagination
              total={totalSlides}
              current={currentSlide}
              onPageChange={goToSlide}
              autoAdvance={false}
            />
          </div>
        </div>
      ) : (
        <div
          className={`grid gap-4 ${
            visibleMetrics.length === 1
              ? 'grid-cols-1'
              : visibleMetrics.length === 2
                ? 'grid-cols-1 sm:grid-cols-2'
                : visibleMetrics.length === 3
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                  : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4'
          }`}
        >
          {visibleMetrics.map((metric, index) => (
            <motion.div
              key={metric.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: index * 0.1,
                ease: 'easeOut',
              }}
            >
              <UsageCard
                key={metric.key}
                label={metric.label}
                icon={metric.icon}
                percentage={metric.percentage}
                used={metric.used}
                limit={metric.limit}
                total_available={metric.total_available}
                remaining={metric.remaining}
                addon_info={metric.addon_info}
                canBuy={metric.canBuy}
                addonType={metric.addonType}
                upgradeUrl={metric.upgradeUrl}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
