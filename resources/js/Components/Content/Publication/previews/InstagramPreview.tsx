import { Avatar } from "@/Components/common/Avatar";
import { format } from "date-fns";
import {
  Bookmark,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Send,
} from "lucide-react";

interface InstagramPreviewProps {
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

export const InstagramPreview = ({
  content,
  mediaUrls,
  user,
  date = new Date(),
  className = "",
}: InstagramPreviewProps) => {
  return (
    <div
      className={`bg-white border text-black border-gray-200 rounded-lg overflow-hidden max-w-[400px] w-full font-sans mx-auto ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3">
          <div className="ring-2 ring-offset-1 ring-pink-500 rounded-full">
            <Avatar src={user?.avatar} name={user?.name} size="sm" />
          </div>
          <div className="text-sm font-semibold">
            {user?.username || "username"}
          </div>
        </div>
        <MoreHorizontal className="w-5 h-5 text-gray-900" />
      </div>

      {/* Media */}
      <div className="relative aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
        {mediaUrls.length > 0 ? (
          mediaUrls[0].match(/\.(mp4|mov|webm)$/i) ? (
            <video
              src={mediaUrls[0]}
              className="w-full h-full object-cover"
              controls={false}
            />
          ) : (
            <img
              src={mediaUrls[0]}
              alt="Post media"
              className="w-full h-full object-cover"
            />
          )
        ) : (
          <span className="text-gray-400 italic text-sm">
            No media selected
          </span>
        )}
        {mediaUrls.length > 1 && (
          <div className="absolute top-3 right-3 bg-black/50 text-white px-2 py-1 rounded-full text-xs font-medium">
            1/{mediaUrls.length}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <Heart className="w-6 h-6 hover:text-gray-500 cursor-pointer" />
            <MessageCircle className="w-6 h-6 hover:text-gray-500 cursor-pointer" />
            <Send className="w-6 h-6 hover:text-gray-500 cursor-pointer" />
          </div>
          <Bookmark className="w-6 h-6 hover:text-gray-500 cursor-pointer" />
        </div>

        {/* Likes count (fake) */}
        <div className="font-semibold text-sm mb-2">1,234 likes</div>

        {/* Caption */}
        <div className="text-sm">
          <span className="font-semibold mr-2">
            {user?.username || "username"}
          </span>
          <span className="whitespace-pre-wrap">{content}</span>
        </div>

        {/* Date */}
        <div className="text-[10px] uppercase text-gray-500 mt-2">
          {date ? format(date, "MMMM d") : "Just now"}
        </div>
      </div>
    </div>
  );
};
