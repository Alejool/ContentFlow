import {create} from "zustand";

export interface SocialAccount {
  id: number;
  platform: string;
  name: string;
  avatar?: string;
  is_active: boolean;
}

interface AccountsStore {
  accounts: SocialAccount[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;

  // Actions
  setAccounts: (accounts: SocialAccount[]) => void;
  addAccount: (account: SocialAccount) => void;
  removeAccount: (accountId: number) => void;
  updateAccount: (accountId: number, updates: Partial<SocialAccount>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearAccounts: () => void;
}

export const useAccountsStore = create<AccountsStore>((set) => ({
  accounts: [],
  isLoading: false,
  error: null,
  lastUpdated: null,

  setAccounts: (accounts) =>
    set({
      accounts,
      lastUpdated: new Date(),
      error: null,
    }),

  addAccount: (account) =>
    set((state) => ({
      accounts: [...state.accounts, account],
      lastUpdated: new Date(),
    })),

  removeAccount: (accountId) =>
    set((state) => ({
      accounts: state.accounts.filter((account) => account.id !== accountId),
      lastUpdated: new Date(),
    })),

  updateAccount: (accountId, updates) =>
    set((state) => ({
      accounts: state.accounts.map((account) =>
        account.id === accountId ? { ...account, ...updates } : account
      ),
      lastUpdated: new Date(),
    })),

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearAccounts: () => set({ accounts: [], lastUpdated: null }),
}));
