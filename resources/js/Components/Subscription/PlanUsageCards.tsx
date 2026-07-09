import { CarouselPagination } from '@/Components/common/CarouselPagination';
import AnimatedPagination from '@/Components/common/ui/AnimatedPagination';
import { useSubscriptionUsage } from '@/Hooks/Subscription/useSubscriptionUsage';
import type { SystemAddons, UsageCardProps, VisibleUsageMetrics } from '@/types/Subscription/planUsage';
import { UsageCard } from '@/Components/Subscription/UsageCard';
import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import { usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { FileText, HardDrive, Share2, Users, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatBytesAsGB, gbToBytes } from '@/Utils/formatters/storage';

// ── Props ─────────────────────────────────────────────────────────
interface PlanUsageCardsProps {
  showCarousel?: boolean;
  showTitle?: boolean;
}

interface PageProps extends InertiaPageProps {
  visibleUsageMetrics: VisibleUsageMetrics;
  systemAddons: SystemAddons;
}

// ── Motion helpers ────────────────────────────────────────────────
const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, delay: i * 0.08, ease: 'easeOut' },
  }),
};

const slideVariants = {
  enter: { opacity: 0, x: 60 },
  center: { opacity: 1, x: 0, transition: { duration: 0.28, ease: 'easeInOut' } },
  exit: { opacity: 0, x: -60, transition: { duration: 0.2 } },
};

// ── Component ─────────────────────────────────────────────────────
export function PlanUsageCards({ showCarousel = false, showTitle = true }: PlanUsageCardsProps) {
  const { t } = useTranslation();
  const { usage, loading } = useSubscriptionUsage();
  const { visibleUsageMetrics, systemAddons } = usePage<PageProps>().props;
  const [currentSlide, setCurrentSlide] = useState(0);
  const [itemsPerSlide, setItemsPerSlide] = useState(4);

  useEffect(() => {
    const getItems = () => {
      if (typeof window === 'undefined') return 4;
      if (window.innerWidth < 640) return 1;
      if (window.innerWidth < 1024) return 2;
      return 4;
    };

    const handleResize = () => {
      setItemsPerSlide(getItems());
      setCurrentSlide(0);
    };

    setItemsPerSlide(getItems());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (loading || !usage) return null;

  // ── Build metric list ─────────────────────────────────────────
  // key and show are internal list metadata — keep them out of UsageCardProps
  // so they are never accidentally spread into <UsageCard>.
  type MetricEntry = { key: string; show: boolean; cardProps: UsageCardProps };

  const metrics: MetricEntry[] = [
    {
      key: 'publications',
      show: visibleUsageMetrics?.publications !== false,
      cardProps: {
        label: t('subscription.addons.publications'),
        icon: FileText,
        accent: 'primary',
        percentage: usage.publications.percentage,
        used: usage.publications.used,
        limit: usage.publications.limit,
        remaining: usage.publications.remaining,
        canBuy: systemAddons?.publications !== false,
        upgradeUrl: '/pricing',
      },
    },
    {
      key: 'storage',
      show: visibleUsageMetrics?.storage !== false,
      cardProps: {
        label: t('subscription.usage.storage'),
        icon: HardDrive,
        accent: 'teal',
        percentage: usage.storage.percentage,
        used: formatBytesAsGB(gbToBytes(usage.storage.used_gb), 1),
        limit: `${usage.storage.limit_gb} GB`,
        total_available: `${usage.storage.total_available_gb} GB`,
        remaining: formatBytesAsGB(usage.storage.remaining_bytes, 1),
        addon_info: usage.storage.addon_info,
        canBuy: systemAddons?.storage !== false,
        addonType: 'storage',
      },
    },
    {
      key: 'social_accounts',
      show: visibleUsageMetrics?.social_accounts !== false,
      cardProps: {
        label: t('subscription.addons.socialAccounts'),
        icon: Share2,
        accent: 'pink',
        percentage: usage.social_accounts.percentage,
        used: usage.social_accounts.used,
        limit: usage.social_accounts.limit === -1 ? '∞' : usage.social_accounts.limit,
        total_available:
          usage.social_accounts.total_available === -1
            ? '∞'
            : usage.social_accounts.total_available,
        remaining:
          usage.social_accounts.remaining === -1 ? '∞' : usage.social_accounts.remaining,
        canBuy: false,
        upgradeUrl: '/pricing',
      },
    },
    {
      key: 'team_members',
      show: visibleUsageMetrics?.team_members !== false,
      cardProps: {
        label: t('subscription.addons.teamMembers'),
        icon: Users,
        accent: 'amber',
        percentage: usage.team_members?.percentage ?? 0,
        used: usage.team_members?.used ?? 0,
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
            : (usage.team_members?.remaining ?? '∞'),
        canBuy: systemAddons?.team_members !== false,
        addonType: 'team_members',
      },
    },
  ];

  const visibleMetrics = metrics.filter((m) => m.show);
  const totalSlides = Math.ceil(visibleMetrics.length / itemsPerSlide);

  const nextSlide = () => setCurrentSlide((p) => (p + 1) % totalSlides);
  const prevSlide = () => setCurrentSlide((p) => (p - 1 + totalSlides) % totalSlides);
  const goToSlide = (i: number) => setCurrentSlide(i);

  const currentMetrics = visibleMetrics.slice(
    currentSlide * itemsPerSlide,
    currentSlide * itemsPerSlide + itemsPerSlide,
  );

  // Responsive grid class based on count
  const gridClass = (count: number) => {
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-1 sm:grid-cols-2';
    if (count === 3) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
    return 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4';
  };

  const useCarousel = showCarousel && visibleMetrics.length > itemsPerSlide;

  return (
    <div className="space-y-4">
      {/* Title row */}
      {showTitle && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
              <Zap className="h-5 w-5 text-primary-500 dark:text-primary-400" />
              {t('subscription.addons.planUsage')}
            </h2>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-neutral-400">
              {t('subscription.addons.monitorMonthlyUsage')}
            </p>
          </div>

          {useCarousel && (
            <CarouselPagination
              currentSlide={currentSlide}
              totalSlides={totalSlides}
              onPrevious={prevSlide}
              onNext={nextSlide}
            />
          )}
        </div>
      )}

      {/* Cards */}
      {useCarousel ? (
        <div>
          <div className="overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={currentSlide}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className={`grid gap-4 ${gridClass(itemsPerSlide)}`}
              >
                {currentMetrics.map((metric, i) => (
                  <motion.div
                    key={metric.key}
                    custom={i}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <UsageCard {...metric.cardProps} />
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
        <div className={`grid gap-4 ${gridClass(visibleMetrics.length)}`}>
          {visibleMetrics.map((metric, i) => (
            <motion.div
              key={metric.key}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
            >
              <UsageCard {...metric.cardProps} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
