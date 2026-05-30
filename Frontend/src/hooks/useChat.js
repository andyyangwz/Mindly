import { useState, useCallback, useRef } from "react"
import { chatService } from "../services/chatService"

export function useChat() {
  const [sessions, setSessions] = useState([])
  const [newSessionId, setNewSessionId] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const fetchMessagesIdRef = useRef(0)
  const pendingAddIds = useRef(new Set())

  const fetchSessions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await chatService.getSessions()
      setSessions((prev) => {
        const apiIds = new Set(result.sessions.map(s => s.id))
        const pendingToKeep = prev.filter(s => pendingAddIds.current.has(s.id) && !apiIds.has(s.id))
        pendingAddIds.current.forEach((id) => { if (apiIds.has(id)) pendingAddIds.current.delete(id) })
        return [...pendingToKeep, ...result.sessions]
      })
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

  const renameSession = useCallback(async (id, title) => {
    const updated = await chatService.renameSession(id, title)
    setSessions((prev) => prev.map((s) => (s.id === id ? updated : s)))
    return updated
  }, [])

  const deleteSession = useCallback(async (id) => {
    await chatService.deleteSession(id)
    setSessions((prev) => prev.filter((s) => s.id !== id))
  }, [])

  const addSession = useCallback((session) => {
    pendingAddIds.current.add(session.id)
    setSessions((prev) => {
      const exists = prev.find(s => s.id === session.id)
      if (exists) return prev.map(s => s.id === session.id ? { ...s, ...session } : s)
      return [session, ...prev]
    })
    setNewSessionId(session.id)
    setTimeout(() => setNewSessionId((prev) => prev === session.id ? null : prev), 1500)
  }, [])

  return {
    sessions,
    newSessionId,
    messages,
    loading,
    error,
    fetchSessions,
    fetchMessages,
    fetchSession,
    renameSession,
    deleteSession,
    addSession,
  }
}
