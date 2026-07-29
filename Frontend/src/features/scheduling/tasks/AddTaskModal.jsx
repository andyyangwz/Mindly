import { useState, useEffect, useRef, useCallback } from "react"
import { motion } from "framer-motion"
import { useTranslation } from "react-i18next"
import { X, Target } from "lucide-react"
import { Portal } from "../../../utils/portal"
import {
  ACTIVITY_COLORS,
  COLOR_NAME_MAP,
  PRIORITY_LABELS,
  toDateStr,
} from "../utils/calendarConstants"
import { Field, In, Pill, Row, Grid, Actions, Error, ErrMsg } from "../modals/ActivityFormFields"
import InteractiveProgressBar from "../components/InteractiveProgressBar"
import { randomTime } from "../../../utils/editor"
import "../../../styles/scheduling/index.css"

const TASK_ACCENT = "#6366F1"
const ANIM_CHAR_MS = 38
const ANIM_SHUFFLE_MS = 90
const ANIM_SHUFFLE_COUNT = 5

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
  progress: 0,
}

export default function AddTaskModal({ open, onClose, onSave, editingActivity, selectedSlot, voiceAutofill, voiceMode, onSaveDraft, hasMoreUndrafted }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(INITIAL_STATE)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [initialProgress, setInitialProgress] = useState(0)
  const titleRef = useRef(null)
  const isEdit = !!editingActivity

  const voiceTargetRef = useRef(null)
  const voicePrevIdRef = useRef(null)
  const voiceTimersRef = useRef([])
  const [animTitle, setAnimTitle] = useState("")
  const [animDescription, setAnimDescription] = useState("")
  const [animStartDate, setAnimStartDate] = useState("")
  const [animStartTime, setAnimStartTime] = useState("")
  const [animDeadlineDate, setAnimDeadlineDate] = useState("")
  const [animDeadlineTime, setAnimDeadlineTime] = useState("")
  const [titleDone, setTitleDone] = useState(true)
  const [descriptionDone, setDescriptionDone] = useState(true)
  const [startDateDone, setStartDateDone] = useState(true)
  const [startTimeDone, setStartTimeDone] = useState(true)
  const [deadlineDateDone, setDeadlineDateDone] = useState(true)
  const [deadlineTimeDone, setDeadlineTimeDone] = useState(true)

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
        startTime: voiceAutofill.start_time || "00:00",
        deadlineDate: voiceAutofill.end_date || "",
        deadlineTime: voiceAutofill.end_time || "23:59",
        color: COLOR_NAME_MAP[voiceAutofill.color?.toLowerCase()] || "#7C3AED",
        priority: "medium",
        productivityLevel: voiceAutofill.productivity_level || null,
      }
      voiceTargetRef.current = target

      setAnimTitle("")
      setAnimDescription("")
      setAnimStartDate("")
      setAnimStartTime("")
      setAnimDeadlineDate("")
      setAnimDeadlineTime("")
      setTitleDone(false)
      setDescriptionDone(false)
      setStartDateDone(false)
      setStartTimeDone(false)
      setDeadlineDateDone(false)
      setDeadlineTimeDone(false)

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
      setAnimDeadlineDate(target.deadlineDate)
      setStartDateDone(true)
      setDeadlineDateDone(true)

      let count = 0
      const id = setInterval(() => {
        count++
        if (count < ANIM_SHUFFLE_COUNT) {
          setAnimStartTime(randomTime())
          setAnimDeadlineTime(randomTime())
        } else {
          setAnimStartTime(target.startTime)
          setAnimDeadlineTime(target.deadlineTime)
          clearInterval(id)
          setStartTimeDone(true)
          setDeadlineTimeDone(true)
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
        setDeadlineDateDone(true)
        setDeadlineTimeDone(true)
      }, 0)
      setTimeout(() => {
        if (editingActivity) {
          const prog = editingActivity.progress ?? 0
          setInitialProgress(prog)
          setForm({
            title: editingActivity.title,
            description: editingActivity.description || "",
            startDate: editingActivity.startDatetime ? editingActivity.startDatetime.slice(0, 10) : "",
            startTime: editingActivity.startTime || (editingActivity.startDatetime ? editingActivity.startDatetime.slice(11, 16) : ""),
            deadlineDate: editingActivity.endDatetime ? editingActivity.endDatetime.slice(0, 10) : "",
            deadlineTime: editingActivity.endTime || (editingActivity.endDatetime ? editingActivity.endDatetime.slice(11, 16) : ""),
            color: editingActivity.color ? (COLOR_NAME_MAP[editingActivity.color.toLowerCase()] || editingActivity.color) : "#7C3AED",
            priority: editingActivity.priority || "medium",
            productivityLevel: editingActivity.productivityLevel || null,
            progress: prog,
          })
        } else if (selectedSlot) {
          setInitialProgress(0)
          setForm({
            ...INITIAL_STATE,
            startDate: toDateStr(selectedSlot.date),
            deadlineDate: toDateStr(selectedSlot.date),
            deadlineTime: "23:59",
          })
        } else {
          setInitialProgress(0)
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

  const safeStartTime = () => form.startTime || "00:00"
  const safeDeadlineTime = () => form.deadlineTime || "23:59"

  const validate = () => {
    const errs = {}
    if (!form.title.trim()) errs.title = t("scheduling.eventForm.validation.titleRequired")
    if (!form.startDate) errs.startDate = t("scheduling.eventForm.validation.required")
    if (!form.deadlineDate) errs.deadlineDate = t("scheduling.eventForm.validation.required")

    if (form.startDate && form.deadlineDate) {
      const start = new Date(`${form.startDate}T${safeStartTime()}`)
      const deadline = new Date(`${form.deadlineDate}T${safeDeadlineTime()}`)
      if (deadline <= start) errs.deadlineTime = "Deadline must be after start"
    }

    if (isEdit) {
      const p = Number(form.progress)
      if (isNaN(p) || p < 0 || p > 100 || !Number.isInteger(p)) {
        errs.progress = "Progress must be a whole number between 0 and 100"
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
        startDatetime: `${form.startDate}T${safeStartTime()}`,
        endDatetime: `${form.deadlineDate}T${safeDeadlineTime()}`,
        color: form.color,
        priority: form.priority,
        productivityLevel: editingActivity?.productivityLevel ?? null,
        status: editingActivity?.status || "To Do",
        hasDeadline: true,
        ...(isEdit ? { progress: Math.round(Number(form.progress) || 0) } : {}),
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
    end_date: form.deadlineDate,
    start_time: form.startTime,
    end_time: form.deadlineTime,
    color: form.color,
    priority: form.priority,
    productivity_level: form.productivityLevel,
    _voiceId: voiceAutofill?._voiceId,
    type: "task",
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
      <motion.div
        className="atm-overlay"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={isEdit ? "Edit Task" : "New Task"}
          onClick={(e) => e.stopPropagation()}
          className="atm-dialog"
          initial={{ opacity: 0, scale: 0.97, y: 4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 4 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <div className="atm-header">
            <div className="atm-header-left">
              <div className="atm-header-icon" style={{ background: `${TASK_ACCENT}18` }}>
                <Target size={18} color={TASK_ACCENT} />
              </div>
              <h2 className="atm-header-title">{isEdit ? "Edit Task" : "New Task"}</h2>
            </div>
            <button type="button" onClick={onClose} className="atm-close-btn">
              <X size={16} />
            </button>
          </div>

          {errors.submit && <Error msg={errors.submit} />}

          {voiceMode && (
            <div key={voiceAutofill?._voiceId || "static"} style={{ animation: "taskFormSlideIn 0.45s cubic-bezier(0.22, 1, 0.36, 1)" }}>
              <div className="atm-form-grid">
                <div>
                  <Field label="Start">
                    <Grid cols="1fr" gap={8}>
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
                  <Field label="Deadline">
                    <Grid cols="1fr" gap={8}>
                      <div>
                        <In
                          type="date"
                          value={!deadlineDateDone ? (animDeadlineDate || form.deadlineDate) : form.deadlineDate}
                          onChange={(e) => set("deadlineDate", e.target.value)}
                          error={errors.deadlineDate}
                          disabled={!deadlineDateDone}
                          style={!deadlineDateDone ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
                        />
                        {errors.deadlineDate && <ErrMsg msg={errors.deadlineDate} />}
                      </div>
                      <div>
                        <In
                          type="time"
                          value={!deadlineTimeDone ? (animDeadlineTime || form.deadlineTime) : form.deadlineTime}
                          onChange={(e) => set("deadlineTime", e.target.value)}
                          error={errors.deadlineTime}
                          disabled={!deadlineTimeDone}
                          style={!deadlineTimeDone ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
                        />
                        {errors.deadlineTime && <ErrMsg msg={errors.deadlineTime} />}
                      </div>
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
                  <Field label="Task Name" error={errors.title}>
                    <In
                      ref={titleRef}
                      value={!titleDone ? animTitle : form.title}
                      onChange={(e) => set("title", e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) handleSubmit() }}
                      placeholder="e.g. Assignment Submission, Project Due"
                      error={errors.title}
                      disabled={!titleDone}
                      style={!titleDone ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
                    />
                  </Field>
                  <Field label="Description">
                    <textarea
                      value={!descriptionDone ? animDescription : form.description}
                      onChange={(e) => set("description", e.target.value)}
                      placeholder="Objectives, requirements, notes..."
                      rows={3}
                      disabled={!descriptionDone}
                      className={`atm-textarea ${!descriptionDone ? "atm-textarea-disabled" : ""}`}
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
                          className="atm-color-btn"
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
            <div className="atm-form-grid">
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
                  className="atm-textarea"
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
                        className="atm-color-btn"
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

          {isEdit && (
            <div className="atm-progress-section">
              <InteractiveProgressBar
                value={Number(form.progress) || 0}
                baselineValue={initialProgress}
                color={form.color}
                onChange={(v) => set("progress", v)}
              />
              {errors.progress && <ErrMsg msg={errors.progress} />}
            </div>
          )}

          {voiceMode ? (
            (() => {
              const anyAnimating = !titleDone || !descriptionDone || !startDateDone || !startTimeDone || !deadlineDateDone || !deadlineTimeDone
              return (
                <div className={`atm-footer ${anyAnimating ? "atm-footer-animating" : "atm-footer-idle"}`}>
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={saving || anyAnimating}
                    className={`atm-btn-cancel ${saving ? "atm-btn-cancel-disabled" : ""}`}
                  >
                    {t("common.cancel")}
                  </button>
                  <div className="atm-btn-right">
                    <button
                      type="button"
                      onClick={handleSaveDraft}
                      disabled={saving}
                      className={`atm-btn-draft ${saving ? "atm-btn-draft-disabled" : ""}`}
                      style={{ border: `1px solid ${TASK_ACCENT}`, color: TASK_ACCENT }}
                    >
                      {hasMoreUndrafted ? "Save Draft & Next" : "Save Draft"}
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={saving}
                      className={`atm-btn-submit ${saving ? "atm-btn-submit-disabled" : ""}`}
                      style={{ background: saving ? "var(--color-muted)" : TASK_ACCENT }}
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
              accent={TASK_ACCENT}
              submitLabel={isEdit ? "Update Task" : "Create Task"}
              onCancel={onClose}
              onSubmit={handleSubmit}
            />
          )}
        </motion.div>
      </motion.div>
    </Portal>
  )
}