import { api } from './api';

export const dashboardApi = {
  getSummary: async () => {
    const response = await api.get('/dashboard');
    return response.data;
  },
};
