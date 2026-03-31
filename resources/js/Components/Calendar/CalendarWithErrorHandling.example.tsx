/**
 * Example: Calendar Component with Complete Error Handling
 *
 * This example demonstrates how to integrate all error handling components
 * into a calendar view.
 */

import { useCalendarStore } from '@/stores/calendarStore';
import type { SyncError } from '@/types/errors';
import { validateDate } from '@/Utils/dateValidation';
import React, { useState } from 'react';
import { CalendarErrorBoundary } from './CalendarErrorBoundary';
import { ConflictResolutionModal } from './ConflictResolutionModal';
import { SyncErrorList } from './SyncErrorDisplay';

export const CalendarWithErrorHandling: React.FC = () => {
  const { events, conflict, setConflict, resolveConflict, updateEvent } = useCalendarStore();

  const [syncErrors, setSyncErrors] = useState<SyncError[]>([]);

  // Handle event update with validation
  const handleEventUpdate = async (_eventId: string, newDate: string, _type: string) => {
    const validation = validateDate(newDate);

    if (!validation.isValid) {
      console.error('Invalid date:', validation.error);
      return;
    }

    if (validation.isPastDate && validation.warning) {
      const confirmed = window.confirm(validation.warning);
      if (!confirmed) return;
    }

    await updateEvent(_eventId, newDate, _type);
  };

  // Handle conflict resolution
  const handleConflictResolve = async (resolution: 'local' | 'server') => {
    await resolveConflict(resolution);
  };

  // Handle sync error retry
  const handleSyncRetry = async (_error: SyncError) => {};

  return (
    <CalendarErrorBoundary>
      <div className="calendar-container">
        {syncErrors.length > 0 && (
          <div className="mb-4">
            <SyncErrorList
              errors={syncErrors}
              onRetry={handleSyncRetry}
              onDismiss={(error) => {
                setSyncErrors((errors) => errors.filter((e) => e !== error));
              }}
              onDismissAll={() => setSyncErrors([])}
            />
          </div>
        )}

        <div className="calendar-grid">
          {events.map((event) => (
            <button
              key={event.id}
              type="button"
              onClick={() => handleEventUpdate(event.id, event.date ?? '', event.type ?? '')}
              className="text-left"
            >
              {event.title}
            </button>
          ))}
        </div>

        {conflict && (
          <ConflictResolutionModal
            conflict={conflict}
            event={events.find((e) => e.id === conflict.eventId)}
            onResolve={handleConflictResolve}
            onCancel={() => setConflict(null)}
            isOpen={true}
          />
        )}
      </div>
    </CalendarErrorBoundary>
  );
};

/**
 * Usage in Calendar Page:
 *
 * import { CalendarWithErrorHandling } from '@/Components/Calendar/CalendarWithErrorHandling.example';
 *
 * function CalendarPage() {
 *   return (
 *     <div>
 *       <CalendarWithErrorHandling />
 *     </div>
 *   );
 * }
 */
