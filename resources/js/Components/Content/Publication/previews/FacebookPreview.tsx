import { Avatar } from '@/Components/common/Avatar';
import { MessageSquare, MoreHorizontal, Share2, ThumbsUp } from 'lucide-react';
import { memo } from 'react';

interface FacebookPreviewProps {
  content: string;
  mediaUrls: string[];
  user?: {
    name: string;
    avatar?: string;
  };
  publishedAt?: string;
  contentType?: string;
  pollOptions?: string[];
  pollDuration?: number;
}

export const FacebookPreview = memo(
  ({
    content,
    mediaUrls,
    user,
    publishedAt,
    contentType = 'post',
    pollOptions = [],
    pollDuration = 24,
  }: FacebookPreviewProps) => {
    return (
      <div className="w-full max-w-[500px] overflow-hidden rounded-lg border border-gray-200 bg-white text-gray-900 shadow-sm dark:border-[#3e4042] dark:bg-[#242526] dark:text-[#e4e6eb]">
        {/* Header */}
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2">
            <Avatar src={user?.avatar} name={user?.name || 'User'} size="md" />
            <div>
              <div className="cursor-pointer text-[15px] font-semibold leading-tight hover:underline">
                {user?.name || 'Intellipost User'}
              </div>
              <div className="flex items-center gap-1 text-[13px] leading-tight text-gray-500 dark:text-[#b0b3b8]">
                {publishedAt
                  ? new Date(publishedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'Just now'}{' '}
                ·{' '}
                <span className="inline-block h-3 w-3 rounded-full bg-gray-400 dark:bg-[#b0b3b8]" />
              </div>
            </div>
          </div>
          <button
            type="button"
            className="rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-[#3a3b3c]"
          >
            <MoreHorizontal className="h-5 w-5 text-gray-500 dark:text-[#b0b3b8]" />
          </button>
        </div>

        {/* Content */}
        <div className="whitespace-pre-wrap break-words px-3 pb-3 text-[15px]">
          {content || 'Your Facebook post content will appear here...'}
        </div>

        {/* Media */}
        {mediaUrls.length > 0 && contentType !== 'poll' && (
          <div className="relative border-y border-gray-100 bg-black dark:border-[#3e4042]">
            {contentType === 'carousel' && mediaUrls.length > 1 ? (
              // Carousel layout for multiple images
              <div className="relative">
                <div className="grid grid-cols-2 gap-0.5">
                  {mediaUrls.slice(0, 4).map((url, index) => (
                    <div
                      key={index}
                      className={`relative aspect-square overflow-hidden bg-gray-200 dark:bg-[#3a3b3c] ${
                        mediaUrls.length === 3 && index === 0 ? 'row-span-2 aspect-auto' : ''
                      }`}
                    >
                      {url.includes('video') || url.includes('.mp4') ? (
                        <video src={url} className="h-full w-full object-cover" />
                      ) : (
                        <img
                          src={url}
                          alt="Facebook carousel media"
                          className="h-full w-full object-cover"
                        />
                      )}
                      {/* Carousel indicator */}
                      {index === 0 && mediaUrls.length > 4 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <span className="text-lg font-bold text-white">
                            +{mediaUrls.length - 4}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {/* Carousel dots indicator */}
                {mediaUrls.length > 1 && (
                  <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 transform gap-1">
                    {mediaUrls.slice(0, Math.min(5, mediaUrls.length)).map((_, index) => (
                      <div
                        key={index}
                        className={`h-2 w-2 rounded-full ${
                          index === 0 ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Single media or regular post layout
              <div
                className={`grid gap-0.5 ${mediaUrls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}
              >
                {mediaUrls.slice(0, 4).map((url, index) => (
                  <div
                    key={index}
                    className={`relative aspect-square overflow-hidden bg-gray-200 dark:bg-[#3a3b3c] ${
                      mediaUrls.length === 3 && index === 0 ? 'row-span-2 aspect-auto' : ''
                    }`}
                  >
                    {url.includes('video') || url.includes('.mp4') ? (
                      <video src={url} className="h-full w-full object-cover" />
                    ) : (
                      <img
                        src={url}
                        alt="Facebook post media"
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Poll */}
        {contentType === 'poll' && pollOptions.length >= 2 && (
          <div className="mx-3 mb-3 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-[#3e4042] dark:bg-[#3a3b3c]">
            <div className="border-b border-gray-200 bg-white p-3 dark:border-[#3e4042] dark:bg-[#242526]">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900 dark:text-[#e4e6eb]">
                  📊 Encuesta
                </span>
                <div className="text-xs text-gray-500 dark:text-[#b0b3b8]">
                  {pollDuration < 24
                    ? `${pollDuration} hora${pollDuration !== 1 ? 's' : ''} restante${pollDuration !== 1 ? 's' : ''}`
                    : `${Math.floor(pollDuration / 24)} día${Math.floor(pollDuration / 24) !== 1 ? 's' : ''} restante${Math.floor(pollDuration / 24) !== 1 ? 's' : ''}`}{' '}
                  · 0 votos
                </div>
              </div>
            </div>
            {pollOptions
              .filter((option) => option.trim())
              .map((option, index) => (
                <div
                  key={index}
                  className="flex cursor-pointer items-center justify-between border-b border-gray-200 p-3 transition-colors last:border-b-0 hover:bg-gray-100 dark:border-[#3e4042] dark:hover:bg-[#4e4f50]"
                >
                  <div className="flex flex-1 items-center gap-3">
                    <div className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-blue-500">
                      <div className="h-2 w-2 rounded-full bg-blue-500 opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                    <span className="text-sm text-gray-900 dark:text-[#e4e6eb]">{option}</span>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-[#b0b3b8]">0%</span>
                </div>
              ))}
          </div>
        )}

        {/* Footer Stats */}
        <div className="mx-3 flex items-center justify-between border-b border-gray-200 px-3 py-2 text-[13px] text-gray-500 dark:border-[#3e4042] dark:text-[#b0b3b8]">
          <div className="flex items-center gap-1">
            <div className="flex -space-x-1">
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 ring-1 ring-white dark:ring-[#242526]">
                <ThumbsUp className="h-2.5 w-2.5 fill-white text-white" />
              </div>
            </div>
            <span>0</span>
          </div>
          <div className="flex gap-3">
            <span>0 comments</span>
            <span>0 shares</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 px-1 py-1">
          <button
            type="button"
            className="flex flex-1 items-center justify-center gap-2 rounded-md py-1.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100 dark:text-[#b0b3b8] dark:hover:bg-[#3a3b3c]"
          >
            <ThumbsUp className="h-5 w-5" /> Like
          </button>
          <button
            type="button"
            className="flex flex-1 items-center justify-center gap-2 rounded-md py-1.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100 dark:text-[#b0b3b8] dark:hover:bg-[#3a3b3c]"
          >
            <MessageSquare className="h-5 w-5" /> Comment
          </button>
          <button
            type="button"
            className="flex flex-1 items-center justify-center gap-2 rounded-md py-1.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100 dark:text-[#b0b3b8] dark:hover:bg-[#3a3b3c]"
          >
            <Share2 className="h-5 w-5" /> Share
          </button>
        </div>
      </div>
    );
  },
);
