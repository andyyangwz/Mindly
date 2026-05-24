import { useState, useRef, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { ArrowLeft, Mic, Square, ArrowRight, Sparkles, Wand2, Loader2, Type } from "lucide-react"
import { theme } from "../../theme"
import EmojiPicker from "../../components/ui/EmojiPicker"
import RichEditor from "../../components/editor/RichEditor"
import InfoButton from "../../components/tutorial/InfoButton"
import { config } from "../../config"

function stripHtml(html) {
  if (!html) return ""
  const doc = new DOMParser().parseFromString(html, "text/html")
  return doc.body.textContent || ""
}

function textToHtml(text) {
  const paragraphs = text.split("\n").filter(Boolean)
  return paragraphs.map((p) => `<p>${p}</p>`).join("")
}

const API = config.API_BASE_URL

export default function JournalForm({ form, setForm, editId, onSave, onBack }) {
  const { t } = useTranslation()
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const [voicePhase, setVoicePhase] = useState("idle")
  const [voiceTimer, setVoiceTimer] = useState(0)
  const [voiceError, setVoiceError] = useState(null)
  const [emojiLoading, setEmojiLoading] = useState(false)
  const [emojiAnimating, setEmojiAnimating] = useState(false)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const streamRef = useRef(null)
  const timerRef = useRef(null)
  const canvasRef = useRef(null)
  const analyserRef = useRef(null)
  const animRef = useRef(null)
  const isEdit = !!editId

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (animRef.current) cancelAnimationFrame(animRef.current)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
      }
    }
  }, [])

  const drawWaveform = () => {
    const canvas = canvasRef.current
    if (!canvas || !analyserRef.current) return
    const ctx = canvas.getContext("2d")
    const bufferLength = analyserRef.current.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      if (!canvas || !analyserRef.current) return
      animRef.current = requestAnimationFrame(draw)
      analyserRef.current.getByteTimeDomainData(dataArray)

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const isDark = document.documentElement.getAttribute("data-theme") !== "light"
      const waveColor = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.25)"
      const glowColor = isDark ? "rgba(124,58,237,0.25)" : "rgba(124,58,237,0.15)"

      ctx.shadowBlur = 12
      ctx.shadowColor = glowColor
      ctx.strokeStyle = waveColor
      ctx.lineWidth = 2
      ctx.beginPath()

      const sliceWidth = canvas.width / bufferLength
      let x = 0
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0
        const y = (v * canvas.height) / 2
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
        x += sliceWidth
      }
      ctx.stroke()
    }
    draw()
  }

  const startRecording = async () => {
    try {
      setVoiceError(null)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm"
      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      const audioContext = new AudioContext()
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        analyserRef.current = null
        audioContext.close()
        stream.getTracks().forEach((t) => t.stop())
        streamRef.current = null
        if (animRef.current) cancelAnimationFrame(animRef.current)
      }

      mediaRecorder.start(250)
      setVoicePhase("recording")
      setVoiceTimer(0)
      timerRef.current = setInterval(() => setVoiceTimer((t) => t + 1), 1000)
      drawWaveform()
    } catch (err) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setVoiceError("Microphone access denied. Please allow microphone permissions in your browser settings.")
      } else {
        setVoiceError(`Could not start recording: ${err.message}`)
      }
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
    }
    if (timerRef.current) clearInterval(timerRef.current)
    if (animRef.current) cancelAnimationFrame(animRef.current)
    setVoicePhase("recorded")
  }

  const transcribe = async () => {
    if (chunksRef.current.length === 0) {
      setVoiceError("No audio recorded.")
      return
    }
    setVoicePhase("transcribing")
    setVoiceError(null)

    try {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" })
      const fd = new FormData()
      fd.append("audio", blob, "recording.webm")

      const token = localStorage.getItem("mindly-token")
      const res = await fetch(`${API}/journals/voice/transcribe`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Transcription failed")

      const existing = stripHtml(form.content)
      const newContent = existing
        ? form.content + textToHtml("\n" + data.text)
        : textToHtml(data.text)
      setForm((f) => ({ ...f, content: newContent }))
      chunksRef.current = []
      setVoicePhase("idle")
    } catch (err) {
      setVoiceError(err.message)
      setVoicePhase("recorded")
    }
  }

  const callTransform = async (endpoint, label) => {
    const preserveStructure = endpoint === "smoothen" || endpoint === "restructure"
    const input = preserveStructure
      ? { html: form.content }
      : { text: stripHtml(form.content) }

    const raw = preserveStructure ? form.content : stripHtml(form.content)
    if (!raw.trim()) {
      setVoiceError("Journal is empty. Nothing to transform.")
      return
    }
    setVoicePhase(endpoint)
    setVoiceError(null)

    try {
      const token = localStorage.getItem("mindly-token")
      const res = await fetch(`${API}/journals/voice/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(input),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `${label} failed`)

      setForm((f) => ({ ...f, content: data.html || textToHtml(data.text) }))
      setVoicePhase("idle")
    } catch (err) {
      setVoiceError(err.message)
      setVoicePhase("idle")
    }
  }

  const formatTime = (s) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
  }

  const autoFillEmojis = async () => {
    const text = stripHtml(form.content)
    if (!text.trim()) return
    setEmojiLoading(true)
    setVoiceError(null)

    try {
      const token = localStorage.getItem("mindly-token")
      const res = await fetch(`${API}/journals/voice/emojis`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Emoji suggestion failed")

      const emojis = data.emojis
      if (!Array.isArray(emojis) || emojis.length < 3) {
        throw new Error("Could not generate emoji suggestions")
      }

      setEmojiAnimating(true)
      setForm((f) => ({
        ...f,
        emojis: [emojis[0] || "", emojis[1] || "", emojis[2] || ""],
      }))
      setTimeout(() => setEmojiAnimating(false), 500)
    } catch (err) {
      setVoiceError(err.message)
    } finally {
      setEmojiLoading(false)
    }
  }

  const validate = () => {
    const errs = {}
    if (!form.title.trim()) errs.title = t("journal.form.validation.titleRequired")
    if (!stripHtml(form.content).trim()) errs.content = t("journal.form.validation.contentRequired")
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const raw = form.emojis || [];
      let trimmed = [...raw];
      while (trimmed.length > 0 && !trimmed[trimmed.length - 1]) {
        trimmed.pop();
      }
      const payload = {
        title: form.title,
        content: form.content,
        emojis: trimmed.length > 0 ? trimmed : ["📝", "", ""],
      }
      await onSave(payload)
    } catch (err) {
      setErrors({ submit: err.message })
    } finally {
      setSaving(false)
    }
  }

  const setEmoji = (index, value) => {
    setForm((f) => {
      const em = [...(f.emojis || [])]
      if (value) {
        em[index] = value
      } else if (em[index]) {
        em.splice(index, 1)
        em.push("")
      }
      return { ...f, emojis: em }
    })
  }

  const filledCount = (form.emojis || []).filter(Boolean).length
  const slotCount = Math.min(Math.max(filledCount + 1, 3), 10)

  const isProcessing = voicePhase === "transcribing" || voicePhase === "smoothen" || voicePhase === "restructure" || voicePhase === "autoformat"

  return (
    <div style={{ padding: "28px 32px", maxWidth: 740, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button
          onClick={onBack}
          style={{
            background: theme.bg,
            border: "none",
            borderRadius: 10,
            padding: 8,
            cursor: "pointer",
            display: "flex",
          }}
        >
          <ArrowLeft size={16} color={theme.primaryText} />
        </button>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: theme.dark }}>
          {isEdit ? t("journal.form.editTitle") : t("journal.form.newTitle")}
        </h1>
      </div>

      {errors.submit && (
        <div
          style={{
            marginBottom: 16,
            padding: "10px 14px",
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: 10,
            color: "#EF4444",
            fontSize: 13,
          }}
        >
          {errors.submit}
        </div>
      )}

      {voiceError && (
        <div
          style={{
            marginBottom: 16,
            padding: "10px 14px",
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: 10,
            color: "#EF4444",
            fontSize: 13,
          }}
        >
          {voiceError}
        </div>
      )}

      <div
        style={{
          background: "var(--color-card, white)",
          borderRadius: 16,
          border: `1px solid ${theme.border}`,
          padding: "24px",
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: theme.dark,
              display: "block",
              marginBottom: 6,
            }}
          >
            {t("journal.form.titleLabel")}
          </label>
          <input
            value={form.title}
            onChange={(e) => {
              setErrors((e2) => ({ ...e2, title: null }))
              setForm((f) => ({ ...f, title: e.target.value }))
            }}
            placeholder={t("journal.form.titlePlaceholder")}
            style={{
              width: "100%",
              padding: "10px 14px",
              border: `1px solid ${errors.title ? "#EF4444" : theme.border}`,
              borderRadius: 10,
              fontSize: 14,
              color: theme.dark,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          {errors.title && (
            <p style={{ fontSize: 12, color: "#EF4444", marginTop: 4 }}>
              {errors.title}
            </p>
          )}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: theme.dark,
              display: "block",
              marginBottom: 6,
            }}
          >
            {t("journal.form.contentPlaceholder")}
          </label>
          <RichEditor
            value={form.content}
            onChange={(html) => {
              setErrors((e2) => ({ ...e2, content: null }))
              setForm((f) => ({ ...f, content: html }))
            }}
          />
          {errors.content && (
            <p style={{ fontSize: 12, color: "#EF4444", marginTop: 4 }}>
              {errors.content}
            </p>
          )}
        </div>

        {stripHtml(form.content).trim() && (
          <div
            data-tutorial-target="writing-assistant"
            style={{
              marginBottom: 16,
              padding: "14px 16px",
              borderRadius: 12,
              background: "var(--color-input)",
              border: `1px solid ${theme.border}`,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: theme.muted,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 10,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              AI Writing Assistant
              <InfoButton tutorialId="writing-assistant" />
            </div>

            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => callTransform("smoothen", "Smoothen")}
                disabled={isProcessing}
                className="ai-tool-btn"
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "6px 12px", borderRadius: 8,
                  border: `1px solid ${isProcessing ? theme.border : theme.border}`,
                  background: isProcessing ? "var(--color-card, white)" : "var(--color-card, white)",
                  color: isProcessing ? theme.muted : theme.dark,
                  fontSize: 12, fontWeight: 500,
                  cursor: isProcessing ? "not-allowed" : "pointer",
                  opacity: isProcessing ? 0.5 : 1,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!isProcessing) {
                    e.currentTarget.style.borderColor = theme.primary
                    e.currentTarget.style.background = `rgba(124,58,237,0.06)`
                    e.currentTarget.style.color = theme.primary
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isProcessing) {
                    e.currentTarget.style.borderColor = theme.border
                    e.currentTarget.style.background = "var(--color-card, white)"
                    e.currentTarget.style.color = theme.dark
                  }
                }}
              >
                {isProcessing && voicePhase === "smoothen" ? (
                  <Loader2 size={13} style={{ animation: "voice-spin 1s linear infinite" }} />
                ) : (
                  <Wand2 size={13} />
                )}
                Smoothen
              </button>

              <button
                type="button"
                onClick={() => callTransform("autoformat", "Auto Format")}
                disabled={isProcessing}
                className="ai-tool-btn"
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "6px 12px", borderRadius: 8,
                  border: `1px solid ${isProcessing ? theme.border : theme.primary}`,
                  background: isProcessing ? "var(--color-card, white)" : `rgba(124,58,237,0.06)`,
                  color: isProcessing ? theme.muted : theme.primary,
                  fontSize: 12, fontWeight: 500,
                  cursor: isProcessing ? "not-allowed" : "pointer",
                  opacity: isProcessing ? 0.5 : 1,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!isProcessing) {
                    e.currentTarget.style.borderColor = theme.primary
                    e.currentTarget.style.background = `rgba(124,58,237,0.12)`
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isProcessing) {
                    e.currentTarget.style.borderColor = theme.primary
                    e.currentTarget.style.background = `rgba(124,58,237,0.06)`
                  }
                }}
              >
                {isProcessing && voicePhase === "autoformat" ? (
                  <Loader2 size={13} style={{ animation: "voice-spin 1s linear infinite" }} />
                ) : (
                  <Type size={13} />
                )}
                Auto Format
              </button>

              <button
                type="button"
                onClick={() => callTransform("restructure", "Restructure")}
                disabled={isProcessing}
                className="ai-tool-btn"
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "6px 12px", borderRadius: 8,
                  border: `1px solid ${isProcessing ? theme.border : theme.border}`,
                  background: isProcessing ? "var(--color-card, white)" : "var(--color-card, white)",
                  color: isProcessing ? theme.muted : theme.dark,
                  fontSize: 12, fontWeight: 500,
                  cursor: isProcessing ? "not-allowed" : "pointer",
                  opacity: isProcessing ? 0.5 : 1,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!isProcessing) {
                    e.currentTarget.style.borderColor = theme.primary
                    e.currentTarget.style.background = `rgba(124,58,237,0.06)`
                    e.currentTarget.style.color = theme.primary
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isProcessing) {
                    e.currentTarget.style.borderColor = theme.border
                    e.currentTarget.style.background = "var(--color-card, white)"
                    e.currentTarget.style.color = theme.dark
                  }
                }}
              >
                {isProcessing && voicePhase === "restructure" ? (
                  <Loader2 size={13} style={{ animation: "voice-spin 1s linear infinite" }} />
                ) : (
                  <Sparkles size={13} />
                )}
                Restructure
              </button>
            </div>
          </div>
        )}

        <div
          data-tutorial-target="voice-journaling"
          style={{
            marginBottom: 20,
            padding: 16,
            borderRadius: 12,
            background: "var(--color-input)",
            border: `1px solid ${voicePhase === "recording" ? theme.primary : theme.border}`,
            transition: "border-color 0.3s",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Mic size={14} color={voicePhase === "recording" ? theme.primary : theme.muted} />
              <span style={{ fontSize: 12, fontWeight: 600, color: theme.muted, textTransform: "uppercase", letterSpacing: "0.05em", display: "inline-flex", alignItems: "center", gap: 6 }}>
                Voice Recording
                <InfoButton tutorialId="voice-journaling" />
              </span>
              {voicePhase !== "idle" && (
                <span style={{ fontSize: 14, fontWeight: 500, fontVariantNumeric: "tabular-nums", color: theme.dark }}>
                  {formatTime(voiceTimer)}
                </span>
              )}
            </div>

            <div style={{ display: "flex", gap: 6 }}>
              {(voicePhase === "idle" || voicePhase === "recorded") && (
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={isProcessing}
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "6px 14px", borderRadius: 8, border: "none",
                    background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                    color: "white", fontSize: 12, fontWeight: 600,
                    cursor: isProcessing ? "not-allowed" : "pointer",
                    opacity: isProcessing ? 0.5 : 1,
                  }}
                >
                  <Mic size={12} />
                  {voicePhase === "idle" ? "Record" : "Record Again"}
                </button>
              )}
              {voicePhase === "recording" && (
                <button
                  type="button"
                  onClick={stopRecording}
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "6px 14px", borderRadius: 8, border: "none",
                    background: "#EF4444", color: "white", fontSize: 12, fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  <Square size={12} />
                  Stop
                </button>
              )}
              {voicePhase === "recorded" && (
                <button
                  type="button"
                  onClick={transcribe}
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "6px 14px", borderRadius: 8, border: "none",
                    background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                    color: "white", fontSize: 12, fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  <ArrowRight size={12} />
                  Transcribe
                </button>
              )}
              {voicePhase === "transcribing" && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 14px", color: theme.muted, fontSize: 12 }}>
                  <Loader2 size={12} style={{ animation: "voice-spin 1s linear infinite" }} />
                  Transcribing...
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              height: 48, borderRadius: 8,
              background: "var(--color-card, white)",
              overflow: "hidden",
              opacity: voicePhase === "recording" ? 1 : 0.3,
              transition: "opacity 0.3s",
            }}
          >
            <canvas
              ref={canvasRef}
              width={600}
              height={48}
              style={{ width: "100%", height: "100%" }}
            />
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
            <label
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: theme.dark,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              {t("journal.form.emojisLabel")}{filledCount > 0 && ` (${filledCount})`}
              <InfoButton tutorialId="emoji-autofill" />
            </label>
            <button
              type="button"
              onClick={autoFillEmojis}
              disabled={emojiLoading || !stripHtml(form.content).trim()}
              style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "4px 10px", borderRadius: 6,
                border: `1px solid ${theme.primary}`,
                background: emojiLoading
                  ? "var(--color-input)"
                  : `rgba(124, 58, 237, 0.06)`,
                color: emojiLoading ? theme.muted : theme.primary,
                fontSize: 11, fontWeight: 500,
                cursor: (emojiLoading || !stripHtml(form.content).trim()) ? "not-allowed" : "pointer",
                opacity: (emojiLoading || !stripHtml(form.content).trim()) ? 0.5 : 1,
                transition: "all 0.2s",
              }}
            >
              {emojiLoading ? (
                <Loader2 size={12} style={{ animation: "voice-spin 1s linear infinite" }} />
              ) : (
                <Sparkles size={12} />
              )}
              Auto Fill
            </button>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", maxWidth: 5 * 64 + 4 * 12, margin: "50px auto" }}>
            {Array.from({ length: slotCount }, (_, i) => (
              <div
                key={i}
                className={emojiAnimating && form.emojis[i] ? "emoji-pop-in" : ""}
                style={{
                  animationDelay: emojiAnimating && form.emojis[i] ? `${i * 0.12}s` : "0s",
                }}
              >
                <EmojiPicker
                  value={form.emojis[i] || ""}
                  onChange={(val) => setEmoji(i, val)}
                  size={64}
                />
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: "100%",
            padding: "12px",
            background: saving
              ? theme.muted
              : `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
            color: "white",
            border: "none",
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 500,
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? t("journal.form.saving") : isEdit ? t("journal.form.update") : t("journal.form.save")}
        </button>
      </div>

      <style>{`
        @keyframes voice-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .emoji-pop-in {
          animation: emoji-pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        @keyframes emoji-pop {
          0% { opacity: 0; transform: scale(0.5) translateY(8px); }
          60% { opacity: 1; transform: scale(1.15) translateY(-2px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  )
}
