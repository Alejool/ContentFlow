import React from "react";
import Skeleton from "@/Components/common/ui/Skeleton";

const ContentCardSkeleton = () => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col h-full">
            {/* Thumbnail Section */}
            <Skeleton className="h-40 w-full rounded-none" />

            {/* Content Section */}
            <div className="p-4 flex-1 flex flex-col space-y-4">
                <div className="space-y-2">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-2/3" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                </div>

                {/* Actions Footer */}
                <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-2 mt-auto">
                    <div className="flex items-center gap-1 flex-1">
                        <Skeleton className="h-10 flex-1 rounded-lg" />
                        <Skeleton className="h-10 w-16 rounded-lg" />
                    </div>
                    <div className="flex items-center gap-1">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <Skeleton className="h-10 w-10 rounded-lg" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContentCardSkeleton;
