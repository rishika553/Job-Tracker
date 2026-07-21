import { api } from './api';

export const applicationsApi = {
  listApplications: async (status = null, skip = 0, limit = 50) => {
    const params = { skip, limit };
    if (status && status !== 'all') params.status = status;
    const response = await api.get('/applications', { params });
    return response.data;
  },

  getApplicationById: async (id) => {
    const response = await api.get(`/applications/${id}`);
    return response.data;
  },

  createApplication: async (data) => {
    const response = await api.post('/applications', data);
    return response.data;
  },

  updateApplication: async (id, data) => {
    const response = await api.put(`/applications/${id}`, data);
    return response.data;
  },

  deleteApplication: async (id) => {
    const response = await api.delete(`/applications/${id}`);
    return response.data;
  },
};
