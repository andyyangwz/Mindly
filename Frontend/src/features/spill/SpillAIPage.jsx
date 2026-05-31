import { useState, useEffect, useRef, useCallback, memo } from "react"
import { useParams, useNavigate, useLocation, useOutletContext } from "react-router-dom"
import { useTranslation } from "react-i18next"
import WaveformAnimation from "../../components/ui/WaveformAnimation"

const SPILL_PERSONALITY_KEY = "mindly_spill_personality"
import { Send, Loader2, MessageCircle, BookOpen, Mic, Square, X } from "lucide-react"
import { theme } from "../../theme"
import InfoButton from "../../components/tutorial/InfoButton"
import { useChat } from "../../hooks/useChat"
import { spillAIService } from "../../services/spillAIService"
import PersonalitySelector from "./components/PersonalitySelector"
import ForwardJournalPopover from "./components/ForwardJournalPopover"
import JournalPreviewCard from "./components/JournalPreviewCard"
import { getPersonalityAvatar } from "./utils/personalityAvatars"

const PERSONALITY_BUBBLE_STYLES = {
  empathetic: {
    borderLeft: `3px solid color-mix(in srgb, ${theme.primary} 30%, transparent)`,
    boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
  },
  problem_solver: {
    borderLeft: `3px solid #14B8A6`,
    boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
  },
  motivational: {
    borderLeft: `3px solid #FFC107`,
    boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
  },
}

function formatChatTime(iso) {
  if (!iso) return ""
  const d = new Date(iso)
  const day = d.getDate()
  const month = d.toLocaleDateString("en-US", { month: "short" })
  const year = d.getFullYear()
  const hh = String(d.getHours()).padStart(2, "0")
  const mm = String(d.getMinutes()).padStart(2, "0")
  return `${day} ${month} ${year}, ${hh}.${mm}`
}

const ChatBubble = memo(({ msg, personality, isStreaming, isError }) => {
  const [hovered, setHovered] = useState(false)

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

  if (msg.role === "user") {
    return (
      <div onPointerEnter={() => setHovered(true)} onPointerLeave={() => setHovered(false)} style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
        <div style={{ maxWidth: 560, display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
          {jc && <JournalPreviewCard title={jc.title} content={jc.content} compact />}
          <div style={{
            padding: "14px 18px",
            borderRadius: "20px 20px 4px 20px",
            background: "linear-gradient(135deg, #5B3CC4, #4A2FA8)",
            color: "white",
            fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-line",
            boxShadow: "0 4px 16px #5B3CC444",
          }}>
            {msg.content}
          </div>
          <span style={{ fontSize: 11, color: hovered ? "var(--color-muted)" : "transparent", userSelect: "none", transition: "color 0.15s ease" }}>{formatChatTime(msg.createdAt)}</span>
        </div>
      </div>
    )
  }

  const msgPersonality = msg.personalityMode || "empathetic"
  const avatarSrc = getPersonalityAvatar(msgPersonality)
  const bubbleStyle = PERSONALITY_BUBBLE_STYLES[msgPersonality] || PERSONALITY_BUBBLE_STYLES.empathetic

  return (
    <div onPointerEnter={() => setHovered(true)} onPointerLeave={() => setHovered(false)} style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "flex-end" }}>
      <div style={{ flexShrink: 0, alignSelf: "flex-start" }}>
        <img
          key={msgPersonality}
          src={avatarSrc}
          alt=""
          style={{
            width: 36, height: 36, borderRadius: "50%",
            objectFit: "cover",
            border: `2px solid color-mix(in srgb, ${theme.primary} 25%, transparent)`,
            boxShadow: `0 0 0 2px var(--color-card), 0 4px 12px rgba(0,0,0,0.08)`,
            animation: "mascotFadeIn 0.35s ease-out",
          }}
        />
      </div>
      <div style={{ maxWidth: 560, display: "flex", flexDirection: "column", gap: 4 }}>
        {jc && <JournalPreviewCard title={jc.title} content={jc.content} compact />}
        <div style={{
          padding: "14px 18px",
          borderRadius: "20px 20px 20px 4px",
          background: isError ? "#FEF2F2" : "var(--color-card)",
          color: isError ? "#DC2626" : theme.dark,
          fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-line",
          ...bubbleStyle,
        }}>
          {isStreaming && !msg.content ? (
            <span style={{ color: theme.muted, fontStyle: "italic" }}>Typing...</span>
          ) : (
            msg.content
          )}
        </div>
        {!isStreaming && (
          <span style={{ fontSize: 11, color: hovered ? "var(--color-muted)" : "transparent", userSelect: "none", transition: "color 0.15s ease" }}>{formatChatTime(msg.createdAt)}</span>
        )}
      </div>
    </div>
  )
})

