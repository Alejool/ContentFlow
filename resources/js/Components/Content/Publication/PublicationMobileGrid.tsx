import PublicationThumbnail from "@/Components/Content/Publication/PublicationThumbnail";
import SocialAccountsDisplay from "@/Components/Content/Publication/SocialAccountsDisplay";
import { Publication } from "@/types/Publication";
import { Edit, Eye, Folder, Image, Rocket, Trash2, Video } from "lucide-react";
import { memo } from "react";

interface PublicationMobileGridProps {
  items: Publication[];
  t: (key: string) => string;
  connectedAccounts: any[];
  getStatusColor: (status?: string) => string;
  onEdit: (item: Publication) => void;
  onDelete: (id: number) => void;
  onPublish: (item: Publication) => void;
  onEditRequest?: (item: Publication) => void;
  onViewDetails?: (item: Publication) => void;
  canManage: boolean;
}

const PublicationMobileGrid = memo(
  ({
    items,
    t,
    connectedAccounts,
    getStatusColor,
    onEdit,
    onDelete,
    onPublish,
    onEditRequest,
    onViewDetails,
    canManage,
  }: PublicationMobileGridProps) => {
    const countMediaFiles = (pub: Publication) => {
      if (
        !pub.media_files ||
        !Array.isArray(pub.media_files) ||
        pub.media_files.length === 0
      ) {
        return { images: 0, videos: 0, total: 0 };
      }
      let images = 0;
      let videos = 0;
      pub.media_files.forEach((f) => {
        if (!f || !f.file_type) return;
        if (f.file_type.includes("image")) images++;
        else if (f.file_type.includes("video")) videos++;
      });
      return { images, videos, total: pub.media_files.length };
    };

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 px-1 pb-10">
        {items.map((item) => {
          const mediaCount = countMediaFiles(item);
          return (
            <div
              key={item.id}
              className="group relative flex flex-col min-h-[16rem] rounded-lg bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
            >
              {/* Primary Visual/Info Area */}
              <div className="p-5 flex-1">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 rounded-lg flex-shrink-0 border border-gray-100 bg-gray-50/50 dark:border-neutral-800 dark:bg-neutral-800/50 overflow-hidden flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-300">
                    <PublicationThumbnail publication={item} t={t} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-tight ${getStatusColor(item.status)}`}
                      >
                        {item.status || "Draft"}
                      </span>
                      {mediaCount.total > 0 && (
                        <div className="flex items-center gap-1.5 opacity-60">
                          {mediaCount.images > 0 && (
                            <Image className="w-3 h-3" />
                          )}
                          {mediaCount.videos > 0 && (
                            <Video className="w-3 h-3" />
                          )}
                        </div>
                      )}
                    </div>
                    <h3
                      className="font-bold text-gray-900 dark:text-white text-lg truncate leading-snug"
                      title={item.title || t("publications.table.untitled")}
                    >
                      {item.title || t("publications.table.untitled")}
                    </h3>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 mt-1 font-medium leading-relaxed">
                      {item.description || "Sin descripción"}
                    </p>
                  </div>
                </div>

                {/* Platform Metadata */}
                <div className="flex flex-wrap gap-2 py-3 border-y border-gray-50 dark:border-neutral-800/50 mb-4">
                  <SocialAccountsDisplay
                    publication={item}
                    connectedAccounts={connectedAccounts}
                    compact={true}
                  />
                  {item.campaigns && item.campaigns.length > 0 && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100/50 dark:border-indigo-900/30">
                      <Folder className="w-3 h-3 text-indigo-500" />
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                        {item.campaigns.length}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Bar */}
              <div className="px-5 py-4 bg-gray-50/50 dark:bg-neutral-800/20 backdrop-blur-sm flex gap-3 mt-auto border-t border-gray-50 dark:border-neutral-800">
                {!canManage ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDetails?.(item);
                    }}
                    className="w-full py-2.5 rounded-lg bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 font-bold text-xs flex items-center justify-center gap-2 border border-gray-200 dark:border-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-all active:scale-95"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {t("common.viewDetails") || "View Details"}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPublish(item);
                      }}
                      className="flex-[2] py-2.5 rounded-lg bg-emerald-600 dark:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-all active:scale-95"
                    >
                      <Rocket className="w-3.5 h-3.5" />
                      {t("publications.button.publish") || "Publish"}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditRequest ? onEditRequest(item) : onEdit(item);
                      }}
                      className="flex-1 py-2.5 rounded-lg bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 font-bold text-xs flex items-center justify-center gap-2 border border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-all active:scale-95"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      {t("common.edit")}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(item.id);
                      }}
                      className="p-2.5 rounded-lg bg-rose-50 text-rose-500 dark:bg-rose-900/20 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 hover:bg-rose-100 transition-all active:scale-90"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  },
);

export default PublicationMobileGrid;
