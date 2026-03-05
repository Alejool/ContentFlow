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
}

export const TwitterPreview = ({
  content,
  mediaUrls,
  user,
  date = new Date(),
  className = "",
}: TwitterPreviewProps) => {
  return (
    <div
      className={`bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg p-4 max-w-[500px] w-full font-sans ${className}`}
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          <Avatar src={user?.avatar} name={user?.name} size="md" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-[15px] leading-5">
            <span className="font-bold text-gray-900 dark:text-white truncate">
              {user?.name || "User Name"}
            </span>
            {/* Verified badge could go here */}
            <span className="text-gray-500 dark:text-gray-500 truncate">
              @{user?.username || "username"}
            </span>
            <span className="text-gray-500 dark:text-gray-500">·</span>
            <span className="text-gray-500 dark:text-gray-500 hover:underline">
              {date ? format(date, "MMM d") : "Now"}
            </span>
          </div>

          <div className="mt-1 text-[15px] text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words leading-normal">
            {content || (
              <span className="text-gray-400 italic">
                Start typing to preview...
              </span>
            )}
          </div>

          {mediaUrls.length > 0 && (
            <div
              className={`mt-3 grid gap-0.5 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 ${
                mediaUrls.length === 1
                  ? "grid-cols-1"
                  : mediaUrls.length === 2
                    ? "grid-cols-2"
                    : "grid-cols-2"
              }`}
            >
              {mediaUrls.slice(0, 4).map((url, index) => (
                <div
                  key={index}
                  className="relative aspect-[16/9] bg-gray-100 dark:bg-gray-900"
                >
                  {/* Simple check for video extension, otherwise assume image */}
                  {url.match(/\.(mp4|mov|webm)$/i) ? (
                    <video
                      src={url}
                      className="w-full h-full object-cover"
                      controls={false}
                    />
                  ) : (
                    <img
                      src={url}
                      alt="Post media"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between mt-3 max-w-[425px] text-gray-500">
            <button
              type="button"
              className="group flex items-center gap-2 hover:text-blue-400 transition-colors"
            >
              <div className="p-2 -ml-2 rounded-full group-hover:bg-blue-400/10 transition-colors">
                <MessageCircle className="w-[18px] h-[18px]" />
              </div>
            </button>
            <button className="group flex items-center gap-2 hover:text-green-400 transition-colors">
              <div className="p-2 -ml-2 rounded-full group-hover:bg-green-400/10 transition-colors">
                <Repeat className="w-[18px] h-[18px]" />
              </div>
            </button>
            <button className="group flex items-center gap-2 hover:text-pink-400 transition-colors">
              <div className="p-2 -ml-2 rounded-full group-hover:bg-pink-400/10 transition-colors">
                <Heart className="w-[18px] h-[18px]" />
              </div>
            </button>
            <button
              type="button"
              className="group flex items-center gap-2 hover:text-blue-400 transition-colors"
            >
              <div className="p-2 -ml-2 rounded-full group-hover:bg-blue-400/10 transition-colors">
                <Share className="w-[18px] h-[18px]" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
