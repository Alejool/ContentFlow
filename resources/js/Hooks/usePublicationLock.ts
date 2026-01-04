import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { usePage } from '@inertiajs/react';
import { toast } from 'react-hot-toast';
import { usePublicationStore } from '@/stores/publicationStore';

interface LockInfo {
    user_id: number;
    user_name: string;
    avatar?: string;
    expires_at: string;
    locked_by?: 'session' | 'user';
    ip_address?: string;
    user_agent?: string;
}

interface User {
    id: number;
    name: string;
    avatar?: string;
}

export const usePublicationLock = (publicationId: number | null, isEditing: boolean) => {
    const { auth } = usePage().props as any;
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

        const { success, data } = await usePublicationStore.getState().acquireLock(publicationId);

        if (success) {
            setIsLockedByMe(true);
            const lockData = data.lock || data.data?.lock;
            setLockInfo({
                user_id: auth.user.id,
                user_name: auth.user.name,
                expires_at: lockData?.expires_at || new Date().toISOString(),
            });
        } else if (data?.details) {
            // Handle 423 Locked
            setLockInfo(data.details);
            setIsLockedByMe(false);
        } else {
            console.error('Failed to acquire lock', data);
        }
    }, [publicationId, isEditing, auth.user.id, auth.user.name]);

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

        // Join Presence Channel
        const channel = window.Echo.join(`publication.${publicationId}`)
            .here((users: User[]) => {
                setActiveUsers(users);

                // If we are the only one here, try to acquire the lock immediately
                // Or if there are others, we check who has the lock via API (handled by acquireLock)
                acquireLock();
            })
            .joining((user: User) => {
                setActiveUsers(prev => [...prev, user]);
                toast(`${user.name} ha entrado a editar.`);
            })
            .leaving((user: User) => {
                setActiveUsers(prev => prev.filter(u => u.id !== user.id));
                toast(`${user.name} ha salido.`);

                // Fail-safe: If the user who has the lock leaves, and we haven't received an unlock event yet
                if (lockInfoRef.current && lockInfoRef.current.user_id === user.id) {
                    // Wait a moment for the official unlock event
                    setTimeout(() => {
                        // If still locked by them, try to acquire (maybe they disconnected abruptly)
                        if (lockInfoRef.current && lockInfoRef.current.user_id === user.id) {
                            toast('El usuario con el bloqueo ha salido. Verificando disponibilidad...');
                            acquireLock();
                        }
                    }, 1500);
                }
            })
            .error((error: any) => {
                console.error('Presence channel error:', error);
            });

        // Listen for explicit lock changes (broadcasted by Controller)
        // This is still useful as a source of truth for "DB lock"
        channel.listen('.publication.lock.changed', (data: any) => {
            if (data.publicationId === publicationId) {
                if (data.lock) {
                    setLockInfo(data.lock);
                    setIsLockedByMe(data.lock.user_id === auth.user.id);
                    if (data.lock.user_id !== auth.user.id) {
                        toast.error(`${data.lock.user_name} ha tomado el bloqueo.`);
                    }
                } else {
                    // Lock was released - clear the lock info
                    setLockInfo(null);
                    setIsLockedByMe(false);

                    // Automatically try to acquire the lock if we're still editing
                    if (isEditing) {
                        // Calculate priority based on entry order
                        // We filter out the user who just left (if they are still in list)
                        const candidates = activeUsersRef.current.filter(u => u.id !== auth.user.id);
                        // Actually we want to find OUR position
                        // The 'activeUsers' list is roughly sorted by join time
                        const myIndex = activeUsersRef.current.findIndex(u => u.id === auth.user.id);

                        // Delay depends on turn. 0 = immediate, 1 = 500ms, etc.
                        // If we are first (index 0), we go immediately.
                        const delay = Math.max(0, myIndex) * 500;

                        setTimeout(() => {
                            toast.success('El bloqueo ha sido liberado. Intentando adquirir...');
                            acquireLock();
                        }, delay);
                    }
                }
            }
        });

        return () => {
            window.Echo.leave(`publication.${publicationId}`);
            releaseLock();
        };
    }, [publicationId, isEditing, acquireLock, releaseLock, auth.user.id]);

    return {
        lockInfo,
        isLockedByMe,
        isLockedByOther: !!lockInfo && !isLockedByMe,
        activeUsers, // Return active users so we can show avatars
        refreshLock: acquireLock
    };
};

export const useWorkspaceLocks = () => {
    // This can remain relatively similar or also use presence if we wanted "who is in workspace"
    // But for now, let's keep it listening to events
    const { auth } = usePage().props as any;
    const [remoteLocks, setRemoteLocks] = useState<Record<number, LockInfo>>({});

    useEffect(() => {
        const workspaceId = auth.current_workspace?.id;
        if (!workspaceId) return;

        const channel = window.Echo.private(`workspace.${workspaceId}`);

        channel.listen('.publication.lock.changed', (data: any) => {
            setRemoteLocks(prev => {
                const next = { ...prev };
                if (data.lock) {
                    if (data.lock.user_id !== auth.user.id) {
                        next[data.publicationId] = data.lock;
                    }
                } else {
                    delete next[data.publicationId];
                }
                return next;
            });
        });

        return () => {
            channel.stopListening('.publication.lock.changed');
        };
    }, [auth.current_workspace?.id, auth.user.id]);

    return { remoteLocks };
};
