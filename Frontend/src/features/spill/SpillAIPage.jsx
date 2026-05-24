import { useState, useEffect, useRef, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Send, Loader2, MessageCircle, BookOpen } from "lucide-react"
import { theme } from "../../theme"
import InfoButton from "../../components/tutorial/InfoButton"
import { useChat } from "../../hooks/useChat"
import { spillAIService } from "../../services/spillAIService"
import PersonalitySelector from "./PersonalitySelector"
import ForwardJournalPopover from "./ForwardJournalPopover"
import JournalPreviewCard from "./JournalPreviewCard"

function ChatBubble({ msg }) {
  if (msg.role === "system") {
    return (
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <span style={{
          fontSize: 11, color: theme.muted, background: theme.bg,
          padding: "4px 12px", borderRadius: 12,
        }}>
          {msg.content}
        </span>
      </div>
    )
  }

  const jc = msg.journalContext

  return (
    <div
      style={{
        display: "flex",
        justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
        marginBottom: 20,
      }}
    >
      <div style={{ maxWidth: 560, display: "flex", flexDirection: "column", gap: 8, alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>
        {jc && (
          <JournalPreviewCard title={jc.title} content={jc.content} compact />
        )}

        <div
          style={{
            padding: "14px 18px",
            borderRadius: msg.role === "user" ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
            background: msg.role === "user" ? "linear-gradient(135deg, #5B3CC4, #4A2FA8)" : "var(--color-card)",
            color: msg.role === "user" ? "white" : theme.dark,
            fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-line",
            boxShadow: msg.role === "user" ? "0 4px 16px #5B3CC444" : "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          {msg.content}
        </div>
      </div>
    </div>
  )
}

export default function SpillAIPage() {
  const { t } = useTranslation()
  const { chatId } = useParams()
  const navigate = useNavigate()
  const bottomRef = useRef(null)
  const [input, setInput] = useState("")
  const [personality, setPersonality] = useState("empathetic")
  const [localMessages, setLocalMessages] = useState([])
  const [initialized, setInitialized] = useState(false)
  const [sending, setSending] = useState(false)
  const [forwardedJournal, setForwardedJournal] = useState(null)
  const [showJournalPicker, setShowJournalPicker] = useState(false)
  const textRef = useRef(null)

  const autoResize = useCallback(() => {
    const el = textRef.current
    if (!el) return
    el.style.height = "0"
    el.style.height = el.scrollHeight + "px"
  }, [])

  useEffect(() => {
    autoResize()
  }, [input])

  const { messages, loading, fetchMessages, fetchSession } = useChat()

  const isNewChat = !chatId

  useEffect(() => {
    if (isNewChat) {
      setLocalMessages([])
      setInitialized(true)
    } else if (chatId) {
      fetchMessages(chatId)
      fetchSession(chatId).then((session) => {
        if (session?.personalityType) {
          setPersonality(session.personalityType)
        }
      })
      setInitialized(true)
    }
  }, [chatId, fetchMessages, fetchSession, isNewChat])

  useEffect(() => {
    if (!isNewChat && !loading && messages.length > 0) {
      setLocalMessages(messages)
    }
  }, [messages, loading, isNewChat])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [localMessages])

  const handlePersonalityChange = useCallback(async (newPersonality) => {
    setPersonality(newPersonality)

    if (chatId) {
      try {
        await spillAIService.setPersonality(chatId, newPersonality)
      } catch (err) {
        console.error("Failed to save personality:", err)
      }
    }

    const nameMap = {
      empathetic: t("spill.personality.empathic"),
      problem_solver: t("spill.personality.problemSolver"),
      motivational: t("spill.personality.coach"),
    }
    const name = nameMap[newPersonality] || newPersonality
    setLocalMessages((prev) => [
      ...prev,
      { id: `sys-${Date.now()}`, role: "system", content: t("spill.system.switched", { name }) },
    ])
  }, [chatId, t])

  const handleForwardJournal = useCallback((journal) => {
    setForwardedJournal(journal)
    setShowJournalPicker(false)
  }, [])

  const send = useCallback(async () => {
    if (!input.trim() && !forwardedJournal) return
    if (sending) return

    const userText = input.trim()
    const journalPayload = forwardedJournal ? { ...forwardedJournal } : null

    setInput("")
    setSending(true)

    const tempId = "temp-" + Date.now()
    setLocalMessages((prev) => [...prev, {
      id: tempId,
      role: "user",
      content: userText,
      journalContext: journalPayload ? {
        id: journalPayload.id,
        title: journalPayload.title,
        content: journalPayload.content,
      } : null,
    }])

    try {
      const result = await spillAIService.sendMessage(
        userText,
        isNewChat ? null : chatId,
        personality,
        journalPayload,
      )

      setForwardedJournal(null)

      if (!result.response || !result.response.trim()) {
        console.warn("Spill AI returned empty response")
        setLocalMessages((prev) => [
          ...prev.filter((m) => m.id !== tempId),
          { id: "error-" + Date.now(), role: "assistant", content: t("spill.errors.response") },
        ])
        setSending(false)
        return
      }

      if (isNewChat) {
        navigate(`/spill/${result.sessionId}`, { replace: true })
      } else {
        await fetchMessages(chatId)
      }
    } catch (err) {
      console.error("Spill AI send error:", err)
      let errorMsg = t("spill.errors.network")
      const errBody = err.response || {}
      if (errBody.type === "ConfigurationError") {
        errorMsg = t("spill.errors.notConfigured")
      } else if (errBody.type === "AuthenticationError") {
        errorMsg = t("spill.errors.invalidKey")
      } else if (errBody.type === "RateLimitError") {
        errorMsg = t("spill.errors.rateLimit")
      } else if (errBody.type === "TimeoutError") {
        errorMsg = t("spill.errors.timeout")
      } else if (errBody.type === "ValidationError") {
        errorMsg = t("spill.errors.unknown")
      } else if (errBody.details) {
        errorMsg = t("spill.errors.withDetails", { details: errBody.details })
      }
      setLocalMessages((prev) => [
        ...prev.filter((m) => m.id !== tempId),
        { id: "error-" + Date.now(), role: "assistant", content: errorMsg },
      ])
    } finally {
      setSending(false)
    }
  }, [input, forwardedJournal, isNewChat, chatId, fetchMessages, navigate, sending, personality, t])

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <div
        style={{
          padding: "8px 28px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          background: "var(--color-card)",
        }}
      >
        <div data-tutorial-target="ai-personalities" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <MessageCircle size={14} color={theme.muted} />
          <span style={{ fontSize: 12, fontWeight: 600, color: theme.muted, letterSpacing: "0.01em" }}>
            {t("spill.header")}
          </span>
        </div>

        <PersonalitySelector personality={personality} onChange={handlePersonalityChange} />
        <InfoButton tutorialId="ai-personalities" />
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px 80px",
        }}
      >
        {localMessages.length === 0 && initialized && !loading && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100%" }}>
            <div style={{ textAlign: "center", userSelect: "none" }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: theme.dark, margin: "0 0 6px", lineHeight: 1.3 }}>
                {t("spill.emptyState")}
              </p>
              <p style={{ fontSize: 13, color: theme.muted, margin: 0, lineHeight: 1.4 }}>
                {t("spill.emptyStateSub")}
              </p>
            </div>
          </div>
        )}

        {localMessages.length > 0 && (
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            {localMessages.map((msg) => (
              <ChatBubble key={msg.id} msg={msg} />
            ))}

            {sending && (
              <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 20 }}>
                <div style={{
                  maxWidth: 560, padding: "14px 18px", borderRadius: "20px 20px 20px 4px",
                  background: "var(--color-card)", color: theme.muted, fontSize: 14,
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                  {t("spill.thinking")}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div
        style={{
          padding: "12px 80px 20px",
          borderTop: `1px solid ${theme.border}`,
          background: "var(--color-card)",
        }}
      >
        <div style={{ maxWidth: 900, margin: "0 auto", position: "relative" }}>
          {showJournalPicker && (
            <ForwardJournalPopover
              onSelect={handleForwardJournal}
              onClose={() => setShowJournalPicker(false)}
            />
          )}

          {forwardedJournal && (
            <div style={{ marginBottom: 8 }}>
              <JournalPreviewCard
                title={forwardedJournal.title}
                content={forwardedJournal.content}
                onRemove={() => setForwardedJournal(null)}
                compact
              />
            </div>
          )}

          <div
            style={{
              background: "transparent",
              borderRadius: 16,
              border: `1px solid ${theme.border}`,
              padding: "8px 8px 8px 16px",
              display: "flex",
              alignItems: "flex-end",
              gap: 8,
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            }}
          >
            <div data-tutorial-target="forward-journal" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <button
                onClick={() => setShowJournalPicker(o => !o)}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "6px 10px",
                  border: `1px solid ${showJournalPicker ? `color-mix(in srgb, ${theme.primary} 33%, transparent)` : theme.border}`,
                  borderRadius: 8,
                  background: showJournalPicker ? `color-mix(in srgb, ${theme.primary} 8%, transparent)` : "transparent",
                  cursor: "pointer", transition: "all 0.15s",
                  fontSize: 11, fontWeight: 500, color: theme.muted,
                  flexShrink: 0, marginBottom: 4,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = theme.primary
                  e.currentTarget.style.color = theme.primary
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = showJournalPicker ? `color-mix(in srgb, ${theme.primary} 33%, transparent)` : theme.border
                  e.currentTarget.style.color = theme.muted
                }}
              >
                <BookOpen size={12} />
                {t("spill.journal")}
              </button>
              <InfoButton tutorialId="forward-journal" />
            </div>

            <textarea
              ref={textRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                autoResize()
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  send()
                }
              }}
              placeholder={forwardedJournal ? t("spill.inputPlaceholderJournal") : t("spill.inputPlaceholder")}
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                boxShadow: "none",
                fontSize: 14,
                color: theme.dark,
              background: "var(--color-card)",
                minWidth: 0,
                resize: "none",
                fontFamily: "inherit",
                lineHeight: "22px",
                padding: "2px 0 2px 12px",
                overflow: "auto",
                maxHeight: 120,
                height: 27,
              }}
            />

            <button
              onClick={send}
              disabled={(!input.trim() && !forwardedJournal) || sending}
              style={{
                background: (input.trim() || forwardedJournal) && !sending
                  ? "linear-gradient(135deg, #5B3CC4, #4A2FA8)"
                  : theme.bg,
                border: "none",
                borderRadius: "50%",
                width: 36, height: 36,
                cursor: (input.trim() || forwardedJournal) && !sending ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.15s",
                flexShrink: 0,
              }}
            >
              {sending ? (
                <Loader2 size={15} color={theme.muted} style={{ animation: "spin 1s linear infinite" }} />
              ) : (
                <Send size={15} color={(input.trim() || forwardedJournal) ? "white" : theme.muted} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
