import { useState, useCallback } from "react"
import { X, Check, Clock, Sparkles, AlertTriangle, FileText, Zap } from "lucide-react"
import { theme } from "../../../theme"
import { Portal } from "../../../utils/portal"
import { PRODUCTIVITY_LEVEL_COLORS, COLOR_NAME_MAP } from "../utils/calendarConstants"

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
  if (!raw) return "#7C3AED"
  return COLOR_NAME_MAP[raw.toLowerCase()] || raw
}

function ActivityCard({ activity, draft, status, onSelect }) {
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
          ? `1px solid ${theme.border}`
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
              color: isCreated ? theme.muted : theme.dark,
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
          <Clock size={11} color={theme.muted} />
          <span style={{ fontSize: 12, color: theme.muted }}>
            {formatDateLabel(display)} · {formatTimeRange(display)}
          </span>
        </div>
      </div>
    </button>
  )
}

function CloseConfirmDialog({ createdCount, draftCount, totalCount, onConfirm, onCancel }) {
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
        inset: 0,
        background: "var(--color-card, white)",
        borderRadius: 20,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
        zIndex: 1,
      }}
    >
      <AlertTriangle size={32} color="#F59E0B" style={{ marginBottom: 16 }} />
      <h3 style={{ fontSize: 16, fontWeight: 600, color: theme.dark, margin: "0 0 8px", textAlign: "center" }}>
        Discard remaining Activities?
      </h3>
      <p style={{ fontSize: 13, color: theme.muted, textAlign: "center", margin: "0 0 20px", lineHeight: 1.5 }}>
        {message}
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: `1px solid ${theme.border}`,
            background: "transparent",
            color: theme.dark,
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            background: "#EF4444",
            color: "white",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Continue Closing
        </button>
      </div>
    </div>
  )
}

function CreateAllConfirmDialog({ remainingCount, onConfirm, onCancel }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "var(--color-card, white)",
        borderRadius: 20,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
        zIndex: 1,
      }}
    >
      <Zap size={32} color={ACCENT} style={{ marginBottom: 16 }} />
      <h3 style={{ fontSize: 16, fontWeight: 600, color: theme.dark, margin: "0 0 8px", textAlign: "center" }}>
        Create all remaining Activities?
      </h3>
      <p style={{ fontSize: 13, color: theme.muted, textAlign: "center", margin: "0 0 20px", lineHeight: 1.5 }}>
        This will create {remainingCount} remaining Activit{remainingCount === 1 ? "y" : "ies"} in your calendar.
        {remainingCount === 1 ? " The latest draft will be used if one exists." : " The latest drafts will be used where available."}
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: `1px solid ${theme.border}`,
            background: "transparent",
            color: theme.dark,
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            background: ACCENT,
            color: "white",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Confirm
        </button>
      </div>
    </div>
  )
}

export default function VoiceReviewPopup({ open, onClose, activities, onSelect, savedIds, drafts, onCreateAll }) {
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)
  const [showCreateAllConfirm, setShowCreateAllConfirm] = useState(false)
  const createdCount = savedIds ? savedIds.size : 0
  const draftCount = drafts ? drafts.size : 0
  const totalCount = activities.length
  const allDone = createdCount === totalCount
  const hasRemaining = createdCount < totalCount

  const handleClose = useCallback(() => {
    if (hasRemaining) {
      setShowCloseConfirm(true)
    } else {
      onClose()
    }
  }, [hasRemaining, onClose])

  const handleConfirmClose = useCallback(() => {
    setShowCloseConfirm(false)
    onClose()
  }, [onClose])

  const handleCancelClose = useCallback(() => {
    setShowCloseConfirm(false)
  }, [])

  const handleCreateAll = useCallback(() => {
    setShowCreateAllConfirm(true)
  }, [])

  const handleConfirmCreateAll = useCallback(() => {
    setShowCreateAllConfirm(false)
    onCreateAll?.()
  }, [onCreateAll])

  const handleCancelCreateAll = useCallback(() => {
    setShowCreateAllConfirm(false)
  }, [])

  if (!open || totalCount === 0) return null

  return (
    <Portal>
      <div
        onClick={handleClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: theme.z.modalOverlay,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
          backdropFilter: "blur(4px)",
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Detected activities"
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "var(--color-card, white)",
            borderRadius: 20,
            padding: "28px 28px 24px",
            maxWidth: 420,
            width: "100%",
            boxShadow: "0 24px 64px rgba(0,0,0,0.15)",
            position: "relative",
            maxHeight: "80vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <button
            type="button"
            onClick={handleClose}
            style={{
              position: "absolute",
              top: 14,
              right: 14,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
              display: "flex",
              color: theme.muted,
            }}
          >
            <X size={16} />
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: `${ACCENT}18`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Sparkles size={18} color={ACCENT} />
            </div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 600, color: theme.dark, margin: 0 }}>
                Detected Activities
              </h2>
              <p style={{ fontSize: 12, color: theme.muted, margin: "2px 0 0" }}>
                {allDone
                  ? "All activities created"
                  : `${createdCount} of ${totalCount} Activities Created`}
              </p>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              marginTop: 16,
              overflowY: "auto",
              maxHeight: 360,
              paddingRight: 4,
            }}
          >
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
                />
              )
            })}
          </div>

          {hasRemaining && (
            <button
              type="button"
              onClick={handleCreateAll}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                width: "100%",
                padding: "10px 16px",
                marginTop: 12,
                borderRadius: 10,
                border: "none",
                background: ACCENT,
                color: "white",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "opacity 0.2s",
              }}
            >
              <Zap size={15} />
              Create All
            </button>
          )}

          {allDone && (
            <div
              style={{
                marginTop: 12,
                padding: "10px 14px",
                borderRadius: 10,
                background: "#ECFDF5",
                textAlign: "center",
              }}
            >
              <span style={{ fontSize: 13, color: "#059669", fontWeight: 500 }}>
                All activities have been created
              </span>
            </div>
          )}

          {showCloseConfirm && (
            <CloseConfirmDialog
              createdCount={createdCount}
              draftCount={draftCount}
              totalCount={totalCount}
              onConfirm={handleConfirmClose}
              onCancel={handleCancelClose}
            />
          )}

          {showCreateAllConfirm && (
            <CreateAllConfirmDialog
              remainingCount={totalCount - createdCount}
              onConfirm={handleConfirmCreateAll}
              onCancel={handleCancelCreateAll}
            />
          )}
        </div>
      </div>
    </Portal>
  )
}