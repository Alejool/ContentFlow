import { Campaign } from "@/types/Campaign";
import { usePage } from "@inertiajs/react";
import { format } from "date-fns";
import { getDateFnsLocale } from "@/Utils/dateLocales";
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
} from "lucide-react";
import { memo } from "react";
import { useTranslation } from "react-i18next";
import Button from "@/Components/common/Modern/Button";

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
     const canManage =
      auth.current_workspace?.permissions?.includes("manage-content");
    return (
      <tr
        data-campaign-id={item.id}
        className={`group transition-colors hover:bg-gray-50/50 dark:hover:bg-neutral-700/30 ${
          expandedCampaigns.includes(item.id)
            ? "bg-gray-50 dark:bg-neutral-800"
            : ""
        }`}
      >
        <td className="px-2 py-4 text-center">
          <Button
            data-expand="true"
            data-expanded={
              expandedCampaigns.includes(item.id) ? "true" : "false"
            }
            onClick={() => toggleExpand(item.id)}
            variant="ghost"
            buttonStyle="icon"
            size="lg"
            className="p-1 rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/10"
            icon={expandedCampaigns.includes(item.id) ? ChevronDown : ChevronRight}
          >
            
          </Button>
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg flex-shrink-0 border border-gray-200 bg-gray-100 dark:border-neutral-700 dark:bg-neutral-800 overflow-hidden flex items-center justify-center">
              <Layers className="w-6 h-6 text-gray-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-sm text-gray-900 dark:text-white truncate">
                {item.name}
              </h3>
              <p className="text-xs mt-0.5 text-gray-500 dark:text-gray-400 truncate max-w-md">
                {item.description && item.description.length > 80
                  ? `${item.description.substring(0, 80)}...`
                  : item.description || "No description"}
              </p>

              {/* Goal & Dates */}
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                {(item.start_date || item.end_date) && (
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {item.start_date
                        ? format(new Date(item.start_date), "d MMM", {
                            locale,
                          })
                        : "..."}
                      {" - "}
                      {item.end_date
                        ? format(new Date(item.end_date), "d MMM yyyy", {
                            locale,
                          })
                        : "..."}
                    </span>
                  </div>
                )}
                {item.goal && (
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/5 px-1.5 py-0.5 rounded">
                    <Target className="w-3 h-3 text-primary-500" />
                    <span className="truncate max-w-[150px]">{item.goal}</span>
                  </div>
                )}
                {item.budget && (
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 bg-green-50 dark:bg-green-900/10 px-1.5 py-0.5 rounded">
                    <DollarSign className="w-3 h-3 text-green-600 dark:text-green-400" />
                    <span>
                      {new Intl.NumberFormat("es-ES", {
                        style: "currency",
                        currency: "USD",
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
              <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-neutral-700 overflow-hidden flex-shrink-0">
                {item.user.photo_url ? (
                  <img
                    src={item.user.photo_url}
                    alt={item.user.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-xs font-medium text-gray-500 uppercase">
                    {item.user.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[120px]">
                  {item.user.name}
                </p>
              </div>
            </div>
          )}
        </td>
        <td className="px-6 py-4">
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(
              item.status,
            )}`}
          >
            {t(`campaigns.filters.${item.status || "active"}`)}
          </span>
        </td>
        <td className="px-6 py-4 text-sm text-gray-500">
          <span className="whitespace-nowrap">
            {item.publications?.length || 0} items
          </span>
        </td>
        <td className="px-6 py-4 text-right">
          <div className="flex items-center justify-end gap-2">
            <Button
              onClick={() => onViewDetails(item)}
              variant="ghost"
              buttonStyle="icon"
              size="lg"
              className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg dark:hover:bg-gray-700/20"
              title="View Details"
              icon={Eye}
            >
              
            </Button>
            {canManage && (
              <>
                <Button
                  onClick={() => {
                    if (onEditRequest) {
                      onEditRequest(item);
                    } else {
                      onEdit(item);
                    }
                  }}
                  variant="ghost"
                  buttonStyle="icon"
                  size="lg"
                  className={`p-2 text-blue-500 hover:bg-blue-50 rounded-lg dark:hover:bg-blue-900/20`}
                  title="Edit"
                  icon={Edit}
                >
                  
                </Button>
                {onDuplicate && (
                  <Button
                    onClick={() => onDuplicate(item.id)}
                    variant="ghost"
                    buttonStyle="icon"
                    size="lg"
                    className="p-2 text-purple-500 hover:bg-purple-50 rounded-lg dark:hover:bg-purple-900/20"
                    title="Duplicate"
                    icon={Copy}
                  >
                    
                  </Button>
                )}
                <Button
                  onClick={() => onDelete(item.id)}
                  variant="ghost"
                  buttonStyle="icon"
                  size="lg"
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg dark:hover:bg-red-900/20"
                  title="Eliminar"
                  icon={Trash2}
                >
                  
                </Button>
              </>
            )}
          </div>
        </td>
      </tr>
    );
  },
);

export default CampaignRow;
