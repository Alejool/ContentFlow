import { cn } from '@/lib/utils';
import { getPublicationStatusConfig } from '@/Utils/publicationHelpers';
import { Popover, Transition } from '@headlessui/react';
import { motion } from 'framer-motion';
import { Info } from 'lucide-react';
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';

interface PublicationStatusCardProps {
  statusKey: string;
  count: number;
  loading?: boolean;
  index?: number;
  showTooltip?: boolean;
}

export function PublicationStatusCard({
  statusKey,
  count,
  loading = false,
  index = 0,
  showTooltip = true,
}: PublicationStatusCardProps) {
  const { t } = useTranslation();

  const statusConfig = getPublicationStatusConfig(statusKey);
  const StatusIcon = statusConfig.icon;

  const tooltipContent = t(`publications.status.${statusKey}_description`, {
    defaultValue: t(`publications.status.${statusKey}`),
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.4,
        delay: index * 0.05,
        ease: [0.4, 0, 0.2, 1],
      }}
      whileHover={{ scale: 1.02, y: -2 }}
      className={cn(
        'group relative flex flex-col items-center overflow-hidden rounded-xl border p-3 text-center shadow-sm transition-all duration-300 sm:p-4',
        'bg-white/80 backdrop-blur-sm dark:bg-neutral-800/50',
        'hover:shadow-lg',
      )}
    >
      {/* Animated gradient background */}
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-100',
          statusConfig.bg.replace('bg-', 'from-').replace('dark:bg-', 'to-') + '/5',
        )}
      />

      {/* Tooltip with Headless UI */}
      {showTooltip && (
        <Popover className="absolute right-2 top-2 z-20">
          {({ open }) => (
            <>
              <Popover.Button
                className={cn(
                  'rounded-full p-1 transition-all duration-200',
                  'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300',
                  'hover:bg-gray-100 dark:hover:bg-neutral-700',
                  open && 'bg-gray-100 dark:bg-neutral-700',
                )}
              >
                <Info className="h-3 w-3" />
              </Popover.Button>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-200"
                enterFrom="opacity-0 translate-y-1"
                enterTo="opacity-100 translate-y-0"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-1"
              >
                <Popover.Panel className="absolute right-0 top-8 z-30 w-48 rounded-lg border border-gray-200 bg-white p-3 shadow-xl dark:border-neutral-700 dark:bg-neutral-800">
                  <p className="text-xs text-gray-600 dark:text-gray-300">{tooltipContent}</p>
                </Popover.Panel>
              </Transition>
            </>
          )}
        </Popover>
      )}

      {/* Icon container with pulse animation on hover */}
      <motion.div
        whileHover={{ rotate: [0, -10, 10, -10, 0] }}
        transition={{ duration: 0.5 }}
        className={cn(
          'relative z-10 mb-2 rounded-full p-2 transition-all duration-300 sm:mb-3 sm:p-2.5',
          statusConfig.bg,
          'group-hover:shadow-md',
        )}
      >
        <StatusIcon className={cn('h-4 w-4 sm:h-5 sm:w-5', statusConfig.text)} />

        {/* Pulse ring on hover */}
        <span
          className={cn(
            'absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 group-hover:animate-ping group-hover:opacity-75',
            statusConfig.bg,
          )}
        />
      </motion.div>

      {/* Label */}
      <p
        className={cn(
          'relative z-10 mb-1 text-[10px] font-medium uppercase tracking-wide sm:text-xs',
          'text-gray-500 dark:text-gray-400',
          'transition-colors duration-300 group-hover:text-gray-700 dark:group-hover:text-gray-200',
        )}
      >
        {t(`publications.status.${statusKey}`)}
      </p>

      {/* Count with number animation */}
      <motion.p
        key={count}
        initial={{ scale: 1.2, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={cn(
          'relative z-10 text-xl font-bold tabular-nums transition-colors sm:text-2xl',
          'text-gray-900 dark:text-white',
          loading && 'animate-pulse',
        )}
      >
        {loading ? (
          <span className="inline-block h-7 w-12 animate-pulse rounded bg-gray-200 dark:bg-neutral-700" />
        ) : (
          count.toLocaleString()
        )}
      </motion.p>

      {/* Bottom accent line with slide animation */}
      <motion.div
        initial={{ width: 0 }}
        whileHover={{ width: '100%' }}
        transition={{ duration: 0.3 }}
        className={cn(
          'absolute bottom-0 left-0 h-1',
          statusConfig.text.replace('text-', 'bg-'),
          'rounded-full',
        )}
      />

      {/* Corner decoration */}
      <div
        className={cn(
          'absolute -right-8 -top-8 h-16 w-16 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-10',
          statusConfig.bg,
        )}
      />
    </motion.div>
  );
}
