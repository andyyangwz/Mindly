import { useState, useCallback, useRef } from "react"
import { chatService } from "../services/chatService"

export function useChat() {
  const [sessions, setSessions] = useState([])
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const fetchMessagesIdRef = useRef(0)

  const fetchSessions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await chatService.getSessions()
      setSessions(result.sessions)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchMessages = useCallback(async (sessionId) => {
    const reqId = ++fetchMessagesIdRef.current
    setLoading(true)
    setError(null)
    try {
      const result = await chatService.getMessages(sessionId)
      if (reqId !== fetchMessagesIdRef.current) return
      console.log("[useChat] Fetched messages:", result.messages.length, "messages")
      setMessages(result.messages)
    } catch (err) {
      if (reqId !== fetchMessagesIdRef.current) return
      setError(err.message)
    } finally {
      if (reqId === fetchMessagesIdRef.current) {
        setLoading(false)
      }
    }
  }, [])

  const fetchSession = useCallback(async (sessionId) => {
    try {
      return await chatService.getSession(sessionId)
    } catch (err) {
      setError(err.message)
      return null
    }
  }, [])

  const createSession = useCallback(async (title) => {
    const session = await chatService.createSession(title)
    setSessions((prev) => [session, ...prev])
    return session
  }, [])

  const renameSession = useCallback(async (id, title) => {
    const updated = await chatService.renameSession(id, title)
    setSessions((prev) => prev.map((s) => (s.id === id ? updated : s)))
    return updated
  }, [])

  const deleteSession = useCallback(async (id) => {
    await chatService.deleteSession(id)
    setSessions((prev) => prev.filter((s) => s.id !== id))
  }, [])

  const createMessage = useCallback(async (sessionId, role, content) => {
    const message = await chatService.createMessage(sessionId, role, content)
    setMessages((prev) => [...prev, message])
    return message
  }, [])

  return {
    sessions,
    messages,
    loading,
    error,
    fetchSessions,
    fetchMessages,
    fetchSession,
    createSession,
    renameSession,
    deleteSession,
    createMessage,
  }
}
