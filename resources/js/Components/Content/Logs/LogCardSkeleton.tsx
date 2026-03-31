import Skeleton from '@/Components/common/ui/Skeleton';

const LogCardSkeleton = () => {
  return (
    <div className="space-y-4 border-b border-gray-100 p-4 dark:border-neutral-700/50">
      <div className="flex items-start justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-20 rounded" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-16 rounded" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-4 w-full" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-40" />
      </div>
      <div className="flex items-center justify-between border-t border-gray-100 pt-3 dark:border-neutral-700/50">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
    </div>
  );
};

export default LogCardSkeleton;
