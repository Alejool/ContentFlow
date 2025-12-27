import { Campaign } from "@/types/Campaign";
import { format } from "date-fns";
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  Edit,
  Eye,
  Trash2,
} from "lucide-react";

import PublicationThumbnail from "@/Components/ManageContent/Publication/PublicationThumbnail";

interface CampaignMobileTableProps {
  items: Campaign[];
  t: (key: string) => string;
  expandedCampaigns: number[];
  toggleExpand: (id: number) => void;
  onEdit: (item: Campaign) => void;
  onDelete: (id: number) => void;
  onEditRequest?: (item: Campaign) => void;
  onViewDetails: (item: Campaign) => void;
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
  getStatusColor,
}: CampaignMobileTableProps) {

  console.log('items: ', items);
  return (
    <div className="lg:hidden">
      <div className="flex flex-col gap-3 m-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-lg border bg-white border-gray-200 dark:bg-neutral-800 dark:border-neutral-700"
          >
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                    {item.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {item.description}
                  </p>
                </div>
                <div
                  className={`text-xs px-2 py-1 rounded-full ${getStatusColor(
                    item.status
                  )}`}
                >
                  {item.status}
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {item.start_date ? format(new Date(item.start_date), "MMM d, yyyy") : "N/A"}
                  </span>
                </div>
                {item.publications && item.publications.length > 0 && (
                  <>
                    <span>•</span>
                    <span>{item.publications.length} publications</span>
                  </>
                )}
              </div>

              <div className="flex items-center justify-between">
                {(item.publications?.length || 0) > 0 ? (
                  <button
                    onClick={() => toggleExpand(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${expandedCampaigns.includes(item.id)
                      ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-neutral-700 dark:text-gray-300 dark:hover:bg-neutral-600"
                      }`}
                  >
                    {expandedCampaigns.includes(item.id) ? (
                      <>
                        <ChevronDown className="w-3.5 h-3.5" />
                        {t("campaigns.actions.hidePublications")}
                      </>
                    ) : (
                      <>
                        <ChevronRight className="w-3.5 h-3.5" />
                        {t("campaigns.actions.showPublications")}
                        <span className="ml-0.5 opacity-75">
                          ({item.publications?.length})
                        </span>
                      </>
                    )}
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onViewDetails(item)}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded"
                    title={t("common.view")}
                  >
                    <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                  <button
                    onClick={() => onEdit(item)}
                    className={`p-2 text-blue-500 hover:bg-blue-50 rounded-lg dark:hover:bg-blue-900/20`}
                    title={t("common.edit")}
                  >
                    <Edit className="w-4 h-4 text-blue-500 " />
                  </button>
                  <button
                    onClick={() => onDelete(item.id)}
                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    title={t("common.delete")}
                  >
                    <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </button>
                </div>
              </div>
            </div>

            {expandedCampaigns.includes(item.id) &&
              item.publications &&
              item.publications.length > 0 && (
                <div
                  className="border-t border-gray-200 dark:border-neutral-700 p-4"
                >
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 pl-2 border-l-2 border-primary-500">
                    {t("campaigns.modal.showCampaign.associatedPublications")}
                  </div>
                  <div className="space-y-2">
                    {item.publications.map((pub) => (
                      <div
                        key={pub.id}
                        className="flex items-center justify-between p-3 rounded bg-gray-50 dark:bg-neutral-700/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            <div
                              className="w-8 h-8 rounded border border-gray-200 bg-gray-100 dark:border-neutral-600 dark:bg-neutral-800 overflow-hidden flex items-center justify-center"
                            >
                              <PublicationThumbnail publication={pub} />
                            </div>
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                              {pub.title}
                            </div>
                            <div className="text-xs text-gray-500">
                              {pub.created_at ? format(new Date(pub.created_at), "MMM d, yyyy") : "N/A"}
                            </div>
                          </div>
                        </div>
                        <div
                          className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${getStatusColor(
                            pub.status
                          )}`}
                        >
                          {pub.status}
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
