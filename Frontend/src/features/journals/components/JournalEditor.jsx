import { useState, useEffect, useRef, useCallback } from "react"
import { useTranslation } from "react-i18next"
import {
  ChevronLeft,
  Star,
  Pin,
  Trash2,
  MessageCircle,
  X,
  Loader2,
  MoreHorizontal,
  Folder,
  Mic,
  Square,
  ArrowRight,
  Sparkles,
  Wand2,
  Type,
  Check,
  AlertTriangle,
  RefreshCw,
} from "lucide-react"
import { theme } from "../../../theme"
import { formatDate } from "../../../utils/formatters"
import { journalService } from "../../../services/journalService"
import ConfirmDialog from "../../../components/ui/ConfirmDialog"
import EmojiPicker from "../../../components/ui/EmojiPicker"
import RichEditor from "../../../components/editor/RichEditor"
import { refreshPinnedJournals } from "../../../hooks/usePinnedJournals"
import { config } from "../../../config"

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


export default function JournalEditor({ journalId, isNew, onBack, onDelete, toggleFavorite, togglePinned, toggleAllowAI, onChatAboutIt, chatAboutItLoading, deleting, onAssignFolders, folders, journals, updateJournal }) {
  const { t } = useTranslation()

  const [journal, setJournal] = useState(null)
  const [loading, setLoading] = useState(!!journalId)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [emojis, setEmojis] = useState(["📝", "", ""])
  const [folderIds, setFolderIds] = useState([])
  const titleRef = useRef(null)
  const editorRef = useRef(null)

  const [saveState, setSaveState] = useState("idle")
  const dirtyRef = useRef(false)
  const saveTimerRef = useRef(null)
  const originalRef = useRef(null)

  const [highlights, setHighlights] = useState([])
  const [selectedText, setSelectedText] = useState("")
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [showFolderFab, setShowFolderFab] = useState(false)
  const [folderAssigning, setFolderAssigning] = useState(false)
  const [editingEmojis, setEditingEmojis] = useState(false)
  const [emojiAnimating, setEmojiAnimating] = useState(false)
  const [emojiLoading, setEmojiLoading] = useState(false)
  const [showDateDisabled, setShowDateDisabled] = useState(false)
  const dateDisabledTimerRef = useRef(null)

  const actionsRef = useRef(null)
  const folderFabRef = useRef(null)
  const prevJournalIdRef = useRef(journalId)

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
  const [hasSelection, setHasSelection] = useState(false)

  const isInvalid = !title.trim() || emojis.filter(Boolean).length === 0
  const [showInvalidWarning, setShowInvalidWarning] = useState(false)

  const isInvalidRef = useRef(false)
  isInvalidRef.current = isInvalid
  const origPushRef = useRef(null)

  const isProcessing = voicePhase === "transcribing" || voicePhase === "smoothen" || voicePhase === "restructure" || voicePhase === "autoformat"
  const buttonsDisabled = isProcessing || !hasSelection

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (animRef.current) cancelAnimationFrame(animRef.current)
      if (dateDisabledTimerRef.current) clearTimeout(dateDisabledTimerRef.current)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
      }
    }
  }, [])

  useEffect(() => {
    if (!showActions) return
    const handleClick = (e) => {
      if (actionsRef.current && !actionsRef.current.contains(e.target)) setShowActions(false)
    }
    const handleKey = (e) => { if (e.key === "Escape") setShowActions(false) }
    document.addEventListener("mousedown", handleClick)
    document.addEventListener("keydown", handleKey)
    return () => {
      document.removeEventListener("mousedown", handleClick)
      document.removeEventListener("keydown", handleKey)
    }
  }, [showActions])

  useEffect(() => {
    if (!showFolderFab) return
    const handleClick = (e) => {
      if (folderFabRef.current && !folderFabRef.current.contains(e.target) && !e.target.closest("[data-folder-fab-btn]")) {
        setShowFolderFab(false)
      }
    }
    const handleKey = (e) => { if (e.key === "Escape") setShowFolderFab(false) }
    document.addEventListener("mousedown", handleClick)
    document.addEventListener("keydown", handleKey)
    return () => {
      document.removeEventListener("mousedown", handleClick)
      document.removeEventListener("keydown", handleKey)
    }
  }, [showFolderFab])

  const saveEmojisNow = useCallback(async () => {
    if (!journal) return
    const trimmed = emojis.filter(Boolean).length > 0 ? emojis : ["📝", "", ""]
    if (!originalRef.current || JSON.stringify(trimmed) === JSON.stringify(originalRef.current.emojis)) return
    setSaveState("saving")
    try {
      if (updateJournal) {
        await updateJournal(journal.id, { emojis: trimmed })
      } else {
        await journalService.update(journal.id, { emojis: trimmed })
      }
      if (originalRef.current) originalRef.current = { ...originalRef.current, emojis: trimmed }
      setSaveState("saved")
      refreshPinnedJournals()
    } catch {
      setSaveState("failed")
    }
  }, [journal, emojis, updateJournal])

  useEffect(() => {
    if (!editingEmojis) return
    const handleClick = (e) => {
      if (!e.target.closest("[data-emoji-area]") && !e.target.closest(".EmojiPickerReact")) {
        saveEmojisNow()
        setEditingEmojis(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [editingEmojis, saveEmojisNow])

  const loadJournal = useCallback(async (id) => {
    setLoading(true)
    try {
      const data = await journalService.getAll({ per_page: 1000 })
      const j = data.journals.find((x) => x.id === id)
      if (j) {
        setJournal(j)
        setTitle(j.title)
        setContent(j.content)
        setEmojis(j.emojis.length >= 3 ? [...j.emojis] : [...j.emojis, ...Array(3 - j.emojis.length).fill("")])
        setFolderIds(j.folderIds || [])
        originalRef.current = { title: j.title, content: j.content, emojis: j.emojis, folderIds: j.folderIds || [] }
        journalService.recordOpen(id).catch(() => {})
      }
    } catch {
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (prevJournalIdRef.current !== journalId) {
      prevJournalIdRef.current = journalId
      setLoading(true)
      setJournal(null)
      setTitle("")
      setContent("")
      setEmojis(["📝", "", ""])
      setFolderIds([])
      setHighlights([])
      setSelectedText("")
      setSaveState("idle")
      dirtyRef.current = false
      originalRef.current = null
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [journalId])

  useEffect(() => {
    if (journalId && !journal) {
      loadJournal(journalId)
    }
  }, [journalId, journal, loadJournal])

  function getUniqueTitleForJournal(baseTitle) {
    if (!journals) return baseTitle
    const existingTitles = new Set(
      journals.filter((j) => j.id !== journalId).map((j) => j.title)
    )
    if (!existingTitles.has(baseTitle)) return baseTitle
    let num = 2
    while (existingTitles.has(`${baseTitle} #${num}`)) num++
    return `${baseTitle} #${num}`
  }

  const saveNow = useCallback(async () => {
    if (!dirtyRef.current) return
    if (!journal) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    setSaveState("saving")
    try {
      const changes = {}
      let titleToSave = title
      if (title !== originalRef.current.title) {
        titleToSave = getUniqueTitleForJournal(title || "Untitled")
        changes.title = titleToSave
        if (titleToSave !== title) setTitle(titleToSave)
      }
      if (content !== originalRef.current.content) changes.content = content
      if (JSON.stringify(emojis) !== JSON.stringify(originalRef.current.emojis)) changes.emojis = emojis.filter(Boolean).length > 0 ? emojis : ["📝", "", ""]
      if (JSON.stringify(folderIds) !== JSON.stringify(originalRef.current.folderIds)) changes.folderIds = folderIds
      if (Object.keys(changes).length === 0) {
        setSaveState("saved")
        return
      }
      if (updateJournal) {
        await updateJournal(journal.id, changes)
      } else {
        await journalService.update(journal.id, changes)
      }
      originalRef.current = { ...originalRef.current, ...changes }
      dirtyRef.current = false
      setSaveState("saved")
      refreshPinnedJournals()
    } catch {
      setSaveState("failed")
    }
  }, [journal, title, content, emojis, folderIds, updateJournal, journals, journalId])

  useEffect(() => {
    if (dirtyRef.current) return
    if (!journal) return
    const isDirty = originalRef.current && (title !== originalRef.current.title || content !== originalRef.current.content || JSON.stringify(emojis) !== JSON.stringify(originalRef.current.emojis) || JSON.stringify(folderIds) !== JSON.stringify(originalRef.current.folderIds))
    if (isDirty) {
      dirtyRef.current = true
      setSaveState("editing")
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => saveNow(), 2000)
    }
  }, [title, content, emojis, folderIds, journal])

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault()
        if (dirtyRef.current) saveNow()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [saveNow])

  useEffect(() => {
    const handler = (e) => {
      if (isInvalidRef.current || dirtyRef.current) {
        e.preventDefault()
        e.returnValue = ""
      }
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [])

  useEffect(() => {
    if (!isInvalid) return

    const origPush = window.history.pushState.bind(window.history)
    origPushRef.current = origPush
    let savedUrl = window.location.href

    window.history.pushState = function (state, title, url) {
      if (url !== undefined) {
        let target
        try { target = new URL(url, window.location.origin).href } catch { target = url }
        if (target !== window.location.href) {
          setShowInvalidWarning(true)
          return
        }
      }
      origPush(state, title, url)
      savedUrl = window.location.href
    }

    const handlePopState = () => {
      window.history.pushState(null, "", savedUrl)
      setShowInvalidWarning(true)
    }
    window.addEventListener("popstate", handlePopState)

    return () => {
      window.history.pushState = origPush
      window.removeEventListener("popstate", handlePopState)
    }
  }, [isInvalid])

  const handleContentChange = useCallback((html) => {
    setContent(html)
    dirtyRef.current = true
    setSaveState("editing")
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => saveNow(), 2000)
  }, [saveNow])

  const handleTitleChange = useCallback((e) => {
    setTitle(e.target.value)
    dirtyRef.current = true
    setSaveState("editing")
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => saveNow(), 2000)
  }, [saveNow])

  const handleToggleFolder = useCallback(async (folderId) => {
    setFolderAssigning(true)
    const next = folderIds.includes(folderId)
      ? folderIds.filter((id) => id !== folderId)
      : [...folderIds, folderId]
    setFolderIds(next)
    try {
      await onAssignFolders(journal.id, next)
      originalRef.current = { ...originalRef.current, folderIds: next }
    } catch {
    } finally {
      setFolderAssigning(false)
    }
  }, [folderIds, journal, onAssignFolders])

  const handleDelete = () => setConfirmDelete(true)
  const handleConfirmDelete = async () => {
    setConfirmDelete(false)
    setShowInvalidWarning(false)
    if (origPushRef.current) window.history.pushState = origPushRef.current
    if (journal) {
      await onDelete(journal.id)
    } else {
      onBack()
    }
  }

  const handleMouseUp = useCallback(() => {
    const sel = window.getSelection()
    const text = sel?.toString().trim()
    if (text && text.length > 2) setSelectedText(text)
    else setSelectedText("")
  }, [])

  const saveHighlight = useCallback(() => {
    if (!selectedText || highlights.includes(selectedText)) return
    setHighlights((h) => [...h, selectedText])
    setSelectedText("")
    window.getSelection()?.removeAllRanges()
  }, [selectedText, highlights])

  const setEmoji = useCallback((index, value) => {
    setEmojis((prev) => {
      const em = [...prev]
      if (value) {
        em[index] = value
      } else if (em[index]) {
        em.splice(index, 1)
        em.push("")
      }
      return em
    })
  }, [])

  const autoFillEmojis = useCallback(async () => {
    const text = stripHtml(content)
    if (!text.trim()) return
    setEmojiLoading(true)
    setVoiceError(null)
    try {
      const token = localStorage.getItem("mindly-token")
      const res = await fetch(`${API}/journals/voice/emojis`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Emoji suggestion failed")
      const newEmojis = data.emojis
      if (!Array.isArray(newEmojis) || newEmojis.length < 3) throw new Error("Could not generate emoji suggestions")
      setEmojiAnimating(true)
      setEmojis([newEmojis[0] || "", newEmojis[1] || "", newEmojis[2] || ""])
      dirtyRef.current = true
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => saveNow(), 2000)
      setTimeout(() => setEmojiAnimating(false), 500)
    } catch (err) {
      setVoiceError(err.message)
    } finally {
      setEmojiLoading(false)
    }
  }, [content, saveNow])

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
    if (chunksRef.current.length === 0) { setVoiceError("No audio recorded."); return }
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
      const html = textToHtml(data.text)
      editorRef.current?.insertAtCursor(html)
      setContent(editorRef.current?.getEditor()?.getHTML() || "")
      dirtyRef.current = true
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => saveNow(), 2000)
      chunksRef.current = []
      setVoicePhase("idle")
    } catch (err) {
      setVoiceError(err.message)
      setVoicePhase("recorded")
    }
  }, [saveNow])

  const formatTime = useCallback((s) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
  }, [])

  const handleDateDoubleClick = useCallback(() => {
    if (showDateDisabled) return
    setShowDateDisabled(true)
    if (dateDisabledTimerRef.current) clearTimeout(dateDisabledTimerRef.current)
    dateDisabledTimerRef.current = setTimeout(() => setShowDateDisabled(false), 2500)
  }, [showDateDisabled])

  const callTransform = useCallback(async (endpoint, label) => {
    const editor = editorRef.current?.getEditor()
    if (!editor || editor.state.selection.empty) {
      setVoiceError("Select text in the editor to transform.")
      return
    }
    const preserveStructure = endpoint === "smoothen" || endpoint === "restructure"
    const selectedHTML = editorRef.current?.getSelectedHTML() || ""
    const selectedTextContent = editorRef.current?.getSelectedText() || ""
    const input = preserveStructure ? { html: selectedHTML } : { text: selectedTextContent }
    const raw = preserveStructure ? selectedHTML : selectedTextContent
    if (!raw.trim()) { setVoiceError("Selected text is empty. Nothing to transform."); return }
    setVoicePhase(endpoint)
    setVoiceError(null)
    try {
      const token = localStorage.getItem("mindly-token")
      const res = await fetch(`${API}/journals/voice/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(input),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `${label} failed`)
      const result = data.html || textToHtml(data.text)
      editorRef.current?.replaceSelection(result)
      setContent(editorRef.current?.getEditor()?.getHTML() || "")
      dirtyRef.current = true
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => saveNow(), 2000)
      setVoicePhase("idle")
    } catch (err) {
      setVoiceError(err.message)
      setVoicePhase("idle")
    }
  }, [saveNow])

  if (loading && !journal) {
    return (
      <div style={{ minHeight: "100vh", background: theme.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={22} color={theme.primary} style={{ animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (!journal) {
    return (
      <div style={{ minHeight: "100vh", background: theme.bg, display: "flex", alignItems: "center", justifyContent: "center", color: theme.muted, fontSize: 14 }}>
        Journal not found
      </div>
    )
  }

  const filledCount = emojis.filter(Boolean).length
  const slotCount = Math.min(Math.max(filledCount + 1, 3), 10)

  return (
    <div style={{ minHeight: "100vh", background: theme.bg }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 24px",
          position: "sticky",
          top: 0,
          zIndex: 20,
          background: theme.bg,
        }}
      >
        <button
          onClick={() => {
            if (isInvalid) {
              setShowInvalidWarning(true)
              return
            }
            if (dirtyRef.current) saveNow()
            onBack()
            setHighlights([])
            setSelectedText("")
          }}
          style={{
            display: "flex", alignItems: "center", gap: 4,
            background: "none", border: "none", cursor: "pointer",
            fontSize: 13, color: theme.muted, fontWeight: 400,
            padding: "4px 6px", borderRadius: 6, transition: "all 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = theme.bg }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
        >
          <ChevronLeft size={15} color={theme.muted} /> {t("journal.detail.back")}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 2, position: "relative" }} ref={actionsRef}>
          <button
            onClick={() => { if (journal) togglePinned(journal.id) }}
            aria-label={journal?.isPinned ? t("journal.detail.pinned") : t("journal.detail.pin")}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", color: journal?.isPinned ? "#3B82F6" : theme.muted, transition: "all 0.15s" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = theme.bg }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
          >
            <Pin size={15} fill={journal?.isPinned ? "#3B82F6" : "none"} color={journal?.isPinned ? "#3B82F6" : theme.muted} />
          </button>

          <button
            onClick={() => { if (journal) toggleAllowAI(journal.id) }}
            aria-label={journal?.allowAI ? t("journal.detail.stopSharing") : t("journal.detail.allowSharing")}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", color: journal?.allowAI ? theme.primary : theme.muted, transition: "all 0.15s" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = theme.bg }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
          >
            <MessageCircle size={15} fill={journal?.allowAI ? theme.primary : "none"} color={journal?.allowAI ? theme.primary : theme.muted} />
          </button>

          <button
            onClick={() => { if (journal) toggleFavorite(journal.id) }}
            aria-label={journal?.isFavorite ? t("journal.detail.favorited") : t("journal.detail.favorite")}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", color: theme.muted, transition: "all 0.15s" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = theme.bg }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
          >
            <Star size={15} fill={journal?.isFavorite ? "#F59E0B" : "none"} color={journal?.isFavorite ? "#F59E0B" : theme.muted} />
          </button>

          <button
            onClick={() => setShowActions((s) => !s)}
            aria-label="More actions"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: 6, border: "none", background: showActions ? theme.bg : "transparent", cursor: "pointer", color: theme.muted, transition: "all 0.15s" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = theme.bg }}
            onMouseLeave={(e) => { if (!showActions) e.currentTarget.style.background = "transparent" }}
          >
            <MoreHorizontal size={15} />
          </button>

          {showActions && (
            <div style={{
              position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 30,
              background: "var(--color-card, white)", borderRadius: 10,
              border: `1px solid ${theme.border}`, boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
              padding: "6px", minWidth: 180, display: "flex", flexDirection: "column", gap: 2,
            }}>
              <ActionRow icon={<Trash2 size={14} />} label={t("journal.detail.delete")} onClick={() => { handleDelete(); setShowActions(false) }} color="#EF4444" />
            </div>
          )}

          <div style={{ marginLeft: 8, display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: theme.muted, userSelect: "none" }}>
            {saveState === "editing" && (
              <span style={{ color: theme.muted }}>Editing</span>
            )}
            {saveState === "saving" && (
              <>
                <RefreshCw size={12} style={{ animation: "spin 0.8s linear infinite" }} />
                <span>Saving...</span>
              </>
            )}
            {saveState === "saved" && (
              <>
                <Check size={12} color="#10B981" />
                <span style={{ color: "#10B981" }}>Saved</span>
              </>
            )}
            {saveState === "failed" && (
              <>
                <AlertTriangle size={12} color="#EF4444" />
                <span style={{ color: "#EF4444" }}>Save Failed</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "48px 32px 50vh" }}>
        <input
          ref={titleRef}
          value={title}
          onChange={handleTitleChange}
          placeholder="Untitled"
          className="jd-title-input"
          style={{
            fontSize: 38, fontWeight: 700, color: theme.dark,
            border: "none", outline: "none", background: "transparent",
            boxShadow: "none",
            width: "100%", padding: 0, margin: "0 0 16px",
            lineHeight: 1.25, letterSpacing: "-0.02em",
            fontFamily: "inherit",
            caretColor: theme.primary,
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, position: "relative" }} data-emoji-area>
            {editingEmojis ? (
              <>
                {[0, 1, 2].map((i) => (
                  <div key={i} className={emojiAnimating && emojis[i] ? "emoji-pop-in" : ""} style={{ animationDelay: emojiAnimating && emojis[i] ? `${i * 0.12}s` : "0s" }}>
                    <EmojiPicker value={emojis[i] || ""} onChange={(val) => setEmoji(i, val)} size={44} />
                  </div>
                ))}
                <button
                  onClick={() => { autoFillEmojis(); setEditingEmojis(false) }}
                  disabled={emojiLoading || !content.replace(/<[^>]*>/g, "").trim()}
                  style={{
                    height: 36, padding: "0 12px", borderRadius: 18,
                    border: `1px solid ${theme.border}`,
                    background: "transparent",
                    color: emojiLoading || !content.replace(/<[^>]*>/g, "").trim() ? theme.muted : theme.dark,
                    fontSize: 12, fontWeight: 500, cursor: emojiLoading || !content.replace(/<[^>]*>/g, "").trim() ? "default" : "pointer",
                    flexShrink: 0, whiteSpace: "nowrap",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = theme.border + "33" }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
                >
                  {emojiLoading ? "..." : "Auto Fill"}
                </button>
              </>
            ) : (
              [0, 1, 2].map((i) => {
                const emoji = emojis[i] || ""
                return (
                  <div
                    key={i}
                    onClick={() => setEditingEmojis(true)}
                    className={`jd-emoji-slot${emojiAnimating && emoji ? " emoji-pop-in" : ""}`}
                    style={{
                      width: 44, height: 44, borderRadius: "50%",
                      border: `1.5px solid ${theme.border}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                      animationDelay: emojiAnimating && emoji ? `${i * 0.12}s` : "0s",
                    }}
                  >
                    {emoji ? <span style={{ fontSize: 26, lineHeight: 1 }}>{emoji}</span> : <span style={{ fontSize: 16, lineHeight: 1, color: theme.muted }}>+</span>}
                  </div>
                )
              })
            )}
          </div>
          <div style={{ position: "relative" }}>
            <p
              onDoubleClick={handleDateDoubleClick}
              style={{ fontSize: 13, color: theme.muted, margin: 0, fontWeight: 400, cursor: "default" }}
            >
              {formatDate(journal?.date || new Date().toISOString().slice(0, 10))}
            </p>
            {showDateDisabled && (
              <div style={{
                position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 50,
                background: "rgba(30,27,75,0.92)", color: "white", borderRadius: 6,
                padding: "5px 10px", fontSize: 11, fontWeight: 500, whiteSpace: "nowrap",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                border: "1px solid rgba(255,255,255,0.1)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                animation: "jd-fade-out 2.5s forwards",
              }}>
                Date editing is not yet available
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 40 }}>
          {folderIds.map((fid) => {
            const f = folders?.find((x) => x.id === fid)
            if (!f) return null
            return (
              <span key={fid} style={{ fontSize: 12, background: "var(--color-hover)", color: theme.dark, borderRadius: 4, padding: "3px 8px", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 4 }}>
                {f.emoji} {f.name}
                <button
                  type="button"
                  onClick={() => handleToggleFolder(fid)}
                  disabled={folderAssigning}
                  style={{ background: "none", border: "none", cursor: folderAssigning ? "not-allowed" : "pointer", padding: 0, display: "flex", color: theme.muted, fontSize: 11, marginLeft: 1 }}
                >
                  <X size={11} />
                </button>
              </span>
            )
          })}
        </div>

        <RichEditor
          ref={editorRef}
          key={journal?.id || "new"}
          value={content}
          onChange={handleContentChange}
          onSelectionChange={setHasSelection}
          showToolbar={false}
          bare
        />

        {selectedText && (
          <div style={{
            position: "fixed", bottom: 100, left: "50%", transform: "translateX(-50%)",
            background: theme.dark, color: "white", borderRadius: 10,
            padding: "10px 18px", display: "flex", alignItems: "center", gap: 12,
            zIndex: 100, boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          }}>
            <span style={{ fontSize: 13 }}>&ldquo;{selectedText.slice(0, 40)}{selectedText.length > 40 ? "..." : ""}&rdquo;</span>
            <button
              onClick={saveHighlight}
              style={{ background: theme.primary, border: "none", borderRadius: 6, padding: "6px 14px", color: "white", fontSize: 12, cursor: "pointer", fontWeight: 500 }}
            >
              {t("journal.detail.saveHighlight")}
            </button>
          </div>
        )}

        {highlights.length > 0 && (
          <div style={{ marginTop: 48, paddingTop: 24, borderTop: `1px solid ${theme.border}` }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: theme.dark, marginBottom: 12, display: "flex", alignItems: "center", gap: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              <Star size={13} fill="#F59E0B" color="#F59E0B" /> {t("journal.detail.savedHighlights", { count: highlights.length })}
            </p>
            {highlights.map((h, i) => (
              <div key={i} style={{ padding: "10px 0", borderBottom: i < highlights.length - 1 ? `1px solid ${theme.border}` : "none", fontSize: 14, color: theme.dark, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                <span style={{ lineHeight: 1.6 }}>&ldquo;{h}&rdquo;</span>
                <button
                  onClick={() => setHighlights((hh) => hh.filter((_, idx) => idx !== i))}
                  style={{ background: "none", border: "none", cursor: "pointer", color: theme.muted, padding: 4, flexShrink: 0, borderRadius: 4 }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-hover)" }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: "var(--sidebar-width)",
          right: 0,
          zIndex: 20,
          background: theme.bg,
          padding: "10px 32px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          borderTop: `1px solid ${theme.border}`,
        }}
      >
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            {voiceError && (
              <div style={{ padding: "6px 10px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#EF4444", fontSize: 11, display: "flex", alignItems: "center", gap: 6 }}>
                <span>{voiceError}</span>
                <button onClick={() => setVoiceError(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#EF4444", padding: 2, display: "flex" }}><X size={12} /></button>
              </div>
            )}

            <div style={{ display: "flex", gap: 4 }}>
              <AiToolButton icon={Wand2} label="Smoothen" phase="smoothen" onClick={() => callTransform("smoothen", "Smoothen")} disabled={buttonsDisabled} isProcessing={isProcessing} />
              <AiToolButton icon={Type} label="Auto Format" phase="autoformat" onClick={() => callTransform("autoformat", "Auto Format")} disabled={buttonsDisabled} isProcessing={isProcessing} accent />
              <AiToolButton icon={Sparkles} label="Restructure" phase="restructure" onClick={() => callTransform("restructure", "Restructure")} disabled={buttonsDisabled} isProcessing={isProcessing} />
            </div>

            <div style={{ width: 1, height: 24, background: theme.border, flexShrink: 0 }} />

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {voicePhase !== "idle" && voicePhase !== "recorded" && voicePhase !== "transcribing" && (
                <span style={{ fontSize: 12, fontWeight: 500, fontVariantNumeric: "tabular-nums", color: theme.dark }}>
                  {formatTime(voiceTimer)}
                </span>
              )}
              {(voicePhase === "idle" || voicePhase === "recorded") && (
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={isProcessing}
                  style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 8, border: "none", background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`, color: "white", fontSize: 11, fontWeight: 600, cursor: isProcessing ? "not-allowed" : "pointer", opacity: isProcessing ? 0.5 : 1 }}
                >
                  <Mic size={12} /> {voicePhase === "idle" ? "Record" : "Again"}
                </button>
              )}
              {voicePhase === "recording" && (
                <button
                  type="button"
                  onClick={stopRecording}
                  style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 8, border: "none", background: "#EF4444", color: "white", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
                >
                  <Square size={12} /> Stop
                </button>
              )}
              {voicePhase === "recorded" && (
                <button
                  type="button"
                  onClick={transcribe}
                  style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 8, border: "none", background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`, color: "white", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
                >
                  <ArrowRight size={12} /> Transcribe
                </button>
              )}
              {voicePhase === "transcribing" && (
                <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", color: theme.muted, fontSize: 11 }}>
                  <Loader2 size={12} style={{ animation: "spin 0.8s linear infinite" }} /> Transcribing...
                </div>
              )}
            </div>

            {voicePhase === "recording" && (
              <div style={{ width: 200, height: 36, borderRadius: 6, background: "var(--color-input)", overflow: "hidden", flexShrink: 0 }}>
                <canvas ref={canvasRef} width={600} height={36} style={{ width: "100%", height: "100%" }} />
              </div>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, position: "relative" }} ref={folderFabRef}>
            <button
              type="button"
              data-folder-fab-btn
              onClick={() => setShowFolderFab((v) => !v)}
              style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 10px", borderRadius: 8, border: `1px solid ${showFolderFab ? theme.primary : theme.border}`, background: showFolderFab ? "rgba(124,58,237,0.06)" : "var(--color-card, white)", cursor: "pointer", fontSize: 11, fontWeight: 500, color: showFolderFab ? theme.primary : theme.dark, transition: "all 0.2s" }}
              onMouseEnter={(e) => { if (!showFolderFab) { e.currentTarget.style.borderColor = theme.primary; e.currentTarget.style.color = theme.primary } }}
              onMouseLeave={(e) => { if (!showFolderFab) { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.color = theme.dark } }}
            >
              <Folder size={12} /> Folder
            </button>
            {showFolderFab && (
              <div style={{
                position: "absolute", bottom: "calc(100% + 8px)", right: 0, zIndex: 60,
                background: "var(--color-card, white)", borderRadius: 12,
                border: `1px solid ${theme.border}`, boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                padding: 14, minWidth: 220,
              }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: theme.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Current Folder</p>
                {folderIds.length === 0 ? (
                  <p style={{ fontSize: 12, color: theme.muted, margin: "0 0 10px", fontStyle: "italic" }}>No folder assigned</p>
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
                    {folderIds.map((fid) => {
                      const f = folders?.find((x) => x.id === fid)
                      if (!f) return null
                      return <span key={fid} style={{ fontSize: 12, background: "var(--color-hover)", borderRadius: 4, padding: "3px 8px", fontWeight: 500 }}>{f.emoji} {f.name}</span>
                    })}
                  </div>
                )}
                <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: 8, marginTop: 4 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: theme.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Move to</p>
                  {folders?.map((f) => {
                    const isSelected = folderIds.includes(f.id)
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => handleToggleFolder(f.id)}
                        disabled={folderAssigning}
                        style={{
                          display: "flex", alignItems: "center", gap: 8,
                          padding: "6px 8px", borderRadius: 6, border: "none",
                          background: isSelected ? "var(--color-hover)" : "transparent",
                          cursor: folderAssigning ? "not-allowed" : "pointer",
                          width: "100%", textAlign: "left", fontSize: 13, color: theme.dark,
                          fontWeight: isSelected ? 500 : 400, opacity: folderAssigning ? 0.6 : 1,
                          transition: "all 0.1s",
                        }}
                        onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "var(--color-hover)" }}
                        onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent" }}
                      >
                        <span style={{ fontSize: 15 }}>{f.emoji}</span>
                        <span style={{ flex: 1 }}>{f.name}</span>
                        {isSelected && <span style={{ fontSize: 11, color: theme.primary }}>✓</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => { if (journal) onChatAboutIt() }}
              disabled={chatAboutItLoading}
              style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 10px", borderRadius: 8, border: `1px solid ${theme.border}`, background: "var(--color-card, white)", cursor: chatAboutItLoading ? "not-allowed" : "pointer", fontSize: 11, fontWeight: 500, color: theme.dark, opacity: chatAboutItLoading ? 0.6 : 1, transition: "all 0.2s" }}
              onMouseEnter={(e) => { if (!chatAboutItLoading) { e.currentTarget.style.borderColor = theme.primary; e.currentTarget.style.color = theme.primary } }}
              onMouseLeave={(e) => { if (!chatAboutItLoading) { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.color = theme.dark } }}
            >
              {chatAboutItLoading ? <Loader2 size={12} style={{ animation: "spin 0.8s linear infinite" }} /> : <MessageCircle size={12} />} Spill AI
            </button>
          </div>
      </div>

      {showInvalidWarning && (
        <div
          className="jd-invalid-snackbar"
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 16px 12px 20px",
            background: "rgba(30,27,75,0.92)",
            color: "white",
            borderRadius: 12,
            boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
            fontSize: 13,
            fontWeight: 500,
            whiteSpace: "nowrap",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <span>Please input a title and at least 1 emoji.</span>
          <button
            onClick={() => setConfirmDelete(true)}
            style={{
              background: "rgba(239,68,68,0.15)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 6,
              padding: "5px 12px",
              color: "#EF4444",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.25)" }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.15)" }}
          >
            Delete Journal
          </button>
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title={t("journal.detail.deleteDialog")}
        message={t("journal.detail.deleteConfirm", { title: journal?.title })}
        confirmLabel={t("journal.detail.confirm")}
        cancelLabel={t("common.cancel")}
        variant="danger"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete(false)}
      />

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        .emoji-pop-in { animation: emoji-pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
        @keyframes emoji-pop {
          0% { opacity: 0; transform: scale(0.5) translateY(8px); }
          60% { opacity: 1; transform: scale(1.15) translateY(-2px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .jd-title-input:focus {
          outline: none !important;
          border: none !important;
          box-shadow: none !important;
          -webkit-appearance: none !important;
        }
        .jd-title-input::placeholder {
          color: var(--color-muted);
          font-style: normal;
        }
        .jd-emoji-slot {
          cursor: default;
          user-select: none;
          -webkit-user-select: none;
        }
        .jd-emoji-slot:hover {
          cursor: pointer;
        }
        @keyframes jd-fade-out {
          0%, 70% { opacity: 1; }
          100% { opacity: 0; pointer-events: none; }
        }
        .jd-invalid-snackbar {
          animation: jd-snackbar-in 0.8s ease-out forwards;
        }
        @keyframes jd-snackbar-in {
          0% { transform: translateX(-50%) translateY(100%); opacity: 0; }
          30% { transform: translateX(-50%) translateY(0); opacity: 1; }
          40% { transform: translateX(calc(-50% - 5px)); }
          50% { transform: translateX(calc(-50% + 5px)); }
          60% { transform: translateX(calc(-50% - 4px)); }
          70% { transform: translateX(calc(-50% + 4px)); }
          80% { transform: translateX(calc(-50% - 2px)); }
          90% { transform: translateX(calc(-50% + 2px)); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}

function ActionRow({ icon, label, onClick, color = "var(--color-dark)" }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "7px 10px", borderRadius: 8, border: "none",
        background: "transparent", color, fontSize: 13, fontWeight: 400,
        cursor: "pointer", textAlign: "left", width: "100%", transition: "all 0.1s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-hover)" }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
    >
      {icon} <span>{label}</span>
    </button>
  )
}

function AiToolButton({ icon: Icon, label, phase, onClick, disabled, isProcessing, accent }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "flex", alignItems: "center", gap: 4,
        padding: "5px 10px", borderRadius: 8,
        border: `1px solid ${disabled ? theme.border : accent ? theme.primary : theme.border}`,
        background: disabled ? "var(--color-card, white)" : accent ? "rgba(124,58,237,0.06)" : "var(--color-card, white)",
        color: disabled ? theme.muted : accent ? theme.primary : theme.dark,
        fontSize: 11, fontWeight: 500,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1, transition: "all 0.2s",
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.borderColor = theme.primary
          e.currentTarget.style.background = accent ? "rgba(124,58,237,0.12)" : "rgba(124,58,237,0.06)"
          e.currentTarget.style.color = theme.primary
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.borderColor = accent ? theme.primary : theme.border
          e.currentTarget.style.background = accent ? "rgba(124,58,237,0.06)" : "var(--color-card, white)"
          e.currentTarget.style.color = accent ? theme.primary : theme.dark
        }
      }}
    >
      {isProcessing ? <Loader2 size={12} style={{ animation: "spin 0.8s linear infinite" }} /> : <Icon size={12} />}
      {label}
    </button>
  )
}
