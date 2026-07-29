import { api } from "../../../services/api";

export const statsService = {
  getDashboardStats: () => api.get("/stats/dashboard"),
  getWeeklyStats: (weekStart) => {
    const params = weekStart ? `?week_start=${weekStart}` : "";
    return api.get(`/stats/weekly${params}`);
  },
};
