import { useMemo, useState, useCallback, useRef, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Plus, ChevronLeft, ChevronRight, Undo, Redo, Waves, Target, Mic } from "lucide-react"
import { theme } from "../../theme"
import InfoButton from "../../components/tutorial/InfoButton"
import { isSameDay, toDateStr } from "./calendarConstants"

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
    <div
      ref={ref}
      style={{
        position: "absolute",
        top: "calc(100% + 6px)",
        left: 0,
        background: "var(--color-card, white)",
        borderRadius: 12,
        border: `1px solid ${theme.border}`,
        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        padding: 8,
        zIndex: 50,
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 2,
        width: 168,
      }}
    >
      {MONTHS.map((m, i) => {
        const isCurrent = i === currentMonth
        return (
          <button
            key={m}
            onClick={() => onSelect(i)}
            style={{
              padding: "6px 2px",
              borderRadius: 6,
              border: "none",
              background: isCurrent ? theme.primary : "transparent",
              color: isCurrent ? "white" : theme.dark,
              fontSize: 12,
              fontWeight: isCurrent ? 600 : 500,
              cursor: "pointer",
              transition: "all 0.1s",
            }}
            onMouseEnter={(e) => {
              if (!isCurrent) e.currentTarget.style.background = theme.bg
            }}
            onMouseLeave={(e) => {
              if (!isCurrent) e.currentTarget.style.background = "transparent"
            }}
          >
            {m}
          </button>
        )
      })}
    </div>
  )
}

