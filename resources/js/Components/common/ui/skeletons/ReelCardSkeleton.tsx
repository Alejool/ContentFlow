import React from "react";
import Skeleton from "@/Components/common/ui/Skeleton";

const ReelCardSkeleton = () => {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      {/* Video Preview */}
      <Skeleton className="h-64 w-full rounded-none" />

      {/* Content */}
      <div className="space-y-3 p-4">
        <Skeleton className="h-5 w-3/4" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          <Skeleton className="h-9 flex-1 rounded-lg" />
          <Skeleton className="h-9 w-9 rounded-lg" />
        </div>
      </div>
    </div>
  );
};

export default ReelCardSkeleton;
