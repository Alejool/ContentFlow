import Button from '@/Components/common/Modern/Button';
import MediaLightbox from '@/Components/common/MediaLightbox';
import MediaPreviewButton from '@/Components/common/MediaPreviewButton';
import CampaignOverviewTab from '@/Components/Content/modals/ViewPublicationModal/CampaignOverviewTab';
import CreatorInfo from '@/Components/Content/modals/ViewPublicationModal/CreatorInfo';
import PublicationHeader from '@/Components/Content/modals/ViewPublicationModal/PublicationHeader';
import ReelsSection from '@/Components/Content/modals/ViewPublicationModal/ReelsSection';
import { getPlatformConfig } from '@/Constants/ConfigSocialMedia/socialPlatforms';
import type { MediaFile, Publication } from '@/types';
import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Building2, Check, Info, Loader2, MessageSquare, X } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface Props {
  publication: Publication & { media_files: MediaFile[] };
  token: string;
}

export default function ClientPortal({ publication, token }: Props) {
  const { t } = useTranslation();
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [reason, setReason] = useState('');
  const [lightboxMedia, setLightboxMedia] = useState<
    | {
        url: string;
        type: 'image' | 'video';
        title?: string;
      }[]
    | null
  >(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const mediaFiles = publication.media_files || [];
  const title = publication.title || 'Untitled';
  const canReview = publication.status === 'pending_review';

  // Separate reels from regular media
  const reels = mediaFiles.filter((m: any) => m.metadata?.original_media_id);
  const regularMedia = mediaFiles.filter((m: any) => !m.metadata?.original_media_id);

  const handleApprove = async () => {
    if (confirm(t('portal.confirm.approve'))) {
      setProcessing(true);
      try {
        const response = await axios.post(route('api.v1.portal.approve', { token }));
        if (response.data.success) {
          setIsSuccess(true);
          toast.success(t('portal.success.approved'));
        } else {
          toast.error(response.data.message || t('portal.error.approve'));
        }
      } catch (error: any) {
        const message = error.response?.data?.message || t('portal.error.approve');
        toast.error(message);
        console.error('Approve error:', error);
      } finally {
        setProcessing(false);
      }
    }
  };

  const handleReject = async (e: FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error(t('portal.rejection.reasonRequired'));
      return;
    }

    setProcessing(true);
    try {
      const response = await axios.post(route('api.v1.portal.reject', { token }), { reason });
      if (response.data.success) {
        setIsSuccess(true);
        toast.success(t('portal.success.rejected'));
      } else {
        toast.error(response.data.message || t('portal.error.reject'));
      }
    } catch (error: any) {
      const message = error.response?.data?.message || t('portal.error.reject');
      toast.error(message);
      console.error('Reject error:', error);
    } finally {
      setProcessing(false);
    }
  };

  // Helper to extract platforms from platform_settings
  const getTargetPlatforms = () => {
    if (
      !publication.platform_settings ||
      typeof publication.platform_settings !== 'object' ||
      Array.isArray(publication.platform_settings)
    ) {
      return [];
    }
    return Object.keys(publication.platform_settings).map((key) => getPlatformConfig(key));
  };

  const targetPlatforms = getTargetPlatforms();

  if (isSuccess) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4 dark:from-zinc-950 dark:to-zinc-900">
        <Head title={`${t('portal.success.title')} - Intellipost`} />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 text-center shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-600 text-white shadow-lg shadow-green-500/30"
          >
            <Check className="h-10 w-10" strokeWidth={3} />
          </motion.div>
          <h1 className="mb-3 text-3xl font-extrabold text-gray-900 dark:text-white">
            {t('portal.success.title')}
          </h1>
          <p className="mb-6 text-lg leading-relaxed text-gray-600 dark:text-zinc-400">
            {t('portal.success.description', { workspace: publication.workspace?.name })}
          </p>
          <p className="text-sm font-medium text-gray-400 dark:text-zinc-500">
            {t('portal.success.thanks')}
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-12 font-sans text-gray-900 dark:from-zinc-950 dark:to-zinc-900 dark:text-zinc-100">
      <Head title={`${t('portal.title')}: ${publication.title} - ${publication.workspace?.name}`} />

      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 shadow-sm backdrop-blur-lg dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-600 text-xl font-bold text-white shadow-lg shadow-orange-500/30">
              C
            </div>
            <div>
              <span className="block text-lg leading-none font-extrabold tracking-tight">
                Intellipost
              </span>
              <span className="text-xs font-bold tracking-widest text-gray-500 uppercase dark:text-zinc-500">
                {t('portal.clientPortal')}
              </span>
            </div>
          </div>

          {publication.workspace && (
            <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-gradient-to-r from-gray-50 to-white px-3 py-2 shadow-sm dark:border-zinc-700 dark:from-zinc-800 dark:to-zinc-800">
              <Building2 className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-bold text-gray-800 dark:text-zinc-200">
                {publication.workspace.name}
              </span>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto mt-6 max-w-5xl px-6">
        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-start gap-3 rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100/50 p-4 shadow-sm dark:border-blue-800/30 dark:from-blue-900/20 dark:to-blue-900/10"
        >
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
          <div className="text-sm leading-relaxed text-blue-900 dark:text-blue-200">
            <p className="mb-1 font-bold">{t('portal.info.title')}</p>
            <p>
              {t('portal.info.description', {
                creator: publication.user?.name || t('common.unknown'),
                workspace: publication.workspace?.name,
              })}
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="p-6">
            {/* Media Preview */}
            {regularMedia.length > 0 && (
              <div className="mb-6">
                <MediaPreviewButton
                  mediaFiles={regularMedia}
                  title={title}
                  onPreview={(
                    media: { url: string; type: 'image' | 'video'; title?: string }[],
                    index: number,
                  ) => {
                    setLightboxMedia(media);
                    setLightboxIndex(index);
                  }}
                  height="h-80"
                />
              </div>
            )}

            {/* Reels Section */}
            <ReelsSection reels={reels} />

            {/* Publication Header with Status */}
            <PublicationHeader
              title={title}
              description={publication.description || ''}
              status={(publication as any).status}
            />

            {/* Creator Info */}
            <div className="mb-6">
              <CreatorInfo user={publication.user} />
            </div>

            {/* Campaign Overview - Shows all details */}
            <div className="mb-6">
              <CampaignOverviewTab item={publication} />
            </div>

            {/* Target Platforms */}
            {targetPlatforms.length > 0 && (
              <div className="mb-6">
                <h3 className="mb-3 text-sm font-bold tracking-wider text-gray-500 uppercase dark:text-zinc-500">
                  {t('portal.details.targetPlatforms')}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {targetPlatforms.map((platform, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gradient-to-r from-gray-50 to-white px-3 py-2 shadow-sm dark:border-zinc-700 dark:from-zinc-800 dark:to-zinc-800"
                    >
                      <platform.icon className={`h-4 w-4 ${platform.textColor}`} />
                      <span className="text-sm font-bold text-gray-700 dark:text-zinc-300">
                        {platform.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <hr className="mb-6 border-gray-200 dark:border-zinc-800" />

            {/* Actions */}
            {!canReview ? (
              <div className="rounded-lg border border-yellow-200 bg-gradient-to-r from-yellow-50 to-yellow-100/50 p-4 text-center dark:border-yellow-800/30 dark:from-yellow-900/20 dark:to-yellow-900/10">
                <p className="mb-2 text-lg font-bold text-yellow-800 dark:text-yellow-300">
                  {t('portal.status.' + publication.status, publication.status)}
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                  {['approved', 'rejected'].includes(publication.status || '')
                    ? t('portal.status.alreadyReviewed')
                    : t('portal.status.notPendingReview')}
                </p>
              </div>
            ) : !showRejectReason ? (
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={handleApprove}
                  disabled={processing}
                  className="h-12 flex-[2] rounded-lg bg-gradient-to-r from-green-600 to-green-700 text-base font-bold text-white shadow-lg shadow-green-500/20 transition-all hover:from-green-700 hover:to-green-800 hover:shadow-xl hover:shadow-green-500/40 active:scale-95"
                  icon={
                    processing ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Check className="h-5 w-5" />
                    )
                  }
                >
                  {processing ? t('portal.actions.approving') : t('portal.actions.approve')}
                </Button>
                <Button
                  onClick={() => setShowRejectReason(true)}
                  disabled={processing}
                  variant="secondary"
                  buttonStyle="outline"
                  className="h-12 flex-1 rounded-lg border-2 border-gray-300 text-base font-bold transition-all hover:border-red-300 hover:bg-red-50 hover:text-red-600 active:scale-95 dark:border-zinc-700 dark:hover:border-red-800 dark:hover:bg-red-950/20 dark:hover:text-red-400"
                  icon={<X className="h-5 w-5" />}
                >
                  {t('portal.actions.reject')}
                </Button>
              </div>
            ) : (
              <motion.form
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleReject}
                className="space-y-4"
              >
                <div className="mb-3 flex items-center gap-3 rounded-lg border border-red-200 bg-gradient-to-r from-red-50 to-red-100/50 p-3 font-bold text-red-700 dark:border-red-800/30 dark:from-red-900/20 dark:to-red-900/10 dark:text-red-400">
                  <MessageSquare className="h-5 w-5" />
                  {t('portal.rejection.title')}
                </div>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="h-32 w-full rounded-lg border-2 border-gray-200 bg-white p-4 text-base text-gray-700 shadow-inner transition-all focus:border-red-500 focus:ring-4 focus:ring-red-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:focus:border-red-600"
                  placeholder={t('portal.rejection.placeholder')}
                  required
                />
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    type="submit"
                    disabled={processing}
                    className="h-11 flex-[2] rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-base font-bold text-white shadow-lg shadow-red-500/30 hover:from-red-700 hover:to-red-800"
                  >
                    {processing ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      t('portal.actions.submitRejection')
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setShowRejectReason(false);
                      setReason('');
                    }}
                    className="h-11 flex-1 rounded-lg text-base font-bold hover:bg-gray-100 dark:hover:bg-zinc-800"
                  >
                    {t('portal.actions.back')}
                  </Button>
                </div>
              </motion.form>
            )}
          </div>
        </motion.div>

        <footer className="mt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-zinc-600">
            {t('portal.footer.secureLink', {
              app: 'Intellipost',
              workspace: publication.workspace?.name,
            })}
          </p>
          <p className="mt-2 text-xs text-gray-400 dark:text-zinc-700">
            {t('portal.footer.reference', { id: publication.id, token: token.substring(0, 8) })}
          </p>
        </footer>
      </main>

      <MediaLightbox
        isOpen={!!lightboxMedia}
        onClose={() => setLightboxMedia(null)}
        media={lightboxMedia}
        initialIndex={lightboxIndex}
      />
    </div>
  );
}
