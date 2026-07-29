import { useMemo, useState, useRef, useEffect, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { motion, AnimatePresence } from "framer-motion"
import { Search, X, Plus, Star, Pin, CalendarDays, List, FolderOpen } from "lucide-react"
import "../../../styles/journals/index.css"
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
  const [hoveredId, setHoveredId] = useState(null)
  const [pressedId, setPressedId] = useState(null)
  const [displayCount, setDisplayCount] = useState(8)
  const [pageLoaded, setPageLoaded] = useState(false)
  const initialLoadStarted = useRef(false)
  const sentinelRef = useRef(null)
  const contextAutoOpened = useRef(false)

  const tutorialJournalData = useMemo(() => {
    if (tutorialId === "journal-page") {
      return {
        id: "tutorial-journal",
        title: "Sample Journal Entry",
        preview: "This is a demonstration journal entry. Click to see how journals open for reading and editing. This card is here to help you explore the journal interface.",
        date: new Date().toISOString().slice(0, 10),
        emojis: ["📝"],
        isPinned: false,
        isFavorite: false,
        folderIds: [],
      }
    }
    return null
  }, [tutorialId])

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, open: false }))
  }, [])

  useEffect(() => {
    if (tutorialId === "journal-page" && tutorialStep === 7 && tutorialJournalData && !contextAutoOpened.current) {
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
            journal: tutorialJournalData,
          })
        }
      })
    } else if (tutorialId !== "journal-page" || tutorialStep !== 7) {
      contextAutoOpened.current = false
    }
  }, [tutorialId, tutorialStep, tutorialJournalData, handleCloseContextMenu])

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
    if (tutorialJournalData) {
      return [tutorialJournalData, ...filtered]
    }
    return filtered
  }, [filtered, tutorialJournalData])

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

  useEffect(() => {
    if (!initialLoadStarted.current && !pageLoaded && displayJournals.length > 0) {
      initialLoadStarted.current = true
      const timer = setTimeout(() => setPageLoaded(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [pageLoaded, displayJournals.length])

  function getEntranceRotation(id) {
    const seed = (id.charCodeAt(0) || 0) * 17 + (id.charCodeAt(1) || 0) * 31 + (id.charCodeAt(2) || 0) * 7 + id.length * 5
    return ((seed % 41) - 20) * 0.17
  }

  const handleDragStart = useCallback((e, journalId) => {
    e.dataTransfer.setData("text/journal-id", journalId)
    e.dataTransfer.effectAllowed = "move"
    e.currentTarget.classList.add("jl-dragging")
  }, [])

  const handleDragEnd = useCallback((e) => {
    e.currentTarget.classList.remove("jl-dragging")
  }, [])

  const handleContextMenu = useCallback((e, journal) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ open: true, x: e.clientX, y: e.clientY, journal })
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

  const pageItem = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <motion.div
      data-tutorial-target="journal-page"
      className="jl-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      <motion.div
        className="jl-header"
        variants={pageItem}
        initial="hidden"
        animate="show"
        transition={{ duration: 0.25, delay: 0.03, ease: "easeOut" }}
      >
        <h1 className="jl-title">
          {t("journal.list.title")}
          <InfoButton tutorialId="journal-page" />
        </h1>
        <button
          data-tutorial-target="journal-add-button"
          onClick={onStartCreate}
          className="jl-add-btn"
        >
          <Plus size={16} strokeWidth={2.5} /> {t("journal.list.addJournal")}
        </button>
      </motion.div>

      <motion.div
        data-tutorial-target="journal-search-input"
        className="jl-search"
        variants={pageItem}
        initial="hidden"
        animate="show"
        transition={{ duration: 0.25, delay: 0.06, ease: "easeOut" }}
      >
        <Search size={16} color="var(--color-muted)" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("journal.list.search")}
          className="jl-search-input"
        />
        {search && (
          <button onClick={() => setSearch("")} className="jl-search-clear">
            <X size={14} color="var(--color-muted)" />
          </button>
        )}
      </motion.div>

      <motion.div
        className="jl-filter-bar"
        variants={pageItem}
        initial="hidden"
        animate="show"
        transition={{ duration: 0.25, delay: 0.09, ease: "easeOut" }}
      >
        <div data-tutorial-target="journal-pin-fav-filter" className="jl-filter-group">
          {FILTERS.map(({ key, icon: Icon }) => {
            const isActive = filter === key
            const count = counts?.[key] ?? 0
            return (
              <motion.button
                key={key}
                onClick={() => onFilterChange(key)}
                className={`jl-filter-btn ${isActive ? "jl-filter-btn--active" : ""}`}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.12 }}
              >
                <Icon size={13} />
                {t(`journal.filter.${key}`)}
                {count > 0 && (
                  <span className={`jl-filter-badge ${isActive ? "jl-filter-badge--active" : ""}`}>
                    {count}
                  </span>
                )}
              </motion.button>
            )
          })}
        </div>

        <div className="jl-actions">
          <span className={`jl-date-status ${dateFrom || dateTo ? "jl-date-status--active" : ""}`}>
            {dateStatus}
          </span>
          <button
            data-tutorial-target="journal-date-filter"
            ref={dateBtnRef}
            type="button"
            onClick={handleOpenDatePopover}
            className={`jl-action-btn ${showDatePopover ? "jl-action-btn--active" : ""}`}
          >
            <CalendarDays size={13} />
            Date Filter
          </button>
          <button
            data-tutorial-target="journal-folder-filter"
            type="button"
            onClick={onOpenFolderExplorer}
            className={`jl-action-btn ${activeFolderId ? "jl-action-btn--active" : ""}`}
          >
            <FolderOpen size={13} />
            Folders
          </button>

          {showDatePopover && (
            <div ref={popoverRef} className="jl-date-popover">
              <div className="jl-popover-field">
                <label className="jl-popover-label">
                  From Date
                </label>
                <input
                  type="date"
                  value={draftFrom}
                  onChange={(e) => setDraftFrom(e.target.value)}
                  className="jl-popover-input"
                />
              </div>
              <div className="jl-popover-field">
                <label className="jl-popover-label">
                  To Date
                </label>
                <input
                  type="date"
                  value={draftTo}
                  onChange={(e) => setDraftTo(e.target.value)}
                  className="jl-popover-input"
                />
              </div>
              <div className="jl-popover-footer">
                <button type="button" onClick={handleDefault} className="jl-popover-btn">
                  Default
                </button>
                <div className="jl-popover-btn-row">
                  <button type="button" onClick={handleCancel} className="jl-popover-btn jl-popover-btn--cancel">
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleProcessFilter}
                    className="jl-popover-btn--confirm"
                  >
                    Process Filter
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {!loading && displayJournals.length === 0 ? (
        <motion.div
          key="empty"
          className="jl-empty"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
            <p className="jl-empty-emoji">
              {search ? "🔍" : "📝"}
            </p>
            <p className="jl-empty-title">
              {search
                ? t("journal.list.noMatch")
                : filter !== "all"
                  ? t("journal.list.noFilter", { filter })
                  : t("journal.list.noJournals")}
            </p>
            <p className="jl-empty-subtitle">
              {search
                ? t("journal.list.emptySearch")
                : filter !== "all"
                  ? t("journal.list.emptyPinned")
                  : t("journal.list.emptyCTA")}
            </p>
            {!search && filter === "all" && (
              <button onClick={onStartCreate} className="jl-empty-btn">
                {t("journal.list.createFirst")}
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            data-tutorial-target="journal-list-container"
            className="jl-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <AnimatePresence mode="popLayout">
          {displayJournals.slice(0, displayCount).map((j, i) => {
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

            const entranceRot = getEntranceRotation(j.id)

            return (
              <motion.div
                key={j.id}
                layout
                initial={!pageLoaded ? { opacity: 0, y: 35, scale: 0.92, rotate: entranceRot } : { opacity: 0 }}
                animate={!pageLoaded ? {
                  opacity: 1,
                  y: [35, 0, -2.5, 0],
                  scale: [0.92, 1, 1, 1],
                  rotate: [entranceRot, 0, 0, 0],
                } : { opacity: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={!pageLoaded ? {
                  y: { duration: 0.55, times: [0, 0.6, 0.82, 1], ease: "easeOut", delay: i * 0.07 },
                  default: { duration: 0.4, ease: "easeOut", delay: i * 0.07 },
                } : { duration: 0.15, ease: "easeOut" }}
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
                className={`jl-card ${isTutorial ? "jl-card--tutorial" : ""}`}
              >
                {/* Back layer — second page underneath, always partially visible */}
                <div className="jl-card-back" style={{
                  transform: `rotate(${rot.back}deg) ${isHovered ? "translateY(14px)" : "translateY(4px)"}`,
                }} />

                {/* Front layer — visible journal page */}
                <div className="jl-card-front" style={{
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
                }}>
                  {/* Pin / Favorite indicators — upper right */}
                  <div className="jl-card-badges">
                    {(isPinned || isFav) && !showActions && (
                      <div className="jl-card-badge-row">
                        {isPinned && <Pin size={13} color="var(--color-primary)" fill="var(--color-primary)" />}
                        {isFav && <Star size={13} color="#F59E0B" fill="#F59E0B" />}
                      </div>
                    )}
                    <div className="jl-card-actions" style={{
                      opacity: showActions ? 1 : 0,
                      transform: showActions ? "translateY(0)" : "translateY(3px)",
                    }}>
                      <button
                        onClick={(ev) => { ev.stopPropagation(); togglePinned?.(j.id) }}
                        className={`jl-card-action-btn ${isPinned ? "jl-card-action-btn--pinned" : ""}`}
                      >
                        <Pin size={14} color="currentColor" fill={isPinned ? "currentColor" : "none"} />
                      </button>
                      <button
                        onClick={(ev) => { ev.stopPropagation(); toggleFavorite(j.id) }}
                        className={`jl-card-action-btn ${isFav ? "jl-card-action-btn--fav" : ""}`}
                      >
                        <Star size={14} color="currentColor" fill={isFav ? "currentColor" : "none"} />
                      </button>
                    </div>
                  </div>

                  {/* Main content — centered */}
                  <div className="jl-card-body">
                    {emojis && emojis.some(Boolean) && (
                      <div className="jl-card-emoji">
                        {emojis.find(Boolean)}
                      </div>
                    )}

                    <h3 className="jl-card-title">
                      {j.title}
                    </h3>

                    <p className="jl-card-date" data-hovered={isHovered ? "" : undefined}>
                      {formatDate(j.date)}
                    </p>

                    {j.folderIds && j.folderIds.length > 0 && (
                      <div className="jl-card-folders">
                        {j.folderIds.slice(0, 2).map((fid) => {
                          const folder = folderMap[fid]
                          if (!folder) return null
                          return (
                            <span key={fid} className="jl-card-folder-tag">
                              {folder.emoji} {folder.name}
                            </span>
                          )
                        })}
                        {j.folderIds.length > 2 && (
                          <span className="jl-card-folder-more">
                            +{j.folderIds.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
          </AnimatePresence>
          {displayCount < filtered.length && (
            <div ref={sentinelRef} className="jl-sentinel" />
          )}
        </motion.div>
      )}
      </AnimatePresence>

      <FolderAssignMenu
        open={contextMenu.open}
        x={contextMenu.x}
        y={contextMenu.y}
        folders={folders || []}
        journalFolderIds={contextMenu.journal?.folderIds || []}
        onSave={handleContextSave}
        onClose={handleCloseContextMenu}
      />
    </motion.div>
  )
}
