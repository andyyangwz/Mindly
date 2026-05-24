import { useState, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { X, Flag, Clock, CalendarClock } from "lucide-react"
import { theme } from "../../theme"
import { Portal } from "../../utils/portal"
import {
  ACTIVITY_COLORS,
  PRIORITY_LABELS,
  PRODUCTIVITY_LEVELS,
  PRODUCTIVITY_LEVEL_COLORS,
  toDateStr,
} from "./calendarConstants"

const INITIAL_STATE = {
  title: "",
  description: "",
  eventDate: "",
  startTime: "",
  endTime: "",
  color: "#7C3AED",
  priority: "medium",
  productivityLevel: "neutral",
  status: "To Do",
  hasDeadline: false,
  deadlineDate: "",
  deadlineTime: "",
}

export default function ActivityFormModal({
  open,
  onClose,
  onSave,
  editingActivity,
  selectedSlot,
}) {
  const { t } = useTranslation()
  const [form, setForm] = useState(INITIAL_STATE)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const titleRef = useRef(null)
  const isEdit = !!editingActivity
  const isMarker = isEdit && editingActivity.isDeadlineMarker
  const mode = form.hasDeadline ? "deadline" : "standard"

  useEffect(() => {
    if (!open) return
    if (editingActivity) {
      setForm({
        title: editingActivity.isDeadlineMarker
          ? editingActivity.title.replace(/ Deadline$/, "")
          : editingActivity.title,
        description: editingActivity.description || "",
        eventDate: editingActivity.eventDate || "",
        startTime: editingActivity.startTime || "",
        endTime: editingActivity.endTime || "",
        color: editingActivity.color || "#7C3AED",
        priority: editingActivity.priority || "medium",
        productivityLevel: editingActivity.productivityLevel || "neutral",
        status: editingActivity.status || "To Do",
        hasDeadline: editingActivity.hasDeadline || false,
        deadlineDate: "",
        deadlineTime: "",
      })
    } else if (selectedSlot) {
      const now = new Date()
      const hh = String(now.getHours()).padStart(2, "0")
      const mm = String(now.getMinutes()).padStart(2, "0")
      const currentTime = `${hh}:${mm}`
      const defaultEnd = `${String((now.getHours() + 1) % 24).padStart(2, "0")}:${mm}`
      setForm({
        ...INITIAL_STATE,
        eventDate: toDateStr(selectedSlot.date),
        startTime: selectedSlot.startTime || currentTime,
        endTime: selectedSlot.endTime || defaultEnd,
        priority: selectedSlot.startTime ? "low" : INITIAL_STATE.priority,
      })
    } else {
      setForm(INITIAL_STATE)
    }
    setErrors({})
    setSaving(false)
  }, [open, editingActivity, selectedSlot])

  useEffect(() => {
    if (open && titleRef.current) {
      setTimeout(() => titleRef.current?.focus(), 100)
    }
  }, [open])

  const validate = () => {
    const errs = {}
    if (!form.title.trim()) errs.title = t("productivity.eventForm.validation.titleRequired")

    if (form.hasDeadline) {
      if (!form.eventDate) errs.eventDate = t("productivity.eventForm.validation.required")
      if (!form.startTime) errs.startTime = t("productivity.eventForm.validation.required")
      if (!form.deadlineDate) errs.deadlineDate = t("productivity.eventForm.validation.required")
      if (!form.deadlineTime) errs.deadlineTime = t("productivity.eventForm.validation.required")

      if (form.productivityLevel === "unproductive") {
        errs.productivityLevel = t("productivity.eventForm.validation.notAllowedForDeadline")
      }

      if (
        form.eventDate &&
        form.startTime &&
        form.deadlineDate &&
        form.deadlineTime
      ) {
        const start = new Date(`${form.eventDate}T${form.startTime}`)
        const deadline = new Date(`${form.deadlineDate}T${form.deadlineTime}`)
        if (deadline <= start) errs.deadlineTime = t("productivity.eventForm.validation.mustBeAfterStart")
      }
    } else {
      if (!form.eventDate) errs.eventDate = t("productivity.eventForm.validation.required")
      if (!form.startTime) errs.startTime = t("productivity.eventForm.validation.required")
      if (!form.endTime) errs.endTime = t("productivity.eventForm.validation.required")
      if (form.startTime && form.endTime && form.startTime >= form.endTime) {
        errs.endTime = t("productivity.eventForm.validation.mustBeAfterStart")
      }
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        eventDate: form.eventDate,
        startTime: form.startTime,
        color: form.color,
        priority: form.priority,
        productivityLevel: form.productivityLevel,
        status: form.status,
        hasDeadline: form.hasDeadline,
      }

      if (form.hasDeadline) {
        const [sh, sm] = form.startTime.split(":").map(Number)
        const eh = (sh + 1) % 24
        payload.endTime = `${String(eh).padStart(2, "0")}:${String(sm).padStart(2, "0")}`
        payload.deadlineDate = form.deadlineDate
        payload.deadlineTime = form.deadlineTime
      } else {
        payload.endTime = form.endTime
      }

      await onSave(payload)
      onClose()
    } catch (err) {
      setErrors({ submit: err.message })
    } finally {
      setSaving(false)
    }
  }

  const set = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => ({ ...e, [field]: null }))
  }

  if (!open) return null

  const tStatus = (s) => {
    const k = { "To Do": "todo", "In Progress": "inProgress", "Done": "done" };
    return t(`productivity.status.${k[s]}`);
  };

  return (
    <Portal>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: theme.z.modalOverlay,
          background: "rgba(0,0,0,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label={isEdit ? t("productivity.eventForm.editActivity") : t("productivity.eventForm.newActivity")}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "var(--color-card, white)",
            borderRadius: 16,
            padding: "40px 44px",
            maxWidth: 780,
            width: "100%",
            boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
            zIndex: theme.z.modal,
          }}
        >
          {/* ── Header row ── */}
          <Header
            isEdit={isEdit}
            isMarker={isMarker}
            mode={mode}
            onClose={onClose}
          />

          {errors.submit && <Error msg={errors.submit} />}
          {isMarker && <MarkerWarning />}

          {/* ── Mode toggle (create only) ── */}
          {!isEdit && (
            <ModeToggle
              hasDeadline={form.hasDeadline}
              onChange={() => {
                const next = !form.hasDeadline
                if (next) {
                  if (form.productivityLevel === "unproductive") {
                    set("productivityLevel", "neutral")
                  }
                  set("deadlineDate", form.eventDate)
                  set("deadlineTime", "23:59")
                } else {
                  set("deadlineDate", "")
                  set("deadlineTime", "")
                }
                set("hasDeadline", next)
              }}
            />
          )}

          {/* ── 2-column layout ── */}
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,2fr)", gap: 28, minWidth: 0 }}>
            {/* Left column: Title + Date/Time */}
            <div style={{ display: "flex", flexDirection: "column", gap: 0, minWidth: 0 }}>
              <Field label={t("productivity.eventForm.titleLabel")} error={errors.title}>
                <In
                  ref={titleRef}
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) handleSubmit()
                  }}
                  placeholder={t("productivity.eventForm.titlePlaceholderExample")}
                  error={errors.title}
                />
              </Field>

              {mode === "standard" ? (
                <StandardSection form={form} errors={errors} set={set} />
              ) : (
                <DeadlineSection form={form} errors={errors} set={set} />
              )}
            </div>

            {/* Right column: Description + Productivity + Status + Priority + Color */}
            <div style={{ display: "flex", flexDirection: "column", gap: 0, minWidth: 0 }}>
              <Field label={t("productivity.eventForm.descriptionLabel")}>
                <textarea
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder={t("productivity.eventForm.descriptionPlaceholder")}
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: `1px solid ${theme.border}`,
                    borderRadius: 8,
                    fontSize: 13,
                    color: theme.dark,
                    background: "var(--color-input)",
                    outline: "none",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                    resize: "vertical",
                    lineHeight: 1.5,
                  }}
                />
              </Field>

              <Field label={t("productivity.eventForm.productivityLabel")} error={errors.productivityLevel}>
                <Row gap={6} wrap>
                  {Object.entries(PRODUCTIVITY_LEVELS)
                    .filter(([key]) => mode !== "deadline" || key !== "unproductive")
                    .map(([key, label]) => {
                      const dotColor = PRODUCTIVITY_LEVEL_COLORS[key]
                      const active = form.productivityLevel === key
                      return (
                        <Pill
                          key={key}
                          active={active}
                          accent={dotColor}
                          onClick={() => set("productivityLevel", key)}
                        >
                          <span
                            style={{
                              width: 7,
                              height: 7,
                              borderRadius: "50%",
                              background: dotColor,
                              flexShrink: 0,
                            }}
                          />
                          {t(`productivity.eventForm.level_${key}`)}
                        </Pill>
                      )
                    })}
                </Row>
              </Field>

              <div style={{ display: "flex", gap: 12, minWidth: 0, width: "100%" }}>
                <div style={{ flexShrink: 0 }}>
                  <Field label={t("productivity.eventForm.statusLabel")}>
                    <Row gap={6}>
                      {["To Do", "In Progress", "Done"].map(s => {
                        const active = form.status === s
                        const colors = {
                          "To Do": { color: "#6B7280", bg: "#6B728014" },
                          "In Progress": { color: "#B45309", bg: "#B4530918" },
                          "Done": { color: "#10B981", bg: "#10B98114" },
                        }
                        return (
                          <Pill
                            key={s}
                            active={active}
                            accent={colors[s].color}
                            onClick={() => set("status", s)}
                          >
                            {tStatus(s)}
                          </Pill>
                        )
                      })}
                    </Row>
                  </Field>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Field label={t("productivity.eventForm.priorityLabel")}>
                    <Row gap={6}>
                      {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                        <Pill
                          key={key}
                          active={form.priority === key}
                          accent={theme.primary}
                          onClick={() => set("priority", key)}
                          compact
                        >
                          {t(`productivity.eventForm.priority_${key}`)}
                        </Pill>
                      ))}
                    </Row>
                  </Field>
                </div>
              </div>

              <Field label={t("productivity.eventForm.colorLabel")}>
                <Row gap={5} wrap>
                  {ACTIVITY_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => set("color", c.value)}
                      aria-label={t(`productivity.eventForm.color_${c.label.toLowerCase()}`)}
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        background: c.value,
                        border:
                          form.color === c.value
                            ? "2px solid white"
                            : "2px solid transparent",
                        outline:
                          form.color === c.value ? `2px solid ${c.value}` : "none",
                        cursor: "pointer",
                        padding: 0,
                        flexShrink: 0,
                      }}
                    />
                  ))}
                </Row>
              </Field>
            </div>
          </div>

          {/* ── Actions ── */}
          <Actions
            saving={saving}
            isEdit={isEdit}
            onCancel={onClose}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </Portal>
  )
}

