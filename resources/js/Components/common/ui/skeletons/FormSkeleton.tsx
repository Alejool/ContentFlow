import React from "react";
import Skeleton from "@/Components/common/ui/Skeleton";

interface FormSkeletonProps {
  fields?: number;
  hasSubmitButton?: boolean;
}

const FormSkeleton = ({ fields = 4, hasSubmitButton = true }: FormSkeletonProps) => {
  return (
    <div className="space-y-6">
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ))}
      
      {hasSubmitButton && (
        <div className="flex justify-end pt-4">
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
      )}
    </div>
  );
};

export default FormSkeleton;
