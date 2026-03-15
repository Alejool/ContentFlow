import React from "react";
import Skeleton from "@/Components/common/ui/Skeleton";

const AnalyticsCardSkeleton = () => {
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton variant="circle" className="h-8 w-8" />
        </div>

        {/* Main Value */}
        <Skeleton className="h-10 w-24" />

        {/* Chart Area */}
        <Skeleton className="h-32 w-full rounded-lg" />

        {/* Footer Stats */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-2 dark:border-gray-700">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
};

export default AnalyticsCardSkeleton;
