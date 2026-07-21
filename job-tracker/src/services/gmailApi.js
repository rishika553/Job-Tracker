import { api } from './api';

export const gmailApi = {
  getConnectUrl: async () => {
    const response = await api.get('/gmail/connect');
    return response.data;
  },

  handleCallback: async (code) => {
    const response = await api.get('/gmail/callback', { params: { code } });
    return response.data;
  },

  listAccounts: async () => {
    const response = await api.get('/gmail/accounts');
    return response.data;
  },

  fetchEmails: async (accountId) => {
    const response = await api.get(`/gmail/accounts/${accountId}/emails`);
    return response.data;
  },
};
