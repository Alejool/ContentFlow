import PieChart from '@/Components/Statistics/PieChart';
import { SeededRandom } from '@/Utils/stableMock';
import { Link } from '@inertiajs/react';
import { AlertTriangle, ChevronLeft, ChevronRight, Plus, RefreshCw, Share2 } from 'lucide-react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface SocialMediaAccount {
  id: number;
  platform: string;
  account_name: string;
  followers: number;
  engagement_rate: number;
  reach: number;
  follower_growth_30d: number;
  needs_reconnection?: boolean;
  is_token_expired?: boolean;
  failure_count?: number;
  is_active?: boolean;
}

interface SocialMediaAccountsProps {
  accounts: SocialMediaAccount[];
  theme?: 'light' | 'dark';
  showChart?: boolean;
}

export default function SocialMediaAccounts({
  accounts,
  theme = 'light',
  showChart = true,
}: SocialMediaAccountsProps) {
  const { t } = useTranslation();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const mockAccounts: SocialMediaAccount[] = [
    {
      id: 101,
      platform: 'instagram',
      account_name: 'Ejemplo Demo',
      followers: 1250,
      engagement_rate: 3.2,
      reach: 3500,
      follower_growth_30d: 45,
    },
    {
      id: 102,
      platform: 'tiktok',
      account_name: 'Ejemplo Demo',
      followers: 2100,
      engagement_rate: 4.1,
      reach: 5800,
      follower_growth_30d: 78,
    },
  ];

  // Inyectar datos a cuentas vacías y agregar imaginarias si hay pocas
  const displayAccounts =
    accounts.length > 0
      ? [
          ...accounts.map((acc) => {
            if (acc.followers === 0 && acc.reach === 0) {
              const rng = new SeededRandom(acc.id || acc.account_name);
              return {
                ...acc,
                account_name: `${acc.account_name} (Datos Simulados)`,
                followers: rng.nextInt(500, 2000),
                engagement_rate: 3.5,
                reach: rng.nextInt(1000, 5000),
                follower_growth_30d: rng.nextInt(10, 100),
              };
            }
            return acc;
          }),
          ...(accounts.length <= 1 ? mockAccounts : []),
        ]
      : mockAccounts;

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = window.innerWidth > 1024 ? 400 : window.innerWidth;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div
      className={`rounded-lg border border-gray-100 bg-white p-6 shadow-lg transition-colors duration-300 dark:border-neutral-700/50 dark:bg-neutral-800/50 dark:backdrop-blur-sm`}
    >
      <div className="mb-8 flex flex-col items-center justify-between gap-4 md:flex-row">
        <h2 className={`text-xl font-bold text-gray-900 dark:text-gray-100`}>
          {t('analytics.socialMedia.title')}
        </h2>
      </div>

      {showChart && displayAccounts.length > 0 && (
        <div className="mb-10">
          <h3
            className={`mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400`}
          >
            {t('analytics.charts.followersByPlatform')}
          </h3>
          <div
            className={`rounded-lg p-4 transition-colors duration-300 ${
              theme === 'dark'
                ? 'border border-neutral-700/30 bg-neutral-800/30'
                : 'border border-gray-100 bg-gray-50/50'
            }`}
          >
            <PieChart
              data={displayAccounts.map((acc) => ({
                name:
                  acc.account_name || acc.platform.charAt(0).toUpperCase() + acc.platform.slice(1),
                value: acc.followers,
              }))}
              theme={theme}
            />
          </div>
        </div>
      )}

      {accounts.length === 0 && (
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800/50 dark:bg-blue-900/20">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/40">
              <Share2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h4 className="mb-1 font-semibold text-blue-900 dark:text-blue-100">
                {t('socialAccounts.demoMode.title', 'Datos de Demostración')}
              </h4>
              <p className="mb-3 text-sm text-blue-800 dark:text-blue-300">
                {t('socialAccounts.demoMode.description', 'No tienes cuentas sociales conectadas. Los datos mostrados son ejemplos para que conozcas la interfaz.')}
              </p>
              <Link
                href={route('social-accounts.index')}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
              >
                <Plus className="h-4 w-4" />
                {t('socialAccounts.connectAccount', 'Conectar Cuenta Social')}
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="group relative">
        {/* Navigation Buttons */}
        {displayAccounts.length > 2 && (
          <>
            <button
              onClick={() => scroll('left')}
              className={`absolute left-0 top-1/2 z-10 -ml-4 -translate-y-1/2 rounded-full p-2 opacity-0 shadow-lg transition-all disabled:opacity-0 group-hover:opacity-100 ${
                theme === 'dark'
                  ? 'bg-neutral-800 text-white hover:bg-neutral-700'
                  : 'bg-white text-gray-800 hover:bg-gray-50'
              }`}
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={() => scroll('right')}
              className={`absolute right-0 top-1/2 z-10 -mr-4 -translate-y-1/2 rounded-full p-2 opacity-0 shadow-lg transition-all disabled:opacity-0 group-hover:opacity-100 ${
                theme === 'dark'
                  ? 'bg-neutral-800 text-white hover:bg-neutral-700'
                  : 'bg-white text-gray-800 hover:bg-gray-50'
              }`}
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}

        <div
          ref={scrollContainerRef}
          className="hide-scrollbars flex snap-x snap-mandatory gap-6 overflow-x-auto pb-6"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {displayAccounts.map((account) => {
            const needsReconnect = account.needs_reconnection || account.is_token_expired;
            return (
              <div
                key={account.id}
                className={`relative w-[85vw] shrink-0 snap-center rounded-lg p-6 transition-all duration-300 hover:scale-[1.02] sm:w-[350px] md:w-[400px] ${
                  needsReconnect
                    ? theme === 'dark'
                      ? 'border border-amber-600/50 bg-neutral-800/30'
                      : 'border border-amber-300 bg-amber-50/40'
                    : theme === 'dark'
                      ? 'border border-neutral-700/30 bg-neutral-800/30 hover:border-neutral-600/50'
                      : 'border border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                {/* Reconnection warning badge */}
                {needsReconnect && (
                  <div className="absolute right-3 top-3">
                    <span
                      className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        theme === 'dark'
                          ? 'bg-amber-900/40 text-amber-300'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      <AlertTriangle className="h-3 w-3" />
                      {account.is_token_expired
                        ? t('socialAccounts.tokenExpired', 'Token expirado')
                        : t('socialAccounts.needsReconnection', 'Reconectar')}
                    </span>
                  </div>
                )}

                <div className="mb-4 flex items-center justify-between">
                  <h3
                    className={`text-lg font-semibold ${
                      theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
                    }`}
                  >
                    <span className="capitalize">{account.platform}</span>
                    {account.account_name && (
                      <span className="ml-1 text-sm font-normal opacity-70">
                        ({account.account_name})
                      </span>
                    )}
                  </h3>
                  {!needsReconnect && (
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        account.follower_growth_30d > 0
                          ? theme === 'dark'
                            ? 'bg-green-900/30 text-green-300'
                            : 'bg-green-100 text-green-800'
                          : theme === 'dark'
                            ? 'bg-primary-900/30 text-primary-300'
                            : 'bg-primary-100 text-primary-800'
                      }`}
                    >
                      {account.follower_growth_30d > 0 ? '+' : ''}
                      {account.follower_growth_30d}
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                      {t('analytics.socialMedia.followers')}
                    </span>
                    <span
                      className={`font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}
                    >
                      {account.followers.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                      {t('analytics.socialMedia.engagementRate')}
                    </span>
                    <span
                      className={`font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}
                    >
                      {account.engagement_rate}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                      {t('analytics.socialMedia.reach')}
                    </span>
                    <span
                      className={`font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}
                    >
                      {account.reach.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Reconnect button at the bottom of the card */}
                {needsReconnect && (
                  <div
                    className={`mt-4 border-t pt-4 ${
                      theme === 'dark' ? 'border-amber-700/30' : 'border-amber-200'
                    }`}
                  >
                    <Link
                      href={route('social-accounts.index')}
                      className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                        theme === 'dark'
                          ? 'bg-amber-900/30 text-amber-300 hover:bg-amber-900/50'
                          : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                      }`}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      {t('socialAccounts.reconnectButton', 'Reconectar cuenta')}
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
