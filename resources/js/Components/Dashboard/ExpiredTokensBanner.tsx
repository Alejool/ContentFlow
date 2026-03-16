import { Link } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ProblematicAccount {
  id: number;
  platform: string;
  account_name: string;
  reason: 'expired' | 'failures';
}

interface Props {
  accounts: ProblematicAccount[];
}

const PLATFORM_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  twitter: 'Twitter / X',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
  threads: 'Threads',
  youtube: 'YouTube',
  pinterest: 'Pinterest',
};

export default function ExpiredTokensBanner({ accounts }: Props) {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);

  if (!accounts.length || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3 }}
        className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-700/50 dark:bg-amber-900/20"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500 dark:text-amber-400" />
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                {t('dashboard.expiredTokens.title', {
                  count: accounts.length,
                  defaultValue:
                    accounts.length === 1
                      ? '1 social account needs reconnection'
                      : `${accounts.length} social accounts need reconnection`,
                })}
              </p>
              <ul className="mt-1 space-y-0.5">
                {accounts.map((acc) => (
                  <li key={acc.id} className="text-sm text-amber-700 dark:text-amber-400">
                    <span className="font-medium">
                      {PLATFORM_LABELS[acc.platform] ?? acc.platform}
                    </span>{' '}
                    &mdash; {acc.account_name}{' '}
                    <span className="text-amber-600 dark:text-amber-500">
                      ({acc.reason === 'expired'
                        ? t('dashboard.expiredTokens.reasonExpired', 'token expired')
                        : t('dashboard.expiredTokens.reasonFailures', 'repeated failures')})
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                href={route('social-accounts.index')}
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-amber-800 underline-offset-2 hover:underline dark:text-amber-300"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                {t('dashboard.expiredTokens.cta', 'Reconnect accounts')}
              </Link>
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="flex-shrink-0 text-amber-500 transition-colors hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-200"
            aria-label={t('common.dismiss', 'Dismiss')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
