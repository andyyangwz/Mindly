import { useState, useCallback, useRef, useEffect } from "react"
import { X, Check, Clock, Sparkles, AlertTriangle, FileText, Zap } from "lucide-react"
import { Portal } from "../../../utils/portal"
import { PRODUCTIVITY_LEVEL_COLORS, colorToHex } from "../utils/calendarConstants"
import "../../../styles/scheduling/index.css"

const ACCENT = "#7C3AED"

function formatTimeRange(activity) {
  const parts = []
  if (activity.start_time) parts.push(activity.start_time)
  if (activity.end_time) parts.push(activity.end_time)
  if (parts.length === 2) return parts.join(" – ")
  if (parts.length === 1) return parts[0]
  return "No time set"
}

function formatDateLabel(activity) {
  if (!activity.start_date) return ""
  const d = new Date(activity.start_date + "T00:00:00")
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  if (d.getTime() === today.getTime()) return "Today"
  if (d.getTime() === tomorrow.getTime()) return "Tomorrow"
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
}

function hexToRgb(hex) {
  const h = hex.replace("#", "")
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  }
}

function luminance({ r, g, b }) {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

function normalizeColor(raw) {
  return colorToHex(raw)
}

function ActivityCard({ activity, draft, status, onSelect, animDelay }) {
  const [hovered, setHovered] = useState(false)
  const isCreated = status === "created"
  const isDraft = status === "draft"
  const display = draft || activity
  const activityColor = normalizeColor(display.color)
  const rgb = hexToRgb(activityColor)
  const lum = luminance(rgb)
  const iconOnDark = lum < 0.55
  const productivityLevel = display.productivity_level || "neutral"
  const prodColor = PRODUCTIVITY_LEVEL_COLORS[productivityLevel]

  return (
    <div style={{ animation: `vrCardIn 1s cubic-bezier(0.16, 1, 0.3, 1) ${animDelay ?? 0}ms both` }}>
    <button
      type="button"
      onClick={() => !isCreated && onSelect(activity)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={isCreated}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        width: "100%",
        padding: "14px 16px",
        borderRadius: 14,
        border: isCreated
          ? "1px solid var(--color-border)"
          : isDraft
            ? `1.5px solid ${hovered ? `rgba(${rgb.r},${rgb.g},${rgb.b},0.35)` : `rgba(${rgb.r},${rgb.g},${rgb.b},0.22)`}`
            : `1px solid ${hovered ? `rgba(${rgb.r},${rgb.g},${rgb.b},0.28)` : `rgba(${rgb.r},${rgb.g},${rgb.b},0.14)`}`,
        background: isCreated
          ? "var(--color-input, #f5f5f5)"
          : isDraft
            ? `rgba(${rgb.r},${rgb.g},${rgb.b},0.03)`
            : hovered
              ? `rgba(${rgb.r},${rgb.g},${rgb.b},0.04)`
              : "var(--color-card, white)",
        cursor: isCreated ? "default" : "pointer",
        textAlign: "left",
        transition: "all 0.2s ease",
        boxShadow: isDraft
          ? `0 1px 4px rgba(${rgb.r},${rgb.g},${rgb.b},0.08)`
          : "none",
        opacity: isCreated ? 0.55 : 1,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: activityColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "all 0.2s ease",
        }}
      >
        {isCreated ? (
          <Check size={16} color={iconOnDark ? "white" : "#1F2937"} strokeWidth={2.5} />
        ) : isDraft ? (
          <FileText size={15} color={iconOnDark ? "white" : "#1F2937"} />
        ) : (
          <Clock size={15} color={iconOnDark ? "white" : "#1F2937"} />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: isCreated ? "var(--color-muted)" : "var(--color-dark)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              minWidth: 0,
            }}
          >
            {display.title}
          </div>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              whiteSpace: "nowrap",
              padding: "2px 7px",
              borderRadius: 6,
              background: `${prodColor}12`,
              color: prodColor,
              border: `1px solid ${prodColor}25`,
              flexShrink: 0,
              textTransform: "capitalize",
              display: display.type === "reminder" ? "none" : "inline-block",
            }}
          >
            {productivityLevel}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginTop: 2,
          }}
        >
          <Clock size={11} color="var(--color-muted)" />
          <span style={{ fontSize: 12, color: "var(--color-muted)" }}>
            {formatDateLabel(display)} · {formatTimeRange(display)}
          </span>
        </div>
      </div>
    </button>
    </div>
  )
}

