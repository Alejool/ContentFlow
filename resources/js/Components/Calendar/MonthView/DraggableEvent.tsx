import { EventCard } from '@/Components/Calendar/EventCard';
import { useDraggable } from '@dnd-kit/core';
import React from 'react';
import { monthViewDefaultT } from '@/Components/Calendar/MonthView/types';
import type { DraggableEventProps } from '@/Components/Calendar/MonthView/types';

export const DraggableEvent: React.FC<DraggableEventProps> = ({
  event,
  isSelected,
  onToggleSelection,
  onEventClick,
  onEventDelete,
  currentUser,
  t = monthViewDefaultT,
}) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: event.id,
    data: { event },
  });

  return (
    <div ref={setNodeRef}>
      <EventCard
        event={event}
        isSelected={isSelected}
        isDragging={isDragging}
        onToggleSelection={onToggleSelection}
        onEventClick={onEventClick}
        onEventDelete={onEventDelete}
        currentUser={currentUser}
        t={t}
        dragHandleProps={{ ...listeners, ...attributes }}
      />
    </div>
  );
};
