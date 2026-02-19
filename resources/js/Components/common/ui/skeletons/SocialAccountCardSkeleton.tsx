import React from "react";
import Skeleton from "@/Components/common/ui/Skeleton";

const SocialAccountCardSkeleton = () => {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-100 dark:border-neutral-700 p-4">
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <Skeleton variant="circle" className="w-12 h-12 flex-shrink-0" />
        
        {/* Content */}
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        
        {/* Action Button */}
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>
    </div>
  );
};

export default SocialAccountCardSkeleton;
