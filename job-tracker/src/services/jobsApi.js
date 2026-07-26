import { api } from "./api";

export const jobsApi = {
  // Search jobs with query parameters
  searchJobs: async (params = {}) => {
    const response = await api.get("/jobs/search", { params });
    return response.data;
  },

  // Get recent search query logs
  getRecentSearches: async () => {
    const response = await api.get("/jobs/recent-searches");
    return response.data;
  },

  // Get user's saved job listings
  getSavedJobs: async () => {
    const response = await api.get("/jobs/saved");
    return response.data;
  },

  // Save a job listing
  saveJob: async (jobData) => {
    const response = await api.post("/jobs/save", { job: jobData });
    return response.data;
  },

  // Unsave/remove a job listing
  unsaveJob: async (jobId) => {
    const response = await api.delete(`/jobs/saved/${jobId}`);
    return response.data;
  },
};
