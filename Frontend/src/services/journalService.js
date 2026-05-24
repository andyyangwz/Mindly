import { api } from "./api";

function stripHtml(html) {
  if (!html) return ""
  const doc = new DOMParser().parseFromString(html, "text/html")
  return doc.body.textContent || ""
}

function toFrontend(j) {
  const plain = stripHtml(j.content)
  return {
    id: j.id,
    title: j.title,
    content: j.content,
    preview: plain ? plain.slice(0, 100) + (plain.length > 100 ? "..." : "") : "",
    date: j.created_at ? j.created_at.slice(0, 10) : "",
    emojis: j.emojis || [],
    isFavorite: j.is_favorite,
    isPinned: j.is_pinned,
    allowAI: j.ai_enabled,
    createdAt: j.created_at,
    updatedAt: j.updated_at,
  };
}

function toBackend(data) {
  const body = {};
  if (data.title !== undefined) body.title = data.title;
  if (data.content !== undefined) body.content = data.content;
  if (data.emojis !== undefined) body.emojis = data.emojis;
  if (data.isFavorite !== undefined) body.is_favorite = data.isFavorite;
  if (data.isPinned !== undefined) body.is_pinned = data.isPinned;
  if (data.allowAI !== undefined) body.ai_enabled = data.allowAI;
  return body;
}

export const journalService = {
  async getAll(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.sort_by) query.set("sort_by", params.sort_by);
    if (params.sort_order) query.set("sort_order", params.sort_order);
    if (params.favorites !== undefined) query.set("favorites", params.favorites);
    if (params.pinned !== undefined) query.set("pinned", params.pinned);
    if (params.page) query.set("page", params.page);
    if (params.per_page) query.set("per_page", params.per_page);

    const qs = query.toString();
    const data = await api.get(`/journals${qs ? `?${qs}` : ""}`);
    return {
      journals: data.journals.map(toFrontend),
      pagination: data.pagination,
    };
  },

  async create(data) {
    const body = toBackend(data);
    const result = await api.post("/journals", body);
    return toFrontend(result.journal);
  },

  async update(id, data) {
    const body = toBackend(data);
    const result = await api.put(`/journals/${id}`, body);
    return toFrontend(result.journal);
  },

  async delete(id) {
    return api.delete(`/journals/${id}`);
  },

  async getForwardable() {
    const data = await api.get("/journals/forwardable");
    return {
      journals: data.journals.map(toFrontend),
    };
  },
};