export default function CalendarHeader({ currentDate, onDateChange, onUndo, onRedo, canUndo, canRedo, onAddActivity, onAddTask, onVoice, showTutorial = true }) {
  const { t } = useTranslation()
  const [showMonthPicker, setShowMonthPicker] = useState(false)
  const [showCreateMenu, setShowCreateMenu] = useState(false)
  const monthRef = useRef(null)
  const createBtnRef = useRef(null)

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
    onDateChange(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 7))
  }

  const goForward = () => {
    onDateChange(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 7))
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
    <div data-tutorial-target="productivity-calendar" style={{ padding: "16px 20px 0 20px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            type="button"
            onClick={goBack}
            aria-label={t("productivity.calendar.previousWeek")}
            style={{
              background: "transparent",
              border: `1px solid ${theme.border}`,
              borderRadius: 8,
              width: 32,
              height: 32,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s",
              color: theme.dark,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = theme.bg
              e.currentTarget.style.borderColor = theme.accent
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent"
              e.currentTarget.style.borderColor = theme.border
            }}
          >
            <ChevronLeft size={15} />
          </button>

          <div ref={monthRef} style={{ position: "relative" }}>
            <button
              onClick={() => setShowMonthPicker((v) => !v)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px 8px",
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 700,
                color: theme.dark,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = theme.bg
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "none"
              }}
            >
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

          <button
            type="button"
            onClick={goForward}
            aria-label={t("productivity.calendar.nextWeek")}
            style={{
              background: "transparent",
              border: `1px solid ${theme.border}`,
              borderRadius: 8,
              width: 32,
              height: 32,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s",
              color: theme.dark,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = theme.bg
              e.currentTarget.style.borderColor = theme.accent
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent"
              e.currentTarget.style.borderColor = theme.border
            }}
          >
            <ChevronRight size={15} />
          </button>

          {showTutorial && <InfoButton tutorialId="productivity-calendar" />}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo()}
            aria-label={t("productivity.calendar.undo")}
            style={{
              background: "transparent",
              border: `1px solid ${theme.border}`,
              borderRadius: 8,
              width: 32,
              height: 32,
              cursor: canUndo() ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s",
              color: canUndo() ? theme.dark : theme.muted,
              opacity: canUndo() ? 1 : 0.4,
            }}
            onMouseEnter={(e) => {
              if (canUndo()) {
                e.currentTarget.style.background = theme.bg
                e.currentTarget.style.borderColor = theme.accent
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent"
              e.currentTarget.style.borderColor = theme.border
            }}
          >
            <Undo size={15} />
          </button>

          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo()}
            aria-label={t("productivity.calendar.redo")}
            style={{
              background: "transparent",
              border: `1px solid ${theme.border}`,
              borderRadius: 8,
              width: 32,
              height: 32,
              cursor: canRedo() ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s",
              color: canRedo() ? theme.dark : theme.muted,
              opacity: canRedo() ? 1 : 0.4,
            }}
            onMouseEnter={(e) => {
              if (canRedo()) {
                e.currentTarget.style.background = theme.bg
                e.currentTarget.style.borderColor = theme.accent
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent"
              e.currentTarget.style.borderColor = theme.border
            }}
          >
            <Redo size={15} />
          </button>

          <div ref={createBtnRef} style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setShowCreateMenu((v) => !v)}
              aria-label={t("productivity.event.addActivity")}
              style={{
                padding: "7px 16px",
                borderRadius: 8,
                border: `1px solid ${theme.primary}`,
                background: theme.primary,
                color: "white",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.15s",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = theme.secondary
                e.currentTarget.style.borderColor = theme.secondary
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = theme.primary
                e.currentTarget.style.borderColor = theme.primary
              }}
            >
              <Plus size={14} />
              {"Add"}
            </button>

            {showCreateMenu && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  right: 0,
                  zIndex: theme.z.dropdown,
                  background: "var(--color-card, white)",
                  borderRadius: 12,
                  border: `1px solid ${theme.border}`,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
                  padding: 4,
                  minWidth: 180,
                  overflow: "hidden",
                }}
              >
                <button
                  onClick={() => { setShowCreateMenu(false); onAddActivity?.() }}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    width: "100%", padding: "10px 12px", border: "none",
                    background: "transparent", borderRadius: 8, cursor: "pointer",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#10B9810C" }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
                >
                  <span style={{
                    width: 26, height: 26, borderRadius: 8,
                    background: "#10B98114",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <Waves size={14} color="#10B981" />
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: theme.dark }}>Activity</span>
                    <span style={{ fontSize: 10, color: theme.muted, fontWeight: 400 }}>Schedule a time block</span>
                  </div>
                </button>
                <button
                  onClick={() => { setShowCreateMenu(false); onAddTask?.() }}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    width: "100%", padding: "10px 12px", border: "none",
                    background: "transparent", borderRadius: 8, cursor: "pointer",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#6366F10C" }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
                >
                  <span style={{
                    width: 26, height: 26, borderRadius: 8,
                    background: "#6366F114",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <Target size={14} color="#6366F1" />
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: theme.dark }}>Task</span>
                    <span style={{ fontSize: 10, color: theme.muted, fontWeight: 400 }}>Create a deadline</span>
                  </div>
                </button>
                <div style={{ height: 1, background: theme.border, margin: "4px 0" }} />
                <button
                  onClick={() => { setShowCreateMenu(false); onVoice?.() }}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    width: "100%", padding: "10px 12px", border: "none",
                    background: "transparent", borderRadius: 8, cursor: "pointer",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#7C3AED0C" }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
                >
                  <span style={{
                    width: 26, height: 26, borderRadius: 8,
                    background: "#7C3AED14",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <Mic size={14} color="#7C3AED" />
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: theme.dark }}>Use Voice</span>
                    <span style={{ fontSize: 10, color: theme.muted, fontWeight: 400 }}>Speak your plan</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={goToToday}
            style={{
              padding: "7px 16px",
              borderRadius: 8,
              border: `1px solid ${isToday ? theme.primary : theme.border}`,
              background: isToday ? theme.primary : "transparent",
              color: isToday ? "white" : theme.dark,
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              if (!isToday) {
                e.currentTarget.style.borderColor = theme.primary
                e.currentTarget.style.color = theme.primary
              }
            }}
            onMouseLeave={(e) => {
              if (!isToday) {
                e.currentTarget.style.borderColor = theme.border
                e.currentTarget.style.color = theme.dark
              }
            }}
          >
            {t("common.today")}
          </button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 4,
        }}
      >
        {weekDays.map((day, i) => {
          const active = isSameDay(day, currentDate)
          const dayIsToday = isSameDay(day, today)
          const isActiveMonth = day.getMonth() === currentDate.getMonth()
          return (
            <button
              key={toDateStr(day)}
              type="button"
              onClick={() => onDateChange(day)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                padding: "8px 4px",
                borderRadius: 10,
                border: "none",
                background: active ? theme.bg : "transparent",
                cursor: "pointer",
                transition: "all 0.15s",
                outline: "none",
                opacity: active ? 1 : (isActiveMonth ? 1 : 0.35),
              }}
              onMouseEnter={(e) => {
                if (!active && isActiveMonth) {
                  e.currentTarget.style.background = `color-mix(in srgb, ${theme.bg} 60%, transparent)`
                }
              }}
              onMouseLeave={(e) => {
                if (!active && isActiveMonth) {
                  e.currentTarget.style.background = "transparent"
                }
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: active
                    ? theme.primary
                    : dayIsToday
                      ? theme.dark
                      : theme.muted,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                {DAY_ABBR[i]}
              </span>
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: active
                    ? "white"
                    : dayIsToday
                      ? theme.primary
                      : isActiveMonth
                        ? theme.dark
                        : theme.muted,
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: active
                    ? theme.primary
                    : dayIsToday
                      ? `color-mix(in srgb, ${theme.primary} 12%, transparent)`
                      : "transparent",
                  transition: "all 0.15s",
                }}
              >
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
