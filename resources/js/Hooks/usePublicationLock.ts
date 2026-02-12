import { useLockStore } from "@/stores/lockStore";
import { usePublicationStore } from "@/stores/publicationStore";
import { Publication } from "@/types/Publication";
import { usePage } from "@inertiajs/react";
import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";

interface LockInfo {
  user_id: number;
  user_name: string;
  avatar?: string;
  expires_at: string;
  locked_by?: "session" | "user";
  ip_address?: string;
  user_agent?: string;
}

interface User {
  id: number;
  name: string;
  avatar?: string;
}

// Helper for multi-store synchronization
const syncAllUIStores = async (pubId: number, freshData: Publication) => {
  // 1. Sync useContentUIStore
  try {
    const { useContentUIStore } = await import("@/stores/contentUIStore");
    const store = useContentUIStore.getState();
    if (store.selectedItem?.id === pubId) {
      store.setSelectedItem(freshData);
    }
  } catch (e) {
    console.warn("Failed to sync store useContentUIStore:", e);
  }

  // 2. Sync useManageContentUIStore
  try {
    const { useManageContentUIStore } =
      await import("@/stores/manageContentUIStore");
    const store = useManageContentUIStore.getState();
    if (store.selectedItem?.id === pubId) {
      store.setSelectedItem(freshData);
    }
  } catch (e) {
    console.warn("Failed to sync store useManageContentUIStore:", e);
  }
};

const refreshPublicationInAllStores = async (
  pubId: number,
  providedData?: Publication,
) => {
  try {
    let freshData = providedData;
    if (!freshData || !freshData.media_files) {
      const { data } = await axios.get(`/api/v1/publications/${pubId}`);
      freshData =
        data.data?.publication || data.publication || data.data || data;
    }

    if (freshData) {
      // 1. Update Global List Store
      usePublicationStore.getState().updatePublication(pubId, freshData);

      // 2. Update Modal/UI Stores
      await syncAllUIStores(pubId, freshData);

      // 3. Update Calendar Store if it exists in the grid
      try {
        const { useCalendarStore } = await import("@/stores/calendarStore");
        const calStore = useCalendarStore.getState();
        const mainMedia = (freshData as any).media_files?.[0];
        const thumb =
          mainMedia?.thumbnail?.file_path || (freshData as any).image;

        calStore.updateEventByResourceId(pubId, "publication", {
          title: freshData.title,
          status: (freshData as any).status,
          extendedProps: {
            thumbnail: thumb,
            description: (freshData as any).description,
          },
        });
      } catch (e) {
        // Calendar store might not be initialized or present
      }
    }
  } catch (err) {
    console.error(`Failed to refresh all stores for pub ${pubId}:`, err);
  }
};

export const usePublicationLock = (
  publicationId: number | null,
  isEditing: boolean,
) => {
  const { auth } = usePage().props as any;
  const userId = auth?.user?.id;
  const userName = auth?.user?.name;
  const [lockInfo, setLockInfo] = useState<LockInfo | null>(null);
  const [isLockedByMe, setIsLockedByMe] = useState(false);
  const [activeUsers, setActiveUsers] = useState<User[]>([]);

  const activeUsersRef = useRef<User[]>([]);
  const lockInfoRef = useRef<LockInfo | null>(null);
  const isLockedByMeRef = useRef(false);
  const isEditingRef = useRef(isEditing);

  useEffect(() => {
    isEditingRef.current = isEditing;
  }, [isEditing]);

  const setLockedByMeInternal = (val: boolean) => {
    setIsLockedByMe(val);
    isLockedByMeRef.current = val;
  };

  useEffect(() => {
    activeUsersRef.current = activeUsers;
  }, [activeUsers]);

  useEffect(() => {
    lockInfoRef.current = lockInfo;
  }, [lockInfo]);

  // Acquire lock function (DB persistence)
  const acquireLock = useCallback(
    async (force: boolean = false) => {
      if (!publicationId || !isEditingRef.current) return;

      if (force) {
      }

      try {
        const { success, data } = await usePublicationStore
          .getState()
          .acquireLock(publicationId, force);

        if (success) {
          const wasAlreadyLockedByMe = isLockedByMeRef.current;
          setLockedByMeInternal(true);
          const lockData = data.lock || data.data?.lock;
          setLockInfo({
            user_id: userId,
            user_name: userName,
            expires_at: lockData?.expires_at || new Date().toISOString(),
          });

          // Handover sync: ensure we have absolute latest data from API
          if (!wasAlreadyLockedByMe || force) {
            await refreshPublicationInAllStores(publicationId);
            if (force) toast.success("Has tomado el control de la edición.");
          }
        } else if (data?.details) {
          setLockInfo(data.details);
          setLockedByMeInternal(false);
        }
      } catch (err) {
        console.error("Exception in acquireLock:", err);
      }
    },
    [publicationId, userId, userName],
  );

  // Release lock function
  const releaseLock = useCallback(async () => {
    // Local cleanup: immediately visible block removal for self
    if (publicationId) {
      useLockStore.getState().updateLock(publicationId, null);
    }

    if (!publicationId || !isLockedByMeRef.current) return;

    setLockedByMeInternal(false);
    setLockInfo(null);

    try {
      await usePublicationStore.getState().releaseLock(publicationId);
    } catch (e) {
      console.error("Release lock failed", e);
    }
  }, [publicationId]);

  useEffect(() => {
    if (!publicationId || !isEditing) return;

    let pollInterval: any = null;
    let channel: any = null;

    const startPolling = () => {
      if (pollInterval) return;
      pollInterval = setInterval(async () => {
        try {
          const resp = await axios.get(
            `/api/v1/publications/${publicationId}/lock`,
          );
          const data = resp.data;
          if (data.lock) {
            setLockInfo(data.lock);
            setLockedByMeInternal(data.lock.user_id === userId);
          } else {
            setLockInfo(null);
            setLockedByMeInternal(false);
          }
        } catch (err) {
          console.error("Polling lock failed", err);
        }
      }, 5000);
    };

    const stopPolling = () => {
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    };

    // immediate attempt to acquire
    acquireLock();

    if (!window.Echo) {
      startPolling();
    } else {
      try {
        channel = window.Echo.join(`publication.${publicationId}`);

        channel.here((users: User[]) => {
          const uniqueUsers = Array.from(
            new Map(users.map((u) => [u.id, u])).values(),
          );
          setActiveUsers(uniqueUsers);
          acquireLock();
        });

        channel.joining((user: User) => {
          setActiveUsers((prev) => {
            if (prev.some((u) => u.id === user.id)) return prev;
            return [...prev, user];
          });
        });

        channel.leaving((user: User) => {
          setActiveUsers((prev) => prev.filter((u) => u.id !== user.id));

          if (lockInfoRef.current && lockInfoRef.current.user_id === user.id) {
            // Handover delay to avoid race with concurrent leaving/locking
            setTimeout(() => {
              if (
                lockInfoRef.current &&
                lockInfoRef.current.user_id === user.id
              ) {
                const survivors = activeUsersRef.current;
                if (
                  survivors.length > 0 &&
                  survivors[0].id === userId &&
                  isEditingRef.current
                ) {
                  acquireLock(true);
                }
              }
            }, 1000); // Faster handover (1s instead of 3s)
          }
        });

        channel.error((error: any) => {
          console.error("Presence channel error:", error);
          startPolling();
        });
      } catch (err) {
        console.error("Presence join failed:", err);
        startPolling();
      }

      if (channel && typeof channel.listen === "function") {
        channel.listen(".publication.lock.changed", (data: any) => {
          if (data.publicationId !== publicationId) return;

          if (data.lock) {
            setLockInfo(data.lock);
            setLockedByMeInternal(data.lock.user_id === userId);
          } else {
            setLockInfo(null);
            setLockedByMeInternal(false);

            if (isEditingRef.current) {
              const survivors = activeUsersRef.current;
              const myIndex = survivors.findIndex((u) => u.id === userId);
              if (myIndex >= 0) {
                setTimeout(() => acquireLock(), myIndex * 300);
              }
            }
          }
        });
      }
    }

    return () => {
      try {
        if (channel && window.Echo) {
          window.Echo.leave(`publication.${publicationId}`);
        }
      } catch (e) {}
      stopPolling();
      releaseLock();
    };
  }, [publicationId, isEditing, userId, acquireLock, releaseLock]);

  // Heartbeat for keeping the lock alive
  useEffect(() => {
    if (!isLockedByMe || !publicationId) return;

    const interval = setInterval(() => {
      acquireLock();
    }, 20000); // 15-20s refresh for 40s lock

    return () => {
      clearInterval(interval);
    };
  }, [isLockedByMe, publicationId, acquireLock]);

  return {
    lockInfo,
    isLockedByMe,
    isLockedByOther: !!lockInfo && !isLockedByMe,
    activeUsers,
    refreshLock: () => acquireLock(),
  };
};

