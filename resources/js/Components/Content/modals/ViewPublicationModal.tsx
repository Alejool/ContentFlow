import Button from '@/Components/common/Modern/Button';
import TabNavigation from '@/Components/common/TabNavigation';
import MediaLightbox from '@/Components/common/ui/MediaLightbox';
import MediaPreviewButton from '@/Components/common/ui/MediaPreviewButton';
import ActivityList from '@/Components/Content/ActivityList';
import ApprovalsTab from '@/Components/Content/modals/ViewPublicationModal/ApprovalsTab';
import AssociatedPublicationsList from '@/Components/Content/modals/ViewPublicationModal/AssociatedPublicationsList';
import CampaignOverviewTab from '@/Components/Content/modals/ViewPublicationModal/CampaignOverviewTab';
import CreatorInfo from '@/Components/Content/modals/ViewPublicationModal/CreatorInfo';
import PublicationHeader from '@/Components/Content/modals/ViewPublicationModal/PublicationHeader';
import ReelsSection from '@/Components/Content/modals/ViewPublicationModal/ReelsSection';
import { usePublicationStore } from '@/stores/publicationStore';
import { Campaign } from '@/types/Campaign';
import { Publication } from '@/types/Publication';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { usePage } from '@inertiajs/react';
import { Edit, FileText, Layers, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ViewPublicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: Campaign | Publication | null;
  onEdit?: (item: Campaign | Publication) => void;
}

export default function ViewPublicationModal({
  isOpen,
  onClose,
  campaign: initialItem,
  onEdit,
}: ViewPublicationModalProps) {
  const { t } = useTranslation();
  const { auth } = usePage<any>().props;
  const [activeTab, setActiveTab] = useState('overview');
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

  // Publication tabs
  const publicationTabs = [
    { key: 'overview', label: t('common.tabs.overview', 'overview') },
    { key: 'activity', label: t('common.tabs.activity', 'activity') },
    ...(canAccessApprovals
      ? [{ key: 'approvals', label: t('common.tabs.approvals', 'approvals') }]
      : []),
  ];

  return (
    <Dialog open={isOpen} onClose={onClose} className='relative z-50'>
      <div className='fixed inset-0 bg-black/30 backdrop-blur-sm' aria-hidden='true' />

      <div className='fixed inset-0 flex items-center justify-center p-4'>
        <DialogPanel className='flex max-h-[90vh] w-full max-w-3xl flex-col rounded-lg border border-gray-200/50 bg-gradient-to-br from-white to-gray-50 shadow-2xl dark:border-neutral-800/50 dark:from-neutral-900 dark:to-neutral-950'>
          <div className='flex flex-shrink-0 items-center justify-between border-b border-gray-100 p-6 dark:border-neutral-700'>
            <DialogTitle className='flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white'>
              {isActuallyPublication ? (
                <FileText className='h-6 w-6 text-primary-500' />
              ) : (
                <Layers className='h-6 w-6 text-primary-500' />
              )}
              {isActuallyPublication
                ? t('publications.modal.show.title')
                : t('campaigns.modal.view.title')}
            </DialogTitle>
            <Button
              onClick={onClose}
              buttonStyle='icon'
              variant='ghost'
              size='lg'
              icon={X}
              aria-label={t('common.close', 'Close')}
            >
              <span className='sr-only'>{t('common.close', 'Close')}</span>
            </Button>
          </div>

          <div className='flex-1 overflow-y-auto p-6'>
            <div className='space-y-6'>
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
                  height='h-64'
                />
              )}

              <ReelsSection reels={reels} />

              <PublicationHeader
                title={title}
                description={desc}
                status={(item as any).status}
              />

              <AssociatedPublicationsList publications={publications} />

              <CreatorInfo user={(item as any).user} />

              {/* Tabs Navigation for Publications */}
              {isActuallyPublication && (
                <TabNavigation
                  tabs={publicationTabs}
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  className='mb-6 mt-8'
                />
              )}

              <div className='mt-6'>
                {/* Overview Content */}
                {(!isActuallyPublication || activeTab === 'overview') && (
                  <CampaignOverviewTab item={item} />
                )}

                {/* Activity Tab */}
                {activeTab === 'activity' && isActuallyPublication && (
                  <div className='max-h-96 overflow-y-auto pr-2'>
                    <ActivityList activities={(item as any).activities || []} />
                  </div>
                )}

                {/* Approvals Tab */}
                {activeTab === 'approvals' && isActuallyPublication && (
                  <ApprovalsTab item={item} />
                )}
              </div>
            </div>
          </div>

          <div className='flex flex-shrink-0 justify-end gap-3 border-t border-gray-100 p-6 dark:border-neutral-700'>
            <Button
              onClick={onClose}
              variant='ghost'
              buttonStyle='ghost'
              size='lg'
            >
              {t('common.close')}
            </Button>
            {onEdit && canEdit && (
              <Button
                onClick={() => {
                  onClose();
                  onEdit(item);
                }}
                variant='primary'
                size='lg'
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
