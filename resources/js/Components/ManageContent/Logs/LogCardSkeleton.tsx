import React from "react";
import Skeleton from "@/Components/common/ui/Skeleton";

const LogCardSkeleton = () => {
    return (
        <div className="p-4 border-b border-gray-100 dark:border-neutral-700/50 space-y-4">
            <div className="flex justify-between items-start">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-20 rounded" />
            </div>
            <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-16 rounded" />
                <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-4 w-full" />
            <div className="space-y-2">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-40" />
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-neutral-700/50">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
        </div>
    );
};

export default LogCardSkeleton;
