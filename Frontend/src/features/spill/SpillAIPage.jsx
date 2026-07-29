import { useState, useEffect, useRef, useCallback, memo } from "react"
import { useParams, useNavigate, useLocation, useOutletContext } from "react-router-dom"
import { useTranslation } from "react-i18next"
import WaveformAnimation from "../../components/ui/WaveformAnimation"
import "../../styles/spill/index.css"

const SPILL_PERSONALITY_KEY = "mindly_spill_personality"
import { Send, Loader2, MessageCircle, BookOpen, Mic, Square, X } from "lucide-react"
import InfoButton from "../../components/tutorial/InfoButton"
import { useChat } from "../../hooks/useChat"
import { spillAIService } from "../../services/spillAIService"
import PersonalitySelector from "./components/PersonalitySelector"
import ForwardJournalPopover from "./components/ForwardJournalPopover"
import JournalPreviewCard from "./components/JournalPreviewCard"
import { getPersonalityAvatar } from "./utils/personalityAvatars"

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
  if (msg.role === "system") {
    return (
      <div className="sa-sys-msg">
        <span className="sa-sys-badge">{msg.content}</span>
      </div>
    )
  }

  const jc = msg.journalContext

  if (msg.role === "user") {
    return (
      <div className="sa-user-msg">
        <div className="sa-user-inner">
          {jc && <JournalPreviewCard title={jc.title} content={jc.content} compact />}
          <div className="sa-user-bubble">{msg.content}</div>
          <span className="sa-timestamp">{formatChatTime(msg.createdAt)}</span>
        </div>
      </div>
    )
  }

  const msgPersonality = msg.personalityMode || "empathetic"
  const avatarSrc = getPersonalityAvatar(msgPersonality)

  return (
    <div className="sa-ai-msg">
      <div className="sa-ai-avatar-wrap">
        <img key={msgPersonality} src={avatarSrc} alt="" className="sa-ai-avatar" />
      </div>
      <div className="sa-ai-inner">
        {jc && <JournalPreviewCard title={jc.title} content={jc.content} compact />}
        <div className={`sa-ai-bubble sa-bubble-${msgPersonality}${isError ? " sa-ai-bubble-error" : ""}`}>
          {isStreaming && !msg.content ? (
            <span className="sa-typing-text">Typing...</span>
          ) : (
            msg.content
          )}
        </div>
        {!isStreaming && (
          <span className="sa-timestamp">{formatChatTime(msg.createdAt)}</span>
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

  const canSend = (input.trim() || forwardedJournal) && !sending

  return (
    <div className="sa-page">
      <div className="sa-header">
        <div data-tutorial-target="ai-personalities" className="sa-header-left">
          <MessageCircle size={14} color="var(--color-muted)" />
          <span className="sa-header-label">{t("spill.header")}</span>
        </div>
        <PersonalitySelector personality={personality} onChange={handlePersonalityChange} />
        <InfoButton tutorialId="ai-personalities" />
      </div>

      <div ref={scrollContainerRef} onScroll={handleChatScroll} className="sa-scroll-container">
        {localMessages.length === 0 && initialized && !loading && (
          <div className="sa-empty-wrapper">
            <div className="sa-empty-inner">
              <p className="sa-empty-title">{t("spill.emptyState")}</p>
              <p className="sa-empty-sub">{t("spill.emptyStateSub")}</p>
            </div>
          </div>
        )}

        {localMessages.length > 0 && (
          <div className="sa-chat-container">
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

      <div className="sa-input-wrapper">
        <div className="sa-input-inner">
          {showJournalPicker && (
            <ForwardJournalPopover
              onSelect={handleForwardJournal}
              onClose={() => setShowJournalPicker(false)}
            />
          )}

          {forwardedJournal && (
            <div className="sa-forwarded-journal-wrap">
              <JournalPreviewCard
                title={forwardedJournal.title}
                content={forwardedJournal.content}
                onRemove={() => setForwardedJournal(null)}
                compact
              />
            </div>
          )}

          <div className="sa-input-border">
            <div data-tutorial-target="forward-journal" className="sa-journal-picker-area">
              <button
                onClick={() => setShowJournalPicker(o => !o)}
                className={`sa-journal-btn${showJournalPicker ? " sa-journal-btn-active" : ""}`}
              >
                <BookOpen size={12} />
                {t("spill.journal")}
              </button>
              <span className="sa-info-btn-margin"><InfoButton tutorialId="forward-journal" /></span>
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
                  className="sa-textarea"
                />

                <div className="sa-btn-group">
                  <button
                    onClick={send}
                    disabled={!canSend}
                    className={`sa-send-btn${canSend ? " sa-send-btn-active" : ""}`}
                  >
                    {sending ? (
                      <Loader2 size={15} color="var(--color-muted)" className="sa-spin" />
                    ) : (
                      <Send size={15} color={canSend ? "white" : "var(--color-muted)"} />
                    )}
                  </button>

                  <button
                    onClick={startRecording}
                    disabled={sending}
                    className={`sa-mic-btn${sending ? " sa-mic-btn-disabled" : ""}`}
                  >
                    <Mic size={15} />
                  </button>
                </div>
              </>
            ) : recordingPhase === "recording" ? (
              <div className="sa-recording-area">
                <div className="sa-recording-row">
                  <WaveformAnimation analyser={analyser} width={200} height={44} barCount={24} />
                  <div className="sa-recording-info">
                    <span className="sa-recording-dot" />
                    <span className="sa-recording-timer">{formatTime(recordingTimer)}</span>
                    <span className="sa-recording-label">{t("spill.recording")}</span>
                  </div>
                </div>
                <div className="sa-recording-actions">
                  <button onClick={cancelRecording} className="sa-cancel-btn">{t("common.cancel")}</button>
                  <button onClick={stopRecording} className="sa-stop-btn">
                    <Square size={10} fill="currentColor" />
                    {t("spill.stopRecording")}
                  </button>
                </div>
              </div>
            ) : recordingPhase === "transcribing" ? (
              <div className="sa-transcribing-area">
                <Loader2 size={16} color="var(--color-primary)" className="sa-spin" />
                <span className="sa-transcribing-text">{t("spill.transcribing")}</span>
              </div>
            ) : (
              <div className="sa-error-area">
                <span className="sa-error-text">{recordingError}</span>
                <button onClick={() => setRecordingPhase("idle")} className="sa-error-close-btn">
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
