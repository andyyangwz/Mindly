import { useState, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { X, Target } from "lucide-react"
import { theme } from "../../../theme"
import { Portal } from "../../../utils/portal"
import {
  ACTIVITY_COLORS,
  COLOR_NAME_MAP,
  PRIORITY_LABELS,
  toDateStr,
} from "../utils/calendarConstants"
import { Field, In, Pill, Row, Grid, Actions, Error, ErrMsg } from "../modals/ActivityFormFields"

const TASK_ACCENT = "#6366F1"

const INITIAL_STATE = {
  title: "",
  description: "",
  startDate: "",
  startTime: "00:00",
  deadlineDate: "",
  deadlineTime: "23:59",
  color: "#7C3AED",
  priority: "medium",
  productivityLevel: null,
}

export default function AddTaskModal({ open, onClose, onSave, editingActivity, selectedSlot, voiceAutofill }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(INITIAL_STATE)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const titleRef = useRef(null)
  const isEdit = !!editingActivity

  useEffect(() => {
    if (!open) return
    if (voiceAutofill) {
      setForm({
        title: voiceAutofill.title || "",
        description: voiceAutofill.description || "",
        startDate: voiceAutofill.start_date || "",
        startTime: voiceAutofill.start_time || "00:00",
        deadlineDate: voiceAutofill.end_date || "",
        deadlineTime: voiceAutofill.end_time || "23:59",
        color: COLOR_NAME_MAP[voiceAutofill.color?.toLowerCase()] || "#7C3AED",
        priority: "medium",
        productivityLevel: voiceAutofill.productivity_level || null,
      })
    } else if (editingActivity) {
      setForm({
        title: editingActivity.title,
        description: editingActivity.description || "",
        startDate: editingActivity.startDatetime ? editingActivity.startDatetime.slice(0, 10) : "",
        startTime: editingActivity.startTime || (editingActivity.startDatetime ? editingActivity.startDatetime.slice(11, 16) : ""),
        deadlineDate: editingActivity.endDatetime ? editingActivity.endDatetime.slice(0, 10) : "",
        deadlineTime: editingActivity.endTime || (editingActivity.endDatetime ? editingActivity.endDatetime.slice(11, 16) : ""),
        color: editingActivity.color || "#7C3AED",
        priority: editingActivity.priority || "medium",
        productivityLevel: editingActivity.productivityLevel || null,
      })
    } else if (selectedSlot) {
      const now = new Date()
      const hh = String(now.getHours()).padStart(2, "0")
      const mm = String(now.getMinutes()).padStart(2, "0")
      const currentTime = `${hh}:${mm}`
      setForm({
        ...INITIAL_STATE,
        startDate: toDateStr(selectedSlot.date),
        startTime: selectedSlot.startTime || currentTime,
        deadlineDate: toDateStr(selectedSlot.date),
        deadlineTime: "23:59",
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

  const safeStartTime = () => form.startTime || "00:00"
  const safeDeadlineTime = () => form.deadlineTime || "23:59"

  const validate = () => {
    const errs = {}
    if (!form.title.trim()) errs.title = t("productivity.eventForm.validation.titleRequired")
    if (!form.startDate) errs.startDate = t("productivity.eventForm.validation.required")
    if (!form.deadlineDate) errs.deadlineDate = t("productivity.eventForm.validation.required")

    if (form.startDate && form.deadlineDate) {
      const start = new Date(`${form.startDate}T${safeStartTime()}`)
      const deadline = new Date(`${form.deadlineDate}T${safeDeadlineTime()}`)
      if (deadline <= start) errs.deadlineTime = "Deadline must be after start"
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
        startDatetime: `${form.startDate}T${safeStartTime()}`,
        endDatetime: `${form.deadlineDate}T${safeDeadlineTime()}`,
        color: form.color,
        priority: form.priority,
        productivityLevel: editingActivity?.productivityLevel ?? null,
        status: editingActivity?.status || "To Do",
        hasDeadline: true,
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
          aria-label={isEdit ? "Edit Task" : "New Task"}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "var(--color-card, white)",
            borderRadius: 16,
            padding: "36px 40px",
            maxWidth: 640,
            width: "100%",
            boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
            zIndex: theme.z.modal,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: `${TASK_ACCENT}18`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <Target size={18} color={TASK_ACCENT} />
              </div>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: theme.dark, margin: 0 }}>
                {isEdit ? "Edit Task" : "New Task"}
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
                <Grid cols="1fr" gap={8}>
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
              <Field label="Deadline">
                <Grid cols="1fr" gap={8}>
                  <div>
                    <In
                      type="date"
                      value={form.deadlineDate}
                      onChange={(e) => set("deadlineDate", e.target.value)}
                      error={errors.deadlineDate}
                    />
                    {errors.deadlineDate && <ErrMsg msg={errors.deadlineDate} />}
                  </div>
                  <div>
                    <In
                      type="time"
                      value={form.deadlineTime}
                      onChange={(e) => set("deadlineTime", e.target.value)}
                      error={errors.deadlineTime}
                    />
                    {errors.deadlineTime && <ErrMsg msg={errors.deadlineTime} />}
                  </div>
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
              <Field label="Task Name" error={errors.title}>
                <In
                  ref={titleRef}
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) handleSubmit() }}
                  placeholder="e.g. Assignment Submission, Project Due"
                  error={errors.title}
                />
              </Field>
              <Field label="Description">
                <textarea
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Objectives, requirements, notes..."
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
            accent={TASK_ACCENT}
            submitLabel={isEdit ? "Update Task" : "Create Task"}
            onCancel={onClose}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </Portal>
  )
}
