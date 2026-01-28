import React from "react";
import Skeleton from "@/Components/common/ui/Skeleton";

const CampaignRowSkeleton = () => {
    return (
        <tr className="border-b border-gray-50 dark:border-neutral-800">
            <td className="px-2 py-4 text-center">
                <Skeleton variant="circle" className="h-4 w-4 mx-auto" shimmer={true} />
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-4">
                    <Skeleton className="w-12 h-12 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                </div>
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <Skeleton variant="circle" className="h-8 w-8" />
                    <Skeleton className="h-4 w-24" />
                </div>
            </td>
            <td className="px-6 py-4">
                <Skeleton className="h-6 w-20 rounded-full" />
            </td>
            <td className="px-6 py-4">
                <Skeleton className="h-4 w-12" />
            </td>
            <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
            </td>
        </tr>
    );
};

export default CampaignRowSkeleton;
