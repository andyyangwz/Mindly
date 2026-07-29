import { useMemo, useState, useCallback, useRef, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Plus, ChevronLeft, ChevronRight, Undo, Redo, Waves, Target, Bell, Mic, Lock, Move, RefreshCw, Zap, PanelRightOpen } from "lucide-react"
import InfoButton from "../../../components/tutorial/InfoButton"
import { isSameDay, toDateStr } from "../utils/calendarConstants"
import { useTutorial } from "../../../components/tutorial/TutorialContext"
import "../../../styles/scheduling/index.css"

function setMonthSafe(date, month) {
  const d = new Date(date)
  d.setMonth(month)
  if (d.getMonth() !== month) {
    d.setDate(0)
  }
  return d
}

function MonthPicker({ currentMonth, onSelect, onClose }) {
  const { t } = useTranslation()
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose()
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [onClose])

  const MONTHS = [
    t("common.monthsShort.jan"), t("common.monthsShort.feb"), t("common.monthsShort.mar"),
    t("common.monthsShort.apr"), t("common.monthsShort.may"), t("common.monthsShort.jun"),
    t("common.monthsShort.jul"), t("common.monthsShort.aug"), t("common.monthsShort.sep"),
    t("common.monthsShort.oct"), t("common.monthsShort.nov"), t("common.monthsShort.dec"),
  ]

  return (
    <div ref={ref} className="ch-month-picker">
      {MONTHS.map((m, i) => (
        <button
          key={m}
          onClick={() => onSelect(i)}
          className={`ch-month-option${i === currentMonth ? " ch-month-option-selected" : ""}`}
        >
          {m}
        </button>
      ))}
    </div>
  )
}

