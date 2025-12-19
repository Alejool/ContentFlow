import PublicationThumbnail from "@/Components/ManageContent/Publication/PublicationThumbnail";
import SocialAccountsDisplay from "@/Components/ManageContent/Publication/SocialAccountsDisplay";
import { Publication } from "@/types/Publication";
import {
  Edit,
  Image,
  Rocket,
  Trash2,
  Video,
  Folder,
  MoreVertical,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { useState } from "react";

interface PublicationMobileRowProps {
  items: Publication[];
  theme: string;
  t: (key: string) => string;
  connectedAccounts: any[];
  getStatusColor: (status?: string) => string;
  onEdit: (item: Publication) => void;
  onDelete: (id: number) => void;
  onPublish: (item: Publication) => void;
  onEditRequest?: (item: Publication) => void;
}

export default function PublicationMobileRow({
  items,
  theme,
  t,
  connectedAccounts,
  getStatusColor,
  onEdit,
  onDelete,
  onPublish,
  onEditRequest,
}: PublicationMobileRowProps) {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const countMediaFiles = (pub: Publication) => {
    if (!pub.media_files || pub.media_files.length === 0) {
      return { images: 0, videos: 0, total: 0 };
    }
    const images = pub.media_files.filter((f) =>
      f.file_type.includes("image")
    ).length;
    const videos = pub.media_files.filter((f) =>
      f.file_type.includes("video")
    ).length;
    return { images, videos, total: pub.media_files.length };
  };

  const toggleExpand = (id: number) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const handleRowClick = (item: Publication, event: React.MouseEvent) => {
    // Si el click fue en un botón, no expandimos
    if ((event.target as HTMLElement).closest("button")) {
      return;
    }
    toggleExpand(item.id);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "published":
        return <CheckCircle className="w-3 h-3" />;
      case "draft":
        return <Clock className="w-3 h-3" />;
      case "failed":
        return <XCircle className="w-3 h-3" />;
      case "scheduled":
        return <Clock className="w-3 h-3" />;
      case "publishing":
        return <Clock className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  return (
    <div className="relative w-full">
      <div className="w-full overflow-x-auto scroll-smooth">
        <div className="min-w-[400px]">
          <table className="w-full">
            <thead
              className={`text-xs uppercase tracking-wider border-b ${
                theme === "dark"
                  ? "bg-neutral-800 border-neutral-700 text-gray-300"
                  : "bg-gray-50 border-gray-200 text-gray-600"
              }`}
            >
              <tr>
                <th className="px-4 py-3 font-semibold text-left w-[70%]">
                  {t("publications.table.name")}
                </th>
                <th className="px-3 py-3 font-semibold text-right w-[30%]">
                  {t("publications.table.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-neutral-700">
              {items.map((item) => {
                const mediaCount = countMediaFiles(item);
                const isExpanded = expandedRow === item.id;

                return (
                  <>
                    <tr
                      key={item.id}
                      onClick={(e) => handleRowClick(item, e)}
                      className={`cursor-pointer ${
                        theme === "dark"
                          ? "hover:bg-neutral-700/30"
                          : "hover:bg-gray-50/50"
                      } ${
                        isExpanded
                          ? theme === "dark"
                            ? "bg-neutral-800/50"
                            : "bg-gray-50"
                          : ""
                      }`}
                    >
                      <td className="px-4 py-3 w-[70%]">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-lg flex-shrink-0 border overflow-hidden flex items-center justify-center ${
                              theme === "dark"
                                ? "border-neutral-700 bg-neutral-800"
                                : "border-gray-200 bg-gray-100"
                            }`}
                          >
                            <PublicationThumbnail publication={item} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="min-w-0">
                                <h3
                                  className={`font-medium text-sm truncate ${
                                    theme === "dark"
                                      ? "text-white"
                                      : "text-gray-900"
                                  }`}
                                >
                                  {item.title ||
                                    t("publications.table.untitled")}
                                </h3>

                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                  <div className="flex items-center gap-1">
                                    {getStatusIcon(item.status || "draft")}
                                    <span
                                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                        item.status
                                      )}`}
                                    >
                                      {item.status ||
                                        t("publications.status.draft")}
                                    </span>
                                  </div>

                                  {mediaCount.total > 0 && (
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {mediaCount.total}
                                      </span>
                                      <div className="flex gap-0.5">
                                        {mediaCount.images > 0 && (
                                          <Image className="w-3 h-3 text-blue-500" />
                                        )}
                                        {mediaCount.videos > 0 && (
                                          <Video className="w-3 h-3 text-purple-500" />
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {item.campaigns &&
                                    item.campaigns.length > 0 && (
                                      <div className="flex items-center gap-1">
                                        <Folder className="w-3 h-3 text-purple-500" />
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                          {item.campaigns.length}
                                        </span>
                                      </div>
                                    )}
                                </div>
                              </div>

                              <div
                                className={`transition-transform duration-200 ${
                                  isExpanded ? "rotate-90" : ""
                                }`}
                              >
                                <MoreVertical className="w-4 h-4 text-gray-400" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-3 w-[30%]">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onPublish(item);
                            }}
                            className="p-2 text-green-500 hover:bg-green-50 rounded-lg dark:hover:bg-green-900/20"
                            title={t("publications.actions.publish")}
                          >
                            <Rocket className="w-4 h-4" />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onEditRequest) {
                                onEditRequest(item);
                              } else {
                                onEdit(item);
                              }
                            }}
                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg dark:hover:bg-blue-900/20"
                            title={t("common.edit")}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr>
                        <td colSpan={2} className="px-4 py-4">
                          <div
                            className={`rounded-lg p-4 ${
                              theme === "dark"
                                ? "bg-neutral-800/50 border border-neutral-700"
                                : "bg-gray-50 border border-gray-200"
                            }`}
                          >
                            <div className="space-y-4">
                              {item.description && (
                                <div>
                                  <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                    {t("publications.table.description")}:
                                  </h4>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {item.description}
                                  </p>
                                </div>
                              )}

                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-3">
                                  <div>
                                    <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                      {t("publications.table.status")}:
                                    </h4>
                                    <div className="flex items-center gap-2">
                                      {getStatusIcon(item.status || "draft")}
                                      <span
                                        className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium ${getStatusColor(
                                          item.status
                                        )}`}
                                      >
                                        {item.status ||
                                          t("publications.status.draft")}
                                      </span>
                                    </div>
                                  </div>

                                  <div>
                                    <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                      {t("publications.table.media")}:
                                    </h4>
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm font-medium">
                                            {mediaCount.total}{" "}
                                            {t("publications.table.media")}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="flex gap-3">
                                        {mediaCount.images > 0 && (
                                          <div className="flex items-center gap-1">
                                            <Image className="w-4 h-4 text-blue-500" />
                                            <span className="text-xs text-gray-600 dark:text-gray-400">
                                              {mediaCount.images}{" "}
                                            </span>
                                          </div>
                                        )}
                                        {mediaCount.videos > 0 && (
                                          <div className="flex items-center gap-1">
                                            <Video className="w-4 h-4 text-purple-500" />
                                            <span className="text-xs text-gray-600 dark:text-gray-400">
                                              {mediaCount.videos}{" "}
                                             
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  {item.campaigns &&
                                    item.campaigns.length > 0 && (
                                      <div>
                                        <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                          {t("campaigns.title")}:
                                        </h4>
                                        <div className="flex flex-wrap gap-1">
                                          {item.campaigns
                                            .slice(0, 2)
                                            .map((campaign) => (
                                              <span
                                                key={campaign.id}
                                                className="inline-flex items-center px-2 py-1 rounded text-xs bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                                              >
                                                <Folder className="w-3 h-3 mr-1" />
                                                {campaign.name}
                                              </span>
                                            ))}
                                          {item.campaigns.length > 2 && (
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                              +{item.campaigns.length - 2}{" "}
                                              {t("common.more")}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    )}

                                  <div>
                                    <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                      {t("publications.table.linkedAccount")}:
                                    </h4>
                                    <div>
                                      <SocialAccountsDisplay
                                        publication={item}
                                        connectedAccounts={connectedAccounts}
                                        theme={theme}
                                        compact={false}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200 dark:border-neutral-700">
                                {item.status === "published" && (
                                  <button
                                    onClick={() => onPublish(item)}
                                    className="px-4 py-2 text-sm font-medium rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100 dark:bg-primary-900/20 dark:text-primary-400 dark:hover:bg-primary-900/30 transition-colors flex items-center gap-2"
                                  >
                                    <Eye className="w-4 h-4" />
                                    {t("publications.actions.viewDetails")}
                                  </button>
                                )}

                                <button
                                  onClick={() => onPublish(item)}
                                  className="px-4 py-2 text-sm font-medium rounded-lg bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30 transition-colors flex items-center gap-2"
                                >
                                  <Rocket className="w-4 h-4" />
                                  {t("publications.actions.publishNow")}
                                </button>

                                <button
                                  onClick={() => {
                                    if (onEditRequest) {
                                      onEditRequest(item);
                                    } else {
                                      onEdit(item);
                                    }
                                  }}
                                  className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors flex items-center gap-2"
                                >
                                  <Edit className="w-4 h-4" />
                                  {t("common.edit")}
                                </button>

                                <button
                                  onClick={() => onDelete(item.id)}
                                  className="px-4 py-2 text-sm font-medium rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors flex items-center gap-2"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  {t("common.delete")}
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
