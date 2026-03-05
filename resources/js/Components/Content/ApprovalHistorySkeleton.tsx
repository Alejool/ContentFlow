import Skeleton from "@/Components/common/ui/Skeleton";

const ApprovalHistorySkeleton = () => {
  return (
    <tr className="border-b border-gray-50 dark:border-neutral-700/50">
      {/* Publication Title */}
      <td className="px-6 py-4">
        <Skeleton className="h-5 w-48 bg-gray-200 dark:bg-neutral-700 rounded" />
      </td>
      {/* Requester */}
      <td className="px-6 py-4">
        <Skeleton className="h-5 w-32 bg-gray-200 dark:bg-neutral-700 rounded" />
      </td>
      {/* Requested At */}
      <td className="px-6 py-4">
        <Skeleton className="h-4 w-24 bg-gray-200 dark:bg-neutral-700 rounded" />
      </td>
      {/* Reviewer */}
      <td className="px-6 py-4">
        <div className="space-y-1">
          <Skeleton className="h-5 w-32 bg-gray-200 dark:bg-neutral-700 rounded" />
          <Skeleton className="h-3 w-24 bg-gray-200 dark:bg-neutral-700 rounded" />
        </div>
      </td>
      {/* Action Badge */}
      <td className="px-6 py-4">
        <div className="flex flex-col gap-1">
          <Skeleton className="h-6 w-20 bg-gray-200 dark:bg-neutral-700 rounded-full" />
        </div>
      </td>
    </tr>
  );
};

export default ApprovalHistorySkeleton;
