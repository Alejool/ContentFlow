import { SocialAccount } from "@/types/SocialAccount";
import axios from "axios";
import { create } from "zustand";

interface AccountsStore {
  accounts: SocialAccount[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;

  setAccounts: (accounts: SocialAccount[]) => void;
  addAccount: (account: SocialAccount) => void;
  removeAccount: (accountId: number) => void;
  updateAccount: (accountId: number, updates: Partial<SocialAccount>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearAccounts: () => void;
  fetchAccounts: () => Promise<SocialAccount[]>;
}

export const useAccountsStore = create<AccountsStore>((set) => ({
  accounts: [],
  isLoading: false,
  error: null,
  lastUpdated: null,

  setAccounts: (accounts) =>
    set({
      accounts: accounts.map((acc) => ({
        ...acc,
        account_name: acc.account_name,
      })),
      lastUpdated: new Date(),
      error: null,
    }),

  addAccount: (account) =>
    set((state) => ({
      accounts: [
        ...state.accounts,
        {
          ...account,
          account_name: account.account_name,
        },
      ],
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
        account.id === accountId
          ? {
              ...account,
              ...updates,
              account_name: updates.account_name || account.account_name,
            }
          : account,
      ),
      lastUpdated: new Date(),
    })),

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearAccounts: () => set({ accounts: [], lastUpdated: null }),

  fetchAccounts: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get("/api/v1/social-accounts");
      const accounts = response.data.accounts || [];

      const processedAccounts = accounts.map((acc: SocialAccount) => ({
        ...acc,
        account_name: acc.account_name,
      }));

      set({
        accounts: processedAccounts,
        isLoading: false,
        lastUpdated: new Date(),
      });
      return processedAccounts;
    } catch (error: any) {
      console.error("Error fetching social accounts:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch accounts";
      set({
        error: errorMessage,
        isLoading: false,
      });
      return [];
    }
  },
}));
