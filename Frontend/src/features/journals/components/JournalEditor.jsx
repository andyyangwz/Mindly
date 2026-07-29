import { useState, useEffect, useRef, useCallback } from "react"
import { useTranslation } from "react-i18next"
import {
  ChevronLeft, Star, Pin, Trash2, MessageCircle, X, Loader2,
  MoreHorizontal, Folder, Mic, Square, ArrowRight, Sparkles,
  Wand2, Type, Check, AlertTriangle, RefreshCw,
} from "lucide-react"
import { theme } from "../../../theme"
import { formatDate } from "../../../utils/formatters"
import { stripHtml, textToHtml } from "../../../utils/editor"
import { journalService } from "../../../services/journalService"
import ConfirmDialog from "../../../components/ui/ConfirmDialog"
import EmojiPicker from "../../../components/ui/EmojiPicker"
import RichEditor from "../../../components/editor/RichEditor"
import useJournalAutosave from "../../../hooks/journals/useJournalAutosave"
import useJournalVoice from "../../../hooks/journals/useJournalVoice"
import useJournalAI from "../../../hooks/journals/useJournalAI"
import useJournalHighlights from "../../../hooks/journals/useJournalHighlights"
import useJournalNavigationGuard from "../../../hooks/journals/useJournalNavigationGuard"
import useJournalFolders from "../../../hooks/journals/useJournalFolders"
import { config } from "../../../config"
import "../../../styles/journals/index.css"

const API = config.API_BASE_URL

