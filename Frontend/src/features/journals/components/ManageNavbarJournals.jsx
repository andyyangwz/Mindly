import { useState, useCallback, useEffect } from "react"
import { X, GripVertical, Trash2 } from "lucide-react"
import { theme } from "../../../theme"
import { Portal } from "../../../utils/portal"
import { journalService } from "../../../services/journalService"
import { refreshPinnedJournals } from "../../../hooks/usePinnedJournals"

const MAX_SLOTS = 3
const ANIM_MS = 220

const KEYFRAMES = `
@keyframes nbar-slide-in {
  from { opacity: 0; transform: translateX(10px) scale(0.96); }
  to   { opacity: 1; transform: translateX(0) scale(1); }
}
@keyframes nbar-slide-out {
  from { opacity: 1; transform: scale(1); }
  to   { opacity: 0; transform: scale(0.94); }
}
@keyframes nbar-fade-in {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes nbar-dash-march {
  to { stroke-dashoffset: -12; }
}
@keyframes nbar-glow-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(59,130,246,0); }
  50%      { box-shadow: 0 0 0 5px rgba(59,130,246,0.08); }
}
`

export default function ManageNavbarJournals({ open, onClose }) {
  const [slots, setSlots] = useState([null, null, null])
  const [allPinned, setAllPinned] = useState([])
  const [dragOverSlot, setDragOverSlot] = useState(null)
  const [dragOverPinned, setDragOverPinned] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [leavingSlotId, setLeavingSlotId] = useState(null)
  const [enteringSlotIndex, setEnteringSlotIndex] = useState(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await journalService.getAll({ pinned: true, per_page: 100 })
      const pinned = result.journals || []
      setAllPinned(pinned)

      const navbar = pinned
        .filter(j => j.navbarOrder != null)
        .sort((a, b) => a.navbarOrder - b.navbarOrder)

      const arr = [null, null, null]
      navbar.forEach(j => {
        if (j.navbarOrder >= 1 && j.navbarOrder <= MAX_SLOTS) {
          arr[j.navbarOrder - 1] = j
        }
      })
      setSlots(arr)
    } catch (err) {
      console.error("Failed to load navbar journals:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) loadData()
  }, [open, loadData])

  const slotIds = new Set(slots.filter(Boolean).map(j => j.id))
  const displayAvailable = allPinned.filter(j => !slotIds.has(j.id))

  const handleDragStart = useCallback((e, journal, source) => {
    e.dataTransfer.setData("application/json", JSON.stringify({ id: journal.id, source }))
    e.dataTransfer.effectAllowed = "move"
    e.currentTarget.style.opacity = "0.5"
    const clear = () => { e.currentTarget.style.opacity = "1" }
    e.currentTarget.addEventListener("dragend", clear, { once: true })
  }, [])

  const handleSlotDrop = useCallback((e, slotIndex) => {
    e.preventDefault()
    setDragOverSlot(null)
    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json"))
      const journal = allPinned.find(j => j.id === data.id)
      if (!journal) return

      setEnteringSlotIndex(slotIndex)
      setTimeout(() => setEnteringSlotIndex(null), ANIM_MS)

      setSlots(prev => {
        const without = prev.map(j => (j && j.id === data.id) ? null : j)
        const compacted = without.filter(Boolean)
        compacted.splice(slotIndex, 0, journal)
        const result = compacted.slice(0, MAX_SLOTS)
        while (result.length < MAX_SLOTS) result.push(null)
        return result
      })
    } catch {}
  }, [allPinned])

  const handlePinnedDrop = useCallback((e) => {
    e.preventDefault()
    setDragOverPinned(false)
    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json"))
      if (data.source.startsWith("slot-")) {
        const journal = slots[parseInt(data.source.split("-")[1])]
        if (journal) {
          setLeavingSlotId(journal.id)
          setTimeout(() => {
            setSlots(prev => {
              const without = prev.map(j => (j && j.id === data.id) ? null : j)
              const compacted = without.filter(Boolean)
              while (compacted.length < MAX_SLOTS) compacted.push(null)
              return compacted
            })
            setLeavingSlotId(null)
          }, ANIM_MS)
        }
      }
    } catch {}
  }, [slots])

  const handleRemoveFromSlot = useCallback((slotIndex) => {
    const journal = slots[slotIndex]
    if (!journal) return
    setLeavingSlotId(journal.id)
    setTimeout(() => {
      setSlots(prev => {
        const next = [...prev]
        next[slotIndex] = null
        const compacted = next.filter(Boolean)
        while (compacted.length < MAX_SLOTS) compacted.push(null)
        return compacted
      })
      setLeavingSlotId(null)
    }, ANIM_MS)
  }, [slots])

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      const orders = slots
        .map((j, i) => j ? { id: j.id, order: i + 1 } : null)
        .filter(Boolean)
      await journalService.setNavbarOrders(orders)
      await refreshPinnedJournals()
      onClose()
    } catch (err) {
      console.error("Failed to save navbar orders:", err)
    } finally {
      setSaving(false)
    }
  }, [slots, onClose])

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
          aria-label="Manage Navbar Journals"
          onClick={e => e.stopPropagation()}
          style={{
            background: "var(--color-card, white)",
            borderRadius: 20, padding: "32px 36px",
            maxWidth: 480, width: "100%",
            maxHeight: "85vh", overflowY: "auto",
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
            Manage Navbar Journals
          </h2>
          <p style={{ fontSize: 13, color: theme.muted, margin: "0 0 24px" }}>
            Drag journals into the navbar slots. Maximum 3.
          </p>

          {loading ? (
            <p style={{ fontSize: 13, color: theme.muted, textAlign: "center", padding: "24px 0" }}>
              Loading...
            </p>
          ) : (
            <>
              {/* Navbar Slots */}
              <p style={{
                fontSize: 10, fontWeight: 700, color: theme.muted,
                textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10,
              }}>
                Navbar (Maximum 3)
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
                {slots.map((journal, i) => {
                  const isDragOver = dragOverSlot === i
                  const isLeaving = journal && leavingSlotId === journal.id
                  const isEntering = enteringSlotIndex === i

                  return (
                    <div
                      key={i}
                      onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setDragOverSlot(i) }}
                      onDragLeave={() => setDragOverSlot(null)}
                      onDrop={e => handleSlotDrop(e, i)}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "10px 12px", borderRadius: 10,
                        border: isDragOver
                          ? `2px dashed ${theme.primary}`
                          : journal
                            ? `1px solid ${theme.border}`
                            : `2px dashed ${theme.border}`,
                        background: isDragOver
                          ? `color-mix(in srgb, ${theme.primary} 6%, transparent)`
                          : "var(--color-input, #f5f5f5)",
                        minHeight: 48,
                        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                        animation: isDragOver ? "nbar-glow-pulse 1.5s ease infinite" : "none",
                      }}
                    >
                      <span style={{
                        fontSize: 11, fontWeight: 700, color: theme.muted,
                        width: 18, textAlign: "center", flexShrink: 0,
                      }}>
                        {i + 1}
                      </span>

                      {journal ? (
                        <div
                          key={journal.id}
                          style={{
                            display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0,
                            animation: isLeaving
                              ? `nbar-slide-out ${ANIM_MS}ms ease forwards`
                              : isEntering
                                ? `nbar-slide-in ${ANIM_MS}ms ease`
                                : `nbar-slide-in ${ANIM_MS}ms ease`,
                          }}
                        >
                          <div
                            draggable
                            onDragStart={e => handleDragStart(e, journal, `slot-${i}`)}
                            style={{
                              cursor: "grab", color: theme.muted, display: "flex", flexShrink: 0,
                              transition: "color 0.15s",
                            }}
                            onMouseEnter={e => { e.currentTarget.style.color = theme.dark }}
                            onMouseLeave={e => { e.currentTarget.style.color = theme.muted }}
                          >
                            <GripVertical size={14} />
                          </div>
                          <span style={{ fontSize: 16, lineHeight: 1, flexShrink: 0 }}>
                            {journal.emojis?.find(Boolean) || "\uD83D\uDCD6"}
                          </span>
                          <span style={{
                            fontSize: 13, fontWeight: 500, color: theme.dark,
                            flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          }}>
                            {journal.title}
                          </span>
                          <button
                            onClick={() => handleRemoveFromSlot(i)}
                            style={{
                              background: "none", border: "none", cursor: "pointer",
                              color: theme.muted, padding: 4, borderRadius: 4,
                              display: "flex", flexShrink: 0,
                              transition: "all 0.15s",
                            }}
                            onMouseEnter={e => { e.currentTarget.style.color = "#EF4444"; e.currentTarget.style.background = "rgba(239,68,68,0.08)" }}
                            onMouseLeave={e => { e.currentTarget.style.color = theme.muted; e.currentTarget.style.background = "none" }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ) : (
                        <span style={{
                          fontSize: 13, color: theme.muted, opacity: isDragOver ? 0.8 : 0.4,
                          transition: "opacity 0.2s",
                        }}>
                          Drop a journal here
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: theme.border, marginBottom: 20 }} />

              {/* All Pinned Journals */}
              <p style={{
                fontSize: 10, fontWeight: 700, color: theme.muted,
                textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10,
              }}>
                All Pinned Journals
              </p>
              <div
                onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setDragOverPinned(true) }}
                onDragLeave={() => setDragOverPinned(false)}
                onDrop={handlePinnedDrop}
                style={{
                  display: "flex", flexDirection: "column", gap: 6,
                  padding: dragOverPinned ? 8 : 0,
                  borderRadius: 10,
                  border: dragOverPinned ? `2px dashed ${theme.primary}` : "2px dashed transparent",
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  minHeight: 40,
                  animation: dragOverPinned ? "nbar-glow-pulse 1.5s ease infinite" : "none",
                }}
              >
                {displayAvailable.length === 0 && (
                  <p style={{
                    fontSize: 13, color: theme.muted, opacity: 0.6, margin: 0,
                    textAlign: "center", padding: "12px 0",
                  }}>
                    {allPinned.length === 0 ? "No pinned journals" : "All pinned journals are on the navbar"}
                  </p>
                )}
                {displayAvailable.map((journal, idx) => (
                  <div
                    key={journal.id}
                    draggable
                    onDragStart={e => handleDragStart(e, journal, "pinned-list")}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "8px 12px", borderRadius: 8,
                      border: `1px solid ${theme.border}`,
                      background: "var(--color-card, white)",
                      cursor: "grab",
                      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                      animation: `nbar-fade-in ${ANIM_MS}ms ease`,
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = theme.primary
                      e.currentTarget.style.background = `color-mix(in srgb, ${theme.primary} 3%, white)`
                      e.currentTarget.style.transform = "translateY(-1px)"
                      e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)"
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = theme.border
                      e.currentTarget.style.background = "var(--color-card, white)"
                      e.currentTarget.style.transform = "translateY(0)"
                      e.currentTarget.style.boxShadow = "none"
                    }}
                  >
                    <div style={{ color: theme.muted, display: "flex", flexShrink: 0 }}>
                      <GripVertical size={14} />
                    </div>
                    <span style={{ fontSize: 15, lineHeight: 1, flexShrink: 0 }}>
                      {journal.emojis?.find(Boolean) || "\uD83D\uDCD6"}
                    </span>
                    <span style={{
                      fontSize: 13, fontWeight: 500, color: theme.dark,
                      flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {journal.title}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving || loading}
            style={{
              width: "100%", padding: "10px 16px", marginTop: 24,
              borderRadius: 10, border: "none",
              background: theme.primary, color: "white",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              opacity: saving || loading ? 0.6 : 1,
              transition: "all 0.2s",
            }}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </Portal>
  )
}
