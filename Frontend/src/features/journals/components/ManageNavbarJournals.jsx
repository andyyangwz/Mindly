import { useState, useCallback, useEffect, useRef } from "react"
import { X, GripVertical } from "lucide-react"
import { theme } from "../../../theme"
import { Portal } from "../../../utils/portal"
import { journalService } from "../../../services/journalService"
import { refreshPinnedJournals } from "../../../hooks/usePinnedJournals"
import { useToast } from "../../../components/ui/Toast"

const MAX_SIDEBAR = 3
const GAP = 6

const KEYFRAMES = `
@keyframes nbar-list-in {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes nbar-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
`

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
      <style>{KEYFRAMES}</style>
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: theme.z.modalOverlay,
          background: "rgba(0,0,0,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
          animation: "nbar-fade-in 0.2s ease",
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Manage Pinned Journals"
          onClick={e => e.stopPropagation()}
          style={{
            background: "var(--color-card, white)",
            borderRadius: 20, padding: "32px 36px",
            maxWidth: 440, width: "100%",
            maxHeight: "80vh", overflowY: "auto",
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            position: "relative",
          }}
        >
          <button
            onClick={onClose}
            style={{
              position: "absolute", top: 16, right: 16,
              background: "none", border: "none", cursor: "pointer",
              color: theme.muted, padding: 4, borderRadius: 6,
              transition: "all 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.color = theme.dark }}
            onMouseLeave={e => { e.currentTarget.style.color = theme.muted }}
          >
            <X size={18} />
          </button>

          <h2 style={{ fontSize: 18, fontWeight: 700, color: theme.dark, margin: "0 0 4px" }}>
            Pinned Journals
          </h2>
          <p style={{ fontSize: 12.5, color: theme.muted, margin: "0 0 20px", lineHeight: 1.5 }}>
            The first 3 journals appear in your sidebar. Drag to reorder.
          </p>

          {loading ? (
            <p style={{ fontSize: 13, color: theme.muted, textAlign: "center", padding: "24px 0" }}>
              Loading...
            </p>
          ) : orderedList.length === 0 ? (
            <p style={{ fontSize: 13, color: theme.muted, textAlign: "center", padding: "24px 0", opacity: 0.6 }}>
              No pinned journals
            </p>
          ) : (
            <div
              ref={listRef}
              onDrop={handleDrop}
              onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = "move" }}
              style={{ display: "flex", flexDirection: "column", gap: `${GAP}px` }}
            >
              {orderedList.map((journal, index) => {
                const isTopThree = index < MAX_SIDEBAR
                const isDragging = dragging && dragStartRef.current === index
                const isDragOver = dragOverIndex === index && !(dragging && dragStartRef.current === index)
                const transform = getDragTransform(index)

                return (
                  <div
                    key={journal.id}
                    draggable
                    onDragStart={e => handleDragStart(e, index)}
                    onDragOver={e => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    onDragLeave={handleDragLeave}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 12px", borderRadius: 10,
                      border: isDragOver
                        ? `1.5px dashed ${theme.primary}`
                        : isTopThree
                          ? `1.5px solid ${theme.primary}`
                          : `1px solid ${theme.border}`,
                      background: isDragOver
                        ? `color-mix(in srgb, ${theme.primary} 8%, transparent)`
                        : isTopThree
                          ? `color-mix(in srgb, ${theme.primary} 3%, var(--color-card, white))`
                          : "var(--color-card, white)",
                      boxShadow: isTopThree && !isDragOver
                        ? `0 0 0 1px color-mix(in srgb, ${theme.primary} 12%, transparent)`
                        : "none",
                      cursor: dragging ? "default" : "grab",
                      transition: justDropped
                        ? "none"
                        : dragging
                          ? "border 0.15s ease, background 0.15s ease, box-shadow 0.15s ease"
                          : "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                      transform,
                      opacity: isDragging ? 0.05 : 1,
                      animation: !dragging && !hasDraggedRef.current ? `nbar-list-in 0.25s ease ${index * 40}ms both` : "none",
                      position: "relative",
                      zIndex: isDragging ? 10 : 1,
                    }}
                    onMouseEnter={e => {
                      if (dragging) return
                      e.currentTarget.style.transform = "translateY(-1px)"
                      e.currentTarget.style.boxShadow = isTopThree
                        ? `0 2px 12px color-mix(in srgb, ${theme.primary} 15%, transparent)`
                        : "0 2px 8px rgba(0,0,0,0.06)"
                    }}
                    onMouseLeave={e => {
                      if (dragging) return
                      e.currentTarget.style.transform = "translateY(0)"
                      e.currentTarget.style.boxShadow = isTopThree
                        ? `0 0 0 1px color-mix(in srgb, ${theme.primary} 12%, transparent)`
                        : "none"
                    }}
                  >
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: isTopThree ? theme.primary : theme.muted,
                      width: 16, textAlign: "center", flexShrink: 0,
                      opacity: isTopThree ? 1 : 0.5,
                    }}>
                      {index + 1}
                    </span>

                    <div style={{ color: theme.muted, display: "flex", flexShrink: 0 }}>
                      <GripVertical size={14} />
                    </div>

                    <span style={{ fontSize: 16, lineHeight: 1, flexShrink: 0 }}>
                      {journal.emojis?.find(Boolean) || "\uD83D\uDCD6"}
                    </span>

                    <span style={{
                      fontSize: 13, fontWeight: isTopThree ? 600 : 500,
                      color: theme.dark,
                      flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {journal.title}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          {saving && (
            <p style={{
              fontSize: 11, color: theme.muted, textAlign: "center",
              marginTop: 12, opacity: 0.7,
            }}>
              Saving...
            </p>
          )}
        </div>
      </div>
    </Portal>
  )
}
