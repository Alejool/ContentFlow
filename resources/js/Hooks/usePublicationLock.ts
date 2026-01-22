import { usePublicationStore } from "@/stores/publicationStore";
import { usePage } from "@inertiajs/react";
import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
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
          const resp = await axios.get(`/api/publications/${publicationId}/lock`);
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
              if (lockInfoRef.current && lockInfoRef.current.user_id === user.id) {
                toast.success("El bloqueo ha sido liberado. Intentando adquirir...");
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
              const myIndex = activeUsersRef.current.findIndex((u) => u.id === userId);
              const delay = Math.max(0, myIndex) * 500;
              setTimeout(() => {
                toast.success("El bloqueo ha sido liberado. Intentando adquirir...");
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
  // This can remain relatively similar or also use presence if we wanted "who is in workspace"
  // But for now, let's keep it listening to events
  const { auth } = usePage().props as any;
  const [remoteLocks, setRemoteLocks] = useState<Record<number, LockInfo>>({});
  const wsUserId = auth?.user?.id;

  useEffect(() => {
    const workspaceId = auth.current_workspace?.id;
    if (!workspaceId) return;

    const channel = window.Echo.private(`workspace.${workspaceId}`);

    const handleLockChange = (data: any) => {
      setRemoteLocks((prev) => {
        const next = { ...prev };
        if (data.lock) {
          if (data.lock.user_id !== wsUserId) {
            next[data.publicationId] = data.lock;
          }
        } else {
          delete next[data.publicationId];
        }
        return next;
      });
    };

    channel.listen(".publication.lock.changed", handleLockChange);

    return () => {
      channel.stopListening(".publication.lock.changed", handleLockChange);
    };
  }, [auth.current_workspace?.id, wsUserId]);

  return { remoteLocks };
};
