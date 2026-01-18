import { Campaign } from "@/types/Campaign";
import { usePage } from "@inertiajs/react";
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
  const { auth } = usePage<any>().props;
  const canManageContent =
    auth.current_workspace?.permissions?.includes("manage-content");

  console.log("items: ", items);
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
                    item.status,
                  )}`}
                >
                  {item.status}
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {item.start_date
                      ? format(new Date(item.start_date), "MMM d, yyyy")
                      : "N/A"}
                  </span>
                </div>
                {item.publications && item.publications.length > 0 && (
                  <>
                    <span>•</span>
                    <span>{item.publications.length} publications</span>
                  </>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100 dark:border-neutral-700/50 mt-2">
                <div className="flex-1 min-w-[140px]">
                  {(item.publications?.length || 0) > 0 ? (
                    <button
                      onClick={() => toggleExpand(item.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase rounded-xl transition-all active:scale-95 ${
                        expandedCampaigns.includes(item.id)
                          ? "bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-400 ring-1 ring-primary-200 dark:ring-primary-800"
                          : "bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-neutral-800 dark:text-gray-300 dark:hover:bg-neutral-700 ring-1 ring-gray-100 dark:ring-neutral-700"
                      }`}
                    >
                      {expandedCampaigns.includes(item.id) ? (
                        <>
                          <ChevronDown className="w-3 h-3" />
                          {t("campaigns.actions.hidePublications")}
                        </>
                      ) : (
                        <>
                          <ChevronRight className="w-3 h-3" />
                          {t("campaigns.actions.showPublications")}
                          <span className="ml-0.5 opacity-60">
                            ({item.publications?.length})
                          </span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="h-8" />
                  )}
                </div>

                <div className="flex items-center gap-1.5 bg-gray-50/50 dark:bg-neutral-800/30 p-1 rounded-xl border border-gray-100 dark:border-neutral-700/50">
                  <button
                    onClick={() => onViewDetails(item)}
                    className="p-2 text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-white dark:hover:bg-neutral-800 rounded-lg transition-all"
                    title={t("common.view")}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {canManageContent && (
                    <>
                      <button
                        onClick={() => onEdit(item)}
                        className="p-2 text-blue-500 hover:bg-white dark:hover:bg-neutral-800 rounded-lg transition-all"
                        title={t("common.edit")}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(item.id)}
                        className="p-2 text-rose-500 hover:bg-white dark:hover:bg-neutral-800 rounded-lg transition-all"
                        title={t("common.delete")}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {expandedCampaigns.includes(item.id) &&
              item.publications &&
              item.publications.length > 0 && (
                <div className="border-t border-gray-200 dark:border-neutral-700 p-4">
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
                            <div className="w-8 h-8 rounded border border-gray-200 bg-gray-100 dark:border-neutral-600 dark:bg-neutral-800 overflow-hidden flex items-center justify-center">
                              <PublicationThumbnail publication={pub} />
                            </div>
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                              {pub.title}
                            </div>
                            <div className="text-xs text-gray-500">
                              {pub.created_at
                                ? format(
                                    new Date(pub.created_at),
                                    "MMM d, yyyy",
                                  )
                                : "N/A"}
                            </div>
                          </div>
                        </div>
                        <div
                          className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${getStatusColor(
                            pub.status,
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
