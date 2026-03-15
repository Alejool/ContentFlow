import Skeleton from '@/Components/common/ui/Skeleton';

const CampaignMobileRowSkeleton = () => {
  return (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4 rounded" />
          <Skeleton className="h-4 w-1/2 rounded" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Skeleton variant="circle" className="h-4 w-4" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-gray-100 pt-2 dark:border-neutral-700/50">
        <Skeleton className="h-8 w-32 rounded-lg" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </div>
    </div>
  );
};

export default CampaignMobileRowSkeleton;
