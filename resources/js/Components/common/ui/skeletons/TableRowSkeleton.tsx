import React from "react";
import Skeleton from "@/Components/common/ui/Skeleton";

interface TableRowSkeletonProps {
  columns?: number;
  hasActions?: boolean;
}

const TableRowSkeleton = ({ columns = 5, hasActions = true }: TableRowSkeletonProps) => {
  return (
    <tr className="border-b border-gray-50 dark:border-neutral-800">
      {Array.from({ length: columns }).map((_, index) => (
        <td key={index} className="px-6 py-4">
          {index === 0 ? (
            <div className="flex items-center gap-3">
              <Skeleton variant="circle" className="h-10 w-10 flex-shrink-0" />
              <Skeleton className="h-4 w-32" />
            </div>
          ) : (
            <Skeleton className="h-4 w-24" />
          )}
        </td>
      ))}
      {hasActions && (
        <td className="px-6 py-4">
          <div className="flex items-center justify-end gap-2">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </td>
      )}
    </tr>
  );
};

export default TableRowSkeleton;
