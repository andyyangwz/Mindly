import { useState, useCallback } from "react"
import { motion } from "framer-motion"
import { X } from "lucide-react"
import ScrollReveal from "../components/ScrollReveal"
import CalendarGrid from "../../productivity/calendar/CalendarGrid"
import CalendarHeader from "../../productivity/calendar/CalendarHeader"

const SHOWCASE_DATE = new Date(2026, 4, 22)

const BASE_EVENTS = [
  {
    id: "showcase-1",
    title: "Morning Planning",
    description: "Plan the day and set key intentions.",
    startDatetime: "2026-05-22T07:00",
    endDatetime: "2026-05-22T07:30",
    startTime: "07:00",
    endTime: "07:30",
    color: "#8B5CF6",
    priority: "medium",
    productivityLevel: "productive",
    status: "Done",
    hasDeadline: false,
  },
  {
    id: "showcase-2",
    title: "Deep Work",
    description: "Focused creative work on the main project.",
    startDatetime: "2026-05-22T08:00",
    endDatetime: "2026-05-22T10:00",
    startTime: "08:00",
    endTime: "10:00",
    color: "#7C3AED",
    priority: "high",
    productivityLevel: "productive",
    status: "In Progress",
    hasDeadline: false,
  },
  {
    id: "showcase-9",
    title: "Code Review",
    description: "Review pull requests and provide feedback.",
    startDatetime: "2026-05-22T09:00",
    endDatetime: "2026-05-22T09:45",
    startTime: "09:00",
    endTime: "09:45",
    color: "#3B82F6",
    priority: "medium",
    productivityLevel: "productive",
    status: "To Do",
    hasDeadline: false,
  },
  {
    id: "showcase-11",
    title: "Team Standup",
    description: "Daily sync with the engineering team.",
    startDatetime: "2026-05-22T09:30",
    endDatetime: "2026-05-22T10:00",
    startTime: "09:30",
    endTime: "10:00",
    color: "#14B8A6",
    priority: "medium",
    productivityLevel: "obligation",
    status: "Done",
    hasDeadline: false,
  },
  {
    id: "showcase-3",
    title: "Team Meeting",
    description: "Weekly sync with the team.",
    startDatetime: "2026-05-22T10:30",
    endDatetime: "2026-05-22T11:30",
    startTime: "10:30",
    endTime: "11:30",
    color: "#F59E0B",
    priority: "medium",
    productivityLevel: "obligation",
    status: "To Do",
    hasDeadline: false,
  },
  {
    id: "showcase-4",
    title: "Journal Reflection",
    description: "Mid-day reflection and note-taking.",
    startDatetime: "2026-05-22T12:00",
    endDatetime: "2026-05-22T12:30",
    startTime: "12:00",
    endTime: "12:30",
    color: "#EC4899",
    priority: "low",
    productivityLevel: "neutral",
    status: "To Do",
    hasDeadline: false,
  },
  {
    id: "showcase-5",
    title: "Reading Session",
    description: "Read 'Deep Work' by Cal Newport.",
    startDatetime: "2026-05-22T13:00",
    endDatetime: "2026-05-22T14:00",
    startTime: "13:00",
    endTime: "14:00",
    color: "#3B82F6",
    priority: "low",
    productivityLevel: "productive",
    status: "To Do",
    hasDeadline: false,
  },
  {
    id: "showcase-6",
    title: "Focus Session",
    description: "Deep focus on project milestones.",
    startDatetime: "2026-05-22T14:00",
    endDatetime: "2026-05-22T16:00",
    startTime: "14:00",
    endTime: "16:00",
    color: "#8B5CF6",
    priority: "high",
    productivityLevel: "productive",
    status: "To Do",
    hasDeadline: false,
  },
  {
    id: "showcase-12",
    title: "Design Review",
    description: "Review wireframes and provide feedback.",
    startDatetime: "2026-05-22T14:30",
    endDatetime: "2026-05-22T15:30",
    startTime: "14:30",
    endTime: "15:30",
    color: "#F97316",
    priority: "medium",
    productivityLevel: "obligation",
    status: "To Do",
    hasDeadline: false,
  },
  {
    id: "showcase-10",
    title: "1:1 with Mentor",
    description: "Weekly check-in and career discussion.",
    startDatetime: "2026-05-22T15:00",
    endDatetime: "2026-05-22T15:30",
    startTime: "15:00",
    endTime: "15:30",
    color: "#EC4899",
    priority: "high",
    productivityLevel: "productive",
    status: "To Do",
    hasDeadline: false,
  },
  {
    id: "showcase-7",
    title: "Gym Session",
    description: "Evening workout routine.",
    startDatetime: "2026-05-22T17:00",
    endDatetime: "2026-05-22T18:00",
    startTime: "17:00",
    endTime: "18:00",
    color: "#10B981",
    priority: "medium",
    productivityLevel: "productive",
    status: "To Do",
    hasDeadline: false,
  },
  {
    id: "showcase-8",
    title: "Assignment Deadline",
    description: "Final submission due tonight.",
    startDatetime: "2026-05-22T23:55",
    endDatetime: "2026-05-22T23:55",
    startTime: "23:55",
    endTime: "23:55",
    color: "#EF4444",
    priority: "high",
    productivityLevel: "obligation",
    status: "To Do",
    hasDeadline: false,
  },
]

