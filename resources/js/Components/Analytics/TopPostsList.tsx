import { useTheme } from '@/Hooks/Layout/useTheme';
import { useTranslation } from 'react-i18next';
import { ExternalLink, Heart, MousePointer2, Eye } from 'lucide-react';

interface PostData {
  id: number;
  title: string;
  type: string;
  views: number;
  clicks: number;
  engagement: number;
  published_at: string;
}

interface TopPostsListProps {
  posts: PostData[];
}

export default function TopPostsList({ posts }: TopPostsListProps) {
  const { t } = useTranslation();
  const { actualTheme: theme } = useTheme();
  const isDark = theme === 'dark';

  if (!posts || posts.length === 0) {
    return (
      <div className="flex h-75 items-center justify-center">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  const formatTitle = (rawTitle: string) => {
    const parts = rawTitle.split(' - ');
    if (parts.length >= 2) {
      return (
        <div className="flex flex-col min-w-0 group">
          <span className="text-2xs uppercase font-bold tracking-wider text-primary-600 dark:text-primary-400 truncate">
            {parts[0]}
          </span>
          <a href="#" className="truncate font-semibold text-gray-900 dark:text-white group-hover:text-primary-500 transition-colors flex items-center gap-1.5">
            <span className="truncate">{parts[1]}</span>
            <ExternalLink className="h-3 w-3 shrink-0 opacity-50 group-hover:opacity-100" />
          </a>
        </div>
      );
    }
    return (
      <a href="#" className="flex items-center gap-1.5 font-semibold text-gray-900 dark:text-white hover:text-primary-500 transition-colors group">
        <span className="truncate block">{rawTitle}</span>
        <ExternalLink className="h-3 w-3 shrink-0 opacity-50 group-hover:opacity-100" />
      </a>
    );
  };

  const displayPosts = posts.slice(0, 5);

  return (
    <div className="flex flex-col gap-4">
      {displayPosts.map((post, index) => (
        <div
          key={post.id}
          className={`flex flex-col gap-3 rounded-lg border p-4 transition-all hover:-translate-y-1 hover:shadow-md ${
            isDark
              ? 'border-gray-800 bg-gray-800/50 hover:border-gray-700'
              : 'border-gray-100 bg-gray-50 hover:border-gray-200'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold ${
                index === 0
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-500'
                  : index === 1
                  ? 'bg-gray-200 text-gray-700 dark:bg-neutral-800 dark:text-neutral-400'
                  : index === 2
                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-600'
                  : 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-500'
              }`}
            >
              #{index + 1}
            </div>
            <div className="min-w-0 flex-1">
              {formatTitle(post.title)}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-3xs uppercase font-bold text-gray-500 bg-gray-100 dark:bg-neutral-800 dark:text-neutral-400 px-1.5 py-0.5 rounded">
                  {post.type}
                </span>
                <p className="text-[11px] text-gray-500 dark:text-neutral-400 truncate">
                  {post.published_at}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 text-sm mt-1">
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-neutral-300">
              <Eye className="h-4 w-4 shrink-0 text-blue-500" />
              <span className="truncate">{post.views.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-neutral-300">
              <MousePointer2 className="h-4 w-4 shrink-0 text-purple-500" />
              <span className="truncate">{post.clicks.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-neutral-300">
              <Heart className="h-4 w-4 shrink-0 text-rose-500" />
              <span className="font-semibold truncate">{post.engagement.toLocaleString()}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
