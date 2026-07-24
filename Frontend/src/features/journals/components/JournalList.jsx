import { useMemo, useState, useRef, useEffect, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Search, X, Plus, Star, Pin, CalendarDays, List, FolderOpen } from "lucide-react"
import { theme } from "../../../theme"
import { formatDate } from "../../../utils/formatters"
import FolderAssignMenu from "../folders/FolderAssignMenu"
import { useToast } from "../../../components/ui/Toast"
import { useTutorial } from "../../../components/tutorial/TutorialContext"
import InfoButton from "../../../components/tutorial/InfoButton"

const FILTERS = [
  { key: "all", icon: List },
  { key: "pinned", icon: Pin },
  { key: "favorites", icon: Star },
]

function formatSingleDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00")
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
}

function cleanPreview(text) {
  if (!text) return text
  return text.replace(/\n+/g, " ").replace(/\s+/g, " ").trim()
}

function formatDateRange(from, to) {
  if (!from && !to) return null

  if (from && to) {
    const fromDate = new Date(from + "T00:00:00")
    const toDate = new Date(to + "T00:00:00")
    const sameYear = fromDate.getFullYear() === toDate.getFullYear()
    const fromStr = fromDate.toLocaleDateString("en-US", {
      day: "numeric", month: "short", ...(sameYear ? {} : { year: "numeric" }),
    })
    const toStr = toDate.toLocaleDateString("en-US", {
      day: "numeric", month: "short", year: "numeric",
    })
    return `${fromStr} - ${toStr}`
  }

  return formatSingleDate(from || to)
}

