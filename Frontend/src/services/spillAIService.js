import { api } from "./api"

export const spillAIService = {
  async sendMessage(message, sessionId = null, personality = "empathetic", forwardedJournal = null) {
    const payload = {
      message,
      session_id: sessionId,
      personality,
    }
    if (forwardedJournal) {
      payload.forwarded_journal = {
        id: forwardedJournal.id,
        title: forwardedJournal.title,
        content: forwardedJournal.content,
      }
    }

    console.log("[SpillAI] Sending request:", {
      message: message?.slice(0, 50),
      sessionId,
      personality,
      hasJournal: !!forwardedJournal,
    })

    const data = await api.post("/spill-ai/chat", payload)

    console.log("[SpillAI] Response received:", {
      sessionId: data.session_id,
      responseLen: data.response?.length || 0,
      personality: data.personality,
    })

    return {
      response: data.response,
      sessionId: data.session_id,
      aiMessageId: data.ai_message_id,
      personality: data.personality,
    }
  },

  async setPersonality(sessionId, personality) {
    const data = await api.post("/spill-ai/personality", {
      session_id: sessionId,
      personality,
    })
    return {
      sessionId: data.session_id,
      personality: data.personality,
      name: data.name,
      description: data.description,
    }
  },
}
