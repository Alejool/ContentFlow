import axios from 'axios';

export const checkoutService = {
  createSession: (): Promise<{ url?: string }> =>
    axios.post('/checkout/create-session').then((r) => r.data),
};
