import axios from 'axios';

export const userEventService = {
  delete: (id: number): Promise<void> =>
    axios.delete(`/api/v1/calendar/user-events/${id}`).then(() => undefined),
};
