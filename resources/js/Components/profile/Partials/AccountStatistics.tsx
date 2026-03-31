import type { PageProps } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Calendar, CheckCircle, Clock, MailWarning, Shield } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface AccountStatisticsProps {
  className?: string;
  status?: string | null;
}

export default function AccountStatistics({
  className = '',
  status = null,
}: AccountStatisticsProps) {
  const { t, i18n } = useTranslation();
  const page = usePage<PageProps>();
  const user = page.props.auth.user;
  const [recentlySent, setRecentlySent] = useState<boolean>(false);

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return t('profile.statistics.notAvailable');
    try {
      return new Date(dateString).toLocaleDateString(i18n.language, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return t('profile.statistics.notAvailable');
    }
  };

  const getDaysSinceJoining = (dateString: string | null): number => {
    if (!dateString) return 0;
    try {
      const joined = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - joined.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch {
      return 0;
    }
  };

  const statisticsItems = [
    {
      icon: Calendar,
      title: t('profile.statistics.memberSince'),
      value: formatDate(user?.created_at || null),
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      icon: Clock,
      title: t('profile.statistics.daysActive'),
      value: `${getDaysSinceJoining(user?.created_at || null)} ${t('profile.statistics.days')}`,
      iconColor: 'text-primary-600 dark:text-primary-400',
    },
    {
      icon: Shield,
      title: t('profile.statistics.accountStatus'),
      value: t('profile.statistics.active'),
      iconElement: user?.email_verified_at ? (
        <div className="mr-1.5 h-2 w-2 rounded-full bg-green-500"></div>
      ) : null,
      iconColor: 'text-green-600 dark:text-green-400',
    },
  ];

  return (
    <div className={className}>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        {statisticsItems.map((item, index) => (
          <div
            key={index}
            className="rounded-lg border border-gray-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gray-100 p-2 dark:bg-neutral-700">
                <item.icon className={`h-5 w-5 ${item.iconColor}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">{item.title}</p>
                <div className="flex items-center gap-1">
                  {item.iconElement}
                  <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                    {item.value}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!user?.email_verified_at && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-800/30 dark:bg-amber-900/10">
          <div className="flex items-start gap-3">
            <MailWarning className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="min-w-0 flex-1">
              <p className="mb-3 text-sm text-amber-800 dark:text-amber-300">
                {t('profile.information.emailUnverified')}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={route('verification.send')}
                  method="post"
                  as="button"
                  onClick={() => setRecentlySent(true)}
                  className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                >
                  {t('profile.information.sendVerification')}
                </Link>
                {(status === 'verification-link-sent' || recentlySent) && (
                  <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                    <CheckCircle className="h-4 w-4" />
                    {t('profile.information.verificationSent')}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
