import { api } from './api';

export const companiesApi = {
  listCompanies: async (q = null, skip = 0, limit = 50) => {
    const params = { skip, limit };
    if (q) params.q = q;
    const response = await api.get('/companies', { params });
    return response.data;
  },

  createCompany: async (data) => {
    const response = await api.post('/companies', data);
    return response.data;
  },
};
