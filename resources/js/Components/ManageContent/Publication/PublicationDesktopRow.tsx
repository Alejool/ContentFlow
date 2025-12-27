import CampaignTags from "@/Components/ManageContent/Publication/CampaignTags";
import PublicationThumbnail from "@/Components/ManageContent/Publication/PublicationThumbnail";
import SocialAccountsDisplay from "@/Components/ManageContent/Publication/SocialAccountsDisplay";
import { Publication } from "@/types/Publication";
import { Edit, Eye, Image, Loader2, Rocket, Trash2, Video } from "lucide-react";
import { useState } from "react";

interface PublicationRowProps {
  item: Publication;
  t: (key: string) => string;
  connectedAccounts: any[];
  getStatusColor: (status?: string) => string;
  onEdit: (item: Publication) => void;
  onDelete: (id: number) => void;
  onPublish: (item: Publication) => void;
  onEditRequest?: (item: Publication) => void;
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
}: PublicationRowProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const mediaCount = countMediaFiles(item);

  return (
    <tr
      className="group transition-colors hover:bg-gray-50/50 dark:hover:bg-neutral-700/30"
    >
      <td className="px-2 py-4 text-center"></td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg flex-shrink-0 border border-gray-200 bg-gray-100 dark:border-neutral-700 dark:bg-neutral-800 overflow-hidden flex items-center justify-center">
            <PublicationThumbnail publication={item} />
          </div>
          <div>
            <h3
              className="font-medium text-sm text-gray-900 dark:text-white"
            >
              {item.title || "Untitled"}
            </h3>
            <p
              className="text-xs mt-0.5 line-clamp-1 text-gray-500 dark:text-gray-400"
            >
              {item.description || "No description"}
            </p>
            {item.platform_settings &&
              Object.keys(item.platform_settings).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {Object.entries(item.platform_settings).map(
                    ([platform, settings]: [string, any]) => {
                      if (!settings) return null;

                      // For Twitter polls/threads
                      if (platform === "twitter" && settings.type) {
                        return (
                          <span
                            key={platform}
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400 border border-sky-200 dark:border-sky-800"
                          >
                            Twitter:{" "}
                            {settings.type === "poll"
                              ? "Poll"
                              : settings.type === "thread"
                                ? "Thread"
                                : "Tweet"}
                          </span>
                        );
                      }

                      // For YouTube Shorts
                      if (platform === "youtube" && settings.type) {
                        return (
                          <span
                            key={platform}
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800"
                          >
                            YouTube:{" "}
                            {settings.type === "short" ? "Short" : "Video"}
                          </span>
                        );
                      }

                      // For Facebook Reels
                      if (platform === "facebook" && settings.type) {
                        return (
                          <span
                            key={platform}
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
                          >
                            FB: {settings.type === "reel" ? "Reel" : "Post"}
                          </span>
                        );
                      }

                      return null;
                    }
                  )}
                </div>
              )}
          </div>
        </div>
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
        <span>{mediaCount.total} files</span>
        {mediaCount.images > 0 && (
          <span className="text-xs ml-2 flex items-center">
            <Image className="w-3 h-3 mr-1" /> {mediaCount.images}
          </span>
        )}
        {mediaCount.videos > 0 && (
          <span className="text-xs ml-2 flex items-center">
            <Video className="w-3 h-3 mr-1" /> {mediaCount.videos}
          </span>
        )}
      </td>
      <td className="px-6 py-4">
        <CampaignTags publication={item} t={t} />
      </td>
      <td className="px-6 py-4">
        <SocialAccountsDisplay
          publication={item}
          connectedAccounts={connectedAccounts}
        />
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          {item.status === "published" && (
            <button
              onClick={async () => {
                setIsPublishing(true);
                try {
                  await onPublish(item);
                } finally {
                  setIsPublishing(false);
                }
              }}
              disabled={isPublishing || isEditing || isDeleting}
              className="p-2 text-primary-500 hover:bg-primary-50 rounded-lg dark:hover:bg-primary-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              title="View Real Status / Preview"
            >
              {isPublishing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          )}
          <button
            onClick={async () => {
              setIsPublishing(true);
              try {
                await onPublish(item);
              } finally {
                setIsPublishing(false);
              }
            }}
            disabled={isPublishing || isEditing || isDeleting}
            className="p-2 text-green-500 hover:bg-green-50 rounded-lg dark:hover:bg-green-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            title="Publish / Manage Platforms"
          >
            {isPublishing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Rocket className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={async () => {
              setIsEditing(true);
              try {
                if (onEditRequest) {
                  await onEditRequest(item);
                } else {
                  await onEdit(item);
                }
              } finally {
                setIsEditing(false);
              }
            }}
            disabled={isPublishing || isEditing || isDeleting}
            className={`p-2 ${item.status === "published" ? "text-amber-500" : "text-blue-500"
              } hover:bg-blue-50 rounded-lg dark:hover:bg-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all`}
            title={item.status === "published" ? "Unpublish to Edit" : "Edit"}
          >
            {isEditing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Edit className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={async () => {
              setIsDeleting(true);
              try {
                await onDelete(item.id);
              } finally {
                setIsDeleting(false);
              }
            }}
            disabled={isPublishing || isEditing || isDeleting}
            className="p-2 text-red-500 hover:bg-red-50 rounded-lg dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </td>
    </tr >
  );
}
