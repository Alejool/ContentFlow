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
      <div className="flex h-[300px] items-center justify-center">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  const formatTitle = (rawTitle: string) => {
    const parts = rawTitle.split(' - ');
    if (parts.length >= 2) {
      return (
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold tracking-wider text-primary-600 dark:text-primary-400">
            {parts[0]}
          </span>
          <span className="line-clamp-1 font-semibold text-gray-900 dark:text-white">
            {parts[1]}
          </span>
        </div>
      );
    }
    return <span className="line-clamp-1 font-semibold text-gray-900 dark:text-white">{rawTitle}</span>;
  };

  return (
    <div className="flex flex-col gap-4">
      {posts.map((post, index) => (
        <div
          key={post.id}
          className={`flex flex-col gap-3 sm:flex-row sm:items-center justify-between rounded-xl border p-4 transition-all hover:-translate-y-1 hover:shadow-md ${
            isDark
              ? 'border-gray-800 bg-gray-800/50 hover:border-gray-700'
              : 'border-gray-100 bg-gray-50 hover:border-gray-200'
          }`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-bold ${
                index === 0
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-500'
                  : index === 1
                  ? 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                  : index === 2
                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-600'
                  : 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-500'
              }`}
            >
              #{index + 1}
            </div>
            <div>
              {formatTitle(post.title)}
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {post.published_at}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
              <Eye className="h-4 w-4 text-blue-500" />
              <span>{post.views.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
              <MousePointer2 className="h-4 w-4 text-purple-500" />
              <span>{post.clicks.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
              <Heart className="h-4 w-4 text-rose-500" />
              <span className="font-semibold">{post.engagement.toLocaleString()}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
