import { api } from "./api"

function toFrontend(e) {
  return {
    id: e.id,
    title: e.title,
    description: e.description || "",
    eventDate: e.event_date,
    startTime: e.start_time,
    endTime: e.end_time,
    color: e.color || "#7C3AED",
    priority: e.priority || "medium",
    createdAt: e.created_at,
    updatedAt: e.updated_at,
    productivityLevel: e.productivity_level || "neutral",
    hasDeadline: e.has_deadline || false,
    isDeadlineMarker: e.is_deadline_marker || false,
    taskGroupId: e.task_group_id || null,
    deadlineDate: e.deadline_date || null,
    deadlineTime: e.deadline_time || null,
    status: e.status || "To Do",
    statusChangeAt: e.status_change_at || null,
  }
}

function toBackend(data) {
  const body = {}
  if (data.title !== undefined) body.title = data.title
  if (data.description !== undefined) body.description = data.description
  if (data.eventDate !== undefined) body.event_date = data.eventDate
  if (data.startTime !== undefined) body.start_time = data.startTime
  if (data.endTime !== undefined) body.end_time = data.endTime
  if (data.color !== undefined) body.color = data.color
  if (data.priority !== undefined) body.priority = data.priority
  if (data.productivityLevel !== undefined) body.productivity_level = data.productivityLevel
  if (data.hasDeadline !== undefined) body.has_deadline = data.hasDeadline
  if (data.deadlineDate !== undefined) body.deadline_date = data.deadlineDate
  if (data.deadlineTime !== undefined) body.deadline_time = data.deadlineTime
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
    return {
      event: toFrontend(result.event),
      linkedEvent: result.linked_event ? toFrontend(result.linked_event) : null,
    }
  },

  async update(id, data) {
    const body = toBackend(data)
    const result = await api.put(`/productivity/${id}`, body)
    return {
      event: toFrontend(result.event),
      linkedEvent: result.linked_event ? toFrontend(result.linked_event) : null,
    }
  },

  async delete(id) {
    const result = await api.delete(`/productivity/${id}`)
    return { deletedIds: result.deleted_ids || [id] }
  },
}