export default function CalendarShowcase() {
  const [events, setEvents] = useState(BASE_EVENTS)
  const [dragOverrides, setDragOverrides] = useState({})
  const [showSignup, setShowSignup] = useState(false)

  const handleDragUpdate = useCallback((eventId, newStart, newEnd) => {
    if (newStart === null) {
      setDragOverrides((prev) => {
        const next = { ...prev }
        delete next[eventId]
        return next
      })
      return
    }
    setDragOverrides((prev) => ({
      ...prev,
      [eventId]: { startTime: newStart, endTime: newEnd },
    }))
  }, [])

  const handleDragEnd = useCallback((eventId, oldStart, oldEnd, newStart, newEnd) => {
    setEvents((prev) =>
      prev.map((ev) => {
        if (ev.id !== eventId) return ev
        return { ...ev, startTime: newStart, endTime: newEnd }
      })
    )
  }, [])

  const handleResize = useCallback((event, oldStart, oldEnd, newStart, newEnd) => {
    setEvents((prev) =>
      prev.map((ev) => {
        if (ev.id !== event.id) return ev
        return { ...ev, startTime: newStart, endTime: newEnd }
      })
    )
  }, [])

  const handleShowSignup = useCallback(() => setShowSignup(true), [])

  return (
    <section
      style={{
        position: "relative",
        zIndex: 1,
        padding: "80px 32px",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "30%",
          left: "50%",
          width: "50vw",
          height: "50vw",
          maxWidth: 700,
          maxHeight: 700,
          borderRadius: "50%",
          background: "var(--landing-hero-glow)",
          filter: "blur(120px)",
          transform: "translate(-50%, -50%)",
          opacity: 0.3,
          pointerEvents: "none",
        }}
      />

      <div style={{ maxWidth: 1000, margin: "0 auto", position: "relative" }}>
        <ScrollReveal>
          <p
            style={{
              fontSize: "clamp(11px, 1.2vw, 14px)",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "var(--landing-accent)",
              fontWeight: 600,
              marginBottom: 12,
              textAlign: "center",
            }}
          >
            Intelligent Scheduling
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <h2
            style={{
              fontSize: "clamp(24px, 3.5vw, 40px)",
              fontWeight: 300,
              color: "var(--landing-text)",
              textAlign: "center",
              margin: "0 0 48px",
              letterSpacing: "-0.03em",
              lineHeight: 1.2,
            }}
          >
            A calendar that understands you
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            style={{ willChange: "transform" }}
          >
            <div
              className="showcase-calendar"
              style={{
                borderRadius: 20,
                background: "var(--color-card, white)",
                border: "1px solid var(--color-border)",
                boxShadow: "0 8px 32px var(--landing-shadow-md)",
                overflow: "hidden",
                filter: showSignup ? "blur(6px)" : "none",
                transition: "filter 0.3s ease",
                pointerEvents: showSignup ? "none" : "auto",
              }}
            >
              <CalendarHeader
                currentDate={SHOWCASE_DATE}
                showTutorial={false}
                onDateChange={() => {}}
                onUndo={() => {}}
                onRedo={() => {}}
                canUndo={() => false}
                canRedo={() => false}
                onAddActivity={handleShowSignup}
                onAddTask={handleShowSignup}
                onVoice={handleShowSignup}
              />
              <CalendarGrid
                activities={events}
                currentDate={SHOWCASE_DATE}
                onViewDetails={() => {}}
                onActivityContextMenu={() => {}}
                onEmptyContextMenu={() => {}}
                onActivityResize={handleResize}
                onDragUpdate={handleDragUpdate}
                onDragEnd={handleDragEnd}
                onInlineCreate={() => {}}
                onInlineSave={() => {}}
                onInlineCancel={() => {}}
                dragOverrides={dragOverrides}
              />
            </div>
          </motion.div>
        </ScrollReveal>

        {showSignup && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 10,
              background: "var(--color-card, white)",
              borderRadius: 20,
              border: "1px solid var(--color-border)",
              boxShadow: "0 16px 48px var(--landing-shadow-lg)",
              padding: "36px 32px 28px",
              maxWidth: 380,
              width: "90%",
              textAlign: "center",
            }}
          >
            <button
              type="button"
              onClick={() => setShowSignup(false)}
              style={{
                position: "absolute", top: 12, right: 12,
                width: 28, height: 28, borderRadius: "50%",
                border: "none", background: "var(--color-input)",
                cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center",
                color: "var(--color-muted)",
              }}
            >
              <X size={13} />
            </button>

            <h3
              style={{
                fontSize: 18, fontWeight: 600,
                color: "var(--color-dark)",
                margin: "0 0 8px",
              }}
            >
              Unlock the Full Calendar
            </h3>

            <p
              style={{
                fontSize: 13, lineHeight: 1.6,
                color: "var(--color-muted)",
                margin: "0 0 24px",
              }}
            >
              Sign up to create activities, set deadlines, and organize your week with AI-powered scheduling.
            </p>

            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button
                type="button"
                onClick={() => setShowSignup(false)}
                style={{
                  padding: "10px 24px", borderRadius: 10,
                  border: "1px solid var(--color-border)",
                  background: "var(--color-card, white)",
                  color: "var(--color-dark)",
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}
              >
                Okay
              </button>
              <a
                href="/signup"
                style={{
                  padding: "10px 24px", borderRadius: 10,
                  border: "none",
                  background: "var(--color-primary)",
                  color: "white",
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                  textDecoration: "none", display: "inline-block",
                }}
              >
                Sign Up
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
