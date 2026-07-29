import { useState, useEffect, useRef, useCallback } from "react"
import { config } from "../../config"
import { formatTimer } from "../../utils/formatters"

const API = config.API_BASE_URL

export default function useJournalVoice() {
  const [voicePhase, setVoicePhase] = useState("idle")
  const [voiceTimer, setVoiceTimer] = useState(0)
  const [voiceError, setVoiceError] = useState(null)

  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const streamRef = useRef(null)
  const timerRef = useRef(null)
  const canvasRef = useRef(null)
  const analyserRef = useRef(null)
  const animRef = useRef(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (animRef.current) cancelAnimationFrame(animRef.current)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
      }
    }
  }, [])

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
      ctx.shadowBlur = 12
      ctx.shadowColor = isDark ? "rgba(124,58,237,0.25)" : "rgba(124,58,237,0.15)"
      ctx.strokeStyle = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.25)"
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

  const startRecording = useCallback(async () => {
    try {
      setVoiceError(null)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm"
      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []
      const audioContext = new AudioContext()
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
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
      if (err.name === "NotAllowedError") {
        setVoiceError("Microphone access denied. Please allow microphone permissions in your browser settings.")
      } else {
        setVoiceError(`Could not start recording: ${err.message}`)
      }
    }
  }, [drawWaveform])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
    }
    if (timerRef.current) clearInterval(timerRef.current)
    if (animRef.current) cancelAnimationFrame(animRef.current)
    setVoicePhase("recorded")
  }, [])

  const transcribe = useCallback(async () => {
    if (chunksRef.current.length === 0) { setVoiceError("No audio recorded."); return null }
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
      chunksRef.current = []
      setVoicePhase("idle")
      return data.text
    } catch (err) {
      setVoiceError(err.message)
      setVoicePhase("recorded")
      return null
    }
  }, [])

  const formatTime = formatTimer

  const resetRecording = useCallback(() => {
    chunksRef.current = []
    setVoicePhase("idle")
    setVoiceTimer(0)
    setVoiceError(null)
  }, [])

  return {
    voicePhase, setVoicePhase,
    voiceTimer,
    voiceError, setVoiceError,
    canvasRef,
    startRecording, stopRecording, transcribe,
    formatTime,
    resetRecording,
  }
}
