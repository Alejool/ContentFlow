import axios from 'axios';

export interface NotificationsResponse<TNotification = unknown> {
  notifications: TNotification[];
  unread_count: number;
}

export const notificationService = {
  list: <TNotification = unknown>(): Promise<NotificationsResponse<TNotification>> =>
    axios.get('/api/v1/notifications').then((r) => r.data),

  markAsRead: (id: string): Promise<void> =>
    axios.post(`/api/v1/notifications/${id}/read`).then(() => undefined),

  markAllAsRead: (): Promise<void> =>
    axios.post('/api/v1/notifications/read-all').then(() => undefined),

  delete: (id: string): Promise<void> =>
    axios.delete(`/api/v1/notifications/${id}`).then(() => undefined),
};
