import { useState, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { X, Waves } from "lucide-react"
import { theme } from "../../theme"
import { Portal } from "../../utils/portal"
import {
  ACTIVITY_COLORS,
  PRIORITY_LABELS,
  PRODUCTIVITY_LEVELS,
  PRODUCTIVITY_LEVEL_COLORS,
  toDateStr,
} from "./calendarConstants"
import { Field, In, Pill, Row, Grid, Actions, Error } from "./formComponents"

const ACTIVITY_ACCENT = "#10B981"

const INITIAL_STATE = {
  title: "",
  description: "",
  startDate: "",
  endDate: "",
  startTime: "",
  endTime: "",
  color: "#7C3AED",
  priority: "medium",
  productivityLevel: "neutral",
}

export default function AddActivityModal({ open, onClose, onSave, editingActivity, selectedSlot, voiceAutofill }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(INITIAL_STATE)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const titleRef = useRef(null)
  const isEdit = !!editingActivity

  useEffect(() => {
    if (!open) return
    if (voiceAutofill) {
      const sd = voiceAutofill.event_date || voiceAutofill.start_date || ""
      const ed = voiceAutofill.end_date || voiceAutofill.event_date || ""
      setForm({
        title: voiceAutofill.title || "",
        description: voiceAutofill.description || "",
        startDate: sd,
        endDate: ed,
        startTime: voiceAutofill.start_time || "",
        endTime: voiceAutofill.end_time || "",
        color: "#7C3AED",
        priority: "medium",
        productivityLevel: voiceAutofill.productivity_level || "neutral",
      })
    } else if (editingActivity) {
      const sd = editingActivity.startDate || editingActivity.eventDate || ""
      const ed = editingActivity.endDate || editingActivity.eventDate || ""
      setForm({
        title: editingActivity.title,
        description: editingActivity.description || "",
        startDate: sd,
        endDate: ed,
        startTime: editingActivity.startTime || "",
        endTime: editingActivity.endTime || "",
        color: editingActivity.color || "#7C3AED",
        priority: editingActivity.priority || "medium",
        productivityLevel: editingActivity.productivityLevel || "neutral",
      })
    } else if (selectedSlot) {
      const now = new Date()
      const hh = String(now.getHours()).padStart(2, "0")
      const mm = String(now.getMinutes()).padStart(2, "0")
      const currentTime = `${hh}:${mm}`
      const defaultEnd = `${String((now.getHours() + 1) % 24).padStart(2, "0")}:${mm}`
      const dateStr = toDateStr(selectedSlot.date)
      setForm({
        ...INITIAL_STATE,
        startDate: dateStr,
        endDate: dateStr,
        startTime: selectedSlot.startTime || currentTime,
        endTime: selectedSlot.endTime || defaultEnd,
      })
    } else {
      setForm(INITIAL_STATE)
    }
    setErrors({})
    setSaving(false)
  }, [open, editingActivity, selectedSlot, voiceAutofill])

  useEffect(() => {
    if (open && titleRef.current) {
      setTimeout(() => titleRef.current?.focus(), 100)
    }
  }, [open])

  const validate = () => {
    const errs = {}
    if (!form.title.trim()) errs.title = t("productivity.eventForm.validation.titleRequired")
    if (!form.startDate) errs.startDate = t("productivity.eventForm.validation.required")
    if (!form.endDate) errs.endDate = t("productivity.eventForm.validation.required")
    if (!form.startTime) errs.startTime = t("productivity.eventForm.validation.required")
    if (!form.endTime) errs.endTime = t("productivity.eventForm.validation.required")
    if (form.startDate && form.endDate && form.startTime && form.endTime) {
      const start = new Date(`${form.startDate}T${form.startTime}`)
      const end = new Date(`${form.endDate}T${form.endTime}`)
      if (end <= start) {
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
      await onSave({
        title: form.title.trim(),
        description: form.description.trim(),
        startDatetime: `${form.startDate}T${form.startTime}`,
        endDatetime: `${form.endDate}T${form.endTime}`,
        eventDate: form.startDate,
        startTime: form.startTime,
        endTime: form.endTime,
        color: form.color,
        priority: form.priority,
        productivityLevel: form.productivityLevel,
        status: "To Do",
        hasDeadline: false,
      })
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
          aria-label={isEdit ? "Edit Activity" : "New Activity"}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "var(--color-card, white)",
            borderRadius: 20,
            padding: "36px 40px",
            maxWidth: 640,
            width: "100%",
            boxShadow: "0 24px 64px rgba(0,0,0,0.15)",
            zIndex: theme.z.modal,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: `${ACTIVITY_ACCENT}18`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <Waves size={18} color={ACTIVITY_ACCENT} />
              </div>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: theme.dark, margin: 0 }}>
                {isEdit ? "Edit Activity" : "New Activity"}
              </h2>
            </div>
            <button type="button" onClick={onClose}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", color: theme.muted }}
            >
              <X size={16} />
            </button>
          </div>

          {errors.submit && <Error msg={errors.submit} />}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24, alignItems: "start" }}>
            <div>
              <Field label="Start">
                <Grid cols="1fr 1fr" gap={8}>
                  <In
                    type="date"
                    value={form.startDate}
                    onChange={(e) => set("startDate", e.target.value)}
                    error={errors.startDate}
                  />
                  <In
                    type="time"
                    value={form.startTime}
                    onChange={(e) => set("startTime", e.target.value)}
                    error={errors.startTime}
                  />
                </Grid>
              </Field>
              <Field label="End">
                <Grid cols="1fr 1fr" gap={8}>
                  <In
                    type="date"
                    value={form.endDate}
                    onChange={(e) => set("endDate", e.target.value)}
                    error={errors.endDate}
                  />
                  <In
                    type="time"
                    value={form.endTime}
                    onChange={(e) => set("endTime", e.target.value)}
                    error={errors.endTime}
                  />
                </Grid>
              </Field>
              <Field label="Priority">
                <Row gap={6} wrap>
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
            <div>
              <Field label="Title" error={errors.title}>
                <In
                  ref={titleRef}
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) handleSubmit() }}
                  placeholder="e.g. Gym Session, Deep Work"
                  error={errors.title}
                />
              </Field>
              <Field label="Description">
                <textarea
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Optional notes..."
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
              <Field label="Productivity Level">
                <Row gap={6} wrap>
                  {Object.entries(PRODUCTIVITY_LEVELS).map(([key, label]) => {
                    const dotColor = PRODUCTIVITY_LEVEL_COLORS[key]
                    const active = form.productivityLevel === key
                    return (
                      <Pill key={key} active={active} accent={dotColor} onClick={() => set("productivityLevel", key)}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
                        {t(`productivity.eventForm.level_${key}`)}
                      </Pill>
                    )
                  })}
                </Row>
              </Field>
              <Field label="Color">
                <Row gap={5} wrap>
                  {ACTIVITY_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => set("color", c.value)}
                      aria-label={c.label}
                      style={{
                        width: 24, height: 24, borderRadius: "50%",
                        background: c.value,
                        border: form.color === c.value ? "2px solid white" : "2px solid transparent",
                        outline: form.color === c.value ? `2px solid ${c.value}` : "none",
                        cursor: "pointer", padding: 0, flexShrink: 0,
                        transition: "transform 0.15s",
                        transform: form.color === c.value ? "scale(1.15)" : "scale(1)",
                      }}
                    />
                  ))}
                </Row>
              </Field>
            </div>
          </div>

          <Actions
            saving={saving}
            isEdit={isEdit}
            accent={theme.primary}
            submitLabel={isEdit ? "Update Activity" : "Create Activity"}
            onCancel={onClose}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </Portal>
  )
}
