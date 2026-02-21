import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Calendar,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  X as XIcon
} from 'lucide-react';
import Button from '@/Components/common/Modern/Button';
import ConfirmDialog from '@/Components/common/ui/ConfirmDialog';
import {
  useExternalCalendarStatus,
  useConnectCalendar,
  useDisconnectCalendar,
  useRetrySync,
} from '@/Hooks/useExternalCalendar';
import { toast } from 'react-hot-toast';
import type { ExternalCalendarConnection } from '@/stores/externalCalendarStore';

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
  <svg className="w-6 h-6" viewBox="0 0 24 24">
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
      className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.disconnected;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.className}`}>
      <Icon className="w-3.5 h-3.5" />
      {config.text}
    </span>
  );
};

export default function ExternalCalendarSettings({
  campaigns = [],
  platforms = [],
}: ExternalCalendarSettingsProps) {
  const { t } = useTranslation();
  const { data: connections, isLoading } = useExternalCalendarStatus();
  const connectCalendar = useConnectCalendar();
  const disconnectCalendar = useDisconnectCalendar();
  const retrySync = useRetrySync();
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [providerToDisconnect, setProviderToDisconnect] = useState<'google' | 'outlook' | null>(null);

  const handleConnect = async (provider: 'google' | 'outlook') => {
    try {
      await connectCalendar.mutateAsync(provider);
    } catch (error) {
      toast.error(t('calendar.external.connectError'));
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
    } catch (error) {
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
    } catch (error) {
      toast.error(t('calendar.external.syncError'));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('calendar.external.description')}
          </p>
        </div>

        <div className="space-y-3">
          <CalendarConnectionCard
            connection={connections?.find((c: ExternalCalendarConnection) => c.provider === 'google') || {
              provider: 'google' as const,
              connected: false,
              status: 'disconnected' as const,
            }}
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

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 hover:border-primary-500 dark:hover:border-primary-500 transition-all">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white dark:bg-gray-700 rounded-lg flex items-center justify-center shadow-sm">
            {icon}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 capitalize">
              {connection.provider} Calendar
            </h4>
            {connection.connected && connection.email && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{connection.email}</p>
            )}
            {connection.lastSync && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {t('calendar.external.lastSync')}: {new Date(connection.lastSync).toLocaleString()}
              </p>
            )}
          </div>
        </div>
        <StatusBadge status={connection.status} />
      </div>

      {connection.errorMessage && (
        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300">{connection.errorMessage}</p>
        </div>
      )}

      <div className="mt-4 flex items-center gap-2">
        {connection.connected ? (
          <>
            <Button
              variant="primary"
              buttonStyle="outline"
              size="md"
              icon={RefreshCw}
              onClick={onSync}
              loading={isSyncing}
              className="!text-black"
            >
              {t('calendar.external.syncNow')}
            </Button>
            <Button
              variant="danger"
              buttonStyle="outline"
              size="md"
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
            size="md"
            icon={Calendar}
            onClick={onConnect}
            loading={isConnecting}
            loadingText={t('calendar.external.connecting')}
          >
            {t('calendar.external.connect')}
          </Button>
        )}
      </div>
    </div>
  );
};
