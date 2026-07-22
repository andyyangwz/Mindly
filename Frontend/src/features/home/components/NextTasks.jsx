import { useState, useEffect, useMemo, useCallback } from "react";
import { Clock3, ClipboardList, ListChecks, ChevronDown, ChevronUp } from "lucide-react";
import { theme } from "../../../theme";
import { productivityService } from "../../../services/productivityService";
import { STATUS_META } from "../../productivity/utils/calendarConstants";
import { EVENT_TASKS_UPDATED, notifyTasksUpdated } from "../../../utils/events";
import ActivityDetailModal from "../../productivity/modals/ActivityDetailModal";

const MAX_VISIBLE = 4;
const EXPANDED_HEIGHT = 400;

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

function TaskItem({ task, onClick }) {
  return (
    <div onClick={() => onClick?.(task)} style={{
      padding: "10px 12px",
      borderRadius: 10,
      border: `1px solid ${theme.border}`,
      marginBottom: 6,
      cursor: "pointer",
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
          background: STATUS_META["To Do"].bg,
          color: STATUS_META["To Do"].color,
          border: `1px solid ${STATUS_META["To Do"].border}`,
          lineHeight: 1.4,
          letterSpacing: "0.01em",
        }}>
          To Do
        </span>
      </div>
    </div>
  );
}

export default function NextTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [detailEvent, setDetailEvent] = useState(null);

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

  const nextTasks = useMemo(() => {
    return tasks
      .filter(t => t.hasDeadline && t.status === "To Do")
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

  const showExpand = nextTasks.length > MAX_VISIBLE;
  const visibleTasks = expanded ? nextTasks : nextTasks.slice(0, MAX_VISIBLE);

  const collapse = useCallback(() => {
    setExpanded(false);
  }, []);

  const handleDetailStatusChange = useCallback(async (event, newStatus) => {
    try {
      await productivityService.update(event.id, { status: newStatus });
      setTasks(prev =>
        prev.map(t => (t.id === event.id ? { ...t, status: newStatus } : t))
      );
      setDetailEvent(prev => prev && prev.id === event.id ? { ...prev, status: newStatus } : prev);
      notifyTasksUpdated();
    } catch {
    }
  }, []);

  const handleDetailDelete = useCallback(async (id) => {
    try {
      await productivityService.delete(id);
      setTasks(prev => prev.filter(t => t.id !== id));
      setDetailEvent(null);
      notifyTasksUpdated();
    } catch {
    }
  }, []);

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
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          background: "linear-gradient(135deg, #3B82F6, #2563EB)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
          <ListChecks size={16} color="white" />
        </div>
        <div>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: theme.dark, margin: 0 }}>
            Next Tasks
          </h2>
          <p style={{ fontSize: 11, color: theme.muted, margin: "1px 0 0 0" }}>
            Tasks ready to be started
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "24px 0", fontSize: 13, color: theme.muted }}>
          Loading...
        </div>
      ) : nextTasks.length === 0 ? (
        <div style={{ textAlign: "center", padding: "24px 12px" }}>
          <ClipboardList size={28} color={theme.border} style={{ marginBottom: 8 }} />
          <p style={{ fontSize: 13, fontWeight: 500, color: theme.dark, margin: "0 0 4px 0" }}>
            No upcoming tasks.
          </p>
          <p style={{ fontSize: 11, color: theme.muted, margin: 0 }}>
            Enjoy the break, or create a new task to get started.
          </p>
        </div>
      ) : (
        <>
          {expanded ? (
            <div style={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              maxHeight: EXPANDED_HEIGHT,
            }}>
              {nextTasks.map(task => (
                <TaskItem key={task.id} task={task} onClick={setDetailEvent} />
              ))}
            </div>
          ) : (
            visibleTasks.map(task => (
              <TaskItem key={task.id} task={task} onClick={setDetailEvent} />
            ))
          )}

          {showExpand && (
            <button
              onClick={() => expanded ? collapse() : setExpanded(true)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                width: "100%",
                padding: "8px 0",
                marginTop: 14,
                border: "none",
                borderTop: `1px solid ${theme.border}`,
                background: "transparent",
                color: theme.primary,
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
                borderRadius: "0 0 8px 8px",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = `color-mix(in srgb, ${theme.primary} 6%, transparent)` }}
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
                  View More ({nextTasks.length - MAX_VISIBLE} more)
                </>
              )}
            </button>
          )}
        </>
      )}

      <ActivityDetailModal
        activity={detailEvent}
        open={!!detailEvent}
        onClose={() => setDetailEvent(null)}
        onStatusChange={handleDetailStatusChange}
        onDelete={handleDetailDelete}
      />
    </div>
  );
}
