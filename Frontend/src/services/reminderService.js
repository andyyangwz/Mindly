import { api } from "./api"

function toFrontend(r) {
  return {
    id: r.id,
    title: r.title,
    description: r.description || "",
    datetime: r.datetime || null,
    date: r.datetime ? r.datetime.slice(0, 10) : null,
    time: r.datetime ? r.datetime.slice(11, 16) : null,
    color: r.color || "#7C3AED",
    priority: r.priority || "medium",
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function toBackend(data) {
  const body = {}
  if (data.title !== undefined) body.title = data.title
  if (data.description !== undefined) body.description = data.description
  if (data.datetime !== undefined) body.datetime = data.datetime
  if (data.color !== undefined) body.color = data.color
  if (data.priority !== undefined) body.priority = data.priority
  return body
}

export const reminderService = {
  async getAll() {
    const data = await api.get("/reminders")
    return { reminders: data.reminders.map(toFrontend) }
  },

  async getByDate(dateStr) {
    const data = await api.get(`/reminders?date=${dateStr}`)
    return { reminders: data.reminders.map(toFrontend) }
  },

  async create(data) {
    const body = toBackend(data)
    const result = await api.post("/reminders", body)
    return toFrontend(result.reminder)
  },

  async update(id, data) {
    const body = toBackend(data)
    const result = await api.put(`/reminders/${id}`, body)
    return toFrontend(result.reminder)
  },

  async delete(id) {
    const result = await api.delete(`/reminders/${id}`)
    return { deletedIds: result.deleted_ids || [id] }
  },
}
