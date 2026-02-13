import { Avatar } from "@/Components/common/Avatar";
import { format } from "date-fns";
import {
  Globe,
  MessageSquare,
  MoreHorizontal,
  Send,
  Share2,
  ThumbsUp,
} from "lucide-react";

interface LinkedInPreviewProps {
  content: string;
  mediaUrls: string[];
  user?: {
    name: string;
    username: string;
    avatar?: string;
    headline?: string;
  };
  date?: Date;
  className?: string;
}

export const LinkedInPreview = ({
  content,
  mediaUrls,
  user,
  date = new Date(),
  className = "",
}: LinkedInPreviewProps) => {
  return (
    <div
      className={`bg-white border text-black border-gray-200 rounded-lg overflow-hidden max-w-[500px] w-full font-sans ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between p-3 pb-2">
        <div className="flex gap-2">
          <Avatar src={user?.avatar} name={user?.name} size="lg" />
          <div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm leading-tight hover:text-blue-600 hover:underline cursor-pointer">
                {user?.name || "User Name"}
              </span>
              <span className="text-xs text-gray-500 leading-tight mt-0.5">
                {user?.headline || "Software Engineer at Tech Company"}
              </span>
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                <span>{date ? format(date, "d 'mo'") : "now"}</span>
                <span>•</span>
                <Globe className="w-3 h-3" />
              </div>
            </div>
          </div>
        </div>
        <button className="text-gray-600 hover:bg-gray-100 p-1 rounded-full">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="px-3 pb-2 text-sm text-gray-900 whitespace-pre-wrap break-words leading-relaxed">
        {content || (
          <span className="text-gray-400 italic">
            Start typing to preview...
          </span>
        )}
      </div>

      {/* Media */}
      {mediaUrls.length > 0 && (
        <div className="w-full bg-gray-100 flex items-center justify-center overflow-hidden border-t border-b border-gray-100">
          {mediaUrls[0].match(/\.(mp4|mov|webm)$/i) ? (
            <video
              src={mediaUrls[0]}
              className="w-full h-auto max-h-[500px] object-contain"
              controls={false}
            />
          ) : (
            <img
              src={mediaUrls[0]}
              alt="Post media"
              className="w-full h-auto max-h-[500px] object-contain"
            />
          )}
        </div>
      )}

      {/* Stats */}
      <div className="px-3 py-2 flex items-center justify-between text-xs text-gray-500 border-b border-gray-100">
        <div className="flex items-center gap-1">
          <div className="bg-blue-500 rounded-full p-0.5">
            <ThumbsUp className="w-2 h-2 text-white fill-white" />
          </div>
          <span className="hover:text-blue-600 hover:underline cursor-pointer">
            123
          </span>
        </div>
        <div className="flex gap-2">
          <span className="hover:text-blue-600 hover:underline cursor-pointer">
            12 comments
          </span>
          <span>•</span>
          <span className="hover:text-blue-600 hover:underline cursor-pointer">
            5 reposts
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="px-2 py-1 flex items-center justify-between">
        <button className="flex items-center gap-1.5 px-3 py-3 hover:bg-gray-100 rounded-md text-gray-600 font-semibold text-sm transition-colors flex-1 justify-center">
          <ThumbsUp className="w-5 h-5" />
          <span>Like</span>
        </button>
        <button className="flex items-center gap-1.5 px-3 py-3 hover:bg-gray-100 rounded-md text-gray-600 font-semibold text-sm transition-colors flex-1 justify-center">
          <MessageSquare className="w-5 h-5" />
          <span>Comment</span>
        </button>
        <button className="flex items-center gap-1.5 px-3 py-3 hover:bg-gray-100 rounded-md text-gray-600 font-semibold text-sm transition-colors flex-1 justify-center">
          <Share2 className="w-5 h-5" />
          <span>Repost</span>
        </button>
        <button className="flex items-center gap-1.5 px-3 py-3 hover:bg-gray-100 rounded-md text-gray-600 font-semibold text-sm transition-colors flex-1 justify-center">
          <Send className="w-5 h-5" />
          <span>Send</span>
        </button>
      </div>
    </div>
  );
};
