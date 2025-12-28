import {
  ChevronDown,
  ChevronRight,
  Edit,
  Trash2,
  Eye,
  Layers,
} from "lucide-react";
import { Campaign } from "@/types/Campaign";

interface CampaignRowProps {
  item: Campaign;
  expandedCampaigns: number[];
  toggleExpand: (id: number) => void;
  getStatusColor: (status?: string) => string;
  onEdit: (item: Campaign) => void;
  onDelete: (id: number) => void;
  onEditRequest?: (item: Campaign) => void;
  onViewDetails: (item: Campaign) => void;
}

export default function CampaignRow({
  item,
  expandedCampaigns,
  toggleExpand,
  getStatusColor,
  onEdit,
  onDelete,
  onEditRequest,
  onViewDetails,
}: CampaignRowProps) {
  return (
    <tr
      data-campaign-id={item.id}
      className={`group transition-colors hover:bg-gray-50/50 dark:hover:bg-neutral-700/30 ${expandedCampaigns.includes(item.id) ? "bg-gray-50 dark:bg-neutral-800" : ""
        }`}
    >
      <td className="px-2 py-4 text-center">
        <button
          data-expand="true"
          data-expanded={expandedCampaigns.includes(item.id) ? "true" : "false"}
          onClick={() => toggleExpand(item.id)}
          className="p-1 rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/10"
        >
          {expandedCampaigns.includes(item.id) ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          )}
        </button>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-lg flex-shrink-0 border border-gray-200 bg-gray-100 dark:border-neutral-700 dark:bg-neutral-800 overflow-hidden flex items-center justify-center"
          >
            <Layers className="w-6 h-6 text-gray-400" />
          </div>
          <div>
            <h3
              className="font-medium text-sm text-gray-900 dark:text-white"
            >
              {item.name}
            </h3>
            <p
              className="text-xs mt-0.5 line-clamp-1 text-gray-500 dark:text-gray-400"
            >
              {item.description || "No description"}
            </p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        {item.user && (
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-neutral-700 overflow-hidden flex-shrink-0">
              {item.user.photo_url ? (
                <img src={item.user.photo_url} alt={item.user.name} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-xs font-medium text-gray-500 uppercase">
                  {item.user.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{item.user.name}</p>
            </div>
          </div>
        )}
      </td>
      <td className="px-6 py-4">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(
            item.status
          )}`}
        >
          {item.status || "Draft"}
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-gray-500">
        <span>
          {item.publications_count || item.publications?.length || 0} items
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => onViewDetails(item)}
            className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg dark:hover:bg-gray-700/20"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (onEditRequest) {
                onEditRequest(item);
              } else {
                onEdit(item);
              }
            }}
            className={`p-2 text-blue-500 hover:bg-blue-50 rounded-lg dark:hover:bg-blue-900/20`}
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="p-2 text-red-500 hover:bg-red-50 rounded-lg dark:hover:bg-red-900/20"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
