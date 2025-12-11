import CampaignTags from "@/Components/ManageContent/Publication/CampaignTags";
import PublicationThumbnail from "@/Components/ManageContent/Publication/PublicationThumbnail";
import SocialAccountsDisplay from "@/Components/ManageContent/Publication/SocialAccountsDisplay";
import { Publication } from "@/types/Publication";
import { Edit, Image, Rocket, Trash2, Video } from "lucide-react";

interface PublicationRowProps {
  item: Publication;
  theme: string;
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
  theme,
  t,
  connectedAccounts,
  getStatusColor,
  onEdit,
  onDelete,
  onPublish,
  onEditRequest,
}: PublicationRowProps) {
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
      className={`group transition-colors ${
        theme === "dark" ? "hover:bg-neutral-700/30" : "hover:bg-gray-50/50"
      }`}
    >
      <td className="px-2 py-4 text-center">
        {/* Empty cell for alignment */}
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-lg flex-shrink-0 border overflow-hidden flex items-center justify-center ${
              theme === "dark"
                ? "border-neutral-700 bg-neutral-800"
                : "border-gray-200 bg-gray-100"
            }`}
          >
            <PublicationThumbnail publication={item} />
          </div>
          <div>
            <h3
              className={`font-medium text-sm ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              {item.title || "Untitled"}
            </h3>
            <p
              className={`text-xs mt-0.5 line-clamp-1 ${
                theme === "dark" ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {item.description || "No description"}
            </p>
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
        <CampaignTags
          publication={item}
          theme={theme}
          t={t}
        />
      </td>
      <td className="px-6 py-4">
        <SocialAccountsDisplay
          publication={item}
          connectedAccounts={connectedAccounts}
          theme={theme}
        />
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => onPublish(item)}
            className="p-2 text-green-500 hover:bg-green-50 rounded-lg dark:hover:bg-green-900/20"
            title="Publish"
          >
            <Rocket className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (onEditRequest) {
                onEditRequest(item);
              } else {
                onEdit(item);
              }
            }}
            className={`p-2 ${
              item.status === "published" ? "text-amber-500" : "text-blue-500"
            } hover:bg-blue-50 rounded-lg dark:hover:bg-blue-900/20`}
            title={item.status === "published" ? "Unpublish to Edit" : "Edit"}
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