/* ── Sub-components ── */

function Header({ isEdit, isMarker, mode, onClose }) {
  const { t } = useTranslation()

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 20,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <h2
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: theme.dark,
            margin: 0,
          }}
        >
          {isEdit ? t("productivity.eventForm.editActivity") : t("productivity.eventForm.newActivity")}
        </h2>
        {isEdit && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              padding: "2px 8px",
              borderRadius: 6,
              background:
                mode === "deadline"
                  ? "#FEFCE8"
                  : `color-mix(in srgb, ${theme.primary} 12%, transparent)`,
              color:
                mode === "deadline"
                  ? "#92400E"
                  : theme.primaryText,
              display: "flex",
              alignItems: "center",
              gap: 4,
              whiteSpace: "nowrap",
            }}
          >
            {isMarker ? (
              <Flag size={10} />
            ) : mode === "deadline" ? (
              <CalendarClock size={10} />
            ) : (
              <Clock size={10} />
            )}
            {isMarker
              ? t("productivity.eventForm.deadlineMarker")
              : mode === "deadline"
                ? t("productivity.eventForm.deadlineTask")
                : t("productivity.eventForm.standardActivity")}
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 4,
          display: "flex",
        }}
      >
        <X size={16} color={theme.muted} />
      </button>
    </div>
  )
}

