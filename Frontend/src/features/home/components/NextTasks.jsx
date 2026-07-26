import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Clock3, ClipboardList, ListChecks, ChevronDown, ChevronUp } from "lucide-react";
import { theme } from "../../../theme";
import { productivityService } from "../../../services/productivityService";
import { STATUS_META } from "../../productivity/utils/calendarConstants";
import { EVENT_TASKS_UPDATED, notifyTasksUpdated } from "../../../utils/events";
import ActivityDetailModal from "../../productivity/modals/ActivityDetailModal";
import AddTaskModal from "../../productivity/tasks/AddTaskModal";
import TaskProgressBar from "./TaskProgressBar";

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
      position: "relative",
      padding: "12px 14px",
      borderRadius: 10,
      border: `1px solid ${theme.border}`,
      marginBottom: 8,
      cursor: "pointer",
      overflow: "hidden",
      transition: "border-color 0.15s, box-shadow 0.15s",
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = `color-mix(in srgb, ${theme.primary} 30%, ${theme.border})`; e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)" }}
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
      <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
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
      <TaskProgressBar progress={task.progress ?? 0} color={task.color || "#6366F1"} />
    </div>
  );
}

export default function NextTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [detailEvent, setDetailEvent] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const editingTaskRef = useRef(null);

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
      const update = { status: newStatus };
      if (newStatus === "Done" && event.hasDeadline) {
        update.progress = 100;
      }
      await productivityService.update(event.id, update);
      setTasks(prev =>
        prev.map(t => (t.id === event.id ? { ...t, ...update } : t))
      );
      setDetailEvent(prev => prev && prev.id === event.id ? { ...prev, ...update } : prev);
      notifyTasksUpdated();
    } catch {
    }
  }, []);

  const handleDetailProgressChange = useCallback(async (event, newProgress) => {
    try {
      await productivityService.update(event.id, { progress: newProgress });
      setTasks(prev =>
        prev.map(t => (t.id === event.id ? { ...t, progress: newProgress } : t))
      );
      setDetailEvent(prev => prev && prev.id === event.id ? { ...prev, progress: newProgress } : prev);
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

  const handleEdit = useCallback((task) => {
    editingTaskRef.current = task;
    setEditingTask(task);
  }, []);

  const handleTaskSave = useCallback(async (data) => {
    const task = editingTaskRef.current;
    if (!task) return;
    try {
      const updated = await productivityService.update(task.id, data);
      setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
      setEditingTask(null);
      editingTaskRef.current = null;
      notifyTasksUpdated();
    } catch (err) {
      console.error("Failed to update task:", err);
    }
  }, []);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      userSelect: "none",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: "linear-gradient(135deg, #3B82F6, #2563EB)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
          <ListChecks size={14} color="white" />
        </div>
        <h2 style={{ fontSize: 15, fontWeight: 650, color: theme.dark, margin: 0 }}>
          Next Tasks
        </h2>
        {nextTasks.length > 0 && (
          <span style={{ fontSize: 11, color: theme.muted, fontWeight: 500 }}>
            {nextTasks.length}
          </span>
        )}
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
        onProgressChange={handleDetailProgressChange}
        onDelete={handleDetailDelete}
        onEdit={handleEdit}
      />

      <AddTaskModal
        open={!!editingTask}
        onClose={() => { setEditingTask(null); editingTaskRef.current = null; }}
        onSave={handleTaskSave}
        editingActivity={editingTask}
      />
    </div>
  );
}
