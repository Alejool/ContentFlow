import CampaignTags from '@/Components/Content/Publication/CampaignTags';
import PublicationThumbnail from '@/Components/Content/Publication/PublicationThumbnail';
import SocialAccountsDisplay from '@/Components/Content/Publication/SocialAccountsDisplay';
import { Publication } from '@/types/Publication';
import { usePage } from '@inertiajs/react';
import { Copy, Edit, Eye, Image, Repeat, Rocket, Trash2, Video } from 'lucide-react';

interface PublicationRowProps {
  item: Publication;
  t: (key: string) => string;
  connectedAccounts: any[];
  getStatusColor: (status?: string) => string;
  onEdit: (item: Publication) => void;
  onDelete: (id: number) => void;
  onPublish: (item: Publication) => void;
  onEditRequest?: (item: Publication) => void;
  onViewDetails?: (item: Publication) => void;
  onDuplicate?: (id: number) => void;
}

export default function PublicationRow({
  item,
  t,
  connectedAccounts,
  getStatusColor,
  onEdit,
  onDelete,
  onPublish,
  onEditRequest,
  onViewDetails,
  onDuplicate,
}: PublicationRowProps) {
  const { auth } = usePage<any>().props;
  const canManageContent = auth.current_workspace?.permissions?.includes('manage-content');

  const countMediaFiles = (pub: Publication) => {
    if (!pub.media_files || pub.media_files.length === 0) {
      return { images: 0, videos: 0, total: 0 };
    }
    const images = pub.media_files.filter((f) => f.file_type.includes('image')).length;
    const videos = pub.media_files.filter((f) => f.file_type.includes('video')).length;
    return { images, videos, total: pub.media_files.length };
  };

  const mediaCount = countMediaFiles(item);

  return (
    <tr className="group transition-colors hover:bg-gray-50/50 dark:hover:bg-neutral-700/30">
      <td className="px-2 py-4 text-center"></td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-100 dark:border-neutral-700 dark:bg-neutral-800">
            <PublicationThumbnail publication={item} />
          </div>
          <div>
            <h3 className="flex items-center gap-1.5 text-sm font-medium text-gray-900 dark:text-white">
              {item.title || 'Untitled'}
              {item.is_recurring && (
                <span
                  title={t('publications.recurring') || 'Recurrente'}
                  className="flex items-center"
                >
                  <Repeat className="h-3.5 w-3.5 text-primary-500" />
                </span>
              )}
            </h3>
            <p className="mt-0.5 line-clamp-1 text-xs text-gray-500 dark:text-gray-400">
              {item.description || 'No description'}
            </p>
            {item.platform_settings &&
              typeof item.platform_settings === 'object' &&
              !Array.isArray(item.platform_settings) &&
              Object.keys(item.platform_settings).length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {Object.entries(item.platform_settings).map(
                    ([platform, settings]: [string, any]) => {
                      if (!settings) return null;

                      // For Twitter polls/threads
                      if (platform === 'twitter' && settings.type) {
                        return (
                          <span
                            key={platform}
                            className="inline-flex items-center rounded border border-sky-200 bg-sky-100 px-1.5 py-0.5 text-[10px] font-medium text-sky-800 dark:border-sky-800 dark:bg-sky-900/30 dark:text-sky-400"
                          >
                            Twitter:{' '}
                            {settings.type === 'poll'
                              ? 'Poll'
                              : settings.type === 'thread'
                                ? 'Thread'
                                : 'Tweet'}
                          </span>
                        );
                      }
                      if (platform === 'youtube' && settings.type) {
                        return (
                          <span
                            key={platform}
                            className="inline-flex items-center rounded border border-red-200 bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400"
                          >
                            YouTube: {settings.type === 'short' ? 'Short' : 'Video'}
                          </span>
                        );
                      }

                      // For Facebook Reels
                      if (platform === 'facebook' && settings.type) {
                        return (
                          <span
                            key={platform}
                            className="inline-flex items-center rounded border border-blue-200 bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-800 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                          >
                            FB: {settings.type === 'reel' ? 'Reel' : 'Post'}
                          </span>
                        );
                      }

                      return null;
                    },
                  )}
                </div>
              )}
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${getStatusColor(
            item.status,
          )}`}
        >
          {t(`publications.status.${item.status || 'draft'}`)}
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-gray-500">
        <span>{mediaCount.total} files</span>
        {mediaCount.images > 0 && (
          <span className="ml-2 flex items-center text-xs">
            <Image className="mr-1 h-3 w-3" /> {mediaCount.images}
          </span>
        )}
        {mediaCount.videos > 0 && (
          <span className="ml-2 flex items-center text-xs">
            <Video className="mr-1 h-3 w-3" /> {mediaCount.videos}
          </span>
        )}
      </td>
      <td className="px-6 py-4">
        <CampaignTags publication={item} t={t} />
      </td>
      <td className="px-6 py-4">
        <SocialAccountsDisplay publication={item} connectedAccounts={connectedAccounts} />
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          {onViewDetails && (
            <button
              onClick={() => onViewDetails(item)}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/20"
              title="Ver detalles"
            >
              <Eye className="h-4 w-4" />
            </button>
          )}
          {canManageContent && (
            <>
              <button
                onClick={() => onPublish(item)}
                className="rounded-lg p-2 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20"
                title="Publish / Manage Platforms"
              >
                <Rocket className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  if (onEditRequest) {
                    onEditRequest(item);
                  } else {
                    onEdit(item);
                  }
                }}
                className={`p-2 ${
                  item.status === 'published' ? 'text-amber-500' : 'text-blue-500'
                } rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20`}
                title={item.status === 'published' ? 'Unpublish to Edit' : 'Edit'}
              >
                <Edit className="h-4 w-4" />
              </button>
              {onDuplicate && (
                <button
                  onClick={() => onDuplicate(item.id)}
                  className="rounded-lg p-2 text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                  title="Duplicar"
                >
                  <Copy className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => onDelete(item.id)}
                className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                title="Eliminar"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
