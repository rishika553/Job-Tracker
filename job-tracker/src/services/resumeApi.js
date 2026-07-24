import { api } from './api';

export const resumeApi = {
  analyzeAts: async (file, targetRole = 'Full Stack Developer') => {
    const formData = new FormData();
    formData.append('file', file);
    if (targetRole) {
      formData.append('target_role', targetRole);
    }
    const response = await api.post('/resume/analyze-ats', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