export default function JournalList({
  journals,
  search,
  setSearch,
  loading,
  filter,
  onFilterChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onViewDetail,
  onStartCreate,
  toggleFavorite,
  togglePinned,
  folders,
  activeFolderId,
  onOpenFolderExplorer,
  onAssignFolders,
}) {
  const { t } = useTranslation()
  const [showDatePopover, setShowDatePopover] = useState(false)
  const [draftFrom, setDraftFrom] = useState("")
  const [draftTo, setDraftTo] = useState("")
  const popoverRef = useRef(null)
  const dateBtnRef = useRef(null)
  const [contextMenu, setContextMenu] = useState({ open: false, x: 0, y: 0, journal: null })
  const toast = useToast()
  const { tutorialId, tutorialStep } = useTutorial()
  const [tutorialJournal, setTutorialJournal] = useState(null)
  const [hoveredId, setHoveredId] = useState(null)
  const [pressedId, setPressedId] = useState(null)
  const [displayCount, setDisplayCount] = useState(8)
  const sentinelRef = useRef(null)
  const contextAutoOpened = useRef(false)

  useEffect(() => {
    if (tutorialId === "journal-page") {
      setTutorialJournal({
        id: "tutorial-journal",
        title: "Sample Journal Entry",
        preview: "This is a demonstration journal entry. Click to see how journals open for reading and editing. This card is here to help you explore the journal interface.",
        date: new Date().toISOString().slice(0, 10),
        emojis: ["📝"],
        isPinned: false,
        isFavorite: false,
        folderIds: [],
      })
    } else {
      setTutorialJournal(null)
    }
  }, [tutorialId])

  useEffect(() => {
    if (tutorialId === "journal-page" && tutorialStep === 7 && tutorialJournal && !contextAutoOpened.current) {
      contextAutoOpened.current = true
      requestAnimationFrame(() => {
        const cardEl = document.querySelector('[data-tutorial-journal="true"]')
        if (cardEl) {
          const rect = cardEl.getBoundingClientRect()
          handleCloseContextMenu()
          setContextMenu({
            open: true,
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            journal: tutorialJournal,
          })
        }
      })
    } else if (tutorialId !== "journal-page" || tutorialStep !== 7) {
      contextAutoOpened.current = false
    }
  }, [tutorialId, tutorialStep, tutorialJournal])

  useEffect(() => {
    if (!showDatePopover) return
    const handleClick = (e) => {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target) &&
        dateBtnRef.current && !dateBtnRef.current.contains(e.target)
      ) {
        setShowDatePopover(false)
      }
    }
    const handleKey = (e) => {
      if (e.key === "Escape") setShowDatePopover(false)
    }
    document.addEventListener("mousedown", handleClick)
    document.addEventListener("keydown", handleKey)
    return () => {
      document.removeEventListener("mousedown", handleClick)
      document.removeEventListener("keydown", handleKey)
    }
  }, [showDatePopover])

  const counts = useMemo(() => {
    const all = journals.length
    const pinned = journals.filter((j) => j.isPinned).length
    const favorites = journals.filter((j) => j.isFavorite).length
    return { all, pinned, favorites }
  }, [journals])

  const dateStatus = useMemo(() => {
    return formatDateRange(dateFrom, dateTo) || "Without Filter"
  }, [dateFrom, dateTo])

  const folderMap = useMemo(() => {
    const map = {}
    if (folders) {
      folders.forEach((f) => { map[f.id] = f })
    }
    return map
  }, [folders])

  const filtered = useMemo(() => {
    let result = [...journals]

    if (filter === "pinned") {
      result = result.filter((j) => j.isPinned)
    } else if (filter === "favorites") {
      result = result.filter((j) => j.isFavorite)
    }

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.content.toLowerCase().includes(q)
      )
    }

    if (dateFrom) {
      result = result.filter((j) => j.date >= dateFrom)
    }

    if (dateTo) {
      result = result.filter((j) => j.date <= dateTo)
    }

    result.sort((a, b) => new Date(b.date) - new Date(a.date))

    return result
  }, [journals, filter, search, dateFrom, dateTo])

  const displayJournals = useMemo(() => {
    if (tutorialJournal) {
      return [tutorialJournal, ...filtered]
    }
    return filtered
  }, [filtered, tutorialJournal])

  useEffect(() => {
    setDisplayCount(8)
  }, [displayJournals])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setDisplayCount((prev) => Math.min(prev + 8, displayJournals.length))
        }
      },
      { rootMargin: "200px" }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [displayJournals.length])

  const handleDragStart = useCallback((e, journalId) => {
    e.dataTransfer.setData("text/journal-id", journalId)
    e.dataTransfer.effectAllowed = "move"
    e.currentTarget.style.opacity = "0.6"
  }, [])

  const handleDragEnd = useCallback((e) => {
    e.currentTarget.style.opacity = "1"
  }, [])

  const handleContextMenu = useCallback((e, journal) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ open: true, x: e.clientX, y: e.clientY, journal })
  }, [])

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, open: false }))
  }, [])

  const handleContextSave = useCallback(
    async (selectedFolderIds) => {
      if (!contextMenu.journal) return
      if (contextMenu.journal.id === "tutorial-journal") {
        toast.show("Folders updated (demo)")
        setContextMenu((prev) => ({ ...prev, open: false }))
        return
      }
      await onAssignFolders(contextMenu.journal.id, selectedFolderIds)
      toast.show("Folders updated")
    },
    [contextMenu.journal, onAssignFolders, toast]
  )

  const handleOpenDatePopover = useCallback(() => {
    setDraftFrom(dateFrom || new Date().toISOString().slice(0, 10))
    setDraftTo(dateTo || new Date().toISOString().slice(0, 10))
    setShowDatePopover(true)
  }, [dateFrom, dateTo])

  const handleDefault = useCallback(() => {
    onDateFromChange("")
    onDateToChange("")
    setShowDatePopover(false)
  }, [onDateFromChange, onDateToChange])

  const handleCancel = useCallback(() => {
    setShowDatePopover(false)
  }, [])

  const handleProcessFilter = useCallback(() => {
    onDateFromChange(draftFrom)
    onDateToChange(draftTo)
    setShowDatePopover(false)
  }, [draftFrom, draftTo, onDateFromChange, onDateToChange])

  return (
    <div data-tutorial-target="journal-page" style={{ padding: "28px 32px", maxWidth: 900, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 600, color: theme.dark, display: "inline-flex", alignItems: "center", gap: 8 }}>
          {t("journal.list.title")}
          <InfoButton tutorialId="journal-page" />
        </h1>
        <button
          data-tutorial-target="journal-add-button"
          onClick={onStartCreate}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
            color: "white",
            border: "none",
            borderRadius: 24,
            padding: "9px 18px",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 500,
            boxShadow: `0 4px 12px color-mix(in srgb, ${theme.primary} 44%, transparent)`,
          }}
        >
          <Plus size={16} strokeWidth={2.5} /> {t("journal.list.addJournal")}
        </button>
      </div>

      <div
        data-tutorial-target="journal-search-input"
        style={{
          background: "var(--color-card, white)",
          borderRadius: 14,
          border: `1px solid ${theme.border}`,
          padding: "12px 16px",
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <Search size={16} color={theme.muted} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("journal.list.search")}
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            fontSize: 14,
            color: theme.dark,
            background: "transparent",
          }}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}
          >
            <X size={14} color={theme.muted} />
          </button>
        )}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div data-tutorial-target="journal-pin-fav-filter" style={{ display: "flex", gap: 4, background: "var(--color-card, white)", borderRadius: 12, padding: 3, border: `1px solid ${theme.border}` }}>
          {FILTERS.map(({ key, icon: Icon }) => {
            const isActive = filter === key
            const count = counts?.[key] ?? 0
            return (
              <button
                key={key}
                onClick={() => onFilterChange(key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "6px 13px",
                  borderRadius: 9,
                  border: "none",
                  background: isActive ? theme.primary : "transparent",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? "white" : theme.muted,
                  transition: "all 0.2s",
                  outline: "none",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = `color-mix(in srgb, ${theme.primary} 8%, transparent)`
                    e.currentTarget.style.color = theme.dark
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent"
                    e.currentTarget.style.color = theme.muted
                  }
                }}
              >
                <Icon size={13} />
                {t(`journal.filter.${key}`)}
                {count > 0 && (
                  <span style={{
                    fontSize: 10,
                    fontWeight: 600,
                    background: isActive ? "rgba(255,255,255,0.25)" : theme.bg,
                    color: isActive ? "white" : theme.muted,
                    borderRadius: 8,
                    padding: "1px 5px",
                    minWidth: 16,
                    textAlign: "center",
                    lineHeight: "15px",
                  }}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, position: "relative" }}>
          <span style={{
            fontSize: 12,
            color: dateFrom || dateTo ? theme.primaryText : theme.muted,
            fontWeight: dateFrom || dateTo ? 500 : 400,
          }}>
            {dateStatus}
          </span>
          <button
            data-tutorial-target="journal-date-filter"
            ref={dateBtnRef}
            type="button"
            onClick={handleOpenDatePopover}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "6px 12px",
              borderRadius: 8,
              border: `1px solid ${showDatePopover ? theme.primary : theme.border}`,
              background: showDatePopover ? `color-mix(in srgb, ${theme.primary} 8%, transparent)` : "var(--color-card, white)",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 500,
              color: showDatePopover ? theme.primary : theme.muted,
              transition: "all 0.2s",
              outline: "none",
            }}
            onMouseEnter={(e) => {
              if (!showDatePopover) {
                e.currentTarget.style.borderColor = theme.primary
                e.currentTarget.style.color = theme.primary
              }
            }}
            onMouseLeave={(e) => {
              if (!showDatePopover) {
                e.currentTarget.style.borderColor = theme.border
                e.currentTarget.style.color = theme.muted
              }
            }}
          >
            <CalendarDays size={13} />
            Date Filter
          </button>
          <button
            data-tutorial-target="journal-folder-filter"
            type="button"
            onClick={onOpenFolderExplorer}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "6px 12px",
              borderRadius: 8,
              border: `1px solid ${activeFolderId ? theme.primary : theme.border}`,
              background: activeFolderId ? `color-mix(in srgb, ${theme.primary} 8%, transparent)` : "var(--color-card, white)",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 500,
              color: activeFolderId ? theme.primary : theme.muted,
              transition: "all 0.2s",
              outline: "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = theme.primary
              e.currentTarget.style.color = theme.primary
            }}
            onMouseLeave={(e) => {
              if (!activeFolderId) {
                e.currentTarget.style.borderColor = theme.border
                e.currentTarget.style.color = theme.muted
              }
            }}
          >
            <FolderOpen size={13} />
            Folders
          </button>

          {showDatePopover && (
            <div
              ref={popoverRef}
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                zIndex: 50,
                background: "var(--color-card, white)",
                borderRadius: 16,
                border: `1px solid ${theme.border}`,
                boxShadow: "0 12px 40px rgba(0,0,0,0.12)",
                padding: "20px 20px 16px",
                minWidth: 280,
                opacity: 0,
                transform: "translateY(-4px) scale(0.97)",
                animation: "popoverIn 0.2s ease forwards",
              }}
            >
              <style>{`
                @keyframes popoverIn {
                  to { opacity: 1; transform: translateY(0) scale(1); }
                }
              `}</style>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: theme.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6, display: "block" }}>
                  From Date
                </label>
                <input
                  type="date"
                  value={draftFrom}
                  onChange={(e) => setDraftFrom(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: `1px solid ${theme.border}`,
                    background: "var(--color-input)",
                    color: theme.dark,
                    fontSize: 13,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: theme.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6, display: "block" }}>
                  To Date
                </label>
                <input
                  type="date"
                  value={draftTo}
                  onChange={(e) => setDraftTo(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: `1px solid ${theme.border}`,
                    background: "var(--color-input)",
                    color: theme.dark,
                    fontSize: 13,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <button
                  type="button"
                  onClick={handleDefault}
                  style={{
                    padding: "7px 14px",
                    borderRadius: 8,
                    border: `1px solid ${theme.border}`,
                    background: "transparent",
                    color: theme.muted,
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = theme.primary
                    e.currentTarget.style.color = theme.primary
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = theme.border
                    e.currentTarget.style.color = theme.muted
                  }}
                >
                  Default
                </button>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    type="button"
                    onClick={handleCancel}
                    style={{
                      padding: "7px 14px",
                      borderRadius: 8,
                      border: `1px solid ${theme.border}`,
                      background: "transparent",
                      color: theme.dark,
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = theme.bg
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent"
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleProcessFilter}
                    style={{
                      padding: "7px 16px",
                      borderRadius: 8,
                      border: "none",
                      background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                      color: "white",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "opacity 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = "0.9"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = "1"
                    }}
                  >
                    Process Filter
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {!loading && displayJournals.length === 0 ? (
      <div
        style={{
            textAlign: "center",
            padding: "48px 24px",
            background: "var(--color-card, white)",
            borderRadius: 16,
            border: `1px solid ${theme.border}`,
          }}
        >
          <p style={{ fontSize: 40, marginBottom: 12, opacity: 0.4 }}>
            {search ? "🔍" : "📝"}
          </p>
          <p style={{ fontSize: 14, fontWeight: 600, color: theme.dark, marginBottom: 4 }}>
            {search
              ? t("journal.list.noMatch")
              : filter !== "all"
                ? t("journal.list.noFilter", { filter })
                : t("journal.list.noJournals")}
          </p>
          <p style={{ fontSize: 12, color: theme.muted, marginBottom: 16 }}>
            {search
              ? t("journal.list.emptySearch")
              : filter !== "all"
                ? t("journal.list.emptyPinned")
                : t("journal.list.emptyCTA")}
          </p>
          {!search && filter === "all" && (
            <button
              onClick={onStartCreate}
              style={{
                padding: "9px 20px",
                borderRadius: 24,
                border: "none",
                background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                color: "white",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {t("journal.list.createFirst")}
            </button>
          )}
        </div>
      ) : (
        <>
        <style>{`
          .journal-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 48px 36px; }
          @media (max-width: 700px) { .journal-grid { grid-template-columns: 1fr; } }
        `}</style>
        <div data-tutorial-target="journal-list-container" className="journal-grid">
          {displayJournals.slice(0, displayCount).map((j) => {
            const isTutorial = j.id === "tutorial-journal"
            const isHovered = hoveredId === j.id
            const isPinned = j.isPinned
            const isFav = j.isFavorite
            const showActions = isHovered || isPinned || isFav
            const emojis = j.emojis

            const isPressed = pressedId === j.id

            const rotationPairs = [
              { front: -1.8, back: 2.2 },
              { front: 1.5, back: -2.0 },
              { front: -1.3, back: 2.1 },
              { front: 1.9, back: -1.7 },
              { front: -1.5, back: 1.8 },
            ]
            const rot = rotationPairs[j.id.charCodeAt(0) % rotationPairs.length]

            return (
              <div
                key={j.id}
                {...(isTutorial ? { "data-tutorial-target": "journal-tutorial-card", "data-tutorial-journal": "true" } : {})}
                draggable={!isTutorial}
                onDragStart={(e) => !isTutorial && handleDragStart(e, j.id)}
                onDragEnd={!isTutorial ? handleDragEnd : undefined}
                onContextMenu={(e) => handleContextMenu(e, j)}
                onClick={() => isTutorial ? null : onViewDetail(j.id)}
                onMouseDown={() => !isTutorial && setPressedId(j.id)}
                onMouseUp={() => setPressedId(null)}
                onMouseLeave={() => { setHoveredId(null); setPressedId(null) }}
                onMouseEnter={() => setHoveredId(j.id)}
                style={{
                  position: "relative",
                  cursor: isTutorial ? "default" : "grab",
                }}
              >
                {/* Back layer — second page underneath, always partially visible */}
                <div style={{
                  position: "absolute",
                  top: 7,
                  left: 14,
                  right: 2,
                  bottom: 0,
                  borderRadius: "3px 12px 12px 3px",
                  background: "color-mix(in srgb, var(--color-card, #fff) 88%, #d4cfc9)",
                  border: "1px solid rgba(0,0,0,0.06)",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                  transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                  transform: `rotate(${rot.back}deg) ${isHovered ? "translateY(14px)" : "translateY(4px)"}`,
                  transformOrigin: "center center",
                  zIndex: 0,
                }} />

                {/* Front layer — visible journal page */}
                <div style={{
                  position: "relative",
                  background: "var(--color-card, #fff)",
                  border: "1px solid rgba(0,0,0,0.04)",
                  borderRadius: "3px 12px 12px 3px",
                  padding: "44px 36px 40px",
                  boxShadow: isHovered
                    ? "0 6px 20px rgba(0,0,0,0.07), 0 2px 6px rgba(0,0,0,0.03)"
                    : "0 1px 4px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)",
                  transition: isPressed
                    ? "transform 0.1s ease, box-shadow 0.1s ease"
                    : "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                  transform: isPressed
                    ? "rotate(0deg) scale(0.98) translateY(-1px)"
                    : isHovered
                      ? "rotate(0deg) translateY(-4px) scale(1.015)"
                      : `rotate(${rot.front}deg) translateY(0) scale(1)`,
                  transformOrigin: "center center",
                  zIndex: 1,
                }}>
                  {/* Pin / Favorite indicators — upper right */}
                  <div style={{
                    position: "absolute",
                    top: 20,
                    right: 24,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}>
                    {(isPinned || isFav) && !showActions && (
                      <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                        {isPinned && <Pin size={13} color={theme.primary} fill={theme.primary} />}
                        {isFav && <Star size={13} color="#F59E0B" fill="#F59E0B" />}
                      </div>
                    )}
                    <div style={{
                      display: "flex",
                      gap: 2,
                      opacity: showActions ? 1 : 0,
                      transform: showActions ? "translateY(0)" : "translateY(3px)",
                      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}>
                      <button
                        onClick={(ev) => { ev.stopPropagation(); togglePinned?.(j.id) }}
                        style={{
                          background: "none",
                          border: "none",
                          borderRadius: 6,
                          padding: 4,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: isPinned ? theme.primary : "#9CA3AF",
                          transition: "color 0.15s",
                        }}
                        onMouseEnter={(e) => { if (!isPinned) e.currentTarget.style.color = theme.dark }}
                        onMouseLeave={(e) => { if (!isPinned) e.currentTarget.style.color = "#9CA3AF" }}
                      >
                        <Pin size={14} color="currentColor" fill={isPinned ? "currentColor" : "none"} />
                      </button>
                      <button
                        onClick={(ev) => { ev.stopPropagation(); toggleFavorite(j.id) }}
                        style={{
                          background: "none",
                          border: "none",
                          borderRadius: 6,
                          padding: 4,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: isFav ? "#F59E0B" : "#9CA3AF",
                          transition: "color 0.15s",
                        }}
                        onMouseEnter={(e) => { if (!isFav) e.currentTarget.style.color = theme.dark }}
                        onMouseLeave={(e) => { if (!isFav) e.currentTarget.style.color = "#9CA3AF" }}
                      >
                        <Star size={14} color="currentColor" fill={isFav ? "currentColor" : "none"} />
                      </button>
                    </div>
                  </div>

                  {/* Main content — centered */}
                  <div style={{ textAlign: "center", paddingTop: 4 }}>
                    {emojis && emojis.some(Boolean) && (
                      <div style={{ fontSize: 36, lineHeight: 1, marginBottom: 14 }}>
                        {emojis.find(Boolean)}
                      </div>
                    )}

                    <h3 style={{
                      fontSize: 21,
                      fontWeight: 700,
                      color: theme.dark,
                      margin: "0 0 8px 0",
                      lineHeight: 1.35,
                    }}>
                      {j.title}
                    </h3>

                    <p style={{
                      fontSize: 13,
                      color: isHovered ? "rgba(0,0,0,0.42)" : "rgba(0,0,0,0.25)",
                      margin: 0,
                      letterSpacing: "0.01em",
                      transition: "color 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}>
                      {formatDate(j.date)}
                    </p>

                    {j.folderIds && j.folderIds.length > 0 && (
                      <div style={{
                        display: "flex",
                        justifyContent: "center",
                        gap: 5,
                        marginTop: 16,
                        flexWrap: "wrap",
                      }}>
                        {j.folderIds.slice(0, 2).map((fid) => {
                          const folder = folderMap[fid]
                          if (!folder) return null
                          return (
                            <span key={fid} style={{
                              fontSize: 11,
                              background: `color-mix(in srgb, ${theme.muted} 8%, transparent)`,
                              color: theme.muted,
                              borderRadius: 6,
                              padding: "2px 8px",
                              fontWeight: 450,
                            }}>
                              {folder.emoji} {folder.name}
                            </span>
                          )
                        })}
                        {j.folderIds.length > 2 && (
                          <span style={{ fontSize: 11, color: theme.muted, opacity: 0.6 }}>
                            +{j.folderIds.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
          {displayCount < filtered.length && (
            <div ref={sentinelRef} style={{ height: 1 }} />
          )}
        </div>
        </>
      )}

      <FolderAssignMenu
        open={contextMenu.open}
        x={contextMenu.x}
        y={contextMenu.y}
        folders={folders || []}
        journalFolderIds={contextMenu.journal?.folderIds || []}
        onSave={handleContextSave}
        onClose={handleCloseContextMenu}
      />
    </div>
  )
}