function ModeToggle({ hasDeadline, onChange }) {
  const { t } = useTranslation()

  return (
    <div
      style={{
        display: "flex",
        gap: 0,
        padding: 3,
        borderRadius: 12,
        background: theme.border,
        marginBottom: 18,
        position: "relative",
      }}
    >
      <button
        type="button"
        onClick={() => hasDeadline && onChange()}
        style={{
          flex: 1,
          padding: "9px 16px",
          borderRadius: 10,
          border: "none",
          background: !hasDeadline ? theme.primary : "transparent",
          color: !hasDeadline ? "#FFFFFF" : theme.muted,
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          transition: "all 0.25s ease",
          boxShadow: !hasDeadline
            ? `0 2px 8px color-mix(in srgb, ${theme.primary} 55%, transparent)`
            : "none",
          position: "relative",
          zIndex: 1,
        }}
        onMouseEnter={(e) => {
          if (hasDeadline) {
            e.currentTarget.style.background = theme.border;
            e.currentTarget.style.color = theme.dark;
          }
        }}
        onMouseLeave={(e) => {
          if (hasDeadline) {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = theme.muted;
          }
        }}
      >
        {t("productivity.eventForm.dayToDayActivity")}
      </button>
      <button
        type="button"
        onClick={() => !hasDeadline && onChange()}
        style={{
          flex: 1,
          padding: "9px 16px",
          borderRadius: 10,
          border: "none",
          background: hasDeadline ? theme.primary : "transparent",
          color: hasDeadline ? "#FFFFFF" : theme.muted,
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          transition: "all 0.25s ease",
          boxShadow: hasDeadline
            ? `0 2px 8px color-mix(in srgb, ${theme.primary} 55%, transparent)`
            : "none",
          position: "relative",
          zIndex: 1,
        }}
        onMouseEnter={(e) => {
          if (!hasDeadline) {
            e.currentTarget.style.background = theme.border;
            e.currentTarget.style.color = theme.dark;
          }
        }}
        onMouseLeave={(e) => {
          if (!hasDeadline) {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = theme.muted;
          }
        }}
      >
        {t("productivity.eventForm.taskWithDeadline")}
      </button>
    </div>
  )
}

