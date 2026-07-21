import { useState, useEffect, useMemo, useCallback } from "react";
import { Flag, Clock3, AlertCircle } from "lucide-react";
import { theme } from "../../../theme";
import { productivityService } from "../../../services/productivityService";
import { STATUS_META } from "../../productivity/utils/calendarConstants";
import { EVENT_TASKS_UPDATED } from "../../../utils/events";

const MAX_VISIBLE = 5;
const ITEM_HEIGHT = 51;

function formatFinishDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

function formatDateRange(startDateStr, endDateStr) {
  if (!startDateStr) return "";
  const start = formatFinishDate(startDateStr);
  if (!endDateStr || startDateStr === endDateStr) return start;
  return `${start} \u2013 ${formatFinishDate(endDateStr)}`;
}

export default function HighPriorityTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    try {
      const data = await productivityService.getAll();
      setTasks(data.events);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    const handler = () => fetchTasks();
    window.addEventListener(EVENT_TASKS_UPDATED, handler);
    return () => window.removeEventListener(EVENT_TASKS_UPDATED, handler);
  }, [fetchTasks]);

  const highPriorityTasks = useMemo(() => {
    return tasks
      .filter(t => t.hasDeadline && t.priority === "high" && t.status === "In Progress")
      .sort((a, b) => {
        const aStart = a.startDatetime || "";
        const bStart = b.startDatetime || "";
        if (aStart < bStart) return -1;
        if (aStart > bStart) return 1;
        const aCreated = a.createdAt || "";
        const bCreated = b.createdAt || "";
        return aCreated < bCreated ? -1 : aCreated > bCreated ? 1 : 0;
      });
  }, [tasks]);

  return (
    <div style={{
      background: "var(--color-card)",
      borderRadius: 18,
      padding: "20px",
      boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
      display: "flex",
      flexDirection: "column",
      boxSizing: "border-box",
      userSelect: "none",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: "linear-gradient(135deg, #EF4444, #DC2626)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            <Flag size={15} color="white" />
          </div>
          <div>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: theme.dark, margin: 0 }}>
              High Priority In Progress Tasks
            </h2>
            <p style={{ fontSize: 11, color: theme.muted, margin: "1px 0 0 0" }}>
              Tasks with high priority that are currently being worked on
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "24px 0", fontSize: 13, color: theme.muted }}>
          Loading...
        </div>
      ) : highPriorityTasks.length === 0 ? (
        <div style={{ textAlign: "center", padding: "24px 12px" }}>
          <AlertCircle size={28} color={theme.border} style={{ marginBottom: 8 }} />
          <p style={{ fontSize: 13, fontWeight: 500, color: theme.dark, margin: "0 0 4px 0" }}>
            No high priority tasks in progress.
          </p>
          <p style={{ fontSize: 11, color: theme.muted, margin: 0 }}>
            You're all caught up. Start a high priority task to see it here.
          </p>
        </div>
      ) : (
        <div style={{
          maxHeight: MAX_VISIBLE * ITEM_HEIGHT,
          overflowY: highPriorityTasks.length > MAX_VISIBLE ? "auto" : "visible",
          marginRight: highPriorityTasks.length > MAX_VISIBLE ? -4 : 0,
          paddingRight: highPriorityTasks.length > MAX_VISIBLE ? 4 : 0,
        }}>
          {highPriorityTasks.map(task => (
            <div key={task.id} style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: `1px solid ${theme.border}`,
              marginBottom: 6,
              transition: "all 0.15s",
            }}>
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
                  {task.title}
                </p>
                <div style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: task.color || theme.primary,
                  flexShrink: 0,
                  marginLeft: 8,
                }} />
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ fontSize: 10, color: theme.muted, display: "flex", alignItems: "center", gap: 3 }}>
                  <Clock3 size={10} />
                  {formatDateRange(task.startDatetime?.slice(0, 10), task.endDatetime?.slice(0, 10))}
                </span>
                <span style={{
                  fontSize: 8,
                  fontWeight: 600,
                  padding: "1px 6px",
                  borderRadius: 3,
                  background: STATUS_META["In Progress"].bg,
                  color: STATUS_META["In Progress"].color,
                  border: `1px solid ${STATUS_META["In Progress"].border}`,
                  lineHeight: 1.4,
                  letterSpacing: "0.01em",
                }}>
                  In Progress
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
