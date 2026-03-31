import Skeleton from '@/Components/common/ui/Skeleton';

const ContentCardSkeleton = () => {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      {/* Thumbnail Section */}
      <Skeleton className="h-40 w-full rounded-none" />

      {/* Content Section */}
      <div className="flex flex-1 flex-col space-y-4 p-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-2/3" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>

        {/* Actions Footer */}
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-gray-100 pt-4 dark:border-gray-700">
          <div className="flex flex-1 items-center gap-1">
            <Skeleton className="h-10 flex-1 rounded-lg" />
            <Skeleton className="h-10 w-16 rounded-lg" />
          </div>
          <div className="flex items-center gap-1">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-10 w-10 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentCardSkeleton;