function StandardSection({ form, errors, set }) {
  const { t } = useTranslation()

  return (
    <>
      <Field label={t("productivity.eventForm.activityDateLabel")} error={errors.eventDate}>
        <In
          type="date"
          value={form.eventDate}
          onChange={(e) => set("eventDate", e.target.value)}
          error={errors.eventDate}
        />
      </Field>
      <Grid cols="minmax(0,1fr) minmax(0,1fr)" gap={12}>
        <Field label={t("productivity.eventForm.startLabel")} error={errors.startTime}>
          <In
            type="time"
            value={form.startTime}
            onChange={(e) => set("startTime", e.target.value)}
            error={errors.startTime}
          />
        </Field>
        <Field label={t("productivity.eventForm.endLabel")} error={errors.endTime}>
          <In
            type="time"
            value={form.endTime}
            onChange={(e) => set("endTime", e.target.value)}
            error={errors.endTime}
          />
        </Field>
      </Grid>
    </>
  )
}

function DeadlineSection({ form, errors, set }) {
  const { t } = useTranslation()

  return (
    <>
      <Field label={t("productivity.eventForm.startsLabel")}>
        <Grid cols="minmax(0,1fr) minmax(0,1fr)" gap={12}>
          <In
            type="date"
            value={form.eventDate}
            onChange={(e) => set("eventDate", e.target.value)}
            error={errors.eventDate}
            placeholder={t("productivity.eventForm.datePlaceholder")}
          />
          <In
            type="time"
            value={form.startTime}
            onChange={(e) => set("startTime", e.target.value)}
            error={errors.startTime}
            placeholder={t("productivity.eventForm.timePlaceholder")}
          />
        </Grid>
        {errors.eventDate && <ErrMsg msg={errors.eventDate} />}
        {errors.startTime && <ErrMsg msg={errors.startTime} />}
      </Field>
      <Field label={t("productivity.eventForm.dueLabel")}>
        <Grid cols="minmax(0,1fr) minmax(0,1fr)" gap={12}>
          <In
            type="date"
            value={form.deadlineDate}
            onChange={(e) => set("deadlineDate", e.target.value)}
            error={errors.deadlineDate}
            placeholder={t("productivity.eventForm.datePlaceholder")}
          />
          <In
            type="time"
            value={form.deadlineTime}
            onChange={(e) => set("deadlineTime", e.target.value)}
            error={errors.deadlineTime}
            placeholder={t("productivity.eventForm.timePlaceholder")}
          />
        </Grid>
        {errors.deadlineDate && <ErrMsg msg={errors.deadlineDate} />}
        {errors.deadlineTime && <ErrMsg msg={errors.deadlineTime} />}
      </Field>
    </>
  )
}

