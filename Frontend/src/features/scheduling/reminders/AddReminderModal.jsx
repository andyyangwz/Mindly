import { useState, useEffect, useRef, useCallback } from "react"
import { motion } from "framer-motion"
import { useTranslation } from "react-i18next"
import { X, Bell } from "lucide-react"
import { Portal } from "../../../utils/portal"
import { ACTIVITY_COLORS, COLOR_NAME_MAP, PRIORITY_LABELS, toDateStr } from "../utils/calendarConstants"
import { Field, In, Pill, Row, Actions, Error } from "../modals/ActivityFormFields"
import { randomTime } from "../../../utils/editor"
import "../../../styles/scheduling/index.css"

const REMINDER_ACCENT = "#F59E0B"
const ANIM_CHAR_MS = 38
const ANIM_SHUFFLE_MS = 90
const ANIM_SHUFFLE_COUNT = 5

const INITIAL_STATE = {
  title: "",
  description: "",
  date: "",
  time: "09:00",
  color: "#7C3AED",
  priority: "medium",
}

export default function AddReminderModal({ open, onClose, onSave, editingReminder, selectedSlot, voiceAutofill, voiceMode }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(INITIAL_STATE)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const titleRef = useRef(null)
  const isEdit = !!editingReminder

  const voiceTargetRef = useRef(null)
  const voicePrevIdRef = useRef(null)
  const voiceTimersRef = useRef([])
  const [animTitle, setAnimTitle] = useState("")
  const [animDescription, setAnimDescription] = useState("")
  const [animDate, setAnimDate] = useState("")
  const [animTime, setAnimTime] = useState("")
  const [titleDone, setTitleDone] = useState(true)
  const [descriptionDone, setDescriptionDone] = useState(true)
  const [dateDone, setDateDone] = useState(true)
  const [timeDone, setTimeDone] = useState(true)

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

      const dt = voiceAutofill.datetime || ""
      const target = {
        title: voiceAutofill.title || "",
        description: voiceAutofill.description || "",
        date: dt ? dt.slice(0, 10) : (voiceAutofill.start_date || ""),
        time: dt ? dt.slice(11, 16) : (voiceAutofill.start_time || "09:00"),
        color: COLOR_NAME_MAP[voiceAutofill.color?.toLowerCase()] || "#7C3AED",
        priority: voiceAutofill.priority || "medium",
      }
      voiceTargetRef.current = target

      setAnimTitle("")
      setAnimDescription("")
      setAnimDate("")
      setAnimTime("")
      setTitleDone(false)
      setDescriptionDone(false)
      setDateDone(false)
      setTimeDone(false)

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

      setAnimDate(target.date)
      setDateDone(true)

      let count = 0
      const id = setInterval(() => {
        count++
        if (count < ANIM_SHUFFLE_COUNT) {
          setAnimTime(randomTime())
        } else {
          setAnimTime(target.time)
          clearInterval(id)
          setTimeDone(true)
          setForm(target)
        }
      }, ANIM_SHUFFLE_MS)
      voiceTimersRef.current.push(id)
    } else if (!voiceAutofill) {
      voicePrevIdRef.current = null
      setTimeout(() => {
        setTitleDone(true)
        setDescriptionDone(true)
        setDateDone(true)
        setTimeDone(true)
      }, 0)
      setTimeout(() => {
        if (editingReminder) {
          setForm({
            title: editingReminder.title,
            description: editingReminder.description || "",
            date: editingReminder.date || (editingReminder.datetime ? editingReminder.datetime.slice(0, 10) : ""),
            time: editingReminder.time || (editingReminder.datetime ? editingReminder.datetime.slice(11, 16) : "09:00"),
            color: editingReminder.color ? (COLOR_NAME_MAP[editingReminder.color.toLowerCase()] || editingReminder.color) : "#7C3AED",
            priority: editingReminder.priority || "medium",
          })
        } else if (selectedSlot) {
          setForm({
            ...INITIAL_STATE,
            date: toDateStr(selectedSlot.date),
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
  }, [open, editingReminder, selectedSlot, voiceAutofill, clearVoiceTimers])

  useEffect(() => {
    if (open && titleRef.current) {
      setTimeout(() => titleRef.current?.focus(), 100)
    }
  }, [open])

  const validate = () => {
    const errs = {}
    if (!form.title.trim()) errs.title = "Title is required"
    if (!form.date) errs.date = "Date is required"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const datetime = form.date && form.time ? `${form.date}T${form.time}` : form.date ? `${form.date}T09:00` : undefined
      await onSave({
        title: form.title.trim(),
        description: form.description.trim(),
        datetime,
        color: form.color,
        priority: form.priority,
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
      <motion.div
        className="arm-overlay"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={isEdit ? "Edit Reminder" : "New Reminder"}
          onClick={(e) => e.stopPropagation()}
          className="arm-dialog"
          initial={{ opacity: 0, scale: 0.97, y: 4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 4 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <div className="arm-header">
            <div className="arm-header-left">
              <div className="arm-header-icon" style={{ background: `${REMINDER_ACCENT}18` }}>
                <Bell size={18} color={REMINDER_ACCENT} />
              </div>
              <h2 className="arm-header-title">{isEdit ? "Edit Reminder" : "New Reminder"}</h2>
            </div>
            <button type="button" onClick={onClose} className="arm-close-btn">
              <X size={16} />
            </button>
          </div>

          {errors.submit && <Error msg={errors.submit} />}

          {voiceMode ? (
            <div key={voiceAutofill?._voiceId || "static"} style={{ animation: "reminderFormSlideIn 0.45s cubic-bezier(0.22, 1, 0.36, 1)" }}>
              <Field label="Title" error={errors.title}>
                <In
                  ref={titleRef}
                  value={!titleDone ? animTitle : form.title}
                  onChange={(e) => set("title", e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) handleSubmit() }}
                  placeholder="e.g. Team Meeting, Doctor Appointment"
                  error={errors.title}
                  disabled={!titleDone}
                  style={!titleDone ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
                />
              </Field>
              <Field label="Description">
                <textarea
                  value={!descriptionDone ? animDescription : form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Notes, details..."
                  rows={3}
                  disabled={!descriptionDone}
                  className={`arm-textarea ${!descriptionDone ? "arm-textarea-disabled" : ""}`}
                />
              </Field>
              <Field label="Date & Time" error={errors.date}>
                <div className="arm-date-grid">
                  <In
                    type="date"
                    value={!dateDone ? (animDate || form.date) : form.date}
                    onChange={(e) => set("date", e.target.value)}
                    error={errors.date}
                    disabled={!dateDone}
                    style={!dateDone ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
                  />
                  <In
                    type="time"
                    value={!timeDone ? (animTime || form.time) : form.time}
                    onChange={(e) => set("time", e.target.value)}
                    disabled={!timeDone}
                    style={!timeDone ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
                  />
                </div>
              </Field>
              <Field label="Priority">
                <Row gap={6} wrap>
                  {Object.entries(PRIORITY_LABELS).map(([key]) => (
                    <Pill
                      key={key}
                      active={form.priority === key}
                      accent={REMINDER_ACCENT}
                      onClick={() => set("priority", key)}
                      compact
                    >
                      {t(`scheduling.eventForm.priority_${key}`)}
                    </Pill>
                  ))}
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
                      className="arm-color-btn"
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
          ) : (
            <>
              <Field label="Title" error={errors.title}>
                <In
                  ref={titleRef}
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) handleSubmit() }}
                  placeholder="e.g. Team Meeting, Doctor Appointment"
                  error={errors.title}
                />
              </Field>
              <Field label="Description">
                <textarea
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Notes, details..."
                  rows={3}
                  className="arm-textarea"
                />
              </Field>
              <Field label="Date & Time" error={errors.date}>
                <div className="arm-date-grid">
                  <In
                    type="date"
                    value={form.date}
                    onChange={(e) => set("date", e.target.value)}
                    error={errors.date}
                  />
                  <In
                    type="time"
                    value={form.time}
                    onChange={(e) => set("time", e.target.value)}
                  />
                </div>
              </Field>
              <Field label="Priority">
                <Row gap={6} wrap>
                  {Object.entries(PRIORITY_LABELS).map(([key]) => (
                    <Pill
                      key={key}
                      active={form.priority === key}
                      accent={REMINDER_ACCENT}
                      onClick={() => set("priority", key)}
                      compact
                    >
                      {t(`scheduling.eventForm.priority_${key}`)}
                    </Pill>
                  ))}
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
                      className="arm-color-btn"
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
            </>
          )}

          <Actions
            saving={saving}
            isEdit={isEdit}
            accent={REMINDER_ACCENT}
            submitLabel={isEdit ? "Update Reminder" : "Create Reminder"}
            onCancel={onClose}
            onSubmit={handleSubmit}
          />
        </motion.div>
      </motion.div>
    </Portal>
  )
}