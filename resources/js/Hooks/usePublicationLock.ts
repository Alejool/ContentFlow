import { useLockStore } from "@/stores/lockStore";
import { usePublicationStore } from "@/stores/publicationStore";
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

  // Refs for accessing state inside event listeners without re-subscribing
  const activeUsersRef = useRef<User[]>([]);
  const lockInfoRef = useRef<LockInfo | null>(null);

  useEffect(() => {
    activeUsersRef.current = activeUsers;
  }, [activeUsers]);

  useEffect(() => {
    lockInfoRef.current = lockInfo;
  }, [lockInfo]);

  // Acquire lock function (DB persistence)
  const acquireLock = useCallback(async () => {
    if (!publicationId || !isEditing) return;

    const { success, data } = await usePublicationStore
      .getState()
      .acquireLock(publicationId);

    if (success) {
      setIsLockedByMe(true);
      const lockData = data.lock || data.data?.lock;
      setLockInfo({
        user_id: userId,
        user_name: userName,
        expires_at: lockData?.expires_at || new Date().toISOString(),
      });

      // Only refresh data if the lock was previously held by someone else
      // This prevents clearing the form when opening a fresh edit
      if (data?.details?.user_id && data.details.user_id !== userId) {
        import("@/stores/manageContentUIStore").then(
          async ({ useManageContentUIStore }) => {
            const uiStore = useManageContentUIStore.getState();
            if (uiStore.selectedItem?.id === publicationId) {
              try {
                const { data: freshData } = await axios.get(
                  `/api/publications/${publicationId}`,
                );
                uiStore.setSelectedItem(freshData.data || freshData);
                toast.success("Datos actualizados del editor anterior.");
              } catch (err) {
                console.error(
                  "Failed to refresh data after lock acquisition",
                  err,
                );
              }
            }
          },
        );
      }
    } else if (data?.details) {
      setLockInfo(data.details);
      setIsLockedByMe(false);
    } else {
      console.error("Failed to acquire lock", data);
    }
  }, [publicationId, isEditing, userId, userName]);

  // Release lock function
  const releaseLock = useCallback(async () => {
    if (!publicationId || !isLockedByMe) return;

    // optimistically update UI
    setIsLockedByMe(false);
    setLockInfo(null);

    await usePublicationStore.getState().releaseLock(publicationId);
  }, [publicationId, isLockedByMe]);

  useEffect(() => {
    if (!publicationId || !isEditing) return;

    let pollInterval: any = null;
    let channel: any = null;

    const startPolling = () => {
      if (pollInterval) return;
      pollInterval = setInterval(async () => {
        try {
          const resp = await axios.get(
            `/api/publications/${publicationId}/lock`,
          );
          const data = resp.data;
          if (data.lock) {
            setLockInfo(data.lock);
            setIsLockedByMe(data.lock.user_id === userId);
          } else {
            setLockInfo(null);
            setIsLockedByMe(false);
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
          setActiveUsers(users);
          acquireLock();
        });

        channel.joining((user: User) => {
          setActiveUsers((prev) => [...prev, user]);
          toast(`${user.name} ha entrado a editar.`);
        });

        channel.leaving((user: User) => {
          setActiveUsers((prev) => prev.filter((u) => u.id !== user.id));
          toast(`${user.name} ha salido.`);

          if (lockInfoRef.current && lockInfoRef.current.user_id === user.id) {
            setTimeout(() => {
              if (
                lockInfoRef.current &&
                lockInfoRef.current.user_id === user.id
              ) {
                toast.success(
                  "El bloqueo ha sido liberado. Intentando adquirir...",
                );
                acquireLock();
              }
            }, 1500);
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

      // Listen for explicit lock changes
      if (channel && typeof channel.listen === "function") {
        channel.listen(".publication.lock.changed", (data: any) => {
          if (data.publicationId !== publicationId) return;

          if (data.lock) {
            setLockInfo(data.lock);
            setIsLockedByMe(data.lock.user_id === userId);
            if (data.lock.user_id !== userId) {
              toast.error(`${data.lock.user_name} ha tomado el bloqueo.`);
            }
          } else {
            setLockInfo(null);
            setIsLockedByMe(false);
            if (isEditing) {
              const myIndex = activeUsersRef.current.findIndex(
                (u) => u.id === userId,
              );
              const delay = Math.max(0, myIndex) * 500;
              setTimeout(() => {
                toast.success(
                  "El bloqueo ha sido liberado. Intentando adquirir...",
                );
                acquireLock();
              }, delay);
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
      } catch (e) {
        // ignore
      }
      stopPolling();
      releaseLock();
    };
  }, [publicationId, isEditing, acquireLock, releaseLock, userId]);

  return {
    lockInfo,
    isLockedByMe,
    isLockedByOther: !!lockInfo && !isLockedByMe,
    activeUsers,
    refreshLock: acquireLock,
  };
};

export const useWorkspaceLocks = () => {
  const { auth } = usePage().props as any;
  const wsUserId = auth?.user?.id;
  const { remoteLocks, setRemoteLocks, updateLock } = useLockStore();

  useEffect(() => {
    const workspaceId = auth.current_workspace?.id;
    if (!workspaceId) return;

    // Initial fetch of active locks
    const fetchLocks = async () => {
      try {
        const { data } = await axios.get("/api/publication-locks");
        const locks = data.data?.locks || data.locks || [];
        const lockMap: Record<number, LockInfo> = {};

        locks.forEach((lock: any) => {
          if (lock.user_id !== wsUserId) {
            // Map the API response to LockInfo interface
            lockMap[lock.publication_id] = {
              user_id: lock.user_id,
              user_name: lock.user?.name || "Unknown User",
              expires_at: lock.expires_at,
              locked_by: "user",
              ip_address: lock.ip_address,
              user_agent: lock.user_agent,
            };
          }
        });

        console.log("🔒 Initial locks fetched:", lockMap);
        setRemoteLocks(lockMap);
      } catch (error) {
        console.error("Failed to fetch initial locks", error);
      }
    };

    fetchLocks();

    const channel = window.Echo.private(`workspace.${workspaceId}`);

    const handleLockChange = (data: any) => {
      console.log("🔒 Lock change event received:", data);
      if (data.lock) {
        if (data.lock.user_id !== wsUserId) {
          console.log(
            "🔒 Updating lock for publication:",
            data.publicationId,
            data.lock,
          );
          updateLock(data.publicationId, data.lock);
        } else {
          console.log("🔒 Ignoring own lock");
        }
      } else {
        console.log("🔓 Removing lock for publication:", data.publicationId);
        updateLock(data.publicationId, null);
      }
    };

    const handlePublicationUpdate = async (e: any) => {
      if (e.publication) {
        // Update the central store
        import("@/stores/publicationStore").then(({ usePublicationStore }) => {
          usePublicationStore
            .getState()
            .updatePublication(e.publication.id, e.publication);
        });

        // Also update the UI store if this item is currently selected (open in modal)
        import("@/stores/manageContentUIStore").then(
          async ({ useManageContentUIStore }) => {
            const uiStore = useManageContentUIStore.getState();
            if (
              uiStore.selectedItem &&
              uiStore.selectedItem.id === e.publication.id
            ) {
              try {
                // Fetch full data to ensure we have activities, logs, etc.
                const { data } = await axios.get(
                  `/api/publications/${e.publication.id}`,
                );
                const freshData = data.data || data;

                // Update the modal
                uiStore.setSelectedItem(freshData);
                toast.success("Publicación actualizada por otro usuario.");
              } catch (error) {
                console.error("Failed to refresh details", error);
              }
            }
          },
        );
      }
    };

    channel.listen(".publication.lock.changed", handleLockChange);
    channel.listen(".publication.updated", handlePublicationUpdate);

    return () => {
      window.Echo.leave(`workspace.${workspaceId}`);
    };
  }, [auth.current_workspace?.id, wsUserId, setRemoteLocks, updateLock]);

  return { remoteLocks };
};
