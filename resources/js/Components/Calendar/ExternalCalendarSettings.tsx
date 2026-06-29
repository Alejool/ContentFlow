import React from 'react';
import Button from '@/Components/common/Modern/Button';
import ConfirmDialog from '@/Components/common/ui/ConfirmDialog';
import {
  useConnectCalendar,
  useDisconnectCalendar,
  useExternalCalendarStatus,
  useRetrySync,
  useUpdateSyncSettings,
} from '@/Hooks/calendar/useExternalCalendar';
import type { ExternalCalendarConnection, SyncDirection, SyncFrequency } from '@/stores/Calendar/externalCalendarStore';
import { formatDateTimeString } from '@/Utils/formatters';
import {
  AlertCircle,
  ArrowLeftRight,
  ArrowUpFromLine,
  ArrowDownToLine,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  Save,
  XCircle,
  X as XIcon,
} from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface Campaign {
  id: number;
  name: string;
}

interface Platform {
  id: string;
  name: string;
}

interface ExternalCalendarSettingsProps {
  campaigns?: Campaign[];
  platforms?: Platform[];
}

const GoogleIcon = () => (
  <svg className="h-6 w-6" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

const StatusBadge = ({ status }: { status: string }) => {
  const { t } = useTranslation();

  const statusConfig = {
    connected: {
      icon: CheckCircle2,
      text: t('calendar.external.connected'),
      className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    },
    error: {
      icon: XCircle,
      text: t('calendar.external.error'),
      className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    },
    disconnected: {
      icon: AlertCircle,
      text: t('calendar.external.disconnected'),
      className: 'bg-gray-100 text-gray-800 dark:bg-neutral-900 dark:text-neutral-300',
    },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.disconnected;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${config.className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.text}
    </span>
  );
};

export default function ExternalCalendarSettings({
  campaigns: _campaigns = [],
  platforms: _platforms = [],
}: ExternalCalendarSettingsProps) {
  const { t } = useTranslation();
  const { data: connections, isLoading } = useExternalCalendarStatus();
  const connectCalendar = useConnectCalendar();
  const disconnectCalendar = useDisconnectCalendar();
  const retrySync = useRetrySync();
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [providerToDisconnect, setProviderToDisconnect] = useState<'google' | 'outlook' | null>(
    null,
  );

  const handleConnect = async (provider: 'google' | 'outlook') => {
    try {
      await connectCalendar.mutateAsync(provider);
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { upgrade_required?: boolean; error?: string } };
      };
      const data = axiosError?.response?.data;
      if (data?.upgrade_required) {
        toast.error(
          data.error || 'Tu plan no incluye sincronización de calendario. Actualiza tu plan.',
        );
      } else {
        toast.error(t('calendar.external.connectError'));
      }
    }
  };

  const initiateDisconnect = (provider: 'google' | 'outlook') => {
    setProviderToDisconnect(provider);
    setShowDisconnectDialog(true);
  };

  const handleDisconnect = async () => {
    if (!providerToDisconnect) return;

    try {
      await disconnectCalendar.mutateAsync(providerToDisconnect);
      toast.success(t('calendar.external.disconnectSuccess'));
    } catch {
      toast.error(t('calendar.external.disconnectError'));
    } finally {
      setShowDisconnectDialog(false);
      setProviderToDisconnect(null);
    }
  };

  const handleSync = async (provider: string) => {
    try {
      await retrySync.mutateAsync(provider);
      toast.success(t('calendar.external.syncSuccess'));
    } catch {
      toast.error(t('calendar.external.syncError'));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="text-primary-600 h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600 dark:text-neutral-400">
            {t('calendar.external.description')}
          </p>
        </div>

        <div className="space-y-3">
          <CalendarConnectionCard
            connection={
              connections?.find((c: ExternalCalendarConnection) => c.provider === 'google') || {
                provider: 'google' as const,
                connected: false,
                status: 'disconnected' as const,
              }
            }
            icon={<GoogleIcon />}
            onConnect={() => handleConnect('google')}
            onDisconnect={() => initiateDisconnect('google')}
            onSync={() => handleSync('google')}
            isConnecting={connectCalendar.isPending}
            isDisconnecting={disconnectCalendar.isPending}
            isSyncing={retrySync.isPending}
          />
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDisconnectDialog}
        onClose={() => {
          setShowDisconnectDialog(false);
          setProviderToDisconnect(null);
        }}
        onConfirm={handleDisconnect}
        title={t('calendar.external.disconnectConfirm.title')}
        message={t('calendar.external.disconnectConfirm.message')}
        confirmText={t('calendar.external.disconnectConfirm.confirm')}
        cancelText={t('calendar.external.disconnectConfirm.cancel')}
        type="warning"
      />
    </>
  );
}

const SYNC_DIRECTIONS: { value: SyncDirection; label: string; icon: React.ElementType; desc: string }[] = [
  { value: 'import',        label: 'Solo importar',     icon: ArrowDownToLine,  desc: 'Del calendario externo al sistema' },
  { value: 'export',        label: 'Solo exportar',     icon: ArrowUpFromLine,  desc: 'Del sistema al calendario externo' },
  { value: 'bidirectional', label: 'Bidireccional',     icon: ArrowLeftRight,   desc: 'Sincronización en ambos sentidos' },
];

