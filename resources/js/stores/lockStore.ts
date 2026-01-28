import { create } from "zustand";

interface LockInfo {
  user_id: number;
  user_name: string;
  expires_at: string;
}

interface LockState {
  remoteLocks: Record<number, LockInfo>;
  setRemoteLocks: (locks: Record<number, LockInfo>) => void;
  updateLock: (publicationId: number, lock: LockInfo | null) => void;
}

export const useLockStore = create<LockState>((set) => ({
  remoteLocks: {},
  setRemoteLocks: (locks) => {
    set({ remoteLocks: locks });
  },
  updateLock: (publicationId, lock) => {
    set((state) => {
      const next = { ...state.remoteLocks };
      if (lock) {
        next[publicationId] = lock;
      } else {
        delete next[publicationId];
      }
      return { remoteLocks: next };
    });
  },
}));
