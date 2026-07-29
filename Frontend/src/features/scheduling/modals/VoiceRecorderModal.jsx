import { useState, useRef, useEffect, useCallback } from "react"
import { Mic, Square, ArrowRight, X, Loader2 } from "lucide-react"
import { Portal } from "../../../utils/portal"
import { config } from "../../../config"
import "../../../styles/scheduling/index.css"

export default function VoiceRecorderModal({ open, onClose, onResult, referenceDate }) {
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
      setTimeout(() => {
        setPhase("idle")
        setTimer(0)
        setError(null)
      }, 0)
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

      let url = `${config.API_BASE_URL}/voice/process`
      if (referenceDate) {
        const y = referenceDate.getFullYear()
        const m = String(referenceDate.getMonth() + 1).padStart(2, "0")
        const d = String(referenceDate.getDate()).padStart(2, "0")
        url += `?reference_date=${encodeURIComponent(`${y}-${m}-${d}`)}`
      }
      const token = localStorage.getItem("mindly-token")
      const res = await fetch(url, {
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
      <div className="vrm-overlay" onClick={onClose}>
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Voice input"
          onClick={(e) => e.stopPropagation()}
          className="vrm-dialog"
        >
          <button type="button" onClick={onClose} className="vrm-close-btn">
            <X size={16} />
          </button>

          <div className="vrm-bg-glow" />

          <div className="vrm-content">
            <div className={`vrm-mic-circle ${phase === "recording" ? "vrm-mic-circle-recording" : "vrm-mic-circle-idle"}`}>
              {phase === "recording" && (
                <span className="vrm-pulse-ring" />
              )}
              {phase === "recording" ? (
                <div className="vrm-bar-group">
                  {[5, 8, 5, 10, 6].map((h, i) => (
                    <div
                      key={i}
                      className="vrm-bar"
                      style={{ height: h, animationDelay: `${i * 0.12}s` }}
                    />
                  ))}
                </div>
              ) : (
                <Mic size={28} color={phase === "transcribing" ? "var(--color-muted)" : "#7C3AED"} />
              )}
            </div>

            {!error && (
              <div style={{ marginBottom: 24 }}>
                <div className="vrm-timer">{formatTime(timer)}</div>
                <div className="vrm-status-label">
                  {phase === "idle" && "Ready"}
                  {phase === "recording" && "Recording"}
                  {phase === "recorded" && "Recording complete"}
                  {phase === "transcribing" && "Processing your voice..."}
                </div>
              </div>
            )}

            {error && (
              <div className="vrm-error-box">{error}</div>
            )}

            <div className={`vrm-waveform-box ${phase === "recording" ? "vrm-waveform-box-active" : "vrm-waveform-box-inactive"}`}>
              <canvas
                ref={canvasRef}
                width={344}
                height={80}
                className="vrm-canvas"
              />
            </div>

            <div className="vrm-btn-row">
              {(phase === "idle" || phase === "recorded") && (
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={phase === "transcribing"}
                  className="vrm-action-btn vrm-action-btn-recording"
                  style={{
                    cursor: phase === "transcribing" ? "not-allowed" : "pointer",
                    opacity: phase === "transcribing" ? 0.5 : 1,
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
                  className="vrm-action-btn vrm-action-btn-stop"
                >
                  <Square size={16} />
                  Stop Recording
                </button>
              )}

              {phase === "recorded" && (
                <button
                  type="button"
                  onClick={transcribe}
                  className="vrm-action-btn vrm-action-btn-recording"
                >
                  <ArrowRight size={16} />
                  Transcribe
                </button>
              )}

              {phase === "transcribing" && (
                <div className="vrm-transcribing-box">
                  <Loader2 size={16} className="vrm-spinner" />
                  Transcribing...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Portal>
  )
}