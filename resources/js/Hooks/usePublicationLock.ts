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

      if (force)
        console.log(
          "✊ Attempting forced lock acquisition (survivor handover)",
        );

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

          // Only refresh data if we JUST took over the lock or if it was forced
          // This prevents data loss during regular heartbeats
          if (!wasAlreadyLockedByMe || force) {
            import("@/stores/contentUIStore").then(
              async ({ useContentUIStore }) => {
                const uiStore = useContentUIStore.getState();
                if (uiStore.selectedItem?.id === publicationId) {
                  try {
                    const { data: freshData } = await axios.get(
                      `/api/publications/${publicationId}`,
                    );
                    // Extract properly: freshData.data is { publication: ... }
                    const pub =
                      freshData.data?.publication ||
                      freshData.publication ||
                      freshData.data ||
                      freshData;
                    uiStore.setSelectedItem(pub);

                    // Also update the main list store
                    import("@/stores/publicationStore").then(
                      ({ usePublicationStore }) => {
                        usePublicationStore
                          .getState()
                          .updatePublication(publicationId, pub);
                      },
                    );

                    if (force) {
                      toast.success(
                        "Datos actualizados. Ahora tienes el control.",
                      );
                    }
                  } catch (err) {
                    console.error("Refresh failed during acquisition", err);
                  }
                }
              },
            );
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
    if (!publicationId || !isLockedByMeRef.current) return;

    console.log("🔓 Releasing lock for:", publicationId);
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
            `/api/publications/${publicationId}/lock`,
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
          console.log(`👤 User ${user.name} left.`);
          setActiveUsers((prev) => prev.filter((u) => u.id !== user.id));

          if (lockInfoRef.current && lockInfoRef.current.user_id === user.id) {
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
            }, 3000);
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
  const { auth } = usePage().props as any;
  const wsUserId = auth?.user?.id;
  const { remoteLocks, setRemoteLocks, updateLock } = useLockStore();

  useEffect(() => {
    const workspaceId = auth.current_workspace?.id;
    if (!workspaceId) return;

    const fetchLocks = async () => {
      try {
        const { data } = await axios.get("/api/publication-locks");
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

    const handleLockChange = (data: any) => {
      if (data.lock) {
        if (data.lock.user_id !== wsUserId) {
          updateLock(Number(data.publicationId), data.lock);
          toast(`${data.lock.user_name} ha empezado a editar.`, {
            icon: "🔒",
            id: `lock-${data.publicationId}`,
          });
        }
      } else {
        updateLock(Number(data.publicationId), null);
        toast.dismiss(`lock-${data.publicationId}`);

        import("@/stores/publicationStore").then(({ usePublicationStore }) => {
          const pub = usePublicationStore
            .getState()
            .publications.find((p) => p.id === Number(data.publicationId));
          if (pub) {
            toast.success(`"${pub.title}" ya está disponible.`);
          }
        });
      }
    };

    const handlePublicationUpdate = async (e: any) => {
      if (e.publication) {
        import("@/stores/publicationStore").then(({ usePublicationStore }) => {
          usePublicationStore
            .getState()
            .updatePublication(e.publication.id, e.publication);
        });

        import("@/stores/contentUIStore").then(
          async ({ useContentUIStore }) => {
            const uiStore = useContentUIStore.getState();
            if (uiStore.selectedItem?.id === e.publication.id) {
              try {
                // Fetch full data to ensure we have activities, logs, etc.
                const { data } = await axios.get(
                  `/api/publications/${e.publication.id}`,
                );
                const freshData =
                  data.data?.publication ||
                  data.publication ||
                  data.data ||
                  data;

                // Update the modal
                uiStore.setSelectedItem(freshData);
              } catch (error) {}
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
