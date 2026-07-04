import axios from 'axios';

export const subscriptionService = {
  getCurrentUsage: <T = Record<string, unknown>>(): Promise<{ success: boolean } & T> =>
    axios
      .get('/api/v1/subscription/current-usage', { params: { _t: Date.now() } })
      .then((r) => r.data),

  listPlans: <TPlan = unknown>(): Promise<TPlan[]> =>
    axios.get('/api/v1/plans').then((r) => r.data),

  openBillingPortal: (): Promise<{ url?: string; error?: string }> =>
    axios
      .post('/subscription/billing-portal', {}, { headers: jsonHeaders })
      .then((r) => r.data),

  cancelSubscription: (): Promise<{ success?: boolean; message?: string; error?: string }> =>
    axios
      .post('/subscription/cancel-subscription', {}, { headers: jsonHeaders })
      .then((r) => r.data),
};

const jsonHeaders = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
};
