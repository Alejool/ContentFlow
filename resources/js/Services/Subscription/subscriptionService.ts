import axios from 'axios';

export const subscriptionService = {
  getCurrentUsage: <T = Record<string, unknown>>(): Promise<{ success: boolean } & T> =>
    axios
      .get('/api/v1/subscription/current-usage', { params: { _t: Date.now() } })
      .then((r) => r.data),

  listPlans: <TPlan = unknown>(): Promise<TPlan[]> =>
    axios.get('/api/v1/plans').then((r) => r.data),
};
