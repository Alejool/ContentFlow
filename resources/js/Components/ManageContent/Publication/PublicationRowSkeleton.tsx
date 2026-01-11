import React from "react";
import Skeleton from "@/Components/common/ui/Skeleton";

const PublicationRowSkeleton = () => {
    return (
        <tr className="border-b border-gray-50 dark:border-neutral-800">
            <td className="px-2 py-4 text-center"></td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-4">
                    <Skeleton className="w-12 h-12 rounded-lg flex-shrink-0" />
                    <div className="min-w-0 flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                </div>
            </td>
            <td className="px-6 py-4">
                <Skeleton variant="circle" className="h-8 w-8" />
            </td>
            <td className="px-6 py-4">
                <Skeleton className="h-6 w-20 rounded-full" />
            </td>
            <td className="px-6 py-4">
                <div className="flex gap-2">
                    <Skeleton className="h-4 w-8" />
                    <Skeleton className="h-4 w-8" />
                </div>
            </td>
            <td className="px-6 py-4">
                <Skeleton className="h-6 w-24 rounded" />
            </td>
            <td className="px-6 py-4">
                <div className="flex gap-2 justify-end">
                    <Skeleton className="h-6 w-12 rounded" />
                </div>
            </td>
            <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                </div>
            </td>
        </tr>
    );
};

export default PublicationRowSkeleton;
