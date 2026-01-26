import React from "react";
import Skeleton from "@/Components/common/ui/Skeleton";

const LogRowSkeleton = () => {
    return (
        <tr className="border-b border-gray-100 dark:border-neutral-700/50">
            <td className="px-4 py-3">
                <Skeleton className="h-4 w-24" />
            </td>
            <td className="px-4 py-3">
                <div className="space-y-1">
                    <Skeleton className="h-5 w-16 rounded" />
                    <Skeleton className="h-3 w-20" />
                </div>
            </td>
            <td className="px-4 py-3">
                <div className="space-y-1">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-32" />
                </div>
            </td>
            <td className="px-4 py-3">
                <Skeleton className="h-6 w-24 rounded" />
            </td>
            <td className="px-4 py-3">
                <Skeleton className="h-4 w-full" />
            </td>
            <td className="px-4 py-3 text-center">
                <Skeleton className="h-8 w-8 rounded-lg mx-auto" />
            </td>
        </tr>
    );
};

export default LogRowSkeleton;
