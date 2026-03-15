import SocialAccountCardSkeleton from '@/Components/common/ui/skeletons/SocialAccountCardSkeleton';
import PlatformSettingsModal from '@/Components/ConfigSocialMedia/PlatformSettingsModal';
import DisconnectBlockerModal from '@/Components/Content/modals/DisconnectBlockerModal';
import DisconnectWarningModal from '@/Components/Content/modals/DisconnectWarningModal';
import { SOCIAL_PLATFORMS } from '@/Constants/socialPlatforms';
import { useSocialMediaAuth } from '@/Hooks/useSocialMediaAuth';
import { getPlatformSchema } from '@/schemas/platformSettings';
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart3,
  Check,
  ChevronDown,
  Clock,
  ExternalLink,
  Loader2,
  X
} from 'lucide-react';
import { memo, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface Account {
  id: number;
  platform: string;
  name: string;
  logo: any;
  isConnected: boolean;
  accountId: number | string | null;
  accountDetails?: any;
  color: string;
  gradient: string;
  connectedBy?: string;
}

const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.06, duration: 0.3, type: 'tween' as const },
  }),
  exit: { opacity: 0, y: -8, scale: 0.97, transition: { duration: 0.2 } },
};

const SocialMediaAccounts = memo(() => {
  const { t } = useTranslation();
  const { isLoading, connectAccount, disconnectAccount } = useSocialMediaAuth();
  const { auth } = usePage<any>().props;
  const [activePlatform, setActivePlatform] = useState<string | null>(null);
  const [localSettings, setLocalSettings] = useState<any>({});
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectedAccountsCount, setConnectedAccountsCount] = useState(0);
  const [blockerModalData, setBlockerModalData] = useState<{
    account: any;
    posts: any[];
    reason?: string;
    canDisconnect?: boolean;
  } | null>(null);
  const [accountsWithPublishing, setAccountsWithPublishing] = useState<Set<number>>(new Set());

  const userPermissions = auth?.current_workspace?.permissions || [];
  const canManageAccounts = userPermissions.includes('manage-accounts');

  useEffect(() => {
    setLocalSettings({});
  }, []);

  const handleOpenSettings = (platform: string) => setActivePlatform(platform);
  const handleCloseSettings = () => setActivePlatform(null);

  const handleSettingsChange = (newSettings: any) => {
    if (!activePlatform) return;
    setLocalSettings({ ...localSettings, [activePlatform.toLowerCase()]: newSettings });
  };

  const saveSettings = () => {
    if (!activePlatform) return;
    const schema = getPlatformSchema(activePlatform);
    const settingsToSave = localSettings[activePlatform.toLowerCase()] || {};
    const result = schema.safeParse(settingsToSave);
    if (!result.success) {
      result.error.issues.forEach((issue: any) => toast.error(t(issue.message)));
      return;
    }
    router.patch(
      route('settings.social.update'),
      { settings: localSettings },
      {
        preserveScroll: true,
        onSuccess: () => {
          toast.success(
            t('platformSettings.messages.success') + ' ' + activePlatform.toLowerCase(),
          );
          handleCloseSettings();
        },
        onError: () => toast.error(t('common.error') || 'Error al guardar'),
      },
    );
  };

  const disconnectSocialMedia = (id: number | null, force: boolean = false) => {
    if (!id) return { success: false };
    return disconnectAccount(id as number, force);
  };

  useEffect(() => {
    fetchConnectedAccounts();
    const handleAuthMessage = (event: MessageEvent) => {
      if (event.data?.type === 'social_auth_callback' && event.data.success) {
        fetchConnectedAccounts();
      }
    };
    window.addEventListener('message', handleAuthMessage);
    return () => window.removeEventListener('message', handleAuthMessage);
  }, []);

  const fetchConnectedAccounts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/social-accounts', {
        headers: {
          'X-CSRF-TOKEN': document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content'),
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      });
      if (response.data?.accounts) updateAccountsStatus(response.data.accounts);
    } catch (error: any) {
      if (error.response?.status === 401) {
        toast.error(t('manageContent.socialMedia.messages.unauthorized'));
      } else {
        toast.error(t('manageContent.socialMedia.messages.loadError'));
      }
    } finally {
      setLoading(false);
    }
  };

  const updateAccountsStatus = (connectedAccounts: any[]) => {
    setConnectedAccountsCount(connectedAccounts?.length || 0);
    const platformCards: Account[] = [];
    Object.entries(SOCIAL_PLATFORMS)
      .filter(([_, config]) => config?.active)
      .forEach(([key, config]) => {
        if (!config?.gradient) return;
        const filtered = connectedAccounts.filter(
          (ca) => ca.platform.toLowerCase() === key.toLowerCase(),
        );
        if (filtered.length === 0) {
          platformCards.push({
            id: config.id,
            platform: key,
            name: config.name,
            logo: config.logo,
            isConnected: false,
            accountId: null,
            color: config.color,
            gradient: config.gradient,
          });
        } else {
          filtered.forEach((ca) => {
            platformCards.push({
              id: ca.id,
              platform: key,
              name: config.name,
              logo: config.logo,
              isConnected: true,
              accountId: ca.id,
              accountDetails: ca,
              color: config.color,
              gradient: config.gradient,
              connectedBy: ca.user?.name,
            });
          });
        }
      });
    setAccounts(platformCards);
  };

  useEffect(() => {
    if (!window.Echo || !auth?.user?.current_workspace_id) return;
    const workspaceId = auth.user.current_workspace_id;
    const channel = window.Echo.private(`workspace.${workspaceId}`);
    const handlePublicationStatusUpdate = (event: any) => {
      if (event.social_account_ids && Array.isArray(event.social_account_ids)) {
        setAccountsWithPublishing((prev: Set<number>) => {
          const newSet = new Set(prev);
          event.social_account_ids.forEach((accountId: number) => {
            if (event.status === 'publishing' || event.status === 'retrying') {
              newSet.add(accountId);
            } else if (event.status === 'published' || event.status === 'failed') {
              newSet.delete(accountId);
            }
          });
          return newSet;
        });
      }
    };
    channel.listen('.PublicationStatusUpdated', handlePublicationStatusUpdate);
    return () => {
      channel.stopListening('.PublicationStatusUpdated', handlePublicationStatusUpdate);
    };
  }, [auth?.user?.current_workspace_id]);

  useEffect(() => {
    if (accounts.length === 0) return;
    const checkInitialPublishingStatus = async () => {
      const publishingAccounts = new Set<number>();
      for (const account of accounts) {
        if (account.isConnected && account.accountId) {
          try {
            const response = await axios.get(
              `/api/v1/social-accounts/${account.accountId}/publishing-status`,
              {
                headers: {
                  'X-CSRF-TOKEN': document
                    .querySelector('meta[name="csrf-token"]')
                    ?.getAttribute('content'),
                  Accept: 'application/json',
                },
                withCredentials: true,
              },
            );
            if (response.data?.has_publishing) publishingAccounts.add(account.accountId as number);
          } catch (error: any) {
            console.error(
              `[Publishing Check] Error checking ${account.name}:`,
              error.response?.data || error.message,
            );
          }
        }
      }
      if (publishingAccounts.size > 0) setAccountsWithPublishing(publishingAccounts);
    };
    checkInitialPublishingStatus();
  }, [accounts]);

  const handleConnectionToggle = async (account: Account) => {
    if (!canManageAccounts) {
      toast.error(
        t('manageContent.socialMedia.messages.noPermission') ||
          'No tienes permiso para gestionar cuentas.',
      );
      return;
    }
    if (blockerModalData?.account?.id === account.id) setBlockerModalData(null);
    if (account.isConnected) {
      if (accountsWithPublishing.has(account.accountId as number)) {
        toast.error(
          t('manageContent.socialMedia.messages.cannotDisconnectPublishing') ||
            'No puedes desconectar esta cuenta mientras hay publicaciones en proceso',
        );
        return;
      }
      try {
        const result: any = await disconnectSocialMedia(account.accountId as number);
        if (result?.success) {
          fetchConnectedAccounts();
          setConnectedAccountsCount((prev: number) => prev - 1);
          toast.success(
            `${account.name} ${t('manageContent.socialMedia.messages.disconnectSuccess')}`,
          );
        } else if (result && !result.success && result.posts) {
          setBlockerModalData({
            account,
            posts: result.posts,
            reason: result.reason,
            canDisconnect: result.can_disconnect,
          });
        }
      } catch {
        toast.error(t('manageContent.socialMedia.messages.disconnectError'));
      }
    } else {
      try {
        await connectAccount(account.platform);
      } catch {
        toast.error(t('manageContent.socialMedia.messages.connectError'));
      }
    }
  };

  const handleForceDisconnect = async (account: Account) => {
    const result = await disconnectSocialMedia(account.accountId as number, true);
    if (result && result.success) {
      fetchConnectedAccounts();
      setConnectedAccountsCount((prev: number) => prev - 1);
      setBlockerModalData(null);
      toast.success(`${account.name} ${t('manageContent.socialMedia.messages.disconnectSuccess')}`);
    }
  };

  return (
    <Disclosure>
      {({ open }) => (
        <div>
          <DisclosureButton className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white p-4 transition-all duration-300 hover:border-gray-300 hover:shadow-sm dark:border-black/50 dark:bg-black/70 dark:hover:border-neutral-600">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: open ? 360 : 0 }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
                className="rounded-lg bg-gray-100 p-2 dark:bg-black/50"
              >
                <BarChart3 className="h-5 w-5 text-primary-500" />
              </motion.div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  {t('manageContent.socialMedia.title')}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {connectedAccountsCount} {t('manageContent.socialMedia.accounts')}{' '}
                  {t('manageContent.socialMedia.connected')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {open
                    ? t('manageContent.socialMedia.hide')
                    : t('manageContent.socialMedia.seeAccounts')}
                </span>
                <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                </motion.div>
              </div>
            </div>
          </DisclosureButton>

          <AnimatePresence>
            {open && (
              <DisclosurePanel as="div" static>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' as const }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 space-y-8">
                    {loading ? (
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {Array.from({ length: 4 }).map((_, index) => (
                          <SocialAccountCardSkeleton key={index} />
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {accounts.map((account, i) => (
                          <motion.div
                            key={`${account.platform}-${account.id}`}
                            custom={i}
                            variants={cardVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            whileHover={{ y: -3, transition: { duration: 0.2 } }}
                            className={`group relative rounded-lg border border-gray-100 bg-white p-4 transition-colors duration-300 hover:border-primary-100 hover:shadow-xl dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-primary-900/30 sm:p-5 ${
                              account.isConnected
                                ? 'ring-1 ring-emerald-500/10 dark:ring-emerald-500/5'
                                : 'opacity-90 hover:opacity-100'
                            }`}
                          >
                            {/* Status badge */}
                            <div className="absolute right-4 top-4 z-10">
                              <div
                                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-tight transition-colors ${
                                  account.isConnected
                                    ? 'border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900/80 dark:bg-emerald-900/30 dark:text-emerald-400'
                                    : 'border-gray-100 bg-gray-50 text-gray-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-400'
                                }`}
                              >
                                {account.isConnected ? (
                                  <>
                                    <motion.div
                                      className="h-1.5 w-1.5 rounded-full bg-emerald-500"
                                      animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                                      transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: 'easeInOut',
                                      }}
                                    />
                                    {t('manageContent.socialMedia.status.connected')}
                                  </>
                                ) : (
                                  <>
                                    <div className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                                    {t('manageContent.socialMedia.status.notConnected')}
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Avatar + name */}
                            <div className="mb-5 flex flex-col items-center pt-3 text-center">
                              <motion.div
                                className="relative mb-4"
                                whileHover={{ scale: 1.1 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                              >
                                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-gray-100 bg-gray-50 p-0.5 shadow-inner dark:border-neutral-800 dark:bg-neutral-800">
                                  {account.isConnected &&
                                  account.accountDetails?.account_metadata?.avatar ? (
                                    <img
                                      src={account.accountDetails.account_metadata.avatar}
                                      alt={account.accountDetails.account_name || account.name}
                                      className="h-full w-full rounded-lg object-cover"
                                    />
                                  ) : (
                                    <div className="h-full w-full p-3">
                                      <img
                                        src={account.logo}
                                        alt={`${account.name} Logo`}
                                        className="h-full w-full object-contain"
                                      />
                                    </div>
                                  )}
                                </div>
                                {account.isConnected && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{
                                      type: 'spring',
                                      stiffness: 400,
                                      damping: 15,
                                      delay: 0.1,
                                    }}
                                    className="absolute -bottom-1 -right-1 rounded-full border-2 border-white bg-emerald-500 p-1 shadow-lg dark:border-neutral-900"
                                  >
                                    <Check className="h-2.5 w-2.5 text-white" />
                                  </motion.div>
                                )}
                              </motion.div>

                              <h3 className="w-full truncate px-2 text-lg font-bold leading-tight text-gray-900 dark:text-gray-100">
                                {account.isConnected && account.accountDetails?.account_name
                                  ? account.accountDetails.account_name
                                  : account.name}
                              </h3>

                              {account.isConnected && account.accountDetails ? (
                                <div className="mt-1.5 flex flex-col items-center gap-1">
                                  <p className="rounded-full border border-gray-100 bg-gray-50 px-2 py-0.5 text-[10px] font-bold text-gray-500 dark:border-neutral-700/50 dark:bg-neutral-800 dark:text-gray-400">
                                    {account.accountDetails.account_metadata?.username
                                      ? `@${account.accountDetails.account_metadata.username}`
                                      : `ID: ${account.accountDetails.account_id}`}
                                  </p>
                                  {account.connectedBy && (
                                    <p className="text-[9px] font-bold uppercase tracking-wider text-primary-500">
                                      {t('manageContent.socialMedia.connectedBy') ||
                                        'Conectado por'}
                                      : {account.connectedBy}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                  {t('manageContent.socialMedia.status.connectToShare')}
                                </p>
                              )}
                            </div>

                            {/* API Limits */}
                            {/* {(() => {
                            const platformConfig = SOCIAL_PLATFORMS[account.platform.toLowerCase()];
                            const apiLimits = platformConfig?.apiLimits;
                            if (!apiLimits) return null;
                            return (
                              <div className="mb-4 rounded-lg border border-gray-100 bg-gray-50/80 px-3 py-2.5 dark:border-neutral-700/50 dark:bg-neutral-800/50">
                                <p className="mb-1.5 text-[9px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                  {t('manageContent.socialMedia.apiLimits')}
                                </p>
                                <div className="space-y-1">
                                  {account.platform.toLowerCase() === 'facebook' && (<>
                                    <div className="flex items-center justify-between text-[10px]">
                                      <span className="text-gray-600 dark:text-gray-400">{t('manageContent.socialMedia.limits.requestsPerHour')}:</span>
                                      <span className="font-bold text-gray-900 dark:text-gray-100">{apiLimits.requestsPerHour}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px]">
                                      <span className="text-gray-600 dark:text-gray-400">{t('manageContent.socialMedia.limits.requestsPerMinute')}:</span>
                                      <span className="font-bold text-gray-900 dark:text-gray-100">{apiLimits.requestsPerMinute}</span>
                                    </div>
                                  </>)}
                                  {account.platform.toLowerCase() === 'tiktok' && (<>
                                    <div className="flex items-center justify-between text-[10px]">
                                      <span className="text-gray-600 dark:text-gray-400">{t('manageContent.socialMedia.limits.requestsPerDay')}:</span>
                                      <span className="font-bold text-gray-900 dark:text-gray-100">{apiLimits.requestsPerDay}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px]">
                                      <span className="text-gray-600 dark:text-gray-400">{t('manageContent.socialMedia.limits.postsPerDay')}:</span>
                                      <span className="font-bold text-gray-900 dark:text-gray-100">{apiLimits.postsPerDay}</span>
                                    </div>
                                  </>)}
                                  {account.platform.toLowerCase() === 'twitter' && (<>
                                    <div className="flex items-center justify-between text-[10px]">
                                      <span className="text-gray-600 dark:text-gray-400">{t('manageContent.socialMedia.limits.postsPerThreeHours')}:</span>
                                      <span className="font-bold text-gray-900 dark:text-gray-100">{apiLimits.postsPerThreeHours}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px]">
                                      <span className="text-gray-600 dark:text-gray-400">{t('manageContent.socialMedia.limits.requestsPerDay')}:</span>
                                      <span className="font-bold text-gray-900 dark:text-gray-100">{apiLimits.requestsPerDay}</span>
                                    </div>
                                  </>)}
                                  {account.platform.toLowerCase() === 'youtube' && (<>
                                    <div className="flex items-center justify-between text-[10px]">
                                      <span className="text-gray-600 dark:text-gray-400">{t('manageContent.socialMedia.limits.dailyQuota')}:</span>
                                      <span className="font-bold text-gray-900 dark:text-gray-100">{apiLimits.quotaUnitsPerDay} units</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px]">
                                      <span className="text-gray-600 dark:text-gray-400">{t('manageContent.socialMedia.limits.uploadCost')}:</span>
                                      <span className="font-bold text-gray-900 dark:text-gray-100">{apiLimits.uploadCost}</span>
                                    </div>
                                  </>)}
                                </div>
                              </div>
                            );
                          })()} */}

                            {/* Action buttons */}
                            <div className="flex w-full gap-2">
                              <motion.button
                                whileTap={{ scale: 0.97 }}
                                onClick={() => handleConnectionToggle(account)}
                                disabled={
                                  !canManageAccounts ||
                                  isLoading ||
                                  (account.isConnected &&
                                    accountsWithPublishing.has(account.accountId as number))
                                }
                                className={`group/btn relative flex flex-1 items-center justify-center gap-2 overflow-hidden rounded-lg px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                                  !canManageAccounts ||
                                  isLoading ||
                                  (account.isConnected &&
                                    accountsWithPublishing.has(account.accountId as number))
                                    ? 'cursor-not-allowed bg-gray-100 text-gray-400 opacity-60 dark:bg-neutral-700/50'
                                    : account.isConnected
                                      ? 'border border-primary-200 bg-gradient-to-r from-primary-50 to-primary-50 text-primary-600 hover:bg-primary-100 dark:border-primary-900/30 dark:from-primary-900/10 dark:to-primary-800/10 dark:text-primary-400 dark:hover:bg-primary-900/20'
                                      : `bg-gradient-to-r ${account.gradient} text-white shadow-lg hover:shadow-xl`
                                }`}
                              >
                                <span className="relative z-10 flex items-center gap-2">
                                  {!canManageAccounts ? (
                                    <>
                                      <X className="h-4 w-4" />
                                      {t('manageContent.socialMedia.actions.noPermission') ||
                                        'Sin permiso'}
                                    </>
                                  ) : isLoading ? (
                                    <>
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                      {t('manageContent.socialMedia.actions.processing')}
                                    </>
                                  ) : account.isConnected &&
                                    accountsWithPublishing.has(account.accountId as number) ? (
                                    <>
                                      <Clock className="h-4 w-4 animate-pulse" />
                                      {t('manageContent.socialMedia.actions.publishing') ||
                                        'Publicando...'}
                                    </>
                                  ) : account.isConnected ? (
                                    <>
                                      <X className="h-4 w-4" />
                                      {t('manageContent.socialMedia.actions.disconnect')}
                                    </>
                                  ) : (
                                    <>
                                      <ExternalLink className="h-4 w-4" />
                                      {t('manageContent.socialMedia.actions.connect')}
                                    </>
                                  )}
                                </span>
                                {canManageAccounts &&
                                  !isLoading &&
                                  !(
                                    account.isConnected &&
                                    accountsWithPublishing.has(account.accountId as number)
                                  ) && (
                                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover/btn:translate-x-full dark:via-white/5" />
                                  )}
                              </motion.button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}

                    {blockerModalData && !blockerModalData.canDisconnect && (
                      <DisconnectBlockerModal
                        isOpen={!!blockerModalData}
                        onClose={() => setBlockerModalData(null)}
                        accountName={blockerModalData.account.name}
                        posts={blockerModalData.posts}
                        reason={blockerModalData.reason as 'publishing' | 'scheduled'}
                      />
                    )}
                    {blockerModalData && blockerModalData.canDisconnect && (
                      <DisconnectWarningModal
                        isOpen={!!blockerModalData}
                        onClose={() => setBlockerModalData(null)}
                        onConfirm={() => handleForceDisconnect(blockerModalData.account)}
                        accountName={blockerModalData.account.name}
                        posts={blockerModalData.posts}
                        isLoading={isLoading}
                      />
                    )}
                    {activePlatform && (
                      <PlatformSettingsModal
                        isOpen={!!activePlatform}
                        onClose={handleCloseSettings}
                        onSave={saveSettings}
                        platform={activePlatform}
                        settings={localSettings[activePlatform.toLowerCase()] || {}}
                        onSettingsChange={handleSettingsChange}
                      />
                    )}
                  </div>
                </motion.div>
              </DisclosurePanel>
            )}
          </AnimatePresence>
        </div>
      )}
    </Disclosure>
  );
});

export default SocialMediaAccounts;
