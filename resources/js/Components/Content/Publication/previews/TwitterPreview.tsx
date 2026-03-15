import { Avatar } from "@/Components/common/Avatar";
import { format } from "date-fns";
import { Heart, MessageCircle, Repeat, Share } from "lucide-react";

interface TwitterPreviewProps {
  content: string;
  mediaUrls: string[];
  user?: {
    name: string;
    username: string;
    avatar?: string;
  };
  date?: Date;
  className?: string;
  contentType?: string;
  pollOptions?: string[];
  pollDuration?: number;
}

export const TwitterPreview = ({
  content,
  mediaUrls,
  user,
  date = new Date(),
  className = "",
  contentType = "post",
  pollOptions = [],
  pollDuration = 24,
}: TwitterPreviewProps) => {
  return (
    <div
      className={`w-full max-w-[500px] rounded-lg border border-gray-200 bg-white p-4 font-sans dark:border-gray-800 dark:bg-black ${className}`}
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          <Avatar src={user?.avatar} name={user?.name} size="md" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[15px] leading-5">
            <span className="truncate font-bold text-gray-900 dark:text-white">
              {user?.name || "User Name"}
            </span>
            {/* Verified badge could go here */}
            <span className="truncate text-gray-500 dark:text-gray-500">
              @{user?.username || "username"}
            </span>
            <span className="text-gray-500 dark:text-gray-500">·</span>
            <span className="text-gray-500 hover:underline dark:text-gray-500">
              {date ? format(date, "MMM d") : "Now"}
            </span>
          </div>

          <div className="mt-1 whitespace-pre-wrap break-words text-[15px] leading-normal text-gray-900 dark:text-gray-100">
            {content || <span className="italic text-gray-400">Start typing to preview...</span>}
          </div>

          {mediaUrls.length > 0 && contentType !== "poll" && (
            <div
              className={`mt-3 grid gap-0.5 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800 ${
                mediaUrls.length === 1
                  ? "grid-cols-1"
                  : mediaUrls.length === 2
                    ? "grid-cols-2"
                    : "grid-cols-2"
              }`}
            >
              {mediaUrls.slice(0, 4).map((url, index) => (
                <div key={index} className="relative aspect-[16/9] bg-gray-100 dark:bg-gray-900">
                  {/* Simple check for video extension, otherwise assume image */}
                  {url.match(/\.(mp4|mov|webm)$/i) ? (
                    <video src={url} className="h-full w-full object-cover" controls={false} />
                  ) : (
                    <img src={url} alt="Post media" className="h-full w-full object-cover" />
                  )}
                </div>
              ))}
            </div>
          )}

          {contentType === "poll" && pollOptions.length >= 2 && (
            <div className="mt-3 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
              <div className="border-b border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-800 dark:bg-gray-900/30">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    📊 Encuesta
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {pollDuration < 24
                      ? `${pollDuration} hora${pollDuration !== 1 ? "s" : ""} restante${pollDuration !== 1 ? "s" : ""}`
                      : `${Math.floor(pollDuration / 24)} día${Math.floor(pollDuration / 24) !== 1 ? "s" : ""} restante${Math.floor(pollDuration / 24) !== 1 ? "s" : ""}`}{" "}
                    · 0 votos
                  </span>
                </div>
              </div>
              {pollOptions
                .filter((option) => option.trim())
                .map((option, index) => (
                  <div
                    key={index}
                    className="flex cursor-pointer items-center justify-between border-b border-gray-200 p-3 transition-colors last:border-b-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900/50"
                  >
                    <div className="flex flex-1 items-center gap-3">
                      <div className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-blue-400">
                        <div className="h-2 w-2 rounded-full bg-blue-400 opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                      <span className="text-[15px] text-gray-900 dark:text-gray-100">{option}</span>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">0%</span>
                  </div>
                ))}
            </div>
          )}

          <div className="mt-3 flex max-w-[425px] justify-between text-gray-500">
            <button
              type="button"
              className="group flex items-center gap-2 transition-colors hover:text-blue-400"
            >
              <div className="-ml-2 rounded-full p-2 transition-colors group-hover:bg-blue-400/10">
                <MessageCircle className="h-[18px] w-[18px]" />
              </div>
            </button>
            <button className="group flex items-center gap-2 transition-colors hover:text-green-400">
              <div className="-ml-2 rounded-full p-2 transition-colors group-hover:bg-green-400/10">
                <Repeat className="h-[18px] w-[18px]" />
              </div>
            </button>
            <button className="group flex items-center gap-2 transition-colors hover:text-pink-400">
              <div className="-ml-2 rounded-full p-2 transition-colors group-hover:bg-pink-400/10">
                <Heart className="h-[18px] w-[18px]" />
              </div>
            </button>
            <button
              type="button"
              className="group flex items-center gap-2 transition-colors hover:text-blue-400"
            >
              <div className="-ml-2 rounded-full p-2 transition-colors group-hover:bg-blue-400/10">
                <Share className="h-[18px] w-[18px]" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
