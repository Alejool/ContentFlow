import React from "react";
import Skeleton from "@/Components/common/ui/Skeleton";

const StatCardSkeleton = ({ compact = false }: { compact?: boolean }) => {
    return (
        <div className={`rounded-lg overflow-hidden border border-gray-100 dark:border-neutral-700/50 bg-white/60 dark:bg-neutral-800/50 backdrop-blur-sm`}>
            {/* Header Skeleton */}
            <div className={`bg-gray-100 dark:bg-neutral-700/30 ${compact ? "p-3" : "p-4"}`}>
                <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-24 rounded" />
                    <Skeleton className={`${compact ? "w-6 h-6" : "w-8 h-8"} rounded-lg`} />
                </div>
            </div>

            {/* Content Skeleton */}
            <div className={compact ? "p-4" : "p-6"}>
                <div className="flex flex-col space-y-4">
                    <Skeleton className={`${compact ? "h-8 w-20" : "h-10 w-24"} rounded`} />
                    <Skeleton className="h-8 w-full rounded-lg" />

                    <div className="flex items-center pt-2">
                        <Skeleton className="h-2 flex-1 rounded-full" />
                        <Skeleton className="ml-2 h-6 w-12 rounded" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatCardSkeleton;
