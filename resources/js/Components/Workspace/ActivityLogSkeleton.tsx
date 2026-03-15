import Skeleton from "@/Components/common/ui/Skeleton";

interface ActivityLogSkeletonProps {
  rows?: number;
}

const ActivityLogSkeleton = ({ rows = 5 }: ActivityLogSkeletonProps) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, index) => (
        <tr key={index} className="animate-pulse border-b border-gray-50 dark:border-neutral-800">
          <td className="whitespace-nowrap px-6 py-4">
            <Skeleton className="h-4 w-32" />
          </td>
          <td className="whitespace-nowrap px-6 py-4 text-center">
            <Skeleton className="mx-auto h-4 w-16" />
          </td>
          <td className="whitespace-nowrap px-6 py-4">
            <div className="flex flex-col gap-1">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
          </td>
          <td className="whitespace-nowrap px-6 py-4 text-center">
            <Skeleton className="mx-auto h-6 w-20 rounded-full" />
          </td>
          <td className="whitespace-nowrap px-6 py-4">
            <Skeleton className="h-4 w-24" />
          </td>
        </tr>
      ))}
    </>
  );
};

export default ActivityLogSkeleton;
