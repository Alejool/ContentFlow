import { NotificationData } from '@/stores/notificationStore';
import axios from 'axios';

interface NotificationsResponse {
  notifications: NotificationData[];
  unread_count: number;
}

async function fetchNotificationsFn(): Promise<NotificationsResponse> {
  const response = await axios.get('/api/v1/notifications');
  const sorted = (response.data.notifications as NotificationData[]).sort((a, b) => {
    if (!a.read_at && b.read_at) return -1;
    if (a.read_at && !b.read_at) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  return { notifications: sorted, unread_count: response.data.unread_count };
}

export function useNotifications() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.notifications.all,
    queryFn: fetchNotificationsFn,
    staleTime: 30 * 1000, // 30s — notifications change frequently
    refetchOnWindowFocus: true,
  });

  const notifications = query.data?.notifications ?? [];
  const unreadCount = query.data?.unread_count ?? 0;

  // Derived slices (replaces store computed values)
  const applicationNotifications = notifications.filter(
    (n) => n.category === 'application' || n.data.category === 'application',
  );
  const systemNotifications = notifications.filter(
    (n) => (n.category === 'system' || !n.category) && n.data.category !== 'application',
  );

  const filterByType = (type: NotificationTypeFilter, source = notifications) =>
    type === 'all' ? source : source.filter((n) => getNotificationType(n) === type);

  const countByType = (type: NotificationTypeFilter, source = notifications) =>
    type === 'all' ? source.length : source.filter((n) => getNotificationType(n) === type).length;

  // --- Mutations with optimistic updates ---

  const markAsRead = useMutation({
    mutationFn: (id: string) => axios.post(`/api/v1/notifications/${id}/read`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all });
      const prev = queryClient.getQueryData<NotificationsResponse>(queryKeys.notifications.all);
      queryClient.setQueryData<NotificationsResponse>(queryKeys.notifications.all, (old) => {
        if (!old) return old;
        const wasUnread = old.notifications.find((n) => n.id === id && !n.read_at);
        return {
          notifications: old.notifications.map((n) =>
            n.id === id ? { ...n, read_at: new Date().toISOString() } : n,
          ),
          unread_count: wasUnread ? Math.max(0, old.unread_count - 1) : old.unread_count,
        };
      });
      return { prev };
    },
    onError: (_, __, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(queryKeys.notifications.all, ctx.prev);
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: () => axios.post('/api/v1/notifications/read-all'),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all });
      const prev = queryClient.getQueryData<NotificationsResponse>(queryKeys.notifications.all);
      queryClient.setQueryData<NotificationsResponse>(queryKeys.notifications.all, (old) => {
        if (!old) return old;
        return {
          notifications: old.notifications.map((n) => ({
            ...n,
            read_at: n.read_at ?? new Date().toISOString(),
          })),
          unread_count: 0,
        };
      });
      return { prev };
    },
    onError: (_, __, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(queryKeys.notifications.all, ctx.prev);
    },
  });

  const deleteNotification = useMutation({
    mutationFn: (id: string) => axios.delete(`/api/v1/notifications/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all });
      const prev = queryClient.getQueryData<NotificationsResponse>(queryKeys.notifications.all);
      queryClient.setQueryData<NotificationsResponse>(queryKeys.notifications.all, (old) => {
        if (!old) return old;
        const target = old.notifications.find((n) => n.id === id);
        return {
          notifications: old.notifications.filter((n) => n.id !== id),
          unread_count:
            target && !target.read_at ? Math.max(0, old.unread_count - 1) : old.unread_count,
        };
      });
      return { prev };
    },
    onError: (_, __, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(queryKeys.notifications.all, ctx.prev);
    },
  });

  return {
    notifications,
    applicationNotifications,
    systemNotifications,
    unreadCount,
    isLoading: query.isLoading,
    filterByType,
    countByType,
    fetchNotifications: query.refetch,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}
