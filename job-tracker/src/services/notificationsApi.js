import { api } from './api';

export const notificationsApi = {
  listNotifications: async (unreadOnly = false, type = null, skip = 0, limit = 50) => {
    const params = { unread_only: unreadOnly, skip, limit };
    if (type) params.type = type;
    const response = await api.get('/notifications', { params });
    return response.data;
  },

  markRead: async (id) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },

  markAllRead: async () => {
    const response = await api.put('/notifications/read-all');
    return response.data;
  },

  deleteNotification: async (id) => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  },
};