function CloseConfirmDialog({ createdCount, draftCount, totalCount, onConfirm, onCancel, exiting }) {
  const hasDrafts = draftCount > 0
  const hasCreated = createdCount > 0
  const remaining = totalCount - createdCount

  let message
  if (hasCreated && hasDrafts) {
    message = `You have ${createdCount} of ${totalCount} Activities created, with ${draftCount} unsaved draft${draftCount > 1 ? "s" : ""}. Closing will discard all ${remaining} remaining Activities and ${draftCount} draft${draftCount > 1 ? "s" : ""}. Created Activities will remain.`
  } else if (hasCreated) {
    message = `You have ${createdCount} of ${totalCount} Activities created. Closing will discard the ${remaining} remaining unrecorded Activities. Created Activities will remain.`
  } else {
    message = `None of the ${totalCount} detected Activities have been created yet. Closing will discard all Activities and any drafts.`
  }

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        background: "var(--color-card, white)",
        borderRadius: 14,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "28px 32px",
        zIndex: 3,
        boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        border: "1px solid var(--color-border)",
        maxWidth: 340,
        width: "90%",
        animation: exiting
          ? "confirmPopupOut 0.28s ease-in forwards"
          : "confirmPopupIn 0.3s cubic-bezier(0.22, 1, 0.36, 1) forwards",
      }}
    >
      <AlertTriangle size={28} color="#F59E0B" style={{ marginBottom: 12 }} />
      <h3 className="vrp-confirm-title">Discard remaining Activities?</h3>
      <p className="vrp-confirm-msg">{message}</p>
      <div className="vrp-confirm-actions">
        <button type="button" onClick={onCancel} className="vrp-confirm-btn-cancel">Cancel</button>
        <button type="button" onClick={onConfirm} className="vrp-confirm-btn-danger">Continue Closing</button>
      </div>
    </div>
  )
}

function CreateAllConfirmDialog({ remainingCount, onConfirm, onCancel, exiting }) {
  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        background: "var(--color-card, white)",
        borderRadius: 14,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "28px 32px",
        zIndex: 3,
        boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        border: "1px solid var(--color-border)",
        maxWidth: 340,
        width: "90%",
        animation: exiting
          ? "confirmPopupOut 0.28s ease-in forwards"
          : "confirmPopupIn 0.3s cubic-bezier(0.22, 1, 0.36, 1) forwards",
      }}
    >
      <Zap size={28} color={ACCENT} style={{ marginBottom: 12 }} />
      <h3 className="vrp-confirm-title">Create all remaining Activities?</h3>
      <p className="vrp-confirm-msg">
        This will create {remainingCount} remaining Activit{remainingCount === 1 ? "y" : "ies"} in your calendar.
        {remainingCount === 1 ? " The latest draft will be used if one exists." : " The latest drafts will be used where available."}
      </p>
      <div className="vrp-confirm-actions">
        <button type="button" onClick={onCancel} className="vrp-confirm-btn-cancel">Cancel</button>
        <button type="button" onClick={onConfirm} className="vrp-confirm-btn-primary">Confirm</button>
      </div>
    </div>
  )
}

