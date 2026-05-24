import { api } from "../../../services/api";

export const habitRelicService = {
  getAll: () => api.get("/habit-goals"),

  getById: (id) => api.get(`/habit-goals/${id}`),

  create: (data) => api.post("/habit-goals", data),

  update: (id, data) => api.put(`/habit-goals/${id}`, data),

  delete: (id) => api.delete(`/habit-goals/${id}`),

  equip: (relicId, slot) => api.post("/habit-goals/equip", { relic_id: relicId, slot }),

  unequip: (relicId) => api.post("/habit-goals/unequip", { relic_id: relicId }),
};
