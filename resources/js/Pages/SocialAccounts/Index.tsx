import Button from '@/Components/common/Modern/Button';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import { AlertTriangle, CheckCircle, Plus, RefreshCw, Share2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface SocialAccount {
  id: number;
  user_id: number;
  platform: string;
  account_id: string;
  account_name: string;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string | null;
  is_active: boolean;
  last_failed_at: string | null;
  failure_count: number;
  account_metadata: any;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  workspace_id: number;
  user: {
    id: number;
    name: string;
  };
}

interface SocialAccountsIndexProps {
  accounts: SocialAccount[];
  allowedPlatforms: string[];
}

const platformLogos: Record<string, string> = {
  facebook: '/images/social/facebook.svg',
  instagram: '/images/social/instagram.svg',
  twitter: '/images/social/twitter.svg',
  linkedin: '/images/social/linkedin.svg',
  tiktok: '/images/social/tiktok.svg',
  youtube: '/images/social/youtube.svg',
};

export default function Index({ accounts, allowedPlatforms }: SocialAccountsIndexProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState<number | null>(null);

  const handleConnect = async (platform: string) => {
    try {
      const response = await axios.get(route('social-accounts.auth-url', { platform }));
      if (response.data.auth_url) {
        window.location.href = response.data.auth_url;
      }
    } catch (error) {
      toast.error(t('socialAccounts.connectError', 'Error al conectar la cuenta'));
    }
  };

  const handleDisconnect = async (accountId: number) => {
    if (!confirm(t('socialAccounts.confirmDisconnect', '¿Estás seguro de desconectar esta cuenta?'))) {
      return;
    }

    setLoading(accountId);
    try {
      await axios.delete(route('api.v1.social-accounts.destroy', { social_account: accountId }));
      toast.success(t('socialAccounts.disconnected', 'Cuenta desconectada'));
      router.reload();
    } catch (error) {
      toast.error(t('socialAccounts.disconnectError', 'Error al desconectar'));
    } finally {
      setLoading(null);
    }
  };

  const getPlatformName = (platform: string) => {
    const names: Record<string, string> = {
      facebook: 'Facebook',
      instagram: 'Instagram',
      twitter: 'Twitter / X',
      linkedin: 'LinkedIn',
      tiktok: 'TikTok',
      youtube: 'YouTube',
    };
    return names[platform] || platform;
  };

  const isTokenExpired = (account: SocialAccount) => {
    if (!account.token_expires_at) return false;
    return new Date(account.token_expires_at) < new Date();
  };

  return (
    <AuthenticatedLayout
      header={
        <div className="flex w-full flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary-100 p-2 dark:bg-primary-900/30">
              <Share2 className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold leading-tight text-gray-900 dark:text-white">
                {t('socialAccounts.title', 'Cuentas Sociales')}
              </h2>
              <p className="text-xs font-medium text-gray-500 dark:text-neutral-500">
                {t('socialAccounts.subtitle', 'Gestiona tus cuentas de redes sociales conectadas')}
              </p>
            </div>
          </div>
        </div>
      }
    >
      <Head title={t('socialAccounts.title', 'Cuentas Sociales')} />

      <div className="min-h-screen w-full min-w-0 max-w-full overflow-x-hidden bg-gray-50/30 dark:bg-neutral-900/10">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Connected Accounts */}
          {accounts.length > 0 && (
            <div className="mb-8">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                {t('socialAccounts.connectedAccounts', 'Cuentas Conectadas')}
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {accounts.map((account) => {
                  const expired = isTokenExpired(account);
                  return (
                    <div
                      key={account.id}
                      className={`rounded-lg border-2 p-6 transition-all ${
                        expired
                          ? 'border-amber-300 bg-amber-50/40 dark:border-amber-600/50 dark:bg-neutral-800/30'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md dark:border-neutral-700 dark:bg-neutral-900'
                      }`}
                    >
                      <div className="mb-4 flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <img
                            src={platformLogos[account.platform]}
                            alt={account.platform}
                            className="h-10 w-10"
                          />
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {getPlatformName(account.platform)}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {account.account_name}
                            </p>
                          </div>
                        </div>
                        {expired ? (
                          <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                            <AlertTriangle className="h-3 w-3" />
                            {t('socialAccounts.expired', 'Expirado')}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
                            <CheckCircle className="h-3 w-3" />
                            {t('socialAccounts.active', 'Activo')}
                          </span>
                        )}
                      </div>

                      <div className="mb-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">
                            {t('socialAccounts.connectedBy', 'Conectado por')}
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {account.user.name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">
                            {t('socialAccounts.connectedAt', 'Conectado')}
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {new Date(account.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {expired && (
                          <Button
                            onClick={() => handleConnect(account.platform)}
                            size="sm"
                            variant="secondary"
                            icon={RefreshCw}
                            className="flex-1"
                          >
                            {t('socialAccounts.reconnect', 'Reconectar')}
                          </Button>
                        )}
                        <Button
                          onClick={() => handleDisconnect(account.id)}
                          size="sm"
                          variant="danger"
                          icon={Trash2}
                          loading={loading === account.id}
                          className={expired ? 'flex-1' : 'w-full'}
                        >
                          {t('socialAccounts.disconnect', 'Desconectar')}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Available Platforms */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              {t('socialAccounts.availablePlatforms', 'Plataformas Disponibles')}
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {allowedPlatforms.map((platform) => {
                const isConnected = accounts.some((acc) => acc.platform === platform);
                return (
                  <div
                    key={platform}
                    className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-900"
                  >
                    <div className="mb-4 flex items-center gap-3">
                      <img src={platformLogos[platform]} alt={platform} className="h-10 w-10" />
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {getPlatformName(platform)}
                        </h4>
                        {isConnected && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {t('socialAccounts.alreadyConnected', 'Ya conectado')}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => handleConnect(platform)}
                      size="sm"
                      icon={Plus}
                      className="w-full"
                      disabled={isConnected}
                    >
                      {isConnected
                        ? t('socialAccounts.connected', 'Conectado')
                        : t('socialAccounts.connect', 'Conectar')}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
