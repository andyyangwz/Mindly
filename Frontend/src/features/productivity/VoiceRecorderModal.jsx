import { useState, useRef, useEffect, useCallback } from "react"
import { Mic, Square, ArrowRight, X, Loader2 } from "lucide-react"
import { theme } from "../../theme"
import { Portal } from "../../utils/portal"
import { config } from "../../config"

export default function VoiceRecorderModal({ open, onClose, onResult }) {
  const [phase, setPhase] = useState("idle")
  const [timer, setTimer] = useState(0)
  const [error, setError] = useState(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const analyserRef = useRef(null)
  const animRef = useRef(null)

  useEffect(() => {
    if (!open) {
      setPhase("idle")
      setTimer(0)
      setError(null)
      chunksRef.current = []
      if (timerRef.current) clearInterval(timerRef.current)
      if (animRef.current) cancelAnimationFrame(animRef.current)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
    }
  }, [open])

  const drawWaveform = useCallback(() => {
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
      const waveColor = isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.3)"
      const glowColor = isDark ? "rgba(124,58,237,0.3)" : "rgba(124,58,237,0.2)"

      ctx.shadowBlur = 15
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
  }, [])

  const startRecording = async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mediaRecorder = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm" })
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
        if (analyserRef.current) {
          analyserRef.current = null
        }
        audioContext.close()
        stream.getTracks().forEach((t) => t.stop())
        streamRef.current = null
        if (animRef.current) cancelAnimationFrame(animRef.current)
      }

      mediaRecorder.start(250)
      setPhase("recording")
      setTimer(0)
      timerRef.current = setInterval(() => {
        setTimer((t) => t + 1)
      }, 1000)

      drawWaveform()
    } catch (err) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setError("Microphone access denied. Please allow microphone permissions in your browser settings.")
      } else {
        setError(`Could not start recording: ${err.message}`)
      }
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
    }
    if (timerRef.current) clearInterval(timerRef.current)
    if (animRef.current) cancelAnimationFrame(animRef.current)
    setPhase("recorded")
  }

  const transcribe = async () => {
    if (chunksRef.current.length === 0) {
      setError("No audio recorded. Please record something first.")
      return
    }

    setPhase("transcribing")
    setError(null)

    try {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" })
      const formData = new FormData()
      formData.append("audio", blob, "recording.webm")

      const token = localStorage.getItem("mindly-token")
      const res = await fetch(`${config.API_BASE_URL}/voice/process`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Transcription failed")
      }

      onResult(data.parsed)
      onClose()
    } catch (err) {
      setError(err.message)
      setPhase("recorded")
    }
  }

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  }

  if (!open) return null

  return (
    <Portal>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: theme.z.modalOverlay,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
          backdropFilter: "blur(4px)",
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Voice input"
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "var(--color-card, #1a1a2e)",
            borderRadius: 24,
            padding: "40px 48px",
            maxWidth: 440,
            width: "100%",
            boxShadow: "0 32px 80px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.05)",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              position: "absolute", top: 16, right: 16,
              background: "none", border: "none", cursor: "pointer",
              padding: 4, display: "flex", color: theme.muted,
            }}
          >
            <X size={16} />
          </button>

          <div
            style={{
              position: "absolute", top: "-50%", left: "-50%",
              width: "200%", height: "200%",
              background: "radial-gradient(circle at center, rgba(124,58,237,0.06) 0%, transparent 60%)",
              pointerEvents: "none",
            }}
          />

          <div style={{ position: "relative", zIndex: 1 }}>
            <div
              style={{
                width: 72, height: 72, borderRadius: "50%",
                margin: "0 auto 20px",
                background: phase === "recording"
                  ? "linear-gradient(135deg, #7C3AED, #EC4899)"
                  : "var(--color-input)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: phase === "recording"
                  ? "0 0 40px rgba(124,58,237,0.4), 0 0 80px rgba(236,72,153,0.2)"
                  : "0 0 20px rgba(124,58,237,0.1)",
                transition: "all 0.5s ease",
                position: "relative",
              }}
            >
              {phase === "recording" && (
                <span
                  style={{
                    position: "absolute", inset: -4, borderRadius: "50%",
                    border: "2px solid rgba(124,58,237,0.3)",
                    animation: "voice-pulse 1.5s ease-in-out infinite",
                  }}
                />
              )}
              {phase === "recording" ? (
                <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
                  {[5, 8, 5, 10, 6].map((h, i) => (
                    <div
                      key={i}
                      style={{
                        width: 3, height: h, borderRadius: 2,
                        background: "white",
                        animation: "voice-bar 0.8s ease-in-out infinite",
                        animationDelay: `${i * 0.12}s`,
                      }}
                    />
                  ))}
                </div>
              ) : (
                <Mic size={28} color={phase === "transcribing" ? theme.muted : "#7C3AED"} />
              )}
            </div>

            {!error && (
              <div style={{ marginBottom: 24 }}>
                <div
                  style={{
                    fontSize: 40, fontWeight: 300, fontVariantNumeric: "tabular-nums",
                    color: theme.dark, letterSpacing: "0.05em",
                  }}
                >
                  {formatTime(timer)}
                </div>
                <div style={{ fontSize: 12, color: theme.muted, marginTop: 4 }}>
                  {phase === "idle" && "Ready"}
                  {phase === "recording" && "Recording"}
                  {phase === "recorded" && "Recording complete"}
                  {phase === "transcribing" && "Processing your voice..."}
                </div>
              </div>
            )}

            {error && (
              <div
                style={{
                  marginBottom: 20, padding: "10px 14px",
                  background: "#FEF2F2", borderRadius: 10,
                  color: "#DC2626", fontSize: 12, lineHeight: 1.5,
                  textAlign: "left",
                }}
              >
                {error}
              </div>
            )}

            <div
              style={{
                height: 80, marginBottom: 24, borderRadius: 12,
                background: "var(--color-input)",
                overflow: "hidden", opacity: phase === "recording" ? 1 : 0.3,
                transition: "opacity 0.3s",
              }}
            >
              <canvas
                ref={canvasRef}
                width={344}
                height={80}
                style={{ width: "100%", height: "100%" }}
              />
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              {(phase === "idle" || phase === "recorded") && (
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={phase === "transcribing"}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "12px 28px", borderRadius: 12,
                    border: "none",
                    background: "linear-gradient(135deg, #7C3AED, #EC4899)",
                    color: "white", fontSize: 14, fontWeight: 600,
                    cursor: phase === "transcribing" ? "not-allowed" : "pointer",
                    opacity: phase === "transcribing" ? 0.5 : 1,
                    transition: "all 0.2s",
                    boxShadow: "0 4px 16px rgba(124,58,237,0.3)",
                  }}
                >
                  <Mic size={16} />
                  {phase === "idle" ? "Start Recording" : "Record Again"}
                </button>
              )}

              {phase === "recording" && (
                <button
                  type="button"
                  onClick={stopRecording}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "12px 28px", borderRadius: 12,
                    border: "none",
                    background: "#EF4444",
                    color: "white", fontSize: 14, fontWeight: 600,
                    cursor: "pointer", transition: "all 0.2s",
                    boxShadow: "0 4px 16px rgba(239,68,68,0.3)",
                  }}
                >
                  <Square size={16} />
                  Stop Recording
                </button>
              )}

              {phase === "recorded" && (
                <button
                  type="button"
                  onClick={transcribe}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "12px 28px", borderRadius: 12,
                    border: "none",
                    background: "linear-gradient(135deg, #7C3AED, #EC4899)",
                    color: "white", fontSize: 14, fontWeight: 600,
                    cursor: "pointer", transition: "all 0.2s",
                    boxShadow: "0 4px 16px rgba(124,58,237,0.3)",
                  }}
                >
                  <ArrowRight size={16} />
                  Transcribe
                </button>
              )}

              {phase === "transcribing" && (
                <div
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "12px 28px", borderRadius: 12,
                    background: "var(--color-input)",
                    color: theme.muted, fontSize: 14, fontWeight: 500,
                  }}
                >
                  <Loader2 size={16} style={{ animation: "voice-spin 1s linear infinite" }} />
                  Transcribing...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes voice-pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.15); opacity: 0.2; }
        }
        @keyframes voice-bar {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(2); }
        }
        @keyframes voice-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Portal>
  )
}
