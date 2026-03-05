import { Avatar } from "@/Components/common/Avatar";
import { MessageSquare, MoreHorizontal, Share2, ThumbsUp } from "lucide-react";
import { memo } from "react";

interface FacebookPreviewProps {
  content: string;
  mediaUrls: string[];
  user?: {
    name: string;
    avatar?: string;
  };
  publishedAt?: string;
}

export const FacebookPreview = memo(
  ({ content, mediaUrls, user, publishedAt }: FacebookPreviewProps) => {
    return (
      <div className="w-full max-w-[500px] bg-white dark:bg-[#242526] rounded-lg shadow-sm border border-gray-200 dark:border-[#3e4042] overflow-hidden text-gray-900 dark:text-[#e4e6eb]">
        {/* Header */}
        <div className="p-3 flex items-center justify-between">
          <div className="flex gap-2 items-center">
            <Avatar src={user?.avatar} name={user?.name || "User"} size="md" />
            <div>
              <div className="font-semibold text-[15px] hover:underline cursor-pointer leading-tight">
                {user?.name || "ContentFlow User"}
              </div>
              <div className="text-[13px] text-gray-500 dark:text-[#b0b3b8] leading-tight flex items-center gap-1">
                {publishedAt ? (
                  new Date(publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                ) : (
                  'Just now'
                )} ·{" "}
                <span className="inline-block w-3 h-3 bg-gray-400 dark:bg-[#b0b3b8] rounded-full" />
              </div>
            </div>
          </div>
          <button
            type="button"
            className="p-2 hover:bg-gray-100 dark:hover:bg-[#3a3b3c] rounded-full transition-colors"
          >
            <MoreHorizontal className="w-5 h-5 text-gray-500 dark:text-[#b0b3b8]" />
          </button>
        </div>

        {/* Content */}
        <div className="px-3 pb-3 text-[15px] whitespace-pre-wrap break-words">
          {content || "Your Facebook post content will appear here..."}
        </div>

        {/* Media */}
        {mediaUrls.length > 0 && (
          <div className="relative border-y border-gray-100 dark:border-[#3e4042] bg-black">
            <div
              className={`grid gap-0.5 ${mediaUrls.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}
            >
              {mediaUrls.slice(0, 4).map((url, index) => (
                <div
                  key={index}
                  className={`relative aspect-square overflow-hidden bg-gray-200 dark:bg-[#3a3b3c] ${
                    mediaUrls.length === 3 && index === 0
                      ? "row-span-2 aspect-auto"
                      : ""
                  }`}
                >
                  {url.includes("video") || url.includes(".mp4") ? (
                    <video src={url} className="w-full h-full object-cover" />
                  ) : (
                    <img
                      src={url}
                      alt="Facebook post media"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Stats */}
        <div className="px-3 py-2 flex items-center justify-between border-b border-gray-200 dark:border-[#3e4042] mx-3 text-[13px] text-gray-500 dark:text-[#b0b3b8]">
          <div className="flex items-center gap-1">
            <div className="flex -space-x-1">
              <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center ring-1 ring-white dark:ring-[#242526]">
                <ThumbsUp className="w-2.5 h-2.5 text-white fill-white" />
              </div>
            </div>
            <span>0</span>
          </div>
          <div className="flex gap-3">
            <span>0 comments</span>
            <span>0 shares</span>
          </div>
        </div>

        {/* Actions */}
        <div className="px-1 py-1 flex items-center gap-1">
          <button
            type="button"
            className="flex-1 flex items-center justify-center gap-2 py-1.5 hover:bg-gray-100 dark:hover:bg-[#3a3b3c] rounded-md transition-colors text-gray-600 dark:text-[#b0b3b8] font-semibold text-sm"
          >
            <ThumbsUp className="w-5 h-5" /> Like
          </button>
          <button
            type="button"
            className="flex-1 flex items-center justify-center gap-2 py-1.5 hover:bg-gray-100 dark:hover:bg-[#3a3b3c] rounded-md transition-colors text-gray-600 dark:text-[#b0b3b8] font-semibold text-sm"
          >
            <MessageSquare className="w-5 h-5" /> Comment
          </button>
          <button
            type="button"
            className="flex-1 flex items-center justify-center gap-2 py-1.5 hover:bg-gray-100 dark:hover:bg-[#3a3b3c] rounded-md transition-colors text-gray-600 dark:text-[#b0b3b8] font-semibold text-sm"
          >
            <Share2 className="w-5 h-5" /> Share
          </button>
        </div>
      </div>
    );
  },
);