export default function SpillAIPage() {
  const { t } = useTranslation()
  const { chatId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const initialSyncDone = useRef(false)
  const navigatingFromSendRef = useRef(false)
  const scrollContainerRef = useRef(null)
  const streamingAccumulatorRef = useRef("")
  const streamingFlushTimerRef = useRef(null)
  const streamingMessageIdRef = useRef(null)
  const [input, setInput] = useState("")
  const [personality, setPersonality] = useState("empathetic")
  const [localMessages, setLocalMessages] = useState([])
  const [initialized, setInitialized] = useState(false)
  const [sending, setSending] = useState(false)
  const [userScrolledUp, setUserScrolledUp] = useState(false)
  const [forwardedJournal, setForwardedJournal] = useState(null)
  const [showJournalPicker, setShowJournalPicker] = useState(false)
  const textRef = useRef(null)

  /* ── Voice recording state ── */
  const [recordingPhase, setRecordingPhase] = useState("idle")
  const [recordingTimer, setRecordingTimer] = useState(0)
  const [recordingError, setRecordingError] = useState(null)
  const [analyser, setAnalyser] = useState(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const streamRef = useRef(null)
  const timerRef = useRef(null)
  const audioContextRef = useRef(null)

  const autoResize = useCallback(() => {
    const el = textRef.current
    if (!el) return
    el.style.height = "0"
    el.style.height = el.scrollHeight + "px"
  }, [])

  useEffect(() => {
    autoResize()
  }, [input])

  const cleanupRecording = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null }
    if (audioContextRef.current) { audioContextRef.current.close(); audioContextRef.current = null }
    mediaRecorderRef.current = null
    chunksRef.current = []
    setAnalyser(null)
  }, [])

  useEffect(() => {
    if (recordingPhase === "idle") {
      setRecordingTimer(0)
      setRecordingError(null)
      cleanupRecording()
    }
  }, [recordingPhase, cleanupRecording])

  const flushStreamingContent = useCallback(() => {
    const content = streamingAccumulatorRef.current
    streamingAccumulatorRef.current = ""
    if (content) {
      setLocalMessages((prev) =>
        prev.map((msg) =>
          msg.id === streamingMessageIdRef.current
            ? { ...msg, content: msg.content + content }
            : msg,
        ),
      )
    }
    streamingFlushTimerRef.current = null
  }, [])

  const handleChatScroll = useCallback(() => {
    const el = scrollContainerRef.current
    if (!el) return
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80
    setUserScrolledUp(!isNearBottom)
  }, [])

  useEffect(() => {
    return () => {
      if (streamingFlushTimerRef.current) {
        cancelAnimationFrame(streamingFlushTimerRef.current)
      }
    }
  }, [])

  const startRecording = useCallback(async () => {
    try {
      setRecordingError(null)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm"
      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      const audioCtx = new AudioContext()
      audioContextRef.current = audioCtx
      const source = audioCtx.createMediaStreamSource(stream)
      const analyserNode = audioCtx.createAnalyser()
      analyserNode.fftSize = 256
      source.connect(analyserNode)
      setAnalyser(analyserNode)

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.start()
      setRecordingPhase("recording")
      setRecordingTimer(0)
      timerRef.current = setInterval(() => {
        setRecordingTimer((p) => p + 1)
      }, 1000)
    } catch (err) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setRecordingError("Microphone access denied. Please allow microphone access in your browser settings.")
      } else if (err.name === "NotFoundError") {
        setRecordingError("No microphone found. Please connect a microphone.")
      } else {
        setRecordingError(err.message || "Failed to start recording")
      }
      setRecordingPhase("error")
    }
  }, [])

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current
    if (!recorder || recorder.state !== "recording") return

    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }

    const handleStop = async () => {
      setAnalyser(null)
      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }

      const blob = new Blob(chunksRef.current, { type: recorder.mimeType })
      if (blob.size < 200) {
        setRecordingError("Recording is too short. Please speak and try again.")
        setRecordingPhase("error")
        return
      }
      try {
        const text = await spillAIService.transcribeAudio(blob)
        if (text) {
          setInput((prev) => {
            const separator = prev.trim() ? " " : ""
            return prev + separator + text
          })
          setTimeout(() => {
            textRef.current?.focus()
            autoResize()
          }, 100)
        }
        setRecordingPhase("idle")
      } catch (err) {
        const msg = err.response?.error || err.message || "Transcription failed"
        setRecordingError(msg)
        setRecordingPhase("error")
      }
    }

    recorder.addEventListener("stop", handleStop, { once: true })
    recorder.stop()
    setRecordingPhase("transcribing")
  }, [autoResize])

  const cancelRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state === "recording") {
      const handleCancel = () => {
        setAnalyser(null)
        if (audioContextRef.current) {
          audioContextRef.current.close()
          audioContextRef.current = null
        }
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop())
          streamRef.current = null
        }
      }
      recorder.addEventListener("stop", handleCancel, { once: true })
      recorder.stop()
    }
    cleanupRecording()
    setRecordingPhase("idle")
    setRecordingTimer(0)
    setRecordingError(null)
  }, [cleanupRecording])

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  const { messages, loading, fetchMessages, fetchSession } = useChat()
  const { addSession, fetchSessions } = useOutletContext() || {}

  const isNewChat = !chatId

  useEffect(() => {
    if (isNewChat) {
      setLocalMessages([])
      initialSyncDone.current = false
      navigatingFromSendRef.current = false

      const state = location.state
      if (state?.forwardedJournal) {
        setForwardedJournal(state.forwardedJournal)
      }
      if (state?.personality) {
        setPersonality(state.personality)
      }

      if (state?.forwardedJournal || state?.personality) {
        window.history.replaceState({}, "")
      }

      setInitialized(true)
    } else if (chatId) {
      if (!navigatingFromSendRef.current) {
        setLocalMessages([])
        initialSyncDone.current = false
      }
      navigatingFromSendRef.current = false
      fetchMessages(chatId)
      fetchSession(chatId).then((session) => {
        if (session?.personalityType) {
          setPersonality(session.personalityType)
        }
      })
      setInitialized(true)
    }
  }, [chatId, fetchMessages, fetchSession, isNewChat, location])

  useEffect(() => {
    if (!isNewChat && !loading && messages.length > 0 && !initialSyncDone.current) {
      setLocalMessages(messages)
      initialSyncDone.current = true
    }
  }, [messages, loading, isNewChat])

  useEffect(() => {
    localStorage.setItem(SPILL_PERSONALITY_KEY, personality)
  }, [personality])

  useEffect(() => {
    if (!userScrolledUp) {
      scrollContainerRef.current?.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
      })
    }
  }, [localMessages, userScrolledUp])

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
    setForwardedJournal(null)
    setSending(true)

    const tempId = "temp-" + Date.now()
    const streamingMsgId = "streaming-" + Date.now()
    streamingMessageIdRef.current = streamingMsgId

    let sessionNavigated = false

    setLocalMessages((prev) => [...prev, {
      id: tempId,
      role: "user",
      content: userText,
      journalContext: journalPayload ? {
        id: journalPayload.id,
        title: journalPayload.title,
        content: journalPayload.content,
      } : null,
      createdAt: new Date().toISOString(),
    },
    {
      id: streamingMsgId,
      role: "assistant",
      content: "",
      personalityMode: personality,
      isStreaming: true,
      createdAt: new Date().toISOString(),
    }])

    try {
      await spillAIService.sendMessageStream(
        userText,
        isNewChat ? null : chatId,
        personality,
        journalPayload,
        {
          onSession: (newSessionId) => {
            if (!sessionNavigated) {
              sessionNavigated = true
              initialSyncDone.current = true
              navigatingFromSendRef.current = true
              addSession?.({
                id: newSessionId,
                title: userText.slice(0, 30) + (userText.length > 30 ? "..." : ""),
                personalityType: personality,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              })
              navigate(`/app/spill/${newSessionId}`, { replace: true })
            }
          },
          onChunk: (chunk) => {
            streamingAccumulatorRef.current += chunk
            if (!streamingFlushTimerRef.current) {
              streamingFlushTimerRef.current =
                requestAnimationFrame(flushStreamingContent)
            }
          },
          onDone: (aiMessageId) => {
            if (streamingFlushTimerRef.current) {
              cancelAnimationFrame(streamingFlushTimerRef.current)
              streamingFlushTimerRef.current = null
            }
            const remaining = streamingAccumulatorRef.current
            streamingAccumulatorRef.current = ""
            setLocalMessages((prev) =>
              prev.map((msg) => {
                if (msg.id === streamingMessageIdRef.current) {
                  return {
                    ...msg,
                    id: aiMessageId || msg.id,
                    content: msg.content + remaining,
                    isStreaming: false,
                    createdAt: new Date().toISOString(),
                  }
                }
                return msg
              }),
            )
            setTimeout(() => fetchSessions?.(), 500)
          },
          onError: (errorMsg) => {
            if (streamingFlushTimerRef.current) {
              cancelAnimationFrame(streamingFlushTimerRef.current)
              streamingFlushTimerRef.current = null
            }
            const remaining = streamingAccumulatorRef.current
            streamingAccumulatorRef.current = ""
            setLocalMessages((prev) =>
              prev.map((msg) => {
                if (msg.id === streamingMessageIdRef.current) {
                  return {
                    ...msg,
                    content: msg.content + remaining || t("spill.errors.response"),
                    isStreaming: false,
                    isError: true,
                  }
                }
                return msg
              }),
            )
          },
        },
      )
    } catch (err) {
      console.error("Spill AI stream error:", err)
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
      } else if (errBody.details) {
        errorMsg = t("spill.errors.withDetails", { details: errBody.details })
      }
      streamingAccumulatorRef.current = ""
      setLocalMessages((prev) =>
        prev.map((msg) =>
          msg.id === streamingMessageIdRef.current
            ? { ...msg, content: errorMsg, isStreaming: false, isError: true }
            : msg,
        ),
      )
    } finally {
      setSending(false)
      streamingMessageIdRef.current = null
    }
  }, [input, forwardedJournal, isNewChat, chatId, navigate, sending, personality, flushStreamingContent, t])

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

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.85); } } @keyframes mascotFadeIn { 0% { opacity: 0; transform: scale(0.8); } 100% { opacity: 1; transform: scale(1); } }`}</style>
      <div
        ref={scrollContainerRef}
        onScroll={handleChatScroll}
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
              <ChatBubble
                key={msg.id}
                msg={msg}
                personality={personality}
                isStreaming={msg.isStreaming}
                isError={msg.isError}
              />
            ))}

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
              <InfoButton tutorialId="forward-journal" style={{ marginBottom: 4 }} />
            </div>

            {recordingPhase === "idle" ? (
              <>
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

                <div style={{ display: "flex", gap: 6, alignItems: "flex-end", flexShrink: 0 }}>
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

                  <button
                    onClick={startRecording}
                    disabled={sending}
                    style={{
                      background: "transparent",
                      border: `1px solid ${theme.border}`,
                      borderRadius: "50%",
                      width: 36, height: 36,
                      cursor: sending ? "default" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.15s",
                      flexShrink: 0,
                      color: theme.muted,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = theme.primary; e.currentTarget.style.color = theme.primary }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.color = theme.muted }}
                  >
                    <Mic size={15} />
                  </button>
                </div>
              </>
            ) : recordingPhase === "recording" ? (
              <div style={{
                flex: 1, display: "flex", flexDirection: "column", gap: 8,
                padding: "4px 0",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <WaveformAnimation analyser={analyser} width={200} height={44} barCount={24} />
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <span style={{
                      width: 8, height: 8, borderRadius: "50%",
                      background: "#DC2626",
                      animation: "pulse 1.2s ease-in-out infinite",
                    }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: theme.muted, fontVariantNumeric: "tabular-nums" }}>
                      {formatTime(recordingTimer)}
                    </span>
                    <span style={{ fontSize: 11, color: theme.muted, fontWeight: 500 }}>
                      {t("spill.recording")}
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                  <button
                    onClick={cancelRecording}
                    style={{
                      padding: "6px 12px", borderRadius: 8,
                      border: `1px solid ${theme.border}`,
                      background: "transparent",
                      color: theme.muted, fontSize: 11, fontWeight: 600,
                      cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    onClick={stopRecording}
                    style={{
                      padding: "6px 12px", borderRadius: 8,
                      border: "none",
                      background: "#DC2626",
                      color: "#fff", fontSize: 11, fontWeight: 600,
                      cursor: "pointer", fontFamily: "inherit",
                      display: "flex", alignItems: "center", gap: 5,
                    }}
                  >
                    <Square size={10} fill="currentColor" />
                    {t("spill.stopRecording")}
                  </button>
                </div>
              </div>
            ) : recordingPhase === "transcribing" ? (
              <div style={{
                flex: 1, display: "flex", alignItems: "center", gap: 10,
                padding: "8px 12px",
              }}>
                <Loader2 size={16} color={theme.primary} style={{ animation: "spin 1s linear infinite" }} />
                <span style={{ fontSize: 13, color: theme.muted, fontWeight: 500 }}>
                  {t("spill.transcribing")}
                </span>
              </div>
            ) : (
              <div style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "8px 12px",
              }}>
                <span style={{ fontSize: 12, color: "#DC2626", fontWeight: 500 }}>
                  {recordingError}
                </span>
                <button
                  onClick={() => setRecordingPhase("idle")}
                  style={{
                    padding: "4px 10px", borderRadius: 6,
                    border: "none", background: "transparent",
                    color: theme.muted, fontSize: 11, fontWeight: 600,
                    cursor: "pointer", fontFamily: "inherit",
                    display: "flex", alignItems: "center", gap: 4,
                  }}
                >
                  <X size={12} />
                  {t("common.close")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
