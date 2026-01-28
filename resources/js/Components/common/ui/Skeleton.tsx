import React from "react";

interface SkeletonProps {
    className?: string;
    variant?: "rectangle" | "circle" | "text";
    shimmer?: boolean;
}

const Skeleton = ({
    className = "",
    variant = "rectangle",
    shimmer = true
}: SkeletonProps) => {
    const baseClasses = "bg-gray-200 dark:bg-neutral-700 overflow-hidden relative";

    const variantClasses = {
        rectangle: "rounded-lg",
        circle: "rounded-full",
        text: "rounded h-3 w-full",
    };

    return (
        <div
            className={`
        ${baseClasses} 
        ${variantClasses[variant]} 
        ${className}
      `}
        >
            {shimmer && (
                <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent" />
            )}
        </div>
    );
};

export default Skeleton;
