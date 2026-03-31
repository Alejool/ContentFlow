import { Avatar } from '@/Components/common/Avatar';
import { format } from 'date-fns';
import { Bookmark, Heart, MessageCircle, MoreHorizontal, Send } from 'lucide-react';

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
  className = '',
}: InstagramPreviewProps) => {
  return (
    <div
      className={`mx-auto w-full max-w-[400px] overflow-hidden rounded-lg border border-gray-200 bg-white font-sans text-black ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3">
          <div className="rounded-full ring-2 ring-pink-500 ring-offset-1">
            <Avatar src={user?.avatar} name={user?.name} size="sm" />
          </div>
          <div className="text-sm font-semibold">{user?.username || 'username'}</div>
        </div>
        <MoreHorizontal className="h-5 w-5 text-gray-900" />
      </div>

      {/* Media */}
      <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-gray-100">
        {mediaUrls.length > 0 ? (
          <>
            {mediaUrls[0].match(/\.(mp4|mov|webm)$/i) ? (
              <div className="relative h-full w-full">
                <video src={mediaUrls[0]} className="h-full w-full object-cover" controls={false} />
                {/* Reel indicator */}
                <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-xs font-bold text-white">
                  🎬 <span>REEL</span>
                </div>
              </div>
            ) : (
              <div className="relative h-full w-full">
                <img src={mediaUrls[0]} alt="Post media" className="h-full w-full object-cover" />
                {/* Carousel indicator */}
                {mediaUrls.length > 1 && (
                  <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-xs font-bold text-white">
                    🎠 <span>CAROUSEL</span>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <span className="text-sm italic text-gray-400">No media selected</span>
        )}
        {mediaUrls.length > 1 && (
          <div className="absolute right-3 top-3 rounded-full bg-black/50 px-2 py-1 text-xs font-medium text-white">
            1/{mediaUrls.length}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-3">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button type="button">
              <Heart className="h-6 w-6 cursor-pointer hover:text-gray-500" />
            </button>
            <button type="button">
              <MessageCircle className="h-6 w-6 cursor-pointer hover:text-gray-500" />
            </button>
            <button type="button">
              <Send className="h-6 w-6 cursor-pointer hover:text-gray-500" />
            </button>
          </div>
          <button type="button">
            <Bookmark className="h-6 w-6 cursor-pointer hover:text-gray-500" />
          </button>
        </div>

        {/* Likes count (fake) */}
        <div className="mb-2 text-sm font-semibold">1,234 likes</div>

        {/* Caption */}
        <div className="text-sm">
          <span className="mr-2 font-semibold">{user?.username || 'username'}</span>
          <span className="whitespace-pre-wrap">{content}</span>
        </div>

        {/* Date */}
        <div className="mt-2 text-[10px] uppercase text-gray-500">
          {date ? format(date, 'MMMM d') : 'Just now'}
        </div>
      </div>
    </div>
  );
};
