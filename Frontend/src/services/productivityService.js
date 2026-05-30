import { api } from "./api"

function toFrontend(e) {
  return {
    id: e.id,
    title: e.title,
    description: e.description || "",
    startDatetime: e.start_datetime || null,
    endDatetime: e.end_datetime || null,
    startTime: e.start_datetime ? e.start_datetime.slice(11, 16) : null,
    endTime: e.end_datetime ? e.end_datetime.slice(11, 16) : null,
    color: e.color || "#7C3AED",
    priority: e.priority || "medium",
    createdAt: e.created_at,
    updatedAt: e.updated_at,
    productivityLevel: e.productivity_level || "neutral",
    hasDeadline: e.has_deadline || false,
    status: e.status || "To Do",
    statusChangeAt: e.status_change_at || null,
  }
}

function toBackend(data) {
  const body = {}
  if (data.title !== undefined) body.title = data.title
  if (data.description !== undefined) body.description = data.description
  if (data.color !== undefined) body.color = data.color
  if (data.priority !== undefined) body.priority = data.priority
  if (data.productivityLevel != null) body.productivity_level = data.productivityLevel
  if (data.startDatetime !== undefined) body.start_datetime = data.startDatetime
  if (data.endDatetime !== undefined) body.end_datetime = data.endDatetime
  if (data.hasDeadline !== undefined) body.has_deadline = data.hasDeadline
  if (data.status !== undefined) body.status = data.status
  return body
}

export const productivityService = {
  async getAll() {
    const data = await api.get("/productivity?all=true")
    return { events: data.events.map(toFrontend) }
  },

  async getByDate(dateStr, plan = false) {
    const data = await api.get(`/productivity?date=${dateStr}${plan ? "&plan=true" : ""}`)
    return { events: data.events.map(toFrontend) }
  },

  async create(data) {
    const body = toBackend(data)
    const result = await api.post("/productivity", body)
    return toFrontend(result.event)
  },

  async update(id, data) {
    const body = toBackend(data)
    const result = await api.put(`/productivity/${id}`, body)
    return toFrontend(result.event)
  },

  async delete(id) {
    const result = await api.delete(`/productivity/${id}`)
    return { deletedIds: result.deleted_ids || [id] }
  },

  async classifyTitle(title) {
    const result = await api.post("/productivity/classify", { title })
    return {
      productivityLevel: result.productivity_level || "neutral",
      priority: result.priority || "medium",
    }
  },

  async syncDayStatuses(dateStr) {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, "0")
    const d = String(now.getDate()).padStart(2, "0")
    const h = String(now.getHours()).padStart(2, "0")
    const min = String(now.getMinutes()).padStart(2, "0")
    const todayStr = `${y}-${m}-${d}`
    const localDatetime = `${todayStr}T${h}:${min}`
    const result = await api.post("/productivity/sync-status", {
      date: dateStr,
      current_datetime: localDatetime,
      today_date: todayStr,
    })
    return result
  },
}
