import PublicationThumbnail from "@/Components/ManageContent/Publication/PublicationThumbnail";
import SocialAccountsDisplay from "@/Components/ManageContent/Publication/SocialAccountsDisplay";
import { Publication } from "@/types/Publication";
import { Edit, Image, Rocket, Trash2, Video } from "lucide-react";

interface PublicationMobileGridProps {
  items: Publication[];
  t: (key: string) => string;
  connectedAccounts: any[];
  getStatusColor: (status?: string) => string;
  onEdit: (item: Publication) => void;
  onDelete: (id: number) => void;
  onPublish: (item: Publication) => void;
  onEditRequest?: (item: Publication) => void;
}

export default function PublicationMobileGrid({
  items,
  t,
  connectedAccounts,
  getStatusColor,
  onEdit,
  onDelete,
  onPublish,
  onEditRequest,
}: PublicationMobileGridProps) {
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-2">
      {items.map((item) => {
        const mediaCount = countMediaFiles(item);
        return (
          <div
            key={item.id}
            className="rounded-lg border p-4 bg-white border-gray-200 dark:bg-neutral-800 dark:border-neutral-700 hover:shadow-md transition-shadow h-[28rem] flex flex-col"
          >
            <div className="flex items-start gap-3 mb-3 shrink-0">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-lg border border-gray-200 bg-gray-100 dark:border-neutral-700 dark:bg-neutral-800 overflow-hidden flex items-center justify-center">
                  <PublicationThumbnail publication={item} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm ">
                      {item.title || "Untitled"}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                          item.status
                        )}`}
                      >
                        {item.status || "Draft"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar mb-3 pr-1 space-y-3">
              {item.description && (
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  {item.description}
                </p>
              )}

              {item.platform_settings &&
                Object.keys(item.platform_settings).length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(item.platform_settings).map(
                      ([platform, settings]: [string, any]) => {
                        if (!settings) return null;

                        let typeText = "";
                        let colorClass = "";

                        if (platform === "twitter" && settings.type) {
                          colorClass =
                            "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400 border-sky-200 dark:border-sky-800";
                          typeText = `Twitter: ${settings.type === "poll"
                            ? "Poll"
                            : settings.type === "thread"
                              ? "Thread"
                              : "Tweet"
                            }`;
                        } else if (platform === "youtube" && settings.type) {
                          colorClass =
                            "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800";
                          typeText = `YouTube: ${settings.type === "short" ? "Short" : "Video"
                            }`;
                        } else if (platform === "facebook" && settings.type) {
                          colorClass =
                            "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800";
                          typeText = `FB: ${settings.type === "reel" ? "Reel" : "Post"
                            }`;
                        } else if (platform === "instagram" && settings.type) {
                          colorClass =
                            "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400 border-pink-200 dark:border-pink-800";
                          typeText = `IG: ${settings.type === "reel"
                            ? "Reel"
                            : settings.type === "story"
                              ? "Story"
                              : "Post"
                            }`;
                        }

                        if (!typeText) return null;

                        return (
                          <span
                            key={platform}
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${colorClass}`}
                          >
                            {typeText}
                          </span>
                        );
                      }
                    )}
                  </div>
                )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {mediaCount.total} files
                    </span>
                  </div>
                  {mediaCount.images > 0 && (
                    <div className="flex items-center gap-1">
                      <Image className="w-3 h-3 text-blue-400" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {mediaCount.images}
                      </span>
                    </div>
                  )}
                  {mediaCount.videos > 0 && (
                    <div className="flex items-center gap-1">
                      <Video className="w-3 h-3 text-purple-400" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {mediaCount.videos}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <SocialAccountsDisplay
                  publication={item}
                  connectedAccounts={connectedAccounts}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-neutral-700 mt-auto shrink-0">
              <button
                onClick={() => onPublish(item)}
                className="flex-1 py-2 px-3 text-xs font-medium rounded-lg bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30 transition-colors flex items-center justify-center gap-1"
              >
                <Rocket className="w-3 h-3" />
                Publish
              </button>
              <button
                onClick={() => {
                  if (onEditRequest) {
                    onEditRequest(item);
                  } else {
                    onEdit(item);
                  }
                }}
                className="flex-1 py-2 px-3 text-xs font-medium rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors flex items-center justify-center gap-1"
              >
                <Edit className="w-3 h-3" />
                Edit
              </button>
              <button
                onClick={() => onDelete(item.id)}
                className="flex-1 py-2 px-3 text-xs font-medium rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors flex items-center justify-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                Delete
              </button>
            </div>
          </div >
        );
      })}
    </div >
  );
}