const SYNC_FREQUENCIES: { value: SyncFrequency; label: string }[] = [
  { value: 'manual', label: 'Manual' },
  { value: '5min',   label: 'Cada 5 min' },
  { value: '10min',  label: 'Cada 10 min' },
  { value: '30min',  label: 'Cada 30 min' },
  { value: '1h',     label: 'Cada hora' },
  { value: '3h',     label: 'Cada 3 h' },
  { value: '6h',     label: 'Cada 6 h' },
  { value: '24h',    label: 'Cada 24 h' },
];

const CalendarConnectionCard = ({
  connection,
  icon,
  onConnect,
  onDisconnect,
  onSync,
  isConnecting,
  isDisconnecting,
  isSyncing,
}: {
  connection: ExternalCalendarConnection;
  icon: React.ReactNode;
  onConnect: () => void;
  onDisconnect: () => void;
  onSync: () => void;
  isConnecting: boolean;
  isDisconnecting: boolean;
  isSyncing: boolean;
}) => {
  const { t } = useTranslation();
  const updateSyncSettings = useUpdateSyncSettings();

  const [direction, setDirection] = useState<SyncDirection>(
    connection.syncDirection ?? 'bidirectional',
  );
  const [frequency, setFrequency] = useState<SyncFrequency>(
    connection.syncFrequency ?? 'manual',
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await updateSyncSettings.mutateAsync({
        provider: connection.provider,
        settings: {
          syncEnabled: true,
          syncDirection: direction,
          syncFrequency: frequency,
          syncCampaigns: connection.syncConfig?.syncCampaigns ?? [],
          syncPlatforms: connection.syncConfig?.syncPlatforms ?? [],
        },
      });
      toast.success('Configuración de sincronización guardada');
    } catch {
      toast.error('Error al guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      {/* Header */}
      <div className="flex items-start justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-neutral-900">
            {icon}
          </div>
          <div>
            <h4 className="text-sm font-semibold capitalize text-gray-900 dark:text-neutral-100">
              {connection.provider} Calendar
            </h4>
            {connection.connected && connection.email && (
              <p className="mt-0.5 text-xs text-gray-500 dark:text-neutral-400">{connection.email}</p>
            )}
            {connection.lastSync && (
              <p className="mt-0.5 text-xs text-gray-400 dark:text-neutral-500">
                Última sync: {formatDateTimeString(connection.lastSync)}
              </p>
            )}
          </div>
        </div>
        <StatusBadge status={connection.status} />
      </div>

      {connection.errorMessage && (
        <div className="mx-4 mb-3 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
          <p className="text-sm text-red-700 dark:text-red-300">{connection.errorMessage}</p>
        </div>
      )}

      {/* Sync settings — only when connected */}
      {connection.connected && (
        <div className="border-t border-gray-100 px-4 py-4 dark:border-neutral-800">
          {/* Direction */}
          <div className="mb-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-neutral-400">
              Dirección de sincronización
            </p>
            <div className="grid grid-cols-3 gap-2">
              {SYNC_DIRECTIONS.map((opt) => {
                const Icon = opt.icon;
                const active = direction === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDirection(opt.value)}
                    className={`flex flex-col items-center gap-1.5 rounded-lg border-2 px-2 py-3 text-center text-xs font-semibold transition-all ${
                      active
                        ? 'border-primary-500 bg-primary-50 text-primary-700 dark:border-primary-500 dark:bg-primary-900/20 dark:text-primary-400'
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-400'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="leading-tight">{opt.label}</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-1.5 text-[11px] text-gray-400 dark:text-neutral-500">
              {SYNC_DIRECTIONS.find((d) => d.value === direction)?.desc}
            </p>
          </div>

          {/* Frequency */}
          <div className="mb-4">
            <p className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-neutral-400">
              <Clock className="h-3 w-3" />
              Frecuencia (job automático)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {SYNC_FREQUENCIES.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFrequency(opt.value)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                    frequency === opt.value
                      ? 'bg-primary-500 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {frequency !== 'manual' && (
              <p className="mt-1.5 text-[11px] text-gray-400 dark:text-neutral-500">
                El servidor sincronizará automáticamente según este intervalo.
              </p>
            )}
          </div>

          {/* Save settings */}
          <Button
            size="md"
            variant="primary"
            buttonStyle="solid"
            icon={Save}
            onClick={handleSaveSettings}
            loading={isSaving}
            className="w-full"
          >
            Guardar configuración
          </Button>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 border-t border-gray-100 px-4 py-3 dark:border-neutral-800">
        {connection.connected ? (
          <>
            <Button
              variant="primary"
              size="sm"
              icon={RefreshCw}
              onClick={onSync}
              loading={isSyncing}
            >
              Sincronizar ahora
            </Button>
            <Button
              variant="danger"
              buttonStyle='ghost'
              size="sm"
              icon={XIcon}
              onClick={onDisconnect}
              loading={isDisconnecting}
            >
              {t('calendar.external.disconnect')}
            </Button>
          </>
        ) : (
          <Button
            variant="primary"
            size="sm"
            icon={Calendar}
            onClick={onConnect}
            loading={isConnecting}
            loadingText={t('calendar.external.connecting')}
            className="w-full"
          >
            {t('calendar.external.connect')}
          </Button>
        )}
      </div>
    </div>
  );
};