export const useWorkspaceLocks = () => {
  const { props } = usePage() as any;
  const wsUserId = props.auth?.user?.id;
  const workspaceId = props.auth?.current_workspace?.id;
  const { remoteLocks, setRemoteLocks, updateLock } = useLockStore();

  const handleLockChange = useCallback(
    (data: any) => {
      const pubId = Number(data.publicationId || data.publication_id);
      if (!pubId) return;

      if (data.lock) {
        if (data.lock.user_id !== wsUserId) {
          updateLock(pubId, data.lock);
          toast(`${data.lock.user_name} ha empezado a editar.`, {
            icon: "🔒",
            id: `lock-${pubId}`,
          });
        }
      } else {
        updateLock(pubId, null);
        toast.dismiss(`lock-${pubId}`);

        import("@/stores/publicationStore").then(({ usePublicationStore }) => {
          const pub = usePublicationStore
            .getState()
            .publications.find((p) => p.id === pubId);
          if (pub) {
            toast.success(`"${pub.title}" ya está disponible.`);
          }
        });
      }
    },
    [wsUserId, updateLock],
  );

  const handlePublicationUpdate = useCallback(async (e: any) => {
    const pubId = e.publication?.id || e.publication_id;
    if (!pubId) return;
    await refreshPublicationInAllStores(pubId, e.publication);
  }, []);

  useEffect(() => {
    if (!workspaceId) return;

    const fetchLocks = async () => {
      try {
        const { data } = await axios.get("/api/v1/publication-locks");
        const locks = data.data?.locks || data.locks || [];
        const lockMap: Record<number, LockInfo> = {};

        locks.forEach((lock: any) => {
          if (lock.user_id !== wsUserId) {
            lockMap[lock.publication_id] = {
              user_id: lock.user_id,
              user_name: lock.user?.name || "Unknown User",
              expires_at: lock.expires_at,
              locked_by: "user",
            };
          }
        });
        setRemoteLocks(lockMap);
      } catch (error) {
        console.error("Failed to fetch initial locks", error);
      }
    };

    fetchLocks();

    const channel = window.Echo.private(`workspace.${workspaceId}`);
    channel.listen(".publication.lock.changed", handleLockChange);
    channel.listen(".publication.updated", handlePublicationUpdate);

    return () => {
      channel.stopListening(".publication.lock.changed", handleLockChange);
      channel.stopListening(".publication.updated", handlePublicationUpdate);
      // We do NOT call window.Echo.leave here because this hook is used in AuthenticatedLayout
      // If we leave, we might break sub-channels if they depend on this root connection.
      // But typically leave is okay if it's the intended navigation behavior.
      // To be safe and stable, we'll just stop listening.
    };
  }, [workspaceId, wsUserId, handleLockChange, handlePublicationUpdate]);

  return { remoteLocks };
};
