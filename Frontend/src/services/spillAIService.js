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

    const data = await api.post("/spill-ai/chat", payload)

    return {
      response: data.response,
      sessionId: data.session_id,
      aiMessageId: data.ai_message_id,
      personality: data.personality,
    }
  },

  async sendMessageStream(message, sessionId, personality, forwardedJournal, callbacks) {
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

    const response = await api.postRaw("/spill-ai/chat/stream", payload)
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ""

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")
      buffer = lines.pop()

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) continue
        try {
          const event = JSON.parse(trimmed)
          switch (event.type) {
            case "session":
              callbacks.onSession?.(event.session_id)
              break
            case "chunk":
              callbacks.onChunk?.(event.content)
              break
            case "done":
              callbacks.onDone?.(event.ai_message_id, event.personality)
              break
            case "error":
              callbacks.onError?.(event.error)
              break
          }
        } catch (e) {
          // ignore malformed JSON
        }
      }
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

  async transcribeAudio(audioBlob) {
    const formData = new FormData()
    formData.append("audio", audioBlob, "recording.webm")
    const data = await api.post("/spill-ai/transcribe", formData)
    return data.text
  },
}
