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
import "../../../styles/journals/index.css"

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


export default function JournalEditor({ journalId, onBack, onDelete, toggleFavorite, togglePinned, toggleAllowAI, onChatAboutIt, chatAboutItLoading, deleting, onAssignFolders, folders, journals, updateJournal }) {
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
    await onDelete(journal.id)
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
      <div className="je-loading">
        <Loader2 size={22} color={theme.primary} className="je-save-spin" />
      </div>
    )
  }

  if (!journal) {
    return (
      <div className="je-not-found">
        Journal not found
      </div>
    )
  }

  const filledCount = emojis.filter(Boolean).length
  const slotCount = Math.min(Math.max(filledCount + 1, 3), 10)

  return (
    <div className="je-container">
      <div className="je-top-bar">
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
          className="je-back-btn"
        >
          <ChevronLeft size={15} color={theme.muted} /> {t("journal.detail.back")}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 2, position: "relative" }} ref={actionsRef}>
          <button
            onClick={() => togglePinned(journal.id)}
            aria-label={journal.isPinned ? t("journal.detail.pinned") : t("journal.detail.pin")}
            className="je-action-btn"
            style={{ color: journal.isPinned ? "#3B82F6" : theme.muted }}
          >
            <Pin size={15} fill={journal.isPinned ? "#3B82F6" : "none"} color={journal.isPinned ? "#3B82F6" : theme.muted} />
          </button>

          <button
            onClick={() => toggleAllowAI(journal.id)}
            aria-label={journal.allowAI ? t("journal.detail.stopSharing") : t("journal.detail.allowSharing")}
            className="je-action-btn"
            style={{ color: journal.allowAI ? theme.primary : theme.muted }}
          >
            <MessageCircle size={15} fill={journal.allowAI ? theme.primary : "none"} color={journal.allowAI ? theme.primary : theme.muted} />
          </button>

          <button
            onClick={() => toggleFavorite(journal.id)}
            aria-label={journal.isFavorite ? t("journal.detail.favorited") : t("journal.detail.favorite")}
            className="je-action-btn"
            style={{ color: theme.muted }}
          >
            <Star size={15} fill={journal.isFavorite ? "#F59E0B" : "none"} color={journal.isFavorite ? "#F59E0B" : theme.muted} />
          </button>

          <button
            onClick={() => setShowActions((s) => !s)}
            aria-label="More actions"
            className="je-action-btn je-action-btn-more"
            style={{ background: showActions ? theme.bg : "transparent" }}
          >
            <MoreHorizontal size={15} />
          </button>

          {showActions && (
            <div className="je-actions-menu">
              <ActionRow icon={<Trash2 size={14} />} label={t("journal.detail.delete")} onClick={() => { handleDelete(); setShowActions(false) }} color="#EF4444" />
            </div>
          )}

          <div className="je-save-state">
            {saveState === "editing" && (
              <span className="je-save-editing">Editing</span>
            )}
            {saveState === "saving" && (
              <>
                <RefreshCw size={12} className="je-save-spin" />
                <span>Saving...</span>
              </>
            )}
            {saveState === "saved" && (
              <>
                <Check size={12} color="#10B981" />
                <span className="je-save-saved">Saved</span>
              </>
            )}
            {saveState === "failed" && (
              <>
                <AlertTriangle size={12} color="#EF4444" />
                <span className="je-save-failed">Save Failed</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="je-content">
        <input
          ref={titleRef}
          value={title}
          onChange={handleTitleChange}
          placeholder="Untitled"
          className="je-title-input"
        />

        <div className="je-emoji-row">
          <div className="je-emoji-slots" data-emoji-area>
            {editingEmojis ? (
              <>
                {[0, 1, 2].map((i) => (
                  <div key={i} className={emojiAnimating && emojis[i] ? "je-emoji-pop" : ""} style={{ animationDelay: emojiAnimating && emojis[i] ? `${i * 0.12}s` : "0s" }}>
                    <EmojiPicker value={emojis[i] || ""} onChange={(val) => setEmoji(i, val)} size={44} />
                  </div>
                ))}
                <button
                  onClick={() => { autoFillEmojis(); setEditingEmojis(false) }}
                  disabled={emojiLoading || !stripHtml(content).trim()}
                  className="je-auto-fill-btn"
                  style={{ color: emojiLoading || !stripHtml(content).trim() ? theme.muted : theme.dark }}
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
                    className={`je-emoji-slot${emojiAnimating && emoji ? " je-emoji-pop" : ""}`}
                    style={{ animationDelay: emojiAnimating && emoji ? `${i * 0.12}s` : "0s" }}
                  >
                    {emoji ? <span className="je-emoji-text">{emoji}</span> : <span className="je-emoji-plus">+</span>}
                  </div>
                )
              })
            )}
          </div>
          <div className="je-date" style={{ position: "relative" }}>
            <p onDoubleClick={handleDateDoubleClick} className="je-date" style={{ margin: 0 }}>
              {formatDate(journal.date || new Date().toISOString().slice(0, 10))}
            </p>
            {showDateDisabled && (
              <div className="je-date-tooltip">
                Date editing is not yet available
              </div>
            )}
          </div>
        </div>

        <div className="je-folders-row">
          {folderIds.map((fid) => {
            const f = folders?.find((x) => x.id === fid)
            if (!f) return null
            return (
              <span key={fid} className="je-folder-badge">
                {f.emoji} {f.name}
                <button
                  type="button"
                  onClick={() => handleToggleFolder(fid)}
                  disabled={folderAssigning}
                  className="je-folder-badge-btn"
                >
                  <X size={11} />
                </button>
              </span>
            )
          })}
        </div>

        <RichEditor
          ref={editorRef}
          key={journal.id || "new"}
          value={content}
          onChange={handleContentChange}
          onSelectionChange={setHasSelection}
          showToolbar={false}
          bare
        />

        {selectedText && (
          <div className="je-selected-bar" style={{ background: theme.dark, color: "white" }}>
            <span className="je-selected-text">&ldquo;{selectedText.slice(0, 40)}{selectedText.length > 40 ? "..." : ""}&rdquo;</span>
            <button
              onClick={saveHighlight}
              className="je-selected-save-btn"
              style={{ background: theme.primary }}
            >
              {t("journal.detail.saveHighlight")}
            </button>
          </div>
        )}

        {highlights.length > 0 && (
          <div className="je-highlights-section">
            <p className="je-highlights-title">
              <Star size={13} fill="#F59E0B" color="#F59E0B" /> {t("journal.detail.savedHighlights", { count: highlights.length })}
            </p>
            {highlights.map((h, i) => (
              <div key={i} className="je-highlight-item">
                <span className="je-highlight-text">&ldquo;{h}&rdquo;</span>
                <button
                  onClick={() => setHighlights((hh) => hh.filter((_, idx) => idx !== i))}
                  className="je-highlight-remove"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="je-bottom-bar">
          <div className="je-bottom-left">
            {voiceError && (
              <div className="je-voice-error">
                <span>{voiceError}</span>
                <button onClick={() => setVoiceError(null)} className="je-voice-error-btn"><X size={12} /></button>
              </div>
            )}

            <div className="je-ai-tools">
              <AiToolButton icon={Wand2} label="Smoothen" phase="smoothen" onClick={() => callTransform("smoothen", "Smoothen")} disabled={buttonsDisabled} isProcessing={isProcessing} />
              <AiToolButton icon={Type} label="Auto Format" phase="autoformat" onClick={() => callTransform("autoformat", "Auto Format")} disabled={buttonsDisabled} isProcessing={isProcessing} accent />
              <AiToolButton icon={Sparkles} label="Restructure" phase="restructure" onClick={() => callTransform("restructure", "Restructure")} disabled={buttonsDisabled} isProcessing={isProcessing} />
            </div>

            <div className="je-divider" />

            <div className="je-voice-controls">
              {voicePhase !== "idle" && voicePhase !== "recorded" && voicePhase !== "transcribing" && (
                <span className="je-voice-timer">
                  {formatTime(voiceTimer)}
                </span>
              )}
              {(voicePhase === "idle" || voicePhase === "recorded") && (
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={isProcessing}
                  className="je-record-btn"
                  style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`, opacity: isProcessing ? 0.5 : 1 }}
                >
                  <Mic size={12} /> {voicePhase === "idle" ? "Record" : "Again"}
                </button>
              )}
              {voicePhase === "recording" && (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="je-stop-btn"
                >
                  <Square size={12} /> Stop
                </button>
              )}
              {voicePhase === "recorded" && (
                <button
                  type="button"
                  onClick={transcribe}
                  className="je-transcribe-btn"
                  style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` }}
                >
                  <ArrowRight size={12} /> Transcribe
                </button>
              )}
              {voicePhase === "transcribing" && (
                <div className="je-transcribing">
                  <Loader2 size={12} className="je-transcribing-spin" /> Transcribing...
                </div>
              )}
            </div>

            {voicePhase === "recording" && (
              <div className="je-waveform">
                <canvas ref={canvasRef} width={600} height={36} />
              </div>
            )}
          </div>

          <div className="je-bottom-right" ref={folderFabRef}>
            <button
              type="button"
              data-folder-fab-btn
              onClick={() => setShowFolderFab((v) => !v)}
              className={showFolderFab ? "je-folder-btn je-folder-btn-active" : "je-folder-btn"}
            >
              <Folder size={12} /> Folder
            </button>
            {showFolderFab && (
              <div className="je-folder-menu">
                <p className="je-folder-menu-label">Current Folder</p>
                {folderIds.length === 0 ? (
                  <p className="je-folder-menu-empty">No folder assigned</p>
                ) : (
                  <div className="je-folder-menu-badges">
                    {folderIds.map((fid) => {
                      const f = folders?.find((x) => x.id === fid)
                      if (!f) return null
                      return <span key={fid} className="je-folder-menu-badge">{f.emoji} {f.name}</span>
                    })}
                  </div>
                )}
                <div className="je-folder-menu-divider">
                  <p className="je-folder-menu-move">Move to</p>
                  {folders?.map((f) => {
                    const isSelected = folderIds.includes(f.id)
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => handleToggleFolder(f.id)}
                        disabled={folderAssigning}
                        className={`je-folder-menu-item${isSelected ? " je-folder-menu-item-selected" : ""}`}
                        style={{ color: theme.dark }}
                      >
                        <span className="je-folder-menu-item-emoji">{f.emoji}</span>
                        <span className="je-folder-menu-item-name">{f.name}</span>
                        {isSelected && <span className="je-folder-menu-item-check">✓</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => onChatAboutIt()}
              disabled={chatAboutItLoading}
              className="je-chat-btn"
            >
              {chatAboutItLoading ? <Loader2 size={12} className="je-save-spin" /> : <MessageCircle size={12} />} Spill AI
            </button>
          </div>
      </div>

      {showInvalidWarning && (
        <div className="je-invalid-snackbar">
          <span>Please input a title and at least 1 emoji.</span>
          <button
            onClick={() => setConfirmDelete(true)}
            className="je-invalid-delete-btn"
          >
            Delete Journal
          </button>
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title={t("journal.detail.deleteDialog")}
        message={t("journal.detail.deleteConfirm", { title: journal.title })}
        confirmLabel={t("journal.detail.confirm")}
        cancelLabel={t("common.cancel")}
        variant="danger"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  )
}

function ActionRow({ icon, label, onClick, color = "var(--color-dark)" }) {
  return (
    <button
      onClick={onClick}
      className="je-action-row"
      style={{ color }}
    >
      {icon} <span>{label}</span>
    </button>
  )
}

function AiToolButton({ icon: Icon, label, phase, onClick, disabled, isProcessing, accent }) {
  const isDisabled = disabled
  const cls = `je-ai-tool-btn${accent ? " je-ai-tool-btn-accent" : " je-ai-tool-btn-default"}${isDisabled ? " je-ai-tool-btn-disabled" : " je-ai-tool-btn-enabled"}`
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className={cls}
      style={{
        border: `1px solid ${isDisabled ? theme.border : accent ? theme.primary : theme.border}`,
        color: isDisabled ? theme.muted : accent ? theme.primary : theme.dark,
        background: isDisabled ? "var(--color-card, white)" : accent ? "rgba(124,58,237,0.06)" : "var(--color-card, white)",
      }}
    >
      {isProcessing ? <Loader2 size={12} className="je-save-spin" /> : <Icon size={12} />}
      {label}
    </button>
  )
}