function Field({ label, error, children }) {
  return (
    <div style={{ marginBottom: 20, width: "100%", boxSizing: "border-box" }}>
      {label && (
        <label
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: error ? "#EF4444" : theme.muted,
            display: "block",
            marginBottom: 6,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {label}
        </label>
      )}
      {children}
    </div>
  )
}

function ErrMsg({ msg }) {
  return (
    <p style={{ fontSize: 10, color: "#EF4444", margin: "3px 0 0" }}>
      {msg}
    </p>
  )
}

function Error({ msg }) {
  return (
    <div
      style={{
        marginBottom: 14,
        padding: "10px 14px",
        background: "#FEF2F2",
        border: "1px solid #FECACA",
        borderRadius: 8,
        color: "#DC2626",
        fontSize: 12,
      }}
    >
      {msg}
    </div>
  )
}

function MarkerWarning() {
  const { t } = useTranslation()

  return (
    <div
      style={{
        marginBottom: 14,
        padding: "10px 14px",
        background: "#FEF2F2",
        borderRadius: 8,
        fontSize: 11,
        color: "#991B1B",
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <Flag size={12} />
      {t("productivity.eventForm.editWarning")}
    </div>
  )
}

function In({ error, style: overrideStyle, ...props }) {
  return (
    <input
      {...props}
      style={{
        width: "100%",
        padding: "10px 12px",
        border: `1px solid ${error ? "#EF4444" : theme.border}`,
        borderRadius: 8,
        fontSize: 13,
        color: theme.dark,
        background: "var(--color-input)",
        outline: "none",
        boxSizing: "border-box",
        fontFamily: "inherit",
        ...overrideStyle,
      }}
    />
  )
}

function Pill({ active, accent, onClick, compact, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        padding: "7px 12px",
        borderRadius: 8,
        border: `1px solid ${active ? accent : theme.border}`,
        background: active ? `${accent}12` : "var(--color-card, white)",
        color: active ? accent : theme.muted,
        fontSize: 11,
        fontWeight: 500,
        cursor: "pointer",
        transition: "all 0.1s",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  )
}

function Row({ gap, wrap, children }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: gap ?? 8,
        flexWrap: wrap ? "wrap" : "nowrap",
      }}
    >
      {children}
    </div>
  )
}

function Grid({ cols, gap, children }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: cols,
        gap: gap ?? 8,
      }}
    >
      {children}
    </div>
  )
}

function Actions({ saving, isEdit, onCancel, onSubmit }) {
  const { t } = useTranslation()

  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        justifyContent: "flex-end",
        marginTop: 20,
      }}
    >
      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        style={{
          padding: "8px 18px",
          borderRadius: 8,
          border: `1px solid ${theme.border}`,
          background: "var(--color-card, white)",
          color: theme.dark,
          fontSize: 13,
          fontWeight: 500,
          cursor: saving ? "not-allowed" : "pointer",
          opacity: saving ? 0.5 : 1,
        }}
      >
        {t("common.cancel")}
      </button>
      <button
        type="button"
        onClick={onSubmit}
        disabled={saving}
        style={{
          padding: "8px 18px",
          borderRadius: 8,
          border: "none",
          background: saving
            ? theme.muted
            : `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
          color: "white",
          fontSize: 13,
          fontWeight: 500,
          cursor: saving ? "not-allowed" : "pointer",
          opacity: saving ? 0.7 : 1,
        }}
      >
        {saving ? t("common.saving") : isEdit ? t("productivity.eventForm.updateButton") : t("productivity.eventForm.createActivityButton")}
      </button>
    </div>
  )
}
