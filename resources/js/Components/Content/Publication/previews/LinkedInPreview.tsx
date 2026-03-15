import { Avatar } from '@/Components/common/Avatar';
import { format } from 'date-fns';
import { Globe, MessageSquare, MoreHorizontal, Send, Share2, ThumbsUp } from 'lucide-react';

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
  className = '',
}: LinkedInPreviewProps) => {
  return (
    <div
      className={`w-full max-w-[500px] overflow-hidden rounded-lg border border-gray-200 bg-white font-sans text-black ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between p-3 pb-2">
        <div className="flex gap-2">
          <Avatar src={user?.avatar} name={user?.name} size="lg" />
          <div>
            <div className="flex flex-col">
              <span className="cursor-pointer text-sm font-semibold leading-tight hover:text-blue-600 hover:underline">
                {user?.name || 'User Name'}
              </span>
              <span className="mt-0.5 text-xs leading-tight text-gray-500">
                {user?.headline || 'Software Engineer at Tech Company'}
              </span>
              <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                <span>{date ? format(date, "d 'mo'") : 'now'}</span>
                <span>•</span>
                <Globe className="h-3 w-3" />
              </div>
            </div>
          </div>
        </div>
        <button type="button" className="rounded-full p-1 text-gray-600 hover:bg-gray-100">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="whitespace-pre-wrap break-words px-3 pb-2 text-sm leading-relaxed text-gray-900">
        {content || <span className="italic text-gray-400">Start typing to preview...</span>}
      </div>

      {/* Media */}
      {mediaUrls.length > 0 && (
        <div className="flex w-full items-center justify-center overflow-hidden border-b border-t border-gray-100 bg-gray-100">
          {mediaUrls[0].match(/\.(mp4|mov|webm)$/i) ? (
            <video
              src={mediaUrls[0]}
              className="h-auto max-h-[500px] w-full object-contain"
              controls={false}
            />
          ) : (
            <img
              src={mediaUrls[0]}
              alt="Post media"
              className="h-auto max-h-[500px] w-full object-contain"
            />
          )}
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="rounded-full bg-blue-500 p-0.5">
            <ThumbsUp className="h-2 w-2 fill-white text-white" />
          </div>
          <span className="cursor-pointer hover:text-blue-600 hover:underline">123</span>
        </div>
        <div className="flex gap-2">
          <span className="cursor-pointer hover:text-blue-600 hover:underline">12 comments</span>
          <span>•</span>
          <span className="cursor-pointer hover:text-blue-600 hover:underline">5 reposts</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between px-2 py-1">
        <button
          type="button"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-3 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100"
        >
          <ThumbsUp className="h-5 w-5" />
          <span>Like</span>
        </button>
        <button
          type="button"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-3 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100"
        >
          <MessageSquare className="h-5 w-5" />
          <span>Comment</span>
        </button>
        <button
          type="button"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-3 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100"
        >
          <Share2 className="h-5 w-5" />
          <span>Repost</span>
        </button>
        <button
          type="button"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-3 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100"
        >
          <Send className="h-5 w-5" />
          <span>Send</span>
        </button>
      </div>
    </div>
  );
};
