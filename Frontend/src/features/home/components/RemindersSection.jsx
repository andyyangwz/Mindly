import { useState, useEffect, useMemo, useCallback } from "react";
import { Bell, ChevronDown, ChevronUp } from "lucide-react";
import { theme } from "../../../theme";
import { reminderService } from "../../../services/reminderService";
import { EVENT_TASKS_UPDATED } from "../../../utils/events";

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
    <div style={{
      position: "relative",
      padding: "12px 14px",
      borderRadius: 10,
      border: `1px solid ${theme.border}`,
      marginBottom: 8,
      overflow: "hidden",
      transition: "border-color 0.15s, box-shadow 0.15s",
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = `color-mix(in srgb, ${reminder.color || "#F59E0B"} 30%, ${theme.border})`; e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)" }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.boxShadow = "none" }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <p style={{
          fontSize: 13,
          fontWeight: 500,
          color: theme.dark,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          margin: 0,
        }}>
          {reminder.title}
        </p>
        <div style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: reminder.color || "#F59E0B",
          flexShrink: 0,
          marginLeft: 8,
        }} />
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        {reminder.datetime && (
          <span style={{ fontSize: 10, color: theme.muted, display: "flex", alignItems: "center", gap: 3 }}>
            <Bell size={10} />
            {formatReminderDate(reminder.datetime)}
          </span>
        )}
        {reminder.priority && (
          <span style={{
            fontSize: 8,
            fontWeight: 600,
            padding: "1px 6px",
            borderRadius: 3,
            background: `${reminder.color || "#F59E0B"}18`,
            color: reminder.color || "#F59E0B",
            lineHeight: 1.4,
            letterSpacing: "0.01em",
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
    <div style={{ display: "flex", flexDirection: "column", userSelect: "none" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: "linear-gradient(135deg, #F59E0B, #D97706)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
          <Bell size={14} color="white" />
        </div>
        <h2 style={{ fontSize: 15, fontWeight: 650, color: theme.dark, margin: 0 }}>
          Reminders
        </h2>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "24px 0", fontSize: 13, color: theme.muted }}>
          Loading...
        </div>
      ) : sortedReminders.length === 0 ? (
        <div style={{ textAlign: "center", padding: "24px 12px" }}>
          <Bell size={28} color={theme.border} style={{ marginBottom: 8 }} />
          <p style={{ fontSize: 13, fontWeight: 500, color: theme.dark, margin: "0 0 4px 0" }}>
            No reminders yet.
          </p>
          <p style={{ fontSize: 11, color: theme.muted, margin: 0 }}>
            Create a reminder to stay on top of important moments.
          </p>
        </div>
      ) : (
        <>
          {visibleReminders.map(reminder => (
            <ReminderItem key={reminder.id} reminder={reminder} />
          ))}

          {showExpand && (
            <button
              onClick={() => setExpanded(v => !v)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                width: "100%",
                padding: "10px 0",
                marginTop: 8,
                border: "none",
                borderTop: `1px solid ${theme.border}`,
                background: "transparent",
                color: theme.primary,
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
                flexShrink: 0,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = `color-mix(in srgb, ${theme.primary} 5%, transparent)` }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
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
        </>
      )}
    </div>
  );
}
