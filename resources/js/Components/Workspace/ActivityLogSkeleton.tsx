import Skeleton from "@/Components/common/ui/Skeleton";

interface ActivityLogSkeletonProps {
  rows?: number;
}

const ActivityLogSkeleton = ({ rows = 5 }: ActivityLogSkeletonProps) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, index) => (
        <tr
          key={index}
          className="border-b border-gray-50 dark:border-neutral-800 animate-pulse"
        >
          <td className="px-6 py-4 whitespace-nowrap">
            <Skeleton className="h-4 w-32" />
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-center">
            <Skeleton className="h-4 w-16 mx-auto" />
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex flex-col gap-1">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-center">
            <Skeleton className="h-6 w-20 rounded-full mx-auto" />
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <Skeleton className="h-4 w-24" />
          </td>
        </tr>
      ))}
    </>
  );
};

export default ActivityLogSkeleton;
