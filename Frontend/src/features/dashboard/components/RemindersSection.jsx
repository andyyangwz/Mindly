import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, ChevronDown, ChevronUp } from "lucide-react";
import { reminderService } from "../../../services/reminderService";
import { EVENT_TASKS_UPDATED } from "../../../utils/events";
import "../../../styles/dashboard/index.css"

const MAX_VISIBLE = 4;

function formatReminderDate(dt) {
  if (!dt) return "";
  const d = new Date(dt);
  const now = new Date();
  const diffMs = d - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const timeStr = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  if (diffDays === 0) return `Today ${timeStr}`;
  if (diffDays === 1) return `Tomorrow ${timeStr}`;
  if (diffDays === -1) return `Yesterday ${timeStr}`;
  if (diffDays > 1 && diffDays <= 7) {
    const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
    return `${dayName} ${timeStr}`;
  }
  return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} ${timeStr}`;
}

function ReminderItem({ reminder }) {
  return (
    <div className="rs-item"
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = `color-mix(in srgb, ${reminder.color || "#F59E0B"} 30%, var(--color-border))`;
        e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = "var(--color-border)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div className="rs-item-top">
        <p className="rs-item-title">{reminder.title}</p>
        <div className="rs-item-dot" style={{ background: reminder.color || "#F59E0B" }} />
      </div>
      <div className="rs-item-meta">
        {reminder.datetime && (
          <span className="rs-item-date">
            <Bell size={10} />
            {formatReminderDate(reminder.datetime)}
          </span>
        )}
        {reminder.priority && (
          <span className="rs-item-priority" style={{
            background: `${reminder.color || "#F59E0B"}18`,
            color: reminder.color || "#F59E0B",
          }}>
            {reminder.priority}
          </span>
        )}
      </div>
    </div>
  );
}

export default function RemindersSection() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const fetchReminders = useCallback(async () => {
    try {
      const data = await reminderService.getAll();
      setReminders(data.reminders);
    } catch {
      setReminders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchReminders();
  }, [fetchReminders]);

  useEffect(() => {
    const handler = () => fetchReminders();
    window.addEventListener(EVENT_TASKS_UPDATED, handler);
    return () => window.removeEventListener(EVENT_TASKS_UPDATED, handler);
  }, [fetchReminders]);

  const sortedReminders = useMemo(() => {
    return [...reminders].sort((a, b) => {
      const aDt = a.datetime || "";
      const bDt = b.datetime || "";
      return aDt.localeCompare(bDt);
    });
  }, [reminders]);

  const showExpand = sortedReminders.length > MAX_VISIBLE;
  const visibleReminders = expanded ? sortedReminders : sortedReminders.slice(0, MAX_VISIBLE);

  return (
    <div className="rs-container">
      <div className="rs-header">
        <div className="rs-icon-box">
          <Bell size={14} color="white" />
        </div>
        <h2 className="rs-title">Reminders</h2>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="skeleton-card skeleton-shimmer" />
            <div className="skeleton-card skeleton-shimmer" />
          </motion.div>
        ) : sortedReminders.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="rs-empty">
              <Bell size={28} color="var(--color-border)" style={{ marginBottom: 8 }} />
              <p className="rs-empty-title">No reminders yet.</p>
              <p className="rs-empty-sub">Create a reminder to stay on top of important moments.</p>
            </div>
          </motion.div>
        ) : (
          <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            {visibleReminders.map((reminder, index) => (
              <motion.div
                key={reminder.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.04 * index, ease: "easeOut" }}
              >
                <ReminderItem reminder={reminder} />
              </motion.div>
            ))}

            {showExpand && (
              <button
                onClick={() => setExpanded(v => !v)}
                className="rs-show-more"
              >
                {expanded ? (
                  <>
                    <ChevronUp size={14} />
                    View Less
                  </>
                ) : (
                  <>
                    <ChevronDown size={14} />
                    View More ({sortedReminders.length - MAX_VISIBLE} more)
                  </>
                )}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
