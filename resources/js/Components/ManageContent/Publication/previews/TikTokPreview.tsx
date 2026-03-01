import { Avatar } from "@/Components/common/Avatar";
import { Bookmark, Heart, MessageCircle, Music, Share2 } from "lucide-react";
import { memo } from "react";

interface TikTokPreviewProps {
  content: string;
  mediaUrls: string[];
  user?: {
    name: string;
    username: string;
    avatar?: string;
  };
}

export const TikTokPreview = memo(
  ({ content, mediaUrls, user }: TikTokPreviewProps) => {
    const videoUrl = mediaUrls.find(
      (url) => url.includes("video") || url.includes(".mp4"),
    );
    const imageUrl = mediaUrls.find(
      (url) => !url.includes("video") && !url.includes(".mp4"),
    );

    return (
      <div className="w-[320px] h-[560px] bg-black rounded-[32px] overflow-hidden relative shadow-2xl border-[8px] border-neutral-900 group">
        {/* Video/Image Background */}
        <div className="absolute inset-0 flex items-center justify-center">
          {videoUrl ? (
            <video
              src={videoUrl}
              className="w-full h-full object-cover"
              loop
              muted
              autoPlay
            />
          ) : imageUrl ? (
            <img src={imageUrl} className="w-full h-full object-cover" alt="TikTok video thumbnail" />
          ) : (
            <div className="text-white/20 text-xs text-center px-8">
              TikTok is primarily a video platform. Upload a video for the best
              preview.
            </div>
          )}
        </div>

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 pointer-events-none" />

        {/* Right Side Actions */}
        <div className="absolute right-3 bottom-20 flex flex-col items-center gap-4 z-10">
          <div className="relative mb-2">
            <Avatar
              src={user?.avatar}
              name={user?.name || "User"}
              size="md"
              className="border-2 border-white"
            />
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#fe2c55] text-white rounded-full p-0.5">
              <span className="text-[10px] font-bold">+</span>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center">
              <Heart className="w-6 h-6 text-white fill-white" />
            </div>
            <span className="text-white text-[10px] mt-1 font-semibold">0</span>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-white fill-white" />
            </div>
            <span className="text-white text-[10px] mt-1 font-semibold">0</span>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center">
              <Bookmark className="w-6 h-6 text-white fill-white" />
            </div>
            <span className="text-white text-[10px] mt-1 font-semibold">0</span>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center">
              <Share2 className="w-6 h-6 text-white fill-white" />
            </div>
            <span className="text-white text-[10px] mt-1 font-semibold">0</span>
          </div>

          {/* Spinning Disc */}
          <div className="w-10 h-10 relative animate-spin-slow">
            <div className="absolute inset-0 rounded-full bg-neutral-800 border-4 border-neutral-700 p-1">
              <Avatar
                src={user?.avatar}
                name={user?.name || ""}
                size="xs"
                className="w-full h-full rounded-full"
              />
            </div>
          </div>
        </div>

        {/* Bottom Info */}
        <div className="absolute bottom-6 left-3 right-16 flex flex-col gap-2 z-10">
          <div className="font-bold text-white text-base">
            @{user?.username || "contentflow_user"}
          </div>
          <div className="text-white text-sm whitespace-pre-wrap line-clamp-2">
            {content || "Your TikTok caption goes here..."}
          </div>
          <div className="flex items-center gap-2 text-white text-xs">
            <Music className="w-3 h-3 animate-pulse" />
            <span className="truncate">
              Original Sound - {user?.name || "ContentFlow User"}
            </span>
          </div>
        </div>

        {/* Top Tabs */}
        <div className="absolute top-8 inset-x-0 flex justify-center gap-4 text-white/60 text-sm font-semibold z-10">
          <span className="hover:text-white cursor-pointer">Following</span>
          <span className="text-white cursor-pointer border-b-2 border-white pb-1">
            For You
          </span>
        </div>
      </div>
    );
  },
);
