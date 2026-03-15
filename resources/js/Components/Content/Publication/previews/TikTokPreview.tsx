import { Avatar } from '@/Components/common/Avatar';
import { Bookmark, Heart, MessageCircle, Music, Share2 } from 'lucide-react';
import { memo } from 'react';

interface TikTokPreviewProps {
  content: string;
  mediaUrls: string[];
  user?: {
    name: string;
    username: string;
    avatar?: string;
  };
}

export const TikTokPreview = memo(({ content, mediaUrls, user }: TikTokPreviewProps) => {
  const videoUrl = mediaUrls.find((url) => url.includes('video') || url.includes('.mp4'));
  const imageUrl = mediaUrls.find((url) => !url.includes('video') && !url.includes('.mp4'));

  return (
    <div className="group relative h-[560px] w-[320px] overflow-hidden rounded-[32px] border-[8px] border-neutral-900 bg-black shadow-2xl">
      {/* Video/Image Background */}
      <div className="absolute inset-0 flex items-center justify-center">
        {videoUrl ? (
          <video src={videoUrl} className="h-full w-full object-cover" loop muted autoPlay />
        ) : imageUrl ? (
          <img src={imageUrl} className="h-full w-full object-cover" alt="TikTok video thumbnail" />
        ) : (
          <div className="px-8 text-center text-xs text-white/20">
            TikTok is primarily a video platform. Upload a video for the best preview.
          </div>
        )}
      </div>

      {/* Overlay Gradient */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />

      {/* Right Side Actions */}
      <div className="absolute bottom-20 right-3 z-10 flex flex-col items-center gap-4">
        <div className="relative mb-2">
          <Avatar
            src={user?.avatar}
            name={user?.name || 'User'}
            size="md"
            className="border-2 border-white"
          />
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-[#fe2c55] p-0.5 text-white">
            <span className="text-[10px] font-bold">+</span>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-md">
            <Heart className="h-6 w-6 fill-white text-white" />
          </div>
          <span className="mt-1 text-[10px] font-semibold text-white">0</span>
        </div>

        <div className="flex flex-col items-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-md">
            <MessageCircle className="h-6 w-6 fill-white text-white" />
          </div>
          <span className="mt-1 text-[10px] font-semibold text-white">0</span>
        </div>

        <div className="flex flex-col items-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-md">
            <Bookmark className="h-6 w-6 fill-white text-white" />
          </div>
          <span className="mt-1 text-[10px] font-semibold text-white">0</span>
        </div>

        <div className="flex flex-col items-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-md">
            <Share2 className="h-6 w-6 fill-white text-white" />
          </div>
          <span className="mt-1 text-[10px] font-semibold text-white">0</span>
        </div>

        {/* Spinning Disc */}
        <div className="animate-spin-slow relative h-10 w-10">
          <div className="absolute inset-0 rounded-full border-4 border-neutral-700 bg-neutral-800 p-1">
            <Avatar
              src={user?.avatar}
              name={user?.name || ''}
              size="xs"
              className="h-full w-full rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Bottom Info */}
      <div className="absolute bottom-6 left-3 right-16 z-10 flex flex-col gap-2">
        <div className="text-base font-bold text-white">
          @{user?.username || 'contentflow_user'}
        </div>
        <div className="line-clamp-2 whitespace-pre-wrap text-sm text-white">
          {content || 'Your TikTok caption goes here...'}
        </div>
        <div className="flex items-center gap-2 text-xs text-white">
          <Music className="h-3 w-3 animate-pulse" />
          <span className="truncate">Original Sound - {user?.name || 'ContentFlow User'}</span>
        </div>
      </div>

      {/* Top Tabs */}
      <div className="absolute inset-x-0 top-8 z-10 flex justify-center gap-4 text-sm font-semibold text-white/60">
        <span className="cursor-pointer hover:text-white">Following</span>
        <span className="cursor-pointer border-b-2 border-white pb-1 text-white">For You</span>
      </div>

      {/* Content Type Indicator */}
      <div className="absolute left-3 top-16 z-10">
        <div className="flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-xs font-bold text-white">
          🎬 <span>REEL</span>
        </div>
      </div>
    </div>
  );
});
