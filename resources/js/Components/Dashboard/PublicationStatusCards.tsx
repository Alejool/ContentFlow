import { cn } from '@/lib/utils';
import { getAllPublicationStatuses, getPublicationStatusConfig } from '@/Utils/publicationHelpers';
import { animate, motion, useMotionValue } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PublicationStatusCard } from './PublicationStatusCard';

interface PublicationStatusCardsProps {
  stats: Record<string, number>;
  loading?: boolean;
  className?: string;
  variant?: 'simple' | 'advanced' | 'carousel';
  showTooltips?: boolean;
}

export function PublicationStatusCards({
  stats,
  loading = false,
  className,
  variant = 'simple',
  showTooltips = false,
}: PublicationStatusCardsProps) {
  const { t } = useTranslation();
  const statuses = getAllPublicationStatuses();

  // --- carousel state ---
  const trackRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const isPaused = useRef(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const CARD_W = 164; // card width + gap
  const total = statuses.length;

  const clampX = (val: number) => {
    const el = trackRef.current;
    if (!el) return val;
    const max = 0;
    const min = -(el.scrollWidth - el.parentElement!.clientWidth);
    return Math.max(min, Math.min(max, val));
  };

  const goTo = (index: number) => {
    const next = index % total;
    setActiveIndex(next);
    const target = clampX(-next * CARD_W);
    animate(x, target, { duration: 0.8, ease: [0.4, 0, 0.2, 1] });
  };

  const nudge = (dir: 'left' | 'right') => {
    isPaused.current = true;
    setTimeout(() => {
      isPaused.current = false;
    }, 5000);
    const next = dir === 'right' ? activeIndex + 1 : activeIndex - 1;
    goTo(Math.max(0, Math.min(total - 1, next)));
  };

  // auto-advance every 3s
  useEffect(() => {
    if (variant !== 'carousel') return;
    const id = setInterval(() => {
      if (isPaused.current) return;
      setActiveIndex((prev) => {
        const next = (prev + 1) % total;
        const target = clampX(-next * CARD_W);
        animate(x, target, { duration: 0.9, ease: [0.4, 0, 0.2, 1] });
        return next;
      });
    }, 3000);
    return () => clearInterval(id);
  }, [variant, total]);

  if (variant === 'carousel') {
    return (
      <div
        className={cn('relative overflow-hidden px-3 py-6', className)}
        onMouseEnter={() => {
          isPaused.current = true;
        }}
        onMouseLeave={() => {
          isPaused.current = false;
        }}
      >
        {/* motion track */}
        <motion.div ref={trackRef} style={{ x }} className="flex gap-3">
          {statuses.map((statusKey, index) => {
            const statusConfig = getPublicationStatusConfig(statusKey);
            const StatusIcon = statusConfig.icon;
            const count = stats[statusKey] || 0;
            const isActive = index === activeIndex;

            return (
              <motion.div
                key={statusKey}
                animate={{ scale: isActive ? 1.04 : 1, opacity: isActive ? 1 : 0.75 }}
                transition={{ duration: 0.4 }}
                className={cn(
                  'group relative flex w-[148px] flex-none flex-col items-center overflow-hidden rounded-xl border p-3 text-center shadow-sm sm:p-4',
                  'bg-white/80 backdrop-blur-sm dark:bg-neutral-800/50',
                  statusConfig.border,
                  isActive && 'shadow-md',
                )}
              >
                <div
                  className={cn(
                    'absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-5',
                    statusConfig.bg,
                  )}
                />

                <div
                  className={cn(
                    'relative z-10 mb-2 rounded-full p-2 sm:mb-3 sm:p-2.5',
                    statusConfig.bg,
                  )}
                >
                  <StatusIcon className={cn('h-4 w-4 sm:h-5 sm:w-5', statusConfig.text)} />
                </div>

                <p className="relative z-10 mb-1 text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 sm:text-xs">
                  {t(`publications.status.${statusKey}`)}
                </p>

                <p
                  className={cn(
                    'relative z-10 text-xl font-bold tabular-nums text-gray-900 dark:text-white sm:text-2xl',
                    loading && 'animate-pulse',
                  )}
                >
                  {loading ? '...' : count.toLocaleString()}
                </p>

                <motion.div
                  animate={{ width: isActive ? '100%' : '0%' }}
                  transition={{ duration: 0.4 }}
                  className={cn(
                    'absolute bottom-0 left-0 h-0.5',
                    statusConfig.text.replace('text-', 'bg-'),
                  )}
                />
              </motion.div>
            );
          })}
        </motion.div>

        {/* arrows */}
        <button
          onClick={() => nudge('left')}
          disabled={activeIndex === 0}
          className={cn(
            'absolute -left-1 top-1/2 z-10 -translate-y-1/2 rounded-full border border-gray-200 bg-white p-1.5 shadow-md transition-all duration-200 dark:border-neutral-700 dark:bg-neutral-800',
            activeIndex === 0 ? 'pointer-events-none opacity-0' : 'opacity-100 hover:scale-110',
          )}
        >
          <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        </button>
        <button
          onClick={() => nudge('right')}
          disabled={activeIndex === total - 1}
          className={cn(
            'absolute -right-1 top-1/2 z-10 -translate-y-1/2 rounded-full border border-gray-200 bg-white p-1.5 shadow-md transition-all duration-200 dark:border-neutral-700 dark:bg-neutral-800',
            activeIndex === total - 1
              ? 'pointer-events-none opacity-0'
              : 'opacity-100 hover:scale-110',
          )}
        >
          <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        </button>

        {/* dots */}
        <div className="mt-3 flex justify-center gap-1.5">
          {statuses.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                isPaused.current = true;
                setTimeout(() => {
                  isPaused.current = false;
                }, 5000);
                goTo(i);
              }}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                i === activeIndex
                  ? 'w-4 bg-gray-500 dark:bg-gray-300'
                  : 'w-1.5 bg-gray-300 dark:bg-gray-600',
              )}
            />
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'advanced') {
    return (
      <div
        className={cn('grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4 lg:grid-cols-7', className)}
      >
        {statuses.map((statusKey, index) => (
          <PublicationStatusCard
            key={statusKey}
            statusKey={statusKey}
            count={stats[statusKey] || 0}
            loading={loading}
            index={index}
            showTooltip={showTooltips}
          />
        ))}
      </div>
    );
  }

  // simple (default)
  return (
    <div className={cn('grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4 lg:grid-cols-7', className)}>
      {statuses.map((statusKey, index) => {
        const statusConfig = getPublicationStatusConfig(statusKey);
        const StatusIcon = statusConfig.icon;
        const count = stats[statusKey] || 0;

        return (
          <motion.div
            key={statusKey}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className={cn(
              'group relative flex flex-col items-center overflow-hidden rounded-xl border p-3 text-center shadow-sm transition-all duration-300 sm:p-4',
              'bg-white/80 backdrop-blur-sm dark:bg-neutral-800/50',
              statusConfig.border,
              statusConfig.hover,
              'hover:-translate-y-0.5 hover:shadow-md',
            )}
          >
            <div
              className={cn(
                'absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-5',
                statusConfig.bg,
              )}
            />

            <div
              className={cn(
                'relative z-10 mb-2 rounded-full p-2 transition-all duration-300 group-hover:scale-110 sm:mb-3 sm:p-2.5',
                statusConfig.bg,
              )}
            >
              <StatusIcon className={cn('h-4 w-4 sm:h-5 sm:w-5', statusConfig.text)} />
            </div>

            <p className="relative z-10 mb-1 text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 sm:text-xs">
              {t(`publications.status.${statusKey}`)}
            </p>

            <p
              className={cn(
                'relative z-10 text-xl font-bold tabular-nums sm:text-2xl',
                'text-gray-900 dark:text-white',
                loading && 'animate-pulse',
              )}
            >
              {loading ? '...' : count.toLocaleString()}
            </p>

            <div
              className={cn(
                'absolute bottom-0 left-0 h-0.5 w-0 transition-all duration-300 group-hover:w-full',
                statusConfig.text.replace('text-', 'bg-'),
              )}
            />
          </motion.div>
        );
      })}
    </div>
  );
}
