import { api } from "./api";

function stripHtml(html) {
  if (!html) return ""
  // Insert space before block-level boundaries so adjacent elements don't concatenate
  const spaced = html
    .replace(/(<\/p>)/gi, " $1")
    .replace(/(<\/div>)/gi, " $1")
    .replace(/(<\/li>)/gi, " $1")
    .replace(/(<\/h[1-6]>)/gi, " $1")
    .replace(/(<br\s*\/?>)/gi, " $1")
  const doc = new DOMParser().parseFromString(spaced, "text/html")
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
    folderIds: j.folder_ids || [],
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
  if (data.folderIds !== undefined) body.folder_ids = data.folderIds;
  return body;
}

function toFolderFrontend(f) {
  return {
    id: f.id,
    name: f.name,
    emoji: f.emoji || "📁",
    journalCount: f.journal_count || 0,
    createdAt: f.created_at,
    updatedAt: f.updated_at,
  };
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
    if (params.folder_id) query.set("folder_id", params.folder_id);

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

  // ---- Folder methods ----

  async getFolders() {
    const data = await api.get("/journals/folders");
    return { folders: (data.folders || []).map(toFolderFrontend) };
  },

  async createFolder(data) {
    const result = await api.post("/journals/folders", {
      name: data.name,
      emoji: data.emoji || "📁",
    });
    return toFolderFrontend(result.folder);
  },

  async updateFolder(id, data) {
    const result = await api.put(`/journals/folders/${id}`, data);
    return toFolderFrontend(result.folder);
  },

  async deleteFolder(id) {
    return api.delete(`/journals/folders/${id}`);
  },

  async setJournalFolders(journalId, folderIds) {
    await api.post(`/journals/${journalId}/folders`, { folder_ids: folderIds });
  },
};