export default function VoiceReviewPopup({ open, onClose, activities, onSelect, savedIds, drafts, onCreateAll }) {
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)
  const [showCreateAllConfirm, setShowCreateAllConfirm] = useState(false)
  const [confirmExiting, setConfirmExiting] = useState(false)
  const exitTimerRef = useRef(null)
  const createdCount = savedIds ? savedIds.size : 0
  const draftCount = drafts ? drafts.size : 0
  const totalCount = activities.length
  const allDone = createdCount === totalCount
  const hasRemaining = createdCount < totalCount

  useEffect(() => {
    return () => { if (exitTimerRef.current) clearTimeout(exitTimerRef.current) }
  }, [])

  const startExit = useCallback((onDone) => {
    setConfirmExiting(true)
    exitTimerRef.current = setTimeout(() => {
      setConfirmExiting(false)
      onDone()
    }, 280)
  }, [])

  const handleClose = useCallback(() => {
    if (hasRemaining) {
      setShowCloseConfirm(true)
    } else {
      onClose()
    }
  }, [hasRemaining, onClose])

  const handleConfirmClose = useCallback(() => {
    startExit(() => {
      setShowCloseConfirm(false)
      onClose()
    })
  }, [onClose, startExit])

  const handleCancelClose = useCallback(() => {
    startExit(() => setShowCloseConfirm(false))
  }, [startExit])

  const handleCreateAll = useCallback(() => {
    setShowCreateAllConfirm(true)
  }, [])

  const handleConfirmCreateAll = useCallback(() => {
    startExit(() => {
      setShowCreateAllConfirm(false)
      onCreateAll?.()
    })
  }, [onCreateAll, startExit])

  const handleCancelCreateAll = useCallback(() => {
    startExit(() => setShowCreateAllConfirm(false))
  }, [startExit])

  if (!open || totalCount === 0) return null

  return (
    <Portal>
      <div className="vrp-overlay" onClick={handleClose}>
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Detected activities"
          onClick={(e) => e.stopPropagation()}
          className="vrp-dialog"
        >
          <button type="button" onClick={handleClose} className="vrp-close-btn">
            <X size={16} />
          </button>

          <div className="vrp-header">
            <div className="vrp-header-icon" style={{ background: `${ACCENT}18` }}>
              <Sparkles size={18} color={ACCENT} />
            </div>
            <div>
              <h2 className="vrp-header-title">Detected Activities</h2>
              <p className="vrp-header-sub">
                {allDone
                  ? "All activities created"
                  : `${createdCount} of ${totalCount} Activities Created`}
              </p>
            </div>
          </div>

          <div className="vrp-scroll-area">
            {activities.map((activity, i) => {
              let status = "pending"
              if (savedIds?.has(activity._voiceId)) status = "created"
              else if (drafts?.has(activity._voiceId)) status = "draft"

              return (
                <ActivityCard
                  key={`${activity.title}-${i}`}
                  activity={activity}
                  draft={drafts?.get(activity._voiceId)}
                  status={status}
                  onSelect={onSelect}
                  animDelay={60 + i * 100}
                />
              )
            })}
          </div>

          {hasRemaining && (
            <button type="button" onClick={handleCreateAll} className="vrp-create-all-btn" style={{ background: ACCENT }}>
              <Zap size={15} />
              Create All
            </button>
          )}

          {allDone && (
            <div className="vrp-all-done-banner">
              <span className="vrp-all-done-text">All activities have been created</span>
            </div>
          )}

          {(showCloseConfirm || showCreateAllConfirm) && (
            <div
              className="vrp-confirm-backdrop"
              style={{
                animation: confirmExiting
                  ? "confirmBackdropOut 0.28s ease-in forwards"
                  : "confirmBackdropIn 0.3s ease-out forwards",
              }}
            />
          )}

          {showCloseConfirm && (
            <CloseConfirmDialog
              createdCount={createdCount}
              draftCount={draftCount}
              totalCount={totalCount}
              onConfirm={handleConfirmClose}
              onCancel={handleCancelClose}
              exiting={confirmExiting}
            />
          )}

          {showCreateAllConfirm && (
            <CreateAllConfirmDialog
              remainingCount={totalCount - createdCount}
              onConfirm={handleConfirmCreateAll}
              onCancel={handleCancelCreateAll}
              exiting={confirmExiting}
            />
          )}
        </div>
      </div>
    </Portal>
  )
}