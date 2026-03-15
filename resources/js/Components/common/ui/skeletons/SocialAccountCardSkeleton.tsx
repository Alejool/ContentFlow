import React from "react";
import Skeleton from "@/Components/common/ui/Skeleton";

const SocialAccountCardSkeleton = () => {
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <Skeleton variant="circle" className="h-12 w-12 flex-shrink-0" />

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
