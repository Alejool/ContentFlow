import React from "react";
import Skeleton from "@/Components/common/ui/Skeleton";

const AnalyticsCardSkeleton = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton variant="circle" className="w-8 h-8" />
        </div>
        
        {/* Main Value */}
        <Skeleton className="h-10 w-24" />
        
        {/* Chart Area */}
        <Skeleton className="h-32 w-full rounded-lg" />
        
        {/* Footer Stats */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
};

export default AnalyticsCardSkeleton;
