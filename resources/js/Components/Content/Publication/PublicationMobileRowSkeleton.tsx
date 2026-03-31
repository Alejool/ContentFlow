import Skeleton from '@/Components/common/ui/Skeleton';

const PublicationMobileRowSkeleton = () => {
  return (
    <div className="w-full space-y-3 px-1">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="relative overflow-hidden rounded-lg border border-gray-100 bg-white/80 p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/80"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Skeleton className="h-12 w-12 flex-shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4 rounded" />
                <div className="flex gap-2">
                  <Skeleton className="h-4 w-16 rounded-full" />
                  <Skeleton className="h-4 w-12 rounded" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-4 w-4 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PublicationMobileRowSkeleton;