export default function JournalEditor({
  journalId, onBack, onDelete, toggleFavorite, togglePinned,
  toggleAllowAI, onChatAboutIt, chatAboutItLoading, deleting,
  onAssignFolders, folders, journals, updateJournal,
}) {
  const { t } = useTranslation()

  const [journal, setJournal] = useState(null)
  const [loading, setLoading] = useState(!!journalId)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [emojis, setEmojis] = useState(["📝", "", ""])
  const titleRef = useRef(null)
  const editorRef = useRef(null)

  const [editingEmojis, setEditingEmojis] = useState(false)
  const [emojiAnimating, setEmojiAnimating] = useState(false)
  const [emojiLoading, setEmojiLoading] = useState(false)
  const [showDateDisabled, setShowDateDisabled] = useState(false)
  const dateDisabledTimerRef = useRef(null)
  const actionsRef = useRef(null)
  const prevJournalIdRef = useRef(journalId)

  const voice = useJournalVoice()
  const { voicePhase, voiceTimer, voiceError, startRecording, stopRecording, formatTime, setVoiceError, canvasRef, transcribe } = voice
  const highlights = useJournalHighlights()
  const folderState = useJournalFolders({ journal, folders, onAssignFolders })
  const { folderIds, showFolderFab, setShowFolderFab, folderAssigning, handleToggleFolder, folderFabRef } = folderState

  const autosave = useJournalAutosave({
    journal, title, content, emojis,
    folderIds,
    updateJournal, journals, journalId,
    onTitleChange: setTitle,
  })

  const ai = useJournalAI({ editorRef, saveNow: autosave.saveNow, setContent })

  const isProcessing = voicePhase === "transcribing" || ai.isProcessing
  const buttonsDisabled = isProcessing || !highlights.hasSelection

  const isInvalid = !title.trim() || emojis.filter(Boolean).length === 0
  const error = voiceError || ai.aiError

  const guard = useJournalNavigationGuard({ dirtyRef: autosave.dirtyRef, isInvalid })

  const [showActions, setShowActions] = useState(false)

  useEffect(() => {
    if (prevJournalIdRef.current !== journalId) {
      prevJournalIdRef.current = journalId
      setLoading(true)
      setJournal(null)
      setTitle("")
      setContent("")
      setEmojis(["📝", "", ""])
      highlights.setHighlights([])
      highlights.setSelectedText("")
    }
  }, [journalId, highlights])

  useEffect(() => {
    if (journalId && !journal) {
      ;(async () => {
        try {
          const data = await journalService.getAll({ per_page: 1000 })
          const j = data.journals.find((x) => x.id === journalId)
          if (j) {
            setJournal(j)
            setTitle(j.title)
            setContent(j.content)
            const emo = j.emojis.length >= 3 ? [...j.emojis] : [...j.emojis, ...Array(3 - j.emojis.length).fill("")]
            setEmojis(emo)
            autosave.setOriginal({ title: j.title, content: j.content, emojis: j.emojis, folderIds: j.folderIds || [] })
            journalService.recordOpen(journalId).catch(() => {})
          }
        } catch {
          /* ignore */
        } finally {
          setLoading(false)
        }
      })()
    }
  }, [journalId, journal, autosave])

  useEffect(() => {
    return () => {
      if (dateDisabledTimerRef.current) clearTimeout(dateDisabledTimerRef.current)
    }
  }, [])

  const saveEmojisNow = useCallback(async () => {
    if (!journal) return
    const trimmed = emojis.filter(Boolean).length > 0 ? emojis : ["📝", "", ""]
    if (!autosave.originalRef.current ||
        JSON.stringify(trimmed) === JSON.stringify(autosave.originalRef.current.emojis)) return
    autosave.saveNow()
  }, [journal, emojis, autosave])

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

  const handleContentChange = useCallback((html) => {
    setContent(html)
    autosave.scheduleAutosave()
  }, [autosave])

  const handleTitleChange = useCallback((e) => {
    setTitle(e.target.value)
    autosave.scheduleAutosave()
  }, [autosave])

  const handleDelete = useCallback(() => guard.setConfirmDelete(true), [guard])
  const handleConfirmDelete = useCallback(async () => {
    guard.setConfirmDelete(false)
    guard.setShowInvalidWarning(false)
    guard.restoreHistory()
    await onDelete(journal.id)
  }, [guard, journal, onDelete])

  const handleDateDoubleClick = useCallback(() => {
    if (showDateDisabled) return
    setShowDateDisabled(true)
    if (dateDisabledTimerRef.current) clearTimeout(dateDisabledTimerRef.current)
    dateDisabledTimerRef.current = setTimeout(() => setShowDateDisabled(false), 2500)
  }, [showDateDisabled])

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
      autosave.scheduleAutosave()
      setTimeout(() => setEmojiAnimating(false), 500)
    } catch (err) {
      setVoiceError(err.message)
    } finally {
      setEmojiLoading(false)
    }
  }, [content, autosave, setVoiceError])

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

  const handleTranscribe = useCallback(async () => {
    const text = await transcribe()
    if (!text) return
    const html = textToHtml(text)
    editorRef.current?.insertAtCursor(html)
    setContent(editorRef.current?.getEditor()?.getHTML() || "")
    autosave.scheduleAutosave()
  }, [transcribe, autosave])

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

  return (
    <div className="je-container">
      <div className="je-top-bar">
        <button
          onClick={() => {
            if (isInvalid) {
              guard.setShowInvalidWarning(true)
              return
            }
            if (autosave.dirtyRef.current) autosave.saveNow()
            onBack()
            highlights.setHighlights([])
            highlights.setSelectedText("")
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
            {autosave.saveState === "editing" && (
              <span className="je-save-editing">Editing</span>
            )}
            {autosave.saveState === "saving" && (
              <>
                <RefreshCw size={12} className="je-save-spin" />
                <span>Saving...</span>
              </>
            )}
            {autosave.saveState === "saved" && (
              <>
                <Check size={12} color="#10B981" />
                <span className="je-save-saved">Saved</span>
              </>
            )}
            {autosave.saveState === "failed" && (
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
          onSelectionChange={highlights.setHasSelection}
          showToolbar={false}
          bare
        />

        {highlights.selectedText && (
          <div className="je-selected-bar" style={{ background: theme.dark, color: "white" }}>
            <span className="je-selected-text">&ldquo;{highlights.selectedText.slice(0, 40)}{highlights.selectedText.length > 40 ? "..." : ""}&rdquo;</span>
            <button
              onClick={highlights.saveHighlight}
              className="je-selected-save-btn"
              style={{ background: theme.primary }}
            >
              {t("journal.detail.saveHighlight")}
            </button>
          </div>
        )}

        {highlights.highlights.length > 0 && (
          <div className="je-highlights-section">
            <p className="je-highlights-title">
              <Star size={13} fill="#F59E0B" color="#F59E0B" /> {t("journal.detail.savedHighlights", { count: highlights.highlights.length })}
            </p>
            {highlights.highlights.map((h, i) => (
              <div key={i} className="je-highlight-item">
                <span className="je-highlight-text">&ldquo;{h}&rdquo;</span>
                <button
                  onClick={() => highlights.setHighlights((hh) => hh.filter((_, idx) => idx !== i))}
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
            {error && (
              <div className="je-voice-error">
                <span>{error}</span>
                <button onClick={() => { setVoiceError(null); ai.setAiError(null) }} className="je-voice-error-btn"><X size={12} /></button>
              </div>
            )}

            <div className="je-ai-tools">
              <AiToolButton icon={Wand2} label="Smoothen" onClick={() => ai.callTransform("smoothen", "Smoothen")} disabled={buttonsDisabled} isProcessing={ai.isProcessing} />
              <AiToolButton icon={Type} label="Auto Format" onClick={() => ai.callTransform("autoformat", "Auto Format")} disabled={buttonsDisabled} isProcessing={ai.isProcessing} accent />
              <AiToolButton icon={Sparkles} label="Restructure" onClick={() => ai.callTransform("restructure", "Restructure")} disabled={buttonsDisabled} isProcessing={ai.isProcessing} />
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
                  onClick={() => startRecording}
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
                  onClick={() => stopRecording}
                  className="je-stop-btn"
                >
                  <Square size={12} /> Stop
                </button>
              )}
              {voicePhase === "recorded" && (
                <button
                  type="button"
                  onClick={handleTranscribe}
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

      {guard.showInvalidWarning && (
        <div className="je-invalid-snackbar">
          <span>Please input a title and at least 1 emoji.</span>
          <button
            onClick={() => guard.setConfirmDelete(true)}
            className="je-invalid-delete-btn"
          >
            Delete Journal
          </button>
        </div>
      )}

      <ConfirmDialog
        open={guard.confirmDelete}
        title={t("journal.detail.deleteDialog")}
        message={t("journal.detail.deleteConfirm", { title: journal.title })}
        confirmLabel={t("journal.detail.confirm")}
        cancelLabel={t("common.cancel")}
        variant="danger"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => guard.setConfirmDelete(false)}
      />
    </div>
  )
}

function ActionRow({ icon, label, onClick, color = "var(--color-dark)" }) {
  return (
    <button onClick={onClick} className="je-action-row" style={{ color }}>
      {icon} <span>{label}</span>
    </button>
  )
}

function AiToolButton({ icon: Icon, label, onClick, disabled, isProcessing, accent }) {
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
