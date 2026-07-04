import axios from 'axios';

export const userEventService = {
  create: (payload: Record<string, unknown>): Promise<void> =>
    axios.post('/api/v1/calendar/user-events', payload).then(() => undefined),

  update: (id: number | string, payload: Record<string, unknown>): Promise<void> =>
    axios.put(`/api/v1/calendar/user-events/${id}`, payload).then(() => undefined),

  delete: (id: number): Promise<void> =>
    axios.delete(`/api/v1/calendar/user-events/${id}`).then(() => undefined),
};
