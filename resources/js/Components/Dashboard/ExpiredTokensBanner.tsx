import { Link } from '@inertiajs/react';
import { AlertTriangle, Clock, WifiOff, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ProblematicAccount {
  id: number;
  platform: string;
  account_name: string;
  /** 'expired' | 'failures' | 'expiring_soon' */
  reason: string;
  /** Only set when reason === 'expiring_soon' */
  days_remaining?: number | null;
}

interface ExpiredTokensBannerProps {
  accounts: ProblematicAccount[];
}

const PLATFORM_ICONS: Record<string, string> = {
  facebook: '📘',
  instagram: '📸',
  twitter: '🐦',
  x: '🐦',
  youtube: '▶️',
  tiktok: '🎵',
  linkedin: '💼',
};

export default function ExpiredTokensBanner({ accounts }: ExpiredTokensBannerProps) {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);

  if (!accounts || accounts.length === 0 || dismissed) {
    return null;
  }

  const expiredAccounts = accounts.filter((a) => a.reason === 'expired' || a.reason === 'failures');
  const expiringSoonAccounts = accounts.filter((a) => a.reason === 'expiring_soon');

  return (
    <div className="mb-6 space-y-3">
      {/* ─── Expired / Failed Accounts ─── */}
      {expiredAccounts.length > 0 && (
        <div className="relative flex items-start gap-4 rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm dark:border-red-800/40 dark:bg-red-900/20">
          <div className="flex-shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
              <WifiOff className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-red-900 dark:text-red-200">
              {expiredAccounts.length === 1
                ? 'Una cuenta necesita reconexión'
                : `${expiredAccounts.length} cuentas necesitan reconexión`}
            </h3>
            <p className="mt-0.5 text-xs text-red-700 dark:text-red-300">
              Las publicaciones en estas cuentas están pausadas hasta que renueves el acceso.
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {expiredAccounts.map((account) => (
                <span
                  key={account.id}
                  className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/40 dark:text-red-200"
                >
                  <span>{PLATFORM_ICONS[account.platform] ?? '🔗'}</span>
                  {account.account_name}
                  {account.reason === 'failures' && (
                    <span
                      className="ml-0.5 text-red-500 dark:text-red-400"
                      title="Múltiples fallos"
                    >
                      ⚠
                    </span>
                  )}
                </span>
              ))}
            </div>
            <Link
              href="/social-accounts"
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
            >
              Reconectar cuentas →
            </Link>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="absolute right-3 top-3 text-red-400 transition-colors hover:text-red-600 dark:text-red-500 dark:hover:text-red-300"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ─── Expiring Soon Accounts ─── */}
      {expiringSoonAccounts.length > 0 && (
        <div className="relative flex items-start gap-4 rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm dark:border-amber-700/40 dark:bg-amber-900/20">
          <div className="flex-shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
              {expiringSoonAccounts.length === 1
                ? 'Una conexión está próxima a vencer'
                : `${expiringSoonAccounts.length} conexiones están próximas a vencer`}
            </h3>
            <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-300">
              Reconecta estas cuentas antes de que expiren para evitar interrupciones.
            </p>
            <div className="mt-2 space-y-1">
              {expiringSoonAccounts.map((account) => {
                const days = account.days_remaining ?? 0;
                const urgency =
                  days <= 1
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-amber-700 dark:text-amber-300';
                return (
                  <div key={account.id} className="flex items-center gap-2">
                    <span className="text-sm">{PLATFORM_ICONS[account.platform] ?? '🔗'}</span>
                    <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
                      {account.account_name}
                    </span>
                    <span className={`text-xs font-semibold ${urgency}`}>
                      {days <= 0
                        ? '— vence hoy'
                        : days === 1
                          ? '— vence mañana'
                          : `— vence en ${days} días`}
                    </span>
                  </div>
                );
              })}
            </div>
            <Link
              href="/social-accounts"
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Renovar conexión →
            </Link>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="absolute right-3 top-3 text-amber-400 transition-colors hover:text-amber-600 dark:text-amber-500 dark:hover:text-amber-300"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
