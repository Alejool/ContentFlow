import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type BillingCycle = 'monthly' | 'yearly';

interface PricingState {
  billingCycle: BillingCycle;
  setBillingCycle: (cycle: BillingCycle) => void;
}

export const usePricingStore = create<PricingState>()(
  persist(
    (set) => ({
      billingCycle: 'monthly',
      setBillingCycle: (cycle) => set({ billingCycle: cycle }),
    }),
    {
      name: 'pricing-storage',
    },
  ),
);
