import Skeleton from "@/Components/common/ui/Skeleton";

const PublicationMobileRowSkeleton = () => {
  return (
    <div className="w-full space-y-3 px-1">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="relative overflow-hidden rounded-2xl border border-gray-100 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 p-4 shadow-sm"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Skeleton className="w-12 h-12 rounded-lg flex-shrink-0" />
              <div className="flex-1 min-w-0 space-y-2">
                <Skeleton className="h-4 w-3/4 rounded" />
                <div className="flex gap-2">
                  <Skeleton className="h-4 w-16 rounded-full" />
                  <Skeleton className="h-4 w-12 rounded" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="w-8 h-8 rounded-xl" />
              <Skeleton className="w-4 h-4 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PublicationMobileRowSkeleton;
