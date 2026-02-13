import { Avatar } from "@/Components/common/Avatar";
import { Scissors, Share2, ThumbsDown, ThumbsUp } from "lucide-react";
import { memo } from "react";

interface YouTubePreviewProps {
  content: string;
  mediaUrls: string[];
  user?: {
    name: string;
    avatar?: string;
  };
}

export const YouTubePreview = memo(
  ({ content, mediaUrls, user }: YouTubePreviewProps) => {
    const videoUrl = mediaUrls.find(
      (url) => url.includes("video") || url.includes(".mp4"),
    );
    const imageUrl = mediaUrls.find(
      (url) => !url.includes("video") && !url.includes(".mp4"),
    );

    return (
      <div className="w-full max-w-[640px] bg-white dark:bg-[#0f0f0f] rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-neutral-800 text-gray-900 dark:text-white">
        {/* Video Player Area */}
        <div className="aspect-video bg-black relative flex items-center justify-center">
          {videoUrl ? (
            <video
              src={videoUrl}
              className="w-full h-full object-contain"
              controls
            />
          ) : imageUrl ? (
            <div className="w-full h-full relative">
              <img
                src={imageUrl}
                className="w-full h-full object-contain"
                alt=""
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <div className="w-16 h-12 bg-red-600 rounded-lg flex items-center justify-center shadow-lg">
                  <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-white border-b-[8px] border-b-transparent ml-1" />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-white/20 text-sm">Video Preview Area</div>
          )}
        </div>

        {/* Info Area */}
        <div className="p-4 space-y-3">
          <h1 className="text-lg font-bold leading-tight line-clamp-2">
            {content.split("\n")[0] ||
              "Your YouTube video title will appear here..."}
          </h1>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Channel Info */}
            <div className="flex items-center gap-3">
              <Avatar
                src={user?.avatar}
                name={user?.name || "User"}
                size="md"
              />
              <div className="flex flex-col">
                <span className="font-bold text-[15px]">
                  {user?.name || "ContentFlow User"}
                </span>
                <span className="text-xs text-gray-500 dark:text-neutral-400">
                  0 subscribers
                </span>
              </div>
              <button
                type="button"
                className="ml-2 bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Subscribe
              </button>
            </div>

            {/* Video Actions */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              <div className="flex items-center bg-gray-100 dark:bg-neutral-800 rounded-full">
                <button
                  type="button"
                  className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-200 dark:hover:bg-neutral-700 border-r border-gray-300 dark:border-neutral-700"
                >
                  <ThumbsUp className="w-4 h-4" />{" "}
                  <span className="text-xs font-semibold">0</span>
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 hover:bg-gray-200 dark:hover:bg-neutral-700"
                >
                  <ThumbsDown className="w-4 h-4" />
                </button>
              </div>
              <button
                type="button"
                className="flex items-center gap-2 bg-gray-100 dark:bg-neutral-800 px-3 py-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-neutral-700"
              >
                <Share2 className="w-4 h-4" />{" "}
                <span className="text-xs font-semibold">Share</span>
              </button>
              <button
                type="button"
                className="hidden items-center gap-2 bg-gray-100 dark:bg-neutral-800 px-3 py-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-neutral-700 lg:flex"
              >
                <Scissors className="w-4 h-4" />{" "}
                <span className="text-xs font-semibold">Clip</span>
              </button>
            </div>
          </div>

          {/* Description Box */}
          <div className="bg-gray-100 dark:bg-neutral-800 rounded-xl p-3 text-[13px] hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer">
            <div className="font-bold mb-1">0 views Oct 13, 2025</div>
            <div className="whitespace-pre-wrap line-clamp-3">
              {content || "Your video description will appear here..."}
            </div>
            <button
              type="button"
              className="mt-2 font-bold text-gray-900 dark:text-white"
            >
              Show more
            </button>
          </div>
        </div>
      </div>
    );
  },
);
