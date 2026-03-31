import { Avatar } from '@/Components/common/Avatar';
import { Scissors, Share2, ThumbsDown, ThumbsUp } from 'lucide-react';
import { memo } from 'react';

interface YouTubePreviewProps {
  content: string;
  mediaUrls: string[];
  user?: {
    name: string;
    avatar?: string;
  };
  title?: string;
  publishedAt?: string;
}

export const YouTubePreview = memo(
  ({ content, mediaUrls, user, title, publishedAt }: YouTubePreviewProps) => {
    const videoUrl = mediaUrls.find((url) => url.includes('video') || url.includes('.mp4'));
    const imageUrl = mediaUrls.find((url) => !url.includes('video') && !url.includes('.mp4'));

    return (
      <div className="w-full max-w-[640px] overflow-hidden rounded-lg border border-gray-200 bg-white text-gray-900 shadow-sm dark:border-neutral-800 dark:bg-[#0f0f0f] dark:text-white">
        {/* Video Player Area */}
        <div className="relative flex aspect-video items-center justify-center bg-black">
          {videoUrl ? (
            <div className="relative h-full w-full">
              <video src={videoUrl} className="h-full w-full object-contain" controls />
              {/* YouTube Short indicator for vertical videos */}
              <div className="absolute left-3 top-3 flex items-center gap-1 rounded bg-red-600 px-2 py-1 text-xs font-bold text-white">
                ▶️ <span>SHORT</span>
              </div>
            </div>
          ) : imageUrl ? (
            <div className="relative h-full w-full">
              <img
                src={imageUrl}
                className="h-full w-full object-contain"
                alt="YouTube video thumbnail"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <div className="flex h-12 w-16 items-center justify-center rounded-lg bg-red-600 shadow-lg">
                  <div className="ml-1 h-0 w-0 border-b-[8px] border-l-[14px] border-t-[8px] border-b-transparent border-l-white border-t-transparent" />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-white/20">Video Preview Area</div>
          )}
        </div>

        {/* Info Area */}
        <div className="space-y-3 p-4">
          <h1 className="line-clamp-2 text-lg font-bold leading-tight">
            {title || 'Your YouTube video title will appear here...'}
          </h1>

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            {/* Channel Info */}
            <div className="flex items-center gap-3">
              <Avatar src={user?.avatar} name={user?.name || 'User'} size="md" />
              <div className="flex flex-col">
                <span className="text-[15px] font-bold">{user?.name || 'Intellipost User'}</span>
                <span className="text-xs text-gray-500 dark:text-neutral-400">0 subscribers</span>
              </div>
              <button
                type="button"
                className="ml-2 rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 dark:bg-white dark:text-black"
              >
                Subscribe
              </button>
            </div>

            {/* Video Actions */}
            <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
              <div className="flex items-center rounded-full bg-gray-100 dark:bg-neutral-800">
                <button
                  type="button"
                  className="flex items-center gap-2 border-r border-gray-300 px-3 py-1.5 hover:bg-gray-200 dark:border-neutral-700 dark:hover:bg-neutral-700"
                >
                  <ThumbsUp className="h-4 w-4" /> <span className="text-xs font-semibold">0</span>
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 hover:bg-gray-200 dark:hover:bg-neutral-700"
                >
                  <ThumbsDown className="h-4 w-4" />
                </button>
              </div>
              <button
                type="button"
                className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700"
              >
                <Share2 className="h-4 w-4" /> <span className="text-xs font-semibold">Share</span>
              </button>
              <button
                type="button"
                className="hidden items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 lg:flex"
              >
                <Scissors className="h-4 w-4" /> <span className="text-xs font-semibold">Clip</span>
              </button>
            </div>
          </div>

          {/* Description Box */}
          <div className="cursor-pointer rounded-lg bg-gray-100 p-3 text-[13px] transition-colors hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700">
            <div className="mb-1 font-bold">
              0 views{' '}
              {publishedAt
                ? new Date(publishedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'Not published yet'}
            </div>
            <div className="line-clamp-3 whitespace-pre-wrap">
              {content || 'Your video description will appear here...'}
            </div>
            <button type="button" className="mt-2 font-bold text-gray-900 dark:text-white">
              Show more
            </button>
          </div>
        </div>
      </div>
    );
  },
);
