import { useState, useCallback, useEffect, useRef } from "react"
import { X, GripVertical } from "lucide-react"
import { Portal } from "../../../utils/portal"
import { journalService } from "../../../services/journalService"
import { refreshPinnedJournals } from "../../../hooks/usePinnedJournals"
import { useToast } from "../../../components/ui/Toast"
import "../../../styles/journals/index.css"

const MAX_SIDEBAR = 3
const GAP = 6

export default function ManageNavbarJournals({ open, onClose }) {
  const [orderedList, setOrderedList] = useState([])
  const [dragOverIndex, setDragOverIndex] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [slotHeight, setSlotHeight] = useState(46)
  const [justDropped, setJustDropped] = useState(false)
  const listRef = useRef(null)
  const dragStartRef = useRef(null)
  const hasDraggedRef = useRef(false)

  const toast = useToast()

  const loadData = useCallback(async () => {
    setLoading(true)
    hasDraggedRef.current = false
    try {
      const result = await journalService.getAll({ pinned: true, per_page: 100 })
      const pinned = result.journals || []
      const sorted = pinned
        .filter(j => j.navbarOrder != null)
        .sort((a, b) => a.navbarOrder - b.navbarOrder)
      const withOrder = sorted.map((j, i) => ({ ...j, _order: i }))
      const unpinned = pinned
        .filter(j => j.navbarOrder == null)
        .map((j, i) => ({ ...j, _order: sorted.length + i }))
      setOrderedList([...withOrder, ...unpinned])
    } catch (err) {
      console.error("Failed to load pinned journals:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) loadData()
  }, [open, loadData])

  useEffect(() => {
    if (listRef.current) {
      const first = listRef.current.children[0]
      if (first) {
        setSlotHeight(first.getBoundingClientRect().height + GAP)
      }
    }
  }, [orderedList, open])

  useEffect(() => {
    if (justDropped) {
      const raf = requestAnimationFrame(() => setJustDropped(false))
      return () => cancelAnimationFrame(raf)
    }
  }, [justDropped])

  const persistOrder = useCallback(async (list) => {
    setSaving(true)
    try {
      const orders = list.map((j, i) => ({ id: j.id, order: i + 1 }))
      await journalService.setNavbarOrders(orders)
      await refreshPinnedJournals()
    } catch (err) {
      console.error("Failed to save journal order:", err)
      toast.error("Couldn't save journal order. Please try again.")
      await loadData()
    } finally {
      setSaving(false)
    }
  }, [loadData, toast])

  const getDragTransform = useCallback((itemIndex) => {
    const start = dragStartRef.current
    if (start == null || dragOverIndex == null) return "none"
    if (itemIndex === start) return "none"

    const hover = dragOverIndex

    if (start < hover) {
      if (itemIndex > start && itemIndex <= hover) {
        return `translateY(-${slotHeight}px)`
      }
    } else if (start > hover) {
      if (itemIndex >= hover && itemIndex < start) {
        return `translateY(${slotHeight}px)`
      }
    }
    return "none"
  }, [dragOverIndex, slotHeight])

  const handleDragStart = useCallback((e, index) => {
    dragStartRef.current = index
    hasDraggedRef.current = true
    setDragOverIndex(index)
    setDragging(true)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", "")
  }, [])

  const handleDragEnd = useCallback(() => {
    setDragOverIndex(null)
    setDragging(false)
  }, [])

  const handleDragOver = useCallback((e, index) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverIndex(index)
  }, [])

  const handleDragLeave = useCallback(() => {}, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    const startIndex = dragStartRef.current
    dragStartRef.current = null
    setDragOverIndex(null)
    setDragging(false)
    if (startIndex == null || !listRef.current) return

    const children = Array.from(listRef.current.children)
    const cursorY = e.clientY

    const midpoints = []
    for (let i = 0; i < children.length; i++) {
      if (i === startIndex) continue
      const rect = children[i].getBoundingClientRect()
      midpoints.push({ arrayIndex: i, mid: rect.top + rect.height / 2 })
    }

    let insertAt = midpoints.length
    for (let i = 0; i < midpoints.length; i++) {
      if (cursorY < midpoints[i].mid) {
        insertAt = i
        break
      }
    }

    setOrderedList(prev => {
      const next = [...prev]
      const [moved] = next.splice(startIndex, 1)
      const result = [...next]
      result.splice(insertAt, 0, moved)
      const changed = result.some((item, i) => item.id !== prev[i].id)
      if (!changed) return prev
      setJustDropped(true)
      persistOrder(result)
      return result
    })
  }, [persistOrder])

  if (!open) return null

  return (
    <Portal>
      <div onClick={onClose} className="nbar-overlay">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Manage Pinned Journals"
          onClick={e => e.stopPropagation()}
          className="nbar-dialog"
        >
          <button onClick={onClose} className="nbar-close-btn">
            <X size={18} />
          </button>

          <h2 className="nbar-title">
            Pinned Journals
          </h2>
          <p className="nbar-subtitle">
            The first 3 journals appear in your sidebar. Drag to reorder.
          </p>

          {loading ? (
            <p className="nbar-loading">Loading...</p>
          ) : orderedList.length === 0 ? (
            <p className="nbar-empty">No pinned journals</p>
          ) : (
            <div
              ref={listRef}
              onDrop={handleDrop}
              onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = "move" }}
              className="nbar-list"
              style={{ gap: `${GAP}px` }}
            >
              {orderedList.map((journal, index) => {
                const isTopThree = index < MAX_SIDEBAR
                const isDragging = dragging && dragStartRef.current === index
                const isDragOver = dragOverIndex === index && !(dragging && dragStartRef.current === index)
                const transform = getDragTransform(index)

                let itemClass = "nbar-item"
                if (isDragOver) itemClass += " drag-over"
                else if (isDragging) itemClass += " dragging"
                else if (isTopThree) itemClass += " top-three"
                else itemClass += " default"

                return (
                  <div
                    key={journal.id}
                    draggable
                    onDragStart={e => handleDragStart(e, index)}
                    onDragOver={e => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    onDragLeave={handleDragLeave}
                    className={itemClass}
                    style={{
                      transition: justDropped ? "none" : dragging ? "border 0.15s ease, background 0.15s ease, box-shadow 0.15s ease" : undefined,
                      transform,
                      opacity: isDragging ? 0.05 : 1,
                      animation: !dragging && !hasDraggedRef.current ? `nbar-list-in 0.25s ease ${index * 40}ms both` : "none",
                      zIndex: isDragging ? 10 : 1,
                    }}
                  >
                    <span className={`nbar-rank${isTopThree ? " top-three" : " default"}`}>
                      {index + 1}
                    </span>

                    <div className="nbar-grip">
                      <GripVertical size={14} />
                    </div>

                    <span className="nbar-emoji">
                      {journal.emojis?.find(Boolean) || "\uD83D\uDCD6"}
                    </span>

                    <span className={`nbar-journal-title${isTopThree ? " top-three" : " default"}`}
                      style={{ color: "var(--color-dark)" }}
                    >
                      {journal.title}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          {saving && (
            <p className="nbar-saving">
              Saving...
            </p>
          )}
        </div>
      </div>
    </Portal>
  )
}
