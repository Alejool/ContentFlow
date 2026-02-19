import React from "react";
import Skeleton from "@/Components/common/ui/Skeleton";

const CalendarEventSkeleton = () => {
  return (
    <div className="p-2 space-y-2">
      <Skeleton className="h-16 w-full rounded-lg" />
      <Skeleton className="h-16 w-full rounded-lg" />
      <Skeleton className="h-16 w-full rounded-lg" />
    </div>
  );
};

export default CalendarEventSkeleton;
