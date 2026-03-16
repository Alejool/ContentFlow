import { Avatar } from '@/Components/common/Avatar';
import Button from '@/Components/common/Modern/Button';
import MediaLightbox from '@/Components/common/ui/MediaLightbox';
import MediaPreviewButton from '@/Components/common/ui/MediaPreviewButton';
import ActivityList from '@/Components/Content/ActivityList';
import ApprovalHistorySection from '@/Components/Content/Publication/common/edit/ApprovalHistorySection';
import ReelsCarousel from '@/Components/Content/ReelsCarousel';
import { usePublicationStore } from '@/stores/publicationStore';
import { Campaign } from '@/types/Campaign';
import { Publication } from '@/types/Publication';
import { formatDateString } from '@/Utils/dateHelpers';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { usePage } from '@inertiajs/react';
import { Calendar, Edit, FileText, Hash, Layers, Target, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ViewCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: Campaign | Publication | null;
  onEdit?: (item: Campaign | Publication) => void;
}

export default function ViewCampaignModal({
  isOpen,
  onClose,
  campaign: initialItem,
  onEdit,
}: ViewCampaignModalProps) {
  const { t } = useTranslation();
  const { auth } = usePage<any>().props;
  const [activeTab, setActiveTab] = useState('overview');
  const [hashtagsExpanded, setHashtagsExpanded] = useState(false);
  const [lightboxMedia, setLightboxMedia] = useState<
    | {
        url: string;
        type: 'image' | 'video';
        title?: string;
      }[]
    | null
  >(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const canEdit = auth.current_workspace?.permissions?.includes('manage-content');

  // Get fresh data from publicationStore if this is a publication
  const publicationsFromStore = usePublicationStore((s) => s.publications);
  const [item, setItem] = useState(initialItem);

  // Update item when store changes (e.g., after approval)
  useEffect(() => {
    if (initialItem && (initialItem as any).title && initialItem.id) {
      // This is a publication - check for updates in store
      const freshPub = publicationsFromStore.find((p) => p.id === initialItem.id);
      if (freshPub) {
        setItem(freshPub);
      } else {
        setItem(initialItem);
      }
    } else {
      // This is a campaign - use initial item
      setItem(initialItem);
    }
  }, [initialItem, publicationsFromStore]);

  // Early return after all hooks
  if (!item) return null;

  const isPublication = (i: any): i is Publication => {
    return !!i.title && !i.name;
  };

  const isActuallyPublication = isPublication(item);

  const planId =
    auth.current_workspace?.subscription?.plan?.toLowerCase() ||
    auth.current_workspace?.plan?.toLowerCase() ||
    'demo';
  const canAccessApprovals = ['demo', 'professional', 'enterprise'].includes(planId);

  const title = (item as any).title || (item as any).name || 'Untitled';
  const desc = item.description || 'No description provided.';
  const media = (item as any).media_files || [];
  const publications = (item as any).publications || [];

  // Separate reels from regular media
  const reels = media.filter((m: any) => m.metadata?.original_media_id);
  const regularMedia = media.filter((m: any) => !m.metadata?.original_media_id);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'deleted':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return t('common.notSet', 'Not set');
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return t('common.notSet', 'Not set');
      return formatDateString(dateString, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      return t('common.notSet', 'Not set');
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-lg border border-gray-200/50 bg-gradient-to-br from-white to-gray-50 shadow-2xl dark:border-neutral-800/50 dark:from-neutral-900 dark:to-neutral-950">
          <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-100 p-6 dark:border-neutral-700">
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
              {isActuallyPublication ? (
                <FileText className="h-6 w-6 text-primary-500" />
              ) : (
                <Layers className="h-6 w-6 text-primary-500" />
              )}
              {isActuallyPublication
                ? t('publications.modal.show.title')
                : t('campaigns.modal.view.title')}
            </DialogTitle>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-neutral-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {regularMedia.length > 0 && (
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
                  height="h-64"
                />
              )}

              {/* Reels Section */}
              {reels.length > 0 && (
                <div className="rounded-lg border-2 border-purple-200 bg-purple-50/50 p-4 dark:border-purple-800 dark:bg-purple-900/10">
                  <div className="mb-4 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                      <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {t('reels.section.title')} ({reels.length})
                    </h3>
                  </div>
                  <ReelsCarousel reels={reels} />
                </div>
              )}

              <div>
                <div className="mb-2 flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h3>
                  {(item as any).status && (
                    <span
                      className={`inline-flex items-center self-start whitespace-nowrap rounded-full px-3 py-1 text-sm font-medium capitalize ${getStatusColor(
                        (item as any).status,
                      )}`}
                    >
                      {(item as any).status}
                    </span>
                  )}
                </div>
                <p className="text-base leading-relaxed text-gray-600 dark:text-gray-300">{desc}</p>
              </div>

              {publications.length > 0 && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-neutral-700 dark:bg-neutral-900/30">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    <Layers className="h-4 w-4" />
                    {t('campaigns.modal.view.associatedPublications')} (
                    <span className="font-bold">{publications.length}</span>)
                  </h3>
                  <div className="space-y-2">
                    {publications.map((pub: any) => {
                      if (!pub) return null;
                      return (
                        <div
                          key={pub.id}
                          className="flex items-center gap-3 rounded bg-white p-2 shadow-sm dark:bg-neutral-800"
                        >
                          {pub.media_files?.[0] ? (
                            <img
                              src={pub.media_files[0].file_path}
                              className="h-8 w-8 rounded object-cover"
                              alt={pub.title || 'Publication media'}
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded bg-gray-200">
                              <FileText className="h-4 w-4 text-gray-400" />
                            </div>
                          )}
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                            {pub.title || pub.name || 'Untitled'}
                          </span>

                          {pub.status === 'published' && <div className="ml-auto flex gap-1"></div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {(item as any).user && (
                <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-4 dark:bg-neutral-900/50">
                  <Avatar
                    src={(item as any).user.photo_url}
                    name={(item as any).user.name}
                    size="md"
                    className="flex-shrink-0"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                      {(item as any).user.name}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t('common.creator')}
                    </p>
                  </div>
                </div>
              )}

              {/* Tabs Navigation for Publications */}
              {isActuallyPublication && (
                <div className="mb-6 mt-8 border-b border-gray-200 dark:border-neutral-700">
                  <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {['overview', 'activity', 'approvals']
                      .filter((tab) => tab !== 'approvals' || canAccessApprovals)
                      .map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium capitalize ${
                            activeTab === tab
                              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                          } `}
                        >
                          {t(`common.tabs.${tab}`, tab)}
                        </button>
                      ))}
                  </nav>
                </div>
              )}

              <div className="mt-6">
                {/* Overview Content (Grid + Footer) */}
                {(!isActuallyPublication || activeTab === 'overview') && (
                  <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {(item as any).goal && (
                        <div className="rounded-lg bg-gray-50 p-4 dark:bg-neutral-900/50">
                          <div className="mb-2 flex items-center gap-2">
                            <Target className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                              {t('campaigns.modal.view.goal')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-900 dark:text-white">
                            {(item as any).goal}
                          </p>
                        </div>
                      )}

                      {(item as any).hashtags && (
                        <div className="rounded-lg bg-gray-50 p-4 dark:bg-neutral-900/50">
                          <div className="mb-2 flex items-center gap-2">
                            <Hash className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                              {t('campaigns.modal.view.hashtags')}
                            </span>
                          </div>
                          <div
                            className={`text-sm text-gray-900 dark:text-white ${
                              !hashtagsExpanded ? 'line-clamp-2' : ''
                            } cursor-pointer break-words transition-colors hover:text-primary-600 dark:hover:text-primary-400`}
                            onClick={() => setHashtagsExpanded(!hashtagsExpanded)}
                            title={hashtagsExpanded ? 'Click para contraer' : 'Click para expandir'}
                          >
                            {(item as any).hashtags}
                          </div>
                          {(item as any).hashtags.length > 100 && (
                            <button
                              onClick={() => setHashtagsExpanded(!hashtagsExpanded)}
                              className="mt-2 text-xs text-primary-600 hover:underline dark:text-primary-400"
                            >
                              {hashtagsExpanded ? 'Ver menos' : 'Ver más'}
                            </button>
                          )}
                        </div>
                      )}

                      {(item as any).start_date && (
                        <div className="rounded-lg bg-gray-50 p-4 dark:bg-neutral-900/50">
                          <div className="mb-2 flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                              {t('campaigns.modal.view.startDate')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-900 dark:text-white">
                            {formatDate((item as any).start_date)}
                          </p>
                        </div>
                      )}

                      {(item as any).end_date && (
                        <div className="rounded-lg bg-gray-50 p-4 dark:bg-neutral-900/50">
                          <div className="mb-2 flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                              {t('campaigns.modal.view.endDate')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-900 dark:text-white">
                            {formatDate((item as any).end_date)}
                          </p>
                        </div>
                      )}

                      {/* Published Posts - Show from both social_post_logs and scheduled_posts with status 'posted' */}
                      {(((item as any).social_post_logs && (item as any).social_post_logs.length > 0) ||
                        ((item as any).scheduled_posts && (item as any).scheduled_posts.some((p: any) => p.status === 'posted' || p.status === 'published'))) ? (
                        <div className="rounded-lg bg-gray-50 p-4 dark:bg-neutral-900/50 md:col-span-2">
                          <div className="mb-3 flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                              {t('publications.table.publishedOn', 'Publicado en')}
                            </span>
                          </div>

                          <div className="space-y-2">
                            {/* From social_post_logs */}
                            {(item as any).social_post_logs &&
                              (item as any).social_post_logs
                                .filter((log: any) => log.published_at || log.created_at)
                                .map((log: any, index: number) => {
                                  const publishDate = log.published_at || log.created_at;
                                  const platformName = log.social_account?.platform || log.platform || 'Social Network';
                                  const accountName = log.social_account?.account_name || log.account_name;
                                  
                                  return (
                                    <div
                                      key={`log-${log.id || index}`}
                                      className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900/30 dark:bg-green-900/10"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                                          <Calendar className="h-4 w-4 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold capitalize text-gray-900 dark:text-white">
                                              {platformName}
                                            </span>
                                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/50 dark:text-green-400">
                                              {t('publications.status.published')}
                                            </span>
                                          </div>
                                          {accountName && (
                                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                              @{accountName}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                          {formatDate(publishDate)}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                          {(() => {
                                            try {
                                              const date = new Date(publishDate);
                                              if (!isNaN(date.getTime())) {
                                                return date.toLocaleTimeString([], {
                                                  hour: '2-digit',
                                                  minute: '2-digit',
                                                });
                                              }
                                              return '';
                                            } catch {
                                              return '';
                                            }
                                          })()}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })}

                            {/* From scheduled_posts with status 'posted' or 'published' */}
                            {(item as any).scheduled_posts &&
                              (item as any).scheduled_posts
                                .filter((post: any) => post.status === 'posted' || post.status === 'published')
                                .map((post: any, index: number) => {
                                  const publishDate = post.published_at || post.scheduled_at;
                                  const platformName = post.social_account?.platform || post.platform || 'Social Network';
                                  const accountName = post.social_account?.account_name || post.account_name;
                                  
                                  return (
                                    <div
                                      key={`posted-${post.id || index}`}
                                      className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900/30 dark:bg-green-900/10"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                                          <Calendar className="h-4 w-4 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold capitalize text-gray-900 dark:text-white">
                                              {platformName}
                                            </span>
                                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/50 dark:text-green-400">
                                              {t('publications.status.published')}
                                            </span>
                                          </div>
                                          {accountName && (
                                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                              @{accountName}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                          {formatDate(publishDate)}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                          {(() => {
                                            try {
                                              const date = new Date(publishDate);
                                              if (!isNaN(date.getTime())) {
                                                return date.toLocaleTimeString([], {
                                                  hour: '2-digit',
                                                  minute: '2-digit',
                                                });
                                              }
                                              return '';
                                            } catch {
                                              return '';
                                            }
                                          })()}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })}
                          </div>
                        </div>
                      ) : null}

                      {(item as any).publish_date && (
                        <div className="rounded-lg bg-gray-50 p-4 dark:bg-neutral-900/50 md:col-span-2">
                          <div className="mb-2 flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                              {t('campaigns.modal.view.publishedOn')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-900 dark:text-white">
                            {formatDate((item as any).publish_date)}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-neutral-700 dark:bg-neutral-900/30">
                      <div className="flex flex-col items-start justify-between gap-2 text-xs sm:flex-row sm:items-center">
                        <span className="text-gray-500 dark:text-gray-400">
                          {t('campaigns.modal.view.created')}:{' '}
                          {formatDate((item as any).created_at)}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                          {t('campaigns.modal.view.lastUpdated')}:{' '}
                          {formatDate((item as any).updated_at)}
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {/* Activity Tab */}
                {activeTab === 'activity' && isActuallyPublication && (
                  <div className="max-h-96 overflow-y-auto pr-2">
                    <ActivityList activities={(item as any).activities || []} />
                  </div>
                )}

                {/* Approvals Tab */}
                {activeTab === 'approvals' && isActuallyPublication && (
                  <div className="max-h-[500px] space-y-6 overflow-y-auto pr-2">
                    {/* Current Workflow Progress */}
                    {(item as any).status === 'pending_review' &&
                      (item as any).currentApprovalStep?.workflow && (
                        <div className="rounded-lg border border-primary-200 bg-gradient-to-br from-primary-50 to-blue-50 p-4 dark:border-primary-800 dark:from-primary-900/20 dark:to-blue-900/20">
                          <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-primary-900 dark:text-primary-300">
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                              />
                            </svg>
                            {t('approvals.workflow_progress') || 'Progreso del Flujo Actual'}
                          </h4>
                          <div className="space-y-2">
                            {(item as any).currentApprovalStep.workflow.steps?.map(
                              (step: any, index: number) => {
                                const isCurrent = step.id === (item as any).currentApprovalStep?.id;
                                const isPast =
                                  step.level_number <
                                  ((item as any).currentApprovalStep?.level_number || 0);

                                return (
                                  <div
                                    key={step.id}
                                    className={`flex items-center gap-3 rounded-lg p-3 transition-all ${
                                      isCurrent
                                        ? 'border-2 border-primary-400 bg-primary-100 shadow-sm dark:border-primary-600 dark:bg-primary-900/40'
                                        : isPast
                                          ? 'border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                                          : 'border border-gray-200 bg-white/50 dark:border-neutral-700 dark:bg-neutral-800/50'
                                    }`}
                                  >
                                    <div
                                      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                                        isCurrent
                                          ? 'bg-primary-500 text-white ring-2 ring-primary-300 dark:ring-primary-700'
                                          : isPast
                                            ? 'bg-green-500 text-white'
                                            : 'bg-gray-300 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                                      }`}
                                    >
                                      {isPast ? '✓' : index + 1}
                                    </div>
                                    <div className="flex-1">
                                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {step.name}
                                      </div>
                                      <div className="text-xs text-gray-600 dark:text-gray-400">
                                        {step.role?.name || 'Sin rol asignado'}
                                      </div>
                                    </div>
                                    {isCurrent && (
                                      <span className="rounded-full bg-primary-200 px-2 py-1 text-xs font-bold text-primary-600 dark:bg-primary-800 dark:text-primary-400">
                                        {t('approvals.in_progress') || 'En Proceso'}
                                      </span>
                                    )}
                                    {isPast && (
                                      <span className="text-xs font-bold text-green-600 dark:text-green-400">
                                        ✓ {t('common.completed') || 'Completado'}
                                      </span>
                                    )}
                                  </div>
                                );
                              },
                            )}
                          </div>
                        </div>
                      )}

                    {/* Workflow Completed */}
                    {(item as any).status === 'approved' &&
                      (item as any).currentApprovalStep?.workflow && (
                        <div className="rounded-lg border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-4 dark:border-green-800 dark:from-green-900/20 dark:to-emerald-900/20">
                          <div className="mb-3 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500">
                              <svg
                                className="h-6 w-6 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-green-900 dark:text-green-300">
                                {t('approvals.approved_ready_to_publish') ||
                                  '¡Flujo Completado y Aprobado!'}
                              </h4>
                              <p className="text-xs text-green-700 dark:text-green-400">
                                {t('approvals.next_action.ready_to_publish') ||
                                  'La publicación ha sido aprobada y está lista para publicarse'}
                              </p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {(item as any).currentApprovalStep.workflow.steps?.map(
                              (step: any, index: number) => (
                                <div
                                  key={step.id}
                                  className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-2 dark:border-green-800 dark:bg-green-900/20"
                                >
                                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-xs font-bold text-white">
                                    ✓
                                  </div>
                                  <div className="flex-1">
                                    <div className="text-xs font-semibold text-gray-900 dark:text-white">
                                      {step.name}
                                    </div>
                                    <div className="text-[10px] text-gray-600 dark:text-gray-400">
                                      {step.role?.name || 'Sin rol asignado'}
                                    </div>
                                  </div>
                                  <span className="text-[10px] font-bold text-green-600 dark:text-green-400">
                                    ✓ {t('common.completed') || 'Completado'}
                                  </span>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      )}

                    {/* Approval History */}
                    {(item as any).approval_logs && (item as any).approval_logs.length > 0 && (
                      <div>
                        <ApprovalHistorySection
                          logs={(item as any).approval_logs || []}
                          workflow={
                            (item as any).approval_request?.workflow ||
                            (item as any).currentApprovalStep?.workflow
                          }
                          currentStepNumber={
                            (item as any).approval_request?.current_step?.level_number ||
                            (item as any).currentApprovalStep?.level_number
                          }
                          approvalStatus={(item as any).approval_request?.status}
                        />
                      </div>
                    )}

                    {/* No approvals */}
                    {!(item as any).approval_logs?.length &&
                      (item as any).status !== 'pending_review' &&
                      (item as any).status !== 'approved' && (
                        <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                          <p>{t('approvals.noHistory') || 'No hay historial de aprobaciones'}</p>
                        </div>
                      )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-shrink-0 justify-end gap-3 border-t border-gray-100 p-6 dark:border-neutral-700">
            <Button
              onClick={onClose}
              variant="secondary"
              buttonStyle="solid"
              size="lg"
            >
              {t('common.close')}
            </Button>
            {onEdit && canEdit && (
              <Button
                onClick={() => {
                  onClose();
                  onEdit(item);
                }}
                variant="primary"
                buttonStyle="gradient"
                size="lg"
                icon={Edit}
              >
                {t('common.editInPanel')}
              </Button>
            )}
          </div>
        </DialogPanel>
      </div>
      
      <MediaLightbox
        isOpen={!!lightboxMedia}
        onClose={() => setLightboxMedia(null)}
        media={lightboxMedia}
        initialIndex={lightboxIndex}
      />
    </Dialog>
  );
}
