import { api } from './api';

export const calendarApi = {
  getEvents: async (startDate = null, endDate = null) => {
    const params = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    const response = await api.get('/calendar/events', { params });
    return response.data;
  },
};
