import React from 'react';
import Skeleton from '@/Components/common/ui/Skeleton';

const CalendarEventSkeleton = () => {
  return (
    <div className="space-y-2 p-2">
      <Skeleton className="h-16 w-full rounded-lg" />
      <Skeleton className="h-16 w-full rounded-lg" />
      <Skeleton className="h-16 w-full rounded-lg" />
    </div>
  );
};

export default CalendarEventSkeleton;
