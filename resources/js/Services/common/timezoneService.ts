import axios from 'axios';

export const timezoneService = {
  getWorkspaceTimezone: (): Promise<string | null> =>
    axios
      .get('/api/v1/workspace/timezone')
      .then((r) => r.data.timezone ?? null)
      .catch(() => null),

  getUserTimezone: (): Promise<string | null> =>
    axios
      .get('/api/v1/timezone')
      .then((r) => r.data.timezone ?? null)
      .catch(() => null),

  updateWorkspaceTimezone: (timezone: string): Promise<void> =>
    axios.patch('/api/v1/workspace/timezone', { timezone }).then(() => undefined),

  updateUserTimezone: (timezone: string): Promise<void> =>
    axios.patch('/api/v1/timezone', { timezone }).then(() => undefined),
};
