import { Campaign } from '@/types/Campaign';
import { usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { getDateFnsLocale } from '@/Utils/dateLocales';
import { useTranslation } from 'react-i18next';
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  Copy,
  DollarSign,
  Edit,
  Eye,
  Target,
  Trash2,
} from 'lucide-react';

import PublicationThumbnail from '@/Components/Content/Publication/PublicationThumbnail';

interface CampaignMobileTableProps {
  items: Campaign[];
  t: (key: string) => string;
  expandedCampaigns: number[];
  toggleExpand: (id: number) => void;
  onEdit: (item: Campaign) => void;
  onDelete: (id: number) => void;
  onEditRequest?: (item: Campaign) => void;
  onViewDetails: (item: Campaign) => void;
  onDuplicate?: (id: number) => void;
  getStatusColor: (status?: string) => string;
}

export default function CampaignMobileTable({
  items,
  t,
  expandedCampaigns,
  toggleExpand,
  onEdit,
  onDelete,
  onEditRequest,
  onViewDetails,
  onDuplicate,
  getStatusColor,
}: CampaignMobileTableProps) {
  const { auth } = usePage<any>().props;
  const canManageContent = auth.current_workspace?.permissions?.includes('manage-content');

  const { i18n } = useTranslation();
  const locale = getDateFnsLocale(i18n.language);

  return (
    <div className="lg:hidden">
      <div className="m-2 flex flex-col gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-lg border border-gray-200 bg-white dark:border-neutral-700 dark:bg-neutral-800"
          >
            <div className="p-4">
              <div className="mb-2 flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">{item.name}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
                    {item.description && item.description.length > 100
                      ? `${item.description.substring(0, 100)}...`
                      : item.description || 'Sin descripción'}
                  </p>
                </div>
                <div
                  className={`whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-medium sm:text-xs ${getStatusColor(
                    item.status,
                  )}`}
                >
                  {t(`campaigns.filters.${item.status || 'active'}`)}
                </div>
              </div>

              {/* Goal & Budget */}
              {(item.goal || item.budget) && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {item.goal && (
                    <div className="flex items-center gap-1 rounded-md bg-gray-50 px-2 py-1 text-xs text-gray-500 dark:bg-neutral-900/50 dark:text-gray-400">
                      <Target className="h-3 w-3 text-primary-500" />
                      <span className="line-clamp-1">{item.goal}</span>
                    </div>
                  )}
                  {item.budget && (
                    <div className="flex items-center gap-1 rounded-md bg-green-50 px-2 py-1 text-xs text-gray-500 dark:bg-green-900/10 dark:text-gray-400">
                      <DollarSign className="h-3 w-3 text-green-600 dark:text-green-400" />
                      <span>
                        {new Intl.NumberFormat('es-ES', {
                          style: 'currency',
                          currency: 'USD',
                        }).format(item.budget)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="mb-3 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {item.start_date
                      ? format(new Date(item.start_date), 'd MMM', {
                          locale,
                        })
                      : '...'}
                    {' - '}
                    {item.end_date
                      ? format(new Date(item.end_date), 'd MMM yyyy', {
                          locale,
                        })
                      : '...'}
                  </span>
                </div>
                {item.publications && item.publications.length > 0 && (
                  <>
                    <span>•</span>
                    <span>{item.publications.length} publications</span>
                  </>
                )}
              </div>

              <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-2 dark:border-neutral-700/50">
                <div className="min-w-[140px] flex-1">
                  {(item.publications?.length || 0) > 0 ? (
                    <button
                      onClick={() => toggleExpand(item.id)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase transition-all active:scale-95 ${
                        expandedCampaigns.includes(item.id)
                          ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-200 dark:bg-primary-900/40 dark:text-primary-400 dark:ring-primary-800'
                          : 'bg-gray-50 text-gray-600 ring-1 ring-gray-100 hover:bg-gray-100 dark:bg-neutral-800 dark:text-gray-300 dark:ring-neutral-700 dark:hover:bg-neutral-700'
                      }`}
                    >
                      {expandedCampaigns.includes(item.id) ? (
                        <>
                          <ChevronDown className="h-3 w-3" />
                          {t('campaigns.actions.hidePublications')}
                        </>
                      ) : (
                        <>
                          <ChevronRight className="h-3 w-3" />
                          {t('campaigns.actions.showPublications')}
                          <span className="ml-0.5 opacity-60">({item.publications?.length})</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="h-8" />
                  )}
                </div>

                <div className="flex items-center gap-1.5 rounded-lg border border-gray-100 bg-gray-50/50 p-1 dark:border-neutral-700/50 dark:bg-neutral-800/30">
                  <button
                    onClick={() => onViewDetails(item)}
                    className="rounded-lg p-2 text-gray-500 transition-all hover:bg-white hover:text-primary-600 dark:hover:bg-neutral-800 dark:hover:text-primary-400"
                    title={t('common.view')}
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  {canManageContent && (
                    <>
                      <button
                        onClick={() => onDuplicate?.(item.id)}
                        className="rounded-lg p-2 text-purple-500 transition-all hover:bg-white dark:hover:bg-neutral-800"
                        title="Duplicar"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onEdit(item)}
                        className="rounded-lg p-2 text-blue-500 transition-all hover:bg-white dark:hover:bg-neutral-800"
                        title={t('common.edit')}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDelete(item.id)}
                        className="rounded-lg p-2 text-rose-500 transition-all hover:bg-white dark:hover:bg-neutral-800"
                        title={t('common.delete')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {expandedCampaigns.includes(item.id) &&
              item.publications &&
              item.publications.length > 0 && (
                <div className="border-t border-gray-200 p-4 dark:border-neutral-700">
                  <div className="mb-3 border-l-2 border-primary-500 pl-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {t('campaigns.modal.view.associatedPublications')}
                  </div>
                  <div className="space-y-2">
                    {item.publications.map((pub) => (
                      <div
                        key={pub.id}
                        className="flex items-center justify-between rounded bg-gray-50 p-3 dark:bg-neutral-700/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded border border-gray-200 bg-gray-100 dark:border-neutral-600 dark:bg-neutral-800">
                              <PublicationThumbnail publication={pub} />
                            </div>
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                              {pub.title}
                            </div>
                            <div className="text-xs text-gray-500">
                              {pub.created_at
                                ? format(new Date(pub.created_at), 'MMM d, yyyy')
                                : 'N/A'}
                            </div>
                          </div>
                        </div>
                        <div
                          className={`flex-shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-medium ${getStatusColor(
                            pub.status,
                          )}`}
                        >
                          {t(`publications.status.${pub.status || 'draft'}`)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        ))}
      </div>
    </div>
  );
}
