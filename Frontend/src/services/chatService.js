import { api } from "./api"

function sessionToFrontend(s) {
  return {
    id: s.id,
    title: s.title || "New Chat",
    personalityType: s.personality_type || "empathetic",
    isPinned: s.is_pinned,
    isArchived: s.is_archived,
    isFavorite: s.is_favorite,
    createdAt: s.created_at,
    updatedAt: s.updated_at,
    lastMessageAt: s.last_message_at,
  }
}

function messageToFrontend(m) {
  return {
    id: m.id,
    sessionId: m.session_id,
    role: m.role,
    content: m.content,
    journalContext: m.journal_context || null,
    personalityMode: m.personality_mode || null,
    createdAt: m.created_at,
  }
}

export const chatService = {
  async getSessions() {
    const data = await api.get("/chats")
    return { sessions: data.sessions.map(sessionToFrontend) }
  },

  async getSession(id) {
    const data = await api.get(`/chats/${id}`)
    return sessionToFrontend(data.session)
  },

  async createSession(title) {
    const data = await api.post("/chats", { title })
    return sessionToFrontend(data.session)
  },

  async renameSession(id, title) {
    const data = await api.put(`/chats/${id}`, { title })
    return sessionToFrontend(data.session)
  },

  async deleteSession(id) {
    return api.delete(`/chats/${id}`)
  },

  async getMessages(sessionId) {
    const data = await api.get(`/chats/${sessionId}/messages`)
    return { messages: data.messages.map(messageToFrontend) }
  },

  async createMessage(sessionId, role, content) {
    const data = await api.post(`/chats/${sessionId}/messages`, { role, content })
    return messageToFrontend(data.message)
  },
}
