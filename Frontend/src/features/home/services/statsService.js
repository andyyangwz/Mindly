import { api } from "../../../services/api";

export const statsService = {
  getHomeStats: () => api.get("/stats/home"),
  getWeeklyStats: (weekStart) => {
    const params = weekStart ? `?week_start=${weekStart}` : "";
    return api.get(`/stats/weekly${params}`);
  },
};
