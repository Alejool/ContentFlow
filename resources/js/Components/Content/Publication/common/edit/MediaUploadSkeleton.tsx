import React from "react";

export default function MediaUploadSkeleton() {
    return (
        <div className="space-y-4 animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-neutral-700 rounded w-24"></div>
            <div className="min-h-[200px] rounded-lg border-2 border-dashed border-gray-200 dark:border-neutral-600 bg-gray-50 dark:bg-neutral-700 flex items-center justify-center">
                <div className="text-center space-y-3">
                    <div className="w-16 h-16 rounded-full bg-gray-300 dark:bg-neutral-600 mx-auto"></div>
                    <div className="h-4 bg-gray-300 dark:bg-neutral-600 rounded w-32 mx-auto"></div>
                    <div className="h-3 bg-gray-200 dark:bg-neutral-700 rounded w-48 mx-auto"></div>
                </div>
            </div>
        </div>
    );
}
