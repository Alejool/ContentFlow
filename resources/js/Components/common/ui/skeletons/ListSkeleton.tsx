import React from "react";
import Skeleton from "@/Components/common/ui/Skeleton";

interface ListSkeletonProps {
  items?: number;
  hasAvatar?: boolean;
  hasActions?: boolean;
}

const ListSkeleton = ({ items = 5, hasAvatar = true, hasActions = true }: ListSkeletonProps) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700"
        >
          {hasAvatar && <Skeleton variant="circle" className="w-10 h-10 flex-shrink-0" />}
          
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          
          {hasActions && (
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ListSkeleton;