export default function CalendarHeader({ currentDate, onDateChange, onUndo, onRedo, canUndo, canRedo, onAddActivity, onAddTask, onAddReminder, onVoice, onQuickAdd, showTutorial = true, interactionMode, onModeChange, onAutoSync, onDrawerToggle, showDrawerToggle = true }) {
  const { t } = useTranslation()
  const { tutorialStep } = useTutorial()
  const [showMonthPicker, setShowMonthPicker] = useState(false)
  const forcedMenuOpen = tutorialStep === 1 || tutorialStep === 2 || tutorialStep === 3
  const [showCreateMenu, setShowCreateMenu] = useState(false)
  const monthRef = useRef(null)
  const createBtnRef = useRef(null)
  const [syncing, setSyncing] = useState(false)
  const [showModeTip, setShowModeTip] = useState(false)

  const handleSync = useCallback(async () => {
    if (syncing || !onAutoSync) return
    setSyncing(true)
    try {
      await onAutoSync()
    } catch {
      // ignore
    } finally {
      setSyncing(false)
    }
  }, [syncing, onAutoSync])

  useEffect(() => {
    if (!showCreateMenu) return
    const handler = (e) => {
      if (createBtnRef.current && !createBtnRef.current.contains(e.target)) {
        setShowCreateMenu(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [showCreateMenu])

  const weekDays = useMemo(() => getWeekDays(currentDate), [toDateStr(currentDate)])
  const today = new Date()

  const monthIndex = currentDate.getMonth()
  const monthNames = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"]
  const monthName = t(`common.months.${monthNames[monthIndex]}`)

  const goToToday = () => onDateChange(new Date())

  const goBack = () => {
    const day = currentDate.getDay()
    const diff = day === 0 ? -6 : 1 - day
    const monday = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + diff)
    monday.setDate(monday.getDate() - 7)
    monday.setDate(monday.getDate() + 6)
    onDateChange(monday)
  }

  const goForward = () => {
    const day = currentDate.getDay()
    const diff = day === 0 ? -6 : 1 - day
    const monday = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + diff)
    monday.setDate(monday.getDate() + 7)
    onDateChange(monday)
  }

  const handleMonthSelect = useCallback(
    (monthIndex) => {
      onDateChange(setMonthSafe(currentDate, monthIndex))
      setShowMonthPicker(false)
    },
    [currentDate, onDateChange]
  )

  const isToday = isSameDay(currentDate, today)

  const DAY_ABBR = [
    t("common.days.monday"),
    t("common.days.tuesday"),
    t("common.days.wednesday"),
    t("common.days.thursday"),
    t("common.days.friday"),
    t("common.days.saturday"),
    t("common.days.sunday"),
  ]

  return (
    <div data-tutorial-target="scheduling-calendar" className="ch-header">
      <div className="ch-top-row">
        <div className="ch-top-left">
          <button type="button" onClick={goBack} aria-label={t("scheduling.calendar.previousWeek")} className="ch-icon-btn">
            <ChevronLeft size={15} />
          </button>

          <div ref={monthRef} className="ch-relative">
            <button onClick={() => setShowMonthPicker((v) => !v)} className="ch-month-btn">
              {monthName}
            </button>

            {showMonthPicker && (
              <MonthPicker
                currentMonth={currentDate.getMonth()}
                onSelect={handleMonthSelect}
                onClose={() => setShowMonthPicker(false)}
              />
            )}
          </div>

          <button type="button" onClick={goForward} aria-label={t("scheduling.calendar.nextWeek")} className="ch-icon-btn">
            <ChevronRight size={15} />
          </button>

          {showTutorial && <InfoButton tutorialId="scheduling-calendar" />}
        </div>

        <div className="ch-top-right">
          <div data-tutorial-target="undo-redo" className="ch-flex-row">
            <button type="button" onClick={onUndo} disabled={!canUndo()} aria-label={t("scheduling.calendar.undo")} className="ch-icon-btn">
              <Undo size={15} />
            </button>
            <button type="button" onClick={onRedo} disabled={!canRedo()} aria-label={t("scheduling.calendar.redo")} className="ch-icon-btn">
              <Redo size={15} />
            </button>
          </div>

          <div className="ch-separator" />

          <div className="ch-relative"
            onMouseEnter={() => setShowModeTip(true)}
            onMouseLeave={() => setShowModeTip(false)}
          >
            <button
              type="button"
              data-tutorial-target="mode-toggle"
              onClick={() => onModeChange(interactionMode === "fixed" ? "reschedule" : "fixed")}
              title={interactionMode === "fixed" ? t("scheduling.calendar.switchToReschedule") : t("scheduling.calendar.switchToFixed")}
              className={`ch-mode-btn ${interactionMode === "reschedule" ? "ch-mode-btn-reschedule" : "ch-mode-btn-fixed"}`}
            >
              {interactionMode === "fixed" ? <Lock size={12} /> : <Move size={12} />}
              {interactionMode === "fixed" ? t("scheduling.calendar.fixed") : t("scheduling.calendar.reschedule")}
            </button>
            {showModeTip && <div className="ch-tooltip">{t("scheduling.calendar.toggleTooltip")}</div>}
          </div>

          <button
            data-tutorial-target="sync-btn"
            onClick={handleSync}
            disabled={syncing}
            className={`ch-sync-btn${syncing ? " ch-syncing" : ""}`}
          >
            <span className="ch-sync-glow" />
            <RefreshCw size={12} className={`ch-sync-icon${syncing ? " ch-spinning" : ""}`} />
            <span className="ch-sync-label">{syncing ? t("scheduling.calendar.syncing") : t("scheduling.calendar.sync")}</span>
          </button>

          <div className="ch-separator" />

          <button
            type="button"
            onClick={goToToday}
            className={`ch-today-btn ${isToday ? "ch-today-btn-active" : "ch-today-btn-default"}`}
          >
            {t("common.today")}
          </button>

          <div ref={createBtnRef} className="ch-relative">
            <button
              type="button"
              data-tutorial-target="add-activity-btn"
              onClick={() => setShowCreateMenu((v) => !v)}
              aria-label={t("scheduling.event.addActivity")}
              className="ch-add-btn"
            >
              <Plus size={14} />
              {t("scheduling.calendar.add")}
            </button>

            {(showCreateMenu || forcedMenuOpen) && (
              <div data-tutorial-target="add-menu-options" className="ch-create-menu">
                <button onClick={() => { setShowCreateMenu(false); onAddActivity?.() }} className="ch-menu-item">
                  <span className="ch-menu-icon-box ch-menu-icon-green">
                    <Waves size={14} color="#10B981" />
                  </span>
                  <div className="ch-menu-item-text">
                    <span className="ch-menu-item-title">{t("scheduling.calendar.addMenu.activity")}</span>
                    <span className="ch-menu-item-desc">{t("scheduling.calendar.addMenu.activityDesc")}</span>
                  </div>
                </button>
                <button onClick={() => { setShowCreateMenu(false); onAddTask?.() }} className="ch-menu-item">
                  <span className="ch-menu-icon-box ch-menu-icon-indigo">
                    <Target size={14} color="#6366F1" />
                  </span>
                  <div className="ch-menu-item-text">
                    <span className="ch-menu-item-title">{t("scheduling.calendar.addMenu.task")}</span>
                    <span className="ch-menu-item-desc">{t("scheduling.calendar.addMenu.taskDesc")}</span>
                  </div>
                </button>
                <button onClick={() => { setShowCreateMenu(false); onAddReminder?.() }} className="ch-menu-item">
                  <span className="ch-menu-icon-box ch-menu-icon-amber">
                    <Bell size={14} color="#F59E0B" />
                  </span>
                  <div className="ch-menu-item-text">
                    <span className="ch-menu-item-title">Reminder</span>
                    <span className="ch-menu-item-desc">Set a reminder</span>
                  </div>
                </button>
                <div className="ch-menu-separator" />
                <button data-tutorial-target="voice-option" onClick={() => { setShowCreateMenu(false); onVoice?.() }} className="ch-menu-item">
                  <span className="ch-menu-icon-box ch-menu-icon-purple">
                    <Mic size={14} color="#7C3AED" />
                  </span>
                  <div className="ch-menu-item-text">
                    <span className="ch-menu-item-title">{t("scheduling.calendar.addMenu.useVoice")}</span>
                    <span className="ch-menu-item-desc">{t("scheduling.calendar.addMenu.voiceDesc")}</span>
                  </div>
                </button>
                <div className="ch-menu-separator" />
                <button onClick={() => { setShowCreateMenu(false); onQuickAdd?.() }} className="ch-menu-item">
                  <span className="ch-menu-icon-box ch-menu-icon-amber">
                    <Zap size={14} color="#F59E0B" />
                  </span>
                  <div className="ch-menu-item-text">
                    <span className="ch-menu-item-title">{t("scheduling.calendar.addMenu.quickAdd")}</span>
                    <span className="ch-menu-item-desc">{t("scheduling.calendar.addMenu.quickAddDesc")}</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          {showDrawerToggle && (
            <button type="button" onClick={onDrawerToggle} aria-label="Open side panel" className="ch-icon-btn">
              <PanelRightOpen size={15} />
            </button>
          )}
        </div>
      </div>

      <div className="ch-day-grid">
        {weekDays.map((day, i) => {
          const active = isSameDay(day, currentDate)
          const dayIsToday = isSameDay(day, today)
          const isActiveMonth = day.getMonth() === currentDate.getMonth()
          return (
            <button
              key={toDateStr(day)}
              type="button"
              onClick={() => onDateChange(day)}
              className={`ch-day-btn ${active ? "ch-day-btn-active" : ""} ${!isActiveMonth ? "ch-day-btn-inactive-month" : ""}`}
            >
              <span className="ch-day-name" style={{
                color: active ? "var(--color-primary)" : dayIsToday ? "var(--color-dark)" : "var(--color-muted)",
              }}>
                {DAY_ABBR[i]}
              </span>
              <span className="ch-day-num" style={{
                color: active ? "white" : dayIsToday ? "var(--color-primary)" : isActiveMonth ? "var(--color-dark)" : "var(--color-muted)",
                background: active ? "var(--color-primary)" : dayIsToday ? "color-mix(in srgb, var(--color-primary) 12%, transparent)" : "transparent",
              }}>
                {day.getDate()}
              </span>
            </button>
          )
        })}
      </div>

    </div>
  )
}

function getWeekDays(date) {
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  return Array.from({ length: 7 }, (_, i) => {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + diff + i)
  })
}
