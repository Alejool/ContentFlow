import axios from 'axios';

export interface CalendarEventUpdatePayload {
  scheduled_at: string;
  type?: string | undefined;
  current_version: unknown;
}

export interface BulkOperationResponse {
  success: boolean;
  data?: Record<string, unknown> | null;
}

export interface CalendarExportEvent {
  title: string;
  start: string | Date;
  end?: string | Date | undefined;
  description?: string | undefined;
}

export const calendarService = {
  getEvents: <TEvent = unknown>(params: Record<string, unknown>): Promise<TEvent[]> =>
    axios.get('/api/v1/calendar/events', { params }).then((r) => r.data.data || []),

  updateEvent: (resourceId: string, payload: CalendarEventUpdatePayload): Promise<void> =>
    axios.patch(`/api/v1/calendar/events/${resourceId}`, payload).then(() => undefined),

  bulkUpdate: (
    eventIds: string[],
    newDate: string,
    operation: 'move' | 'delete',
  ): Promise<BulkOperationResponse> =>
    axios
      .post('/api/v1/calendar/bulk-update', {
        event_ids: eventIds,
        new_date: newDate,
        operation,
      })
      .then((r) => r.data),

  bulkUndo: (): Promise<BulkOperationResponse> =>
    axios.post('/api/v1/calendar/bulk-undo').then((r) => r.data),

  deleteUserEvent: (resourceId: string): Promise<void> =>
    axios.delete(`/api/v1/calendar/user-events/${resourceId}`).then(() => undefined),

  deleteScheduledPost: (resourceId: string): Promise<void> =>
    axios.delete(`/api/v1/scheduled-posts/${resourceId}`).then(() => undefined),

  exportToGoogle: (events: CalendarExportEvent[]): Promise<{ url?: string }> =>
    axios.post('/api/v1/calendar/export/google', { events }).then((r) => r.data),

  exportToOutlook: (events: CalendarExportEvent[]): Promise<{ url?: string }> =>
    axios.post('/api/v1/calendar/export/outlook', { events }).then((r) => r.data),

  resolveConflict: (
    resourceId: string,
    payload: { resolution: 'local' | 'server'; field: string; value: unknown },
  ): Promise<void> =>
    axios
      .post(`/api/v1/calendar/events/${resourceId}/resolve-conflict`, payload)
      .then(() => undefined),
};
