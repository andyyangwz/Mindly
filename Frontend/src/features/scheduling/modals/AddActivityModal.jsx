import { useState, useEffect, useRef, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { X, Waves } from "lucide-react"
import { Portal } from "../../../utils/portal"
import {
  ACTIVITY_COLORS,
  COLOR_NAME_MAP,
  PRIORITY_LABELS,
  PRODUCTIVITY_LEVELS,
  PRODUCTIVITY_LEVEL_COLORS,
  toDateStr,
} from "../utils/calendarConstants"
import { Field, In, Pill, Row, Grid, Actions, Error } from "./ActivityFormFields"
import { randomTime } from "../../../utils/editor"
import "../../../styles/scheduling/index.css"

const ACTIVITY_ACCENT = "#10B981"
const ANIM_CHAR_MS = 38
const ANIM_SHUFFLE_MS = 90
const ANIM_SHUFFLE_COUNT = 5

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

export default function AddActivityModal({ open, onClose, onSave, editingActivity, selectedSlot, voiceAutofill, voiceMode, onSaveDraft, hasMoreUndrafted }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(INITIAL_STATE)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const titleRef = useRef(null)
  const isEdit = !!editingActivity

  const voiceTargetRef = useRef(null)
  const voicePrevIdRef = useRef(null)
  const voiceTimersRef = useRef([])
  const [animTitle, setAnimTitle] = useState("")
  const [animDescription, setAnimDescription] = useState("")
  const [animStartDate, setAnimStartDate] = useState("")
  const [animStartTime, setAnimStartTime] = useState("")
  const [animEndDate, setAnimEndDate] = useState("")
  const [animEndTime, setAnimEndTime] = useState("")
  const [titleDone, setTitleDone] = useState(true)
  const [descriptionDone, setDescriptionDone] = useState(true)
  const [startDateDone, setStartDateDone] = useState(true)
  const [startTimeDone, setStartTimeDone] = useState(true)
  const [endDateDone, setEndDateDone] = useState(true)
  const [endTimeDone, setEndTimeDone] = useState(true)

  const clearVoiceTimers = useCallback(() => {
    voiceTimersRef.current.forEach(clearTimeout)
    voiceTimersRef.current = []
  }, [])

  useEffect(() => clearVoiceTimers, [clearVoiceTimers])

  useEffect(() => {
    if (!open) {
      voicePrevIdRef.current = null
      clearVoiceTimers()
      return
    }

    if (voiceAutofill && voiceAutofill._voiceId !== voicePrevIdRef.current) {
      voicePrevIdRef.current = voiceAutofill._voiceId
      clearVoiceTimers()

      const target = {
        title: voiceAutofill.title || "",
        description: voiceAutofill.description || "",
        startDate: voiceAutofill.start_date || "",
        endDate: voiceAutofill.end_date || voiceAutofill.start_date || "",
        startTime: voiceAutofill.start_time || "",
        endTime: voiceAutofill.end_time || "",
        color: COLOR_NAME_MAP[voiceAutofill.color?.toLowerCase()] || "#7C3AED",
        priority: "medium",
        productivityLevel: voiceAutofill.productivity_level || "neutral",
      }
      voiceTargetRef.current = target

      setAnimTitle("")
      setAnimDescription("")
      setAnimStartDate("")
      setAnimStartTime("")
      setAnimEndDate("")
      setAnimEndTime("")
      setTitleDone(false)
      setDescriptionDone(false)
      setStartDateDone(false)
      setStartTimeDone(false)
      setEndDateDone(false)
      setEndTimeDone(false)

      const title = target.title
      const desc = target.description

      if (!title) {
        setTimeout(() => setTitleDone(true), 0)
      } else {
        let i = 0
        const id = setInterval(() => {
          i++
          setAnimTitle(title.slice(0, i))
          if (i >= title.length) {
            clearInterval(id)
            setTitleDone(true)
          }
        }, ANIM_CHAR_MS)
        voiceTimersRef.current.push(id)
      }

      if (!desc) {
        setTimeout(() => setDescriptionDone(true), 0)
      } else {
        let i = 0
        const id = setInterval(() => {
          i++
          setAnimDescription(desc.slice(0, i))
          if (i >= desc.length) {
            clearInterval(id)
            setDescriptionDone(true)
          }
        }, ANIM_CHAR_MS)
        voiceTimersRef.current.push(id)
      }

      setAnimStartDate(target.startDate)
      setAnimEndDate(target.endDate)
      setStartDateDone(true)
      setEndDateDone(true)

      let count = 0
      const id = setInterval(() => {
        count++
        if (count < ANIM_SHUFFLE_COUNT) {
          setAnimStartTime(randomTime())
          setAnimEndTime(randomTime())
        } else {
          setAnimStartTime(target.startTime)
          setAnimEndTime(target.endTime)
          clearInterval(id)
          setStartTimeDone(true)
          setEndTimeDone(true)
          setForm(target)
        }
      }, ANIM_SHUFFLE_MS)
      voiceTimersRef.current.push(id)
    } else if (!voiceAutofill) {
      voicePrevIdRef.current = null
      setTimeout(() => {
        setTitleDone(true)
        setDescriptionDone(true)
        setStartDateDone(true)
        setStartTimeDone(true)
        setEndDateDone(true)
        setEndTimeDone(true)
      }, 0)
      setTimeout(() => {
        if (editingActivity) {
          const sd = editingActivity.startDate || (editingActivity.startDatetime ? editingActivity.startDatetime.slice(0, 10) : "")
          const ed = editingActivity.endDate || (editingActivity.endDatetime ? editingActivity.endDatetime.slice(0, 10) : sd)
          setForm({
            title: editingActivity.title,
            description: editingActivity.description || "",
            startDate: sd,
            endDate: ed,
            startTime: editingActivity.startTime || (editingActivity.startDatetime ? editingActivity.startDatetime.slice(11, 16) : ""),
            endTime: editingActivity.endTime || (editingActivity.endDatetime ? editingActivity.endDatetime.slice(11, 16) : ""),
            color: editingActivity.color ? (COLOR_NAME_MAP[editingActivity.color.toLowerCase()] || editingActivity.color) : "#7C3AED",
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
      }, 0)
    } else {
      setTimeout(() => {
        setErrors({})
        setSaving(false)
      }, 0)
    }
  }, [open, editingActivity, selectedSlot, voiceAutofill, clearVoiceTimers])

  useEffect(() => {
    if (open && titleRef.current) {
      setTimeout(() => titleRef.current?.focus(), 100)
    }
  }, [open])

  const validate = () => {
    const errs = {}
    if (!form.title.trim()) errs.title = t("scheduling.eventForm.validation.titleRequired")
    if (!form.startDate) errs.startDate = t("scheduling.eventForm.validation.required")
    if (!form.endDate) errs.endDate = t("scheduling.eventForm.validation.required")
    if (!form.startTime) errs.startTime = t("scheduling.eventForm.validation.required")
    if (!form.endTime) errs.endTime = t("scheduling.eventForm.validation.required")
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
        color: form.color,
        priority: form.priority,
        productivityLevel: form.productivityLevel,
        status: editingActivity?.status || "To Do",
        hasDeadline: false,
      })
      onClose()
    } catch (err) {
      setErrors({ submit: err.message })
    } finally {
      setSaving(false)
    }
  }

  const toDraftData = () => ({
    title: form.title,
    description: form.description,
    start_date: form.startDate,
    end_date: form.endDate,
    start_time: form.startTime,
    end_time: form.endTime,
    color: form.color,
    priority: form.priority,
    productivity_level: form.productivityLevel,
    _voiceId: voiceAutofill?._voiceId,
    type: "activity",
  })

  const handleSaveDraft = () => {
    onSaveDraft?.(toDraftData())
  }

  const set = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => ({ ...e, [field]: null }))
  }

  if (!open) return null

  return (
    <Portal>
      <div className="aam-overlay" onClick={onClose}>
        <div
          role="dialog"
          aria-modal="true"
          aria-label={isEdit ? "Edit Activity" : "New Activity"}
          onClick={(e) => e.stopPropagation()}
          className="aam-dialog"
        >
          <div className="aam-header">
            <div className="aam-header-left">
              <div className="aam-header-icon" style={{ background: `${ACTIVITY_ACCENT}18` }}>
                <Waves size={18} color={ACTIVITY_ACCENT} />
              </div>
              <h2 className="aam-header-title">{isEdit ? "Edit Activity" : "New Activity"}</h2>
            </div>
            <button type="button" onClick={onClose} className="aam-close-btn">
              <X size={16} />
            </button>
          </div>

          {errors.submit && <Error msg={errors.submit} />}

          {voiceMode && (
            <div key={voiceAutofill?._voiceId || "static"} style={{ animation: "actFormSlideIn 0.45s cubic-bezier(0.22, 1, 0.36, 1)" }}>
              <div className="aam-form-grid">
                <div>
                  <Field label="Start">
                    <Grid cols="1fr 1fr" gap={8}>
                      <In
                        type="date"
                        value={!startDateDone ? (animStartDate || form.startDate) : form.startDate}
                        onChange={(e) => set("startDate", e.target.value)}
                        error={errors.startDate}
                        disabled={!startDateDone}
                        style={!startDateDone ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
                      />
                      <In
                        type="time"
                        value={!startTimeDone ? (animStartTime || form.startTime) : form.startTime}
                        onChange={(e) => set("startTime", e.target.value)}
                        error={errors.startTime}
                        disabled={!startTimeDone}
                        style={!startTimeDone ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
                      />
                    </Grid>
                  </Field>
                  <Field label="End">
                    <Grid cols="1fr 1fr" gap={8}>
                      <In
                        type="date"
                        value={!endDateDone ? (animEndDate || form.endDate) : form.endDate}
                        onChange={(e) => set("endDate", e.target.value)}
                        error={errors.endDate}
                        disabled={!endDateDone}
                        style={!endDateDone ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
                      />
                      <In
                        type="time"
                        value={!endTimeDone ? (animEndTime || form.endTime) : form.endTime}
                        onChange={(e) => set("endTime", e.target.value)}
                        error={errors.endTime}
                        disabled={!endTimeDone}
                        style={!endTimeDone ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
                      />
                    </Grid>
                  </Field>
                  <Field label="Priority">
                    <Row gap={6} wrap>
                      {Object.entries(PRIORITY_LABELS).map(([key]) => (
                        <Pill
                          key={key}
                          active={form.priority === key}
                          accent="var(--color-primary)"
                          onClick={() => set("priority", key)}
                          compact
                        >
                          {t(`scheduling.eventForm.priority_${key}`)}
                        </Pill>
                      ))}
                    </Row>
                  </Field>
                </div>
                <div>
                  <Field label="Title" error={errors.title}>
                    <In
                      ref={titleRef}
                      value={!titleDone ? animTitle : form.title}
                      onChange={(e) => set("title", e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) handleSubmit() }}
                      placeholder="e.g. Gym Session, Deep Work"
                      error={errors.title}
                      disabled={!titleDone}
                      style={!titleDone ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
                    />
                  </Field>
                  <Field label="Description">
                    <textarea
                      value={!descriptionDone ? animDescription : form.description}
                      onChange={(e) => set("description", e.target.value)}
                      placeholder="Optional notes..."
                      rows={3}
                      disabled={!descriptionDone}
                      className={`aam-textarea ${!descriptionDone ? "aam-textarea-disabled" : ""}`}
                    />
                  </Field>
                  <Field label="Productivity Level">
                    <Row gap={6} wrap>
                      {Object.entries(PRODUCTIVITY_LEVELS).map(([key]) => {
                        const dotColor = PRODUCTIVITY_LEVEL_COLORS[key]
                        const active = form.productivityLevel === key
                        return (
                          <Pill key={key} active={active} accent={dotColor} onClick={() => set("productivityLevel", key)}>
                            <span style={{ width: 7, height: 7, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
                            {t(`scheduling.eventForm.level_${key}`)}
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
                          className="aam-color-btn"
                          style={{
                            background: c.value,
                            border: form.color === c.value ? "2px solid white" : "2px solid transparent",
                            outline: form.color === c.value ? `2px solid ${c.value}` : "none",
                            transform: form.color === c.value ? "scale(1.15)" : "scale(1)",
                          }}
                        />
                      ))}
                    </Row>
                  </Field>
                </div>
              </div>
            </div>
          )}

          {!voiceMode && (
            <div className="aam-form-grid">
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
                    {Object.entries(PRIORITY_LABELS).map(([key]) => (
                      <Pill
                        key={key}
                        active={form.priority === key}
                        accent="var(--color-primary)"
                        onClick={() => set("priority", key)}
                        compact
                      >
                        {t(`scheduling.eventForm.priority_${key}`)}
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
                    className="aam-textarea"
                  />
                </Field>
                <Field label="Productivity Level">
                  <Row gap={6} wrap>
                    {Object.entries(PRODUCTIVITY_LEVELS).map(([key]) => {
                      const dotColor = PRODUCTIVITY_LEVEL_COLORS[key]
                      const active = form.productivityLevel === key
                      return (
                        <Pill key={key} active={active} accent={dotColor} onClick={() => set("productivityLevel", key)}>
                          <span style={{ width: 7, height: 7, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
                          {t(`scheduling.eventForm.level_${key}`)}
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
                        className="aam-color-btn"
                        style={{
                          background: c.value,
                          border: form.color === c.value ? "2px solid white" : "2px solid transparent",
                          outline: form.color === c.value ? `2px solid ${c.value}` : "none",
                          transform: form.color === c.value ? "scale(1.15)" : "scale(1)",
                        }}
                      />
                    ))}
                  </Row>
                </Field>
              </div>
            </div>
          )}

          {voiceMode ? (
            (() => {
              const anyAnimating = !titleDone || !descriptionDone || !startDateDone || !startTimeDone || !endDateDone || !endTimeDone
              return (
                <div className={`aam-footer ${anyAnimating ? "aam-footer-animating" : "aam-footer-idle"}`}>
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={saving || anyAnimating}
                    className={`aam-btn-cancel ${saving ? "aam-btn-cancel-disabled" : ""}`}
                  >
                    {t("common.cancel")}
                  </button>
                  <div className="aam-btn-right">
                    <button
                      type="button"
                      onClick={handleSaveDraft}
                      disabled={saving}
                      className={`aam-btn-draft ${saving ? "aam-btn-draft-disabled" : ""}`}
                      style={{ border: `1px solid ${ACTIVITY_ACCENT}`, color: ACTIVITY_ACCENT }}
                    >
                      {hasMoreUndrafted ? "Save Draft & Next" : "Save Draft"}
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={saving}
                      className={`aam-btn-submit ${saving ? "aam-btn-submit-disabled" : ""}`}
                      style={{ background: saving ? "var(--color-muted)" : ACTIVITY_ACCENT }}
                    >
                      {saving ? t("common.saving") : "Create Now"}
                    </button>
                  </div>
                </div>
              )
            })()
          ) : (
            <Actions
              saving={saving}
              isEdit={isEdit}
              accent="var(--color-primary)"
              submitLabel={isEdit ? "Update Activity" : "Create Activity"}
              onCancel={onClose}
              onSubmit={handleSubmit}
            />
          )}
        </div>
      </div>
    </Portal>
  )
}