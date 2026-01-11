import React from "react";
import Skeleton from "@/Components/common/ui/Skeleton";

const CampaignMobileRowSkeleton = () => {
    return (
        <div className="rounded-lg border bg-white border-gray-200 dark:bg-neutral-800 dark:border-neutral-700 p-4 space-y-4">
            <div className="flex justify-between items-start">
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4 rounded" />
                    <Skeleton className="h-4 w-1/2 rounded" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
            </div>

            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <Skeleton variant="circle" className="h-4 w-4" />
                    <Skeleton className="h-4 w-24" />
                </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-neutral-700/50">
                <Skeleton className="h-8 w-32 rounded-xl" />
                <div className="flex gap-2">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
            </div>
        </div>
    );
};

export default CampaignMobileRowSkeleton;
