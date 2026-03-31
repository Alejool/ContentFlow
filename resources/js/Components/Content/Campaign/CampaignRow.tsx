import type { Campaign } from '@/types/Campaign';
import { usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { getDateFnsLocale } from '@/Utils/dateLocales';
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  Copy,
  DollarSign,
  Edit,
  Eye,
  Layers,
  Target,
  Trash2,
} from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

interface CampaignRowProps {
  item: Campaign;
  expandedCampaigns: number[];
  toggleExpand: (id: number) => void;
  getStatusColor: (status?: string) => string;
  onEdit: (item: Campaign) => void;
  onDelete: (id: number) => void;
  onEditRequest?: (item: Campaign) => void;
  onViewDetails: (item: Campaign) => void;
  onDuplicate?: (id: number) => void;
}

const CampaignRow = memo(
  ({
    item,
    expandedCampaigns,
    toggleExpand,
    getStatusColor,
    onEdit,
    onDelete,
    onEditRequest,
    onViewDetails,
    onDuplicate,
  }: CampaignRowProps) => {
    const { t, i18n } = useTranslation();
    const locale = getDateFnsLocale(i18n.language);
    const { auth } = usePage<any>().props;
    const canManage = auth.current_workspace?.permissions?.includes('manage-content');
    return (
      <tr
        data-campaign-id={item.id}
        className={`group transition-colors hover:bg-gray-50/50 dark:hover:bg-neutral-700/30 ${
          expandedCampaigns.includes(item.id) ? 'bg-gray-50 dark:bg-neutral-800' : ''
        }`}
      >
        <td className="px-2 py-4 text-center">
          <button
            data-expand="true"
            data-expanded={expandedCampaigns.includes(item.id) ? 'true' : 'false'}
            onClick={() => toggleExpand(item.id)}
            className="rounded-full p-1 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
          >
            {expandedCampaigns.includes(item.id) ? (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            )}
          </button>
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-100 dark:border-neutral-700 dark:bg-neutral-800">
              <Layers className="h-6 w-6 text-gray-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-medium text-gray-900 dark:text-white">
                {item.name}
              </h3>
              <p className="mt-0.5 max-w-md truncate text-xs text-gray-500 dark:text-gray-400">
                {item.description && item.description.length > 80
                  ? `${item.description.substring(0, 80)}...`
                  : item.description || 'No description'}
              </p>

              {/* Goal & Dates */}
              <div className="mt-1.5 flex flex-wrap items-center gap-3">
                {(item.start_date || item.end_date) && (
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <Calendar className="h-3 w-3" />
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
                )}
                {item.goal && (
                  <div className="flex items-center gap-1 rounded bg-gray-50 px-1.5 py-0.5 text-xs text-gray-500 dark:bg-white/5 dark:text-gray-400">
                    <Target className="h-3 w-3 text-primary-500" />
                    <span className="max-w-[150px] truncate">{item.goal}</span>
                  </div>
                )}
                {item.budget && (
                  <div className="flex items-center gap-1 rounded bg-green-50 px-1.5 py-0.5 text-xs text-gray-500 dark:bg-green-900/10 dark:text-gray-400">
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
            </div>
          </div>
        </td>
        <td className="px-6 py-4">
          {item.user && (
            <div className="flex items-center">
              <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-gray-200 dark:bg-neutral-700">
                {item.user.photo_url ? (
                  <img
                    src={item.user.photo_url}
                    alt={item.user.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs font-medium uppercase text-gray-500">
                    {item.user.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="ml-3">
                <p className="max-w-[120px] truncate text-sm font-medium text-gray-900 dark:text-white">
                  {item.user.name}
                </p>
              </div>
            </div>
          )}
        </td>
        <td className="px-6 py-4">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusColor(
              item.status,
            )}`}
          >
            {t(`campaigns.filters.${item.status || 'active'}`)}
          </span>
        </td>
        <td className="px-6 py-4 text-sm text-gray-500">
          <span className="whitespace-nowrap">{item.publications?.length || 0} items</span>
        </td>
        <td className="px-6 py-4 text-right">
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => onViewDetails(item)}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/20"
              title="View Details"
            >
              <Eye className="h-4 w-4" />
            </button>
            {canManage && (
              <>
                <button
                  onClick={() => {
                    if (onEditRequest) {
                      onEditRequest(item);
                    } else {
                      onEdit(item);
                    }
                  }}
                  className={`rounded-lg p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20`}
                  title="Edit"
                >
                  <Edit className="h-4 w-4" />
                </button>
                {onDuplicate && (
                  <button
                    onClick={() => onDuplicate(item.id)}
                    className="rounded-lg p-2 text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                    title="Duplicate"
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
  },
);

export default CampaignRow;
