import React from "react";
import Skeleton from "@/Components/common/ui/Skeleton";

interface GridSkeletonProps {
  items?: number;
  columns?: 2 | 3 | 4;
  cardHeight?: string;
}

const GridSkeleton = ({ items = 6, columns = 3, cardHeight = "h-64" }: GridSkeletonProps) => {
  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-4`}>
      {Array.from({ length: items }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-lg border border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800"
        >
          <Skeleton className={`${cardHeight} w-full rounded-none`} />
          <div className="space-y-3 p-4">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex items-center gap-2 pt-2">
              <Skeleton className="h-8 flex-1 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default GridSkeleton;
