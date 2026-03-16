import { Avatar } from '@/Components/common/Avatar';
import { format } from 'date-fns';
import { Heart, MessageCircle, MoreHorizontal, Repeat2, Send } from 'lucide-react';

interface ThreadsPreviewProps {
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

export const ThreadsPreview = ({
  content,
  mediaUrls,
  user,
  date = new Date(),
  className = '',
}: ThreadsPreviewProps) => {
  return (
    <div
      className={`mx-auto w-full max-w-[500px] overflow-hidden rounded-lg border border-gray-200 bg-white font-sans text-black ${className}`}
    >
      {/* Header */}
      <div className="flex items-start gap-3 p-4">
        <div className="flex-shrink-0">
          <Avatar src={user?.avatar} name={user?.name} size="md" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{user?.username || 'username'}</span>
              <span className="text-xs text-gray-500">
                {date ? format(date, 'h:mm a') : 'Just now'}
              </span>
            </div>
            <MoreHorizontal className="h-5 w-5 cursor-pointer text-gray-500" />
          </div>

          {/* Content */}
          <div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{content}</div>

          {/* Media */}
          {mediaUrls.length > 0 && (
            <div className="mt-3 overflow-hidden rounded-xl border border-gray-200">
              {mediaUrls[0].match(/\.(mp4|mov|webm)$/i) ? (
                <video
                  src={mediaUrls[0]}
                  className="w-full object-cover"
                  controls={false}
                  style={{ maxHeight: '400px' }}
                />
              ) : (
                <img
                  src={mediaUrls[0]}
                  alt="Thread media"
                  className="w-full object-cover"
                  style={{ maxHeight: '400px' }}
                />
              )}
            </div>
          )}

          {/* Actions */}
          <div className="mt-3 flex items-center gap-5">
            <button type="button" className="flex items-center gap-1 hover:opacity-70">
              <Heart className="h-5 w-5" />
            </button>
            <button type="button" className="flex items-center gap-1 hover:opacity-70">
              <MessageCircle className="h-5 w-5" />
            </button>
            <button type="button" className="flex items-center gap-1 hover:opacity-70">
              <Repeat2 className="h-5 w-5" />
            </button>
            <button type="button" className="flex items-center gap-1 hover:opacity-70">
              <Send className="h-5 w-5" />
            </button>
          </div>

          {/* Stats (fake) */}
          <div className="mt-3 text-xs text-gray-500">
            <span>234 replies · 1.2K likes</span>
          </div>
        </div>
      </div>
    </div>
  );
};
