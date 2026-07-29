import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock3, ClipboardList, ListChecks, ChevronDown, ChevronUp } from "lucide-react";
import { schedulingService } from "../../../services/schedulingService";
import { STATUS_META } from "../../scheduling/utils/calendarConstants";
import { EVENT_TASKS_UPDATED, notifyTasksUpdated } from "../../../utils/events";
import ActivityDetailModal from "../../scheduling/modals/ActivityDetailModal";
import AddTaskModal from "../../scheduling/tasks/AddTaskModal";
import TaskProgressBar from "./TaskProgressBar";
import "../../../styles/dashboard/index.css"

const MAX_VISIBLE = 4;

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
    <div onClick={() => onClick?.(task)} className="nt-task">
      <div className="nt-task-top">
        <p className="nt-task-title">{task.title}</p>
        <div className="nt-task-dot" style={{ background: task.color || "var(--color-primary)" }} />
      </div>
      <div className="nt-task-meta">
        <span className="nt-task-date">
          <Clock3 size={10} />
          {formatDateRange(task.startDatetime?.slice(0, 10), task.endDatetime?.slice(0, 10))}
        </span>
        <span className="nt-task-status" style={{
          background: STATUS_META["To Do"].bg,
          color: STATUS_META["To Do"].color,
          border: `1px solid ${STATUS_META["To Do"].border}`,
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
      const data = await schedulingService.getAll();
      setTasks(data.events);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
      await schedulingService.update(event.id, update);
      setTasks(prev =>
        prev.map(t => (t.id === event.id ? { ...t, ...update } : t))
      );
      setDetailEvent(prev => prev && prev.id === event.id ? { ...prev, ...update } : prev);
      notifyTasksUpdated();
    } catch { /* ignore */
    }
  }, []);

  const handleDetailProgressChange = useCallback(async (event, newProgress) => {
    try {
      await schedulingService.update(event.id, { progress: newProgress });
      setTasks(prev =>
        prev.map(t => (t.id === event.id ? { ...t, progress: newProgress } : t))
      );
      setDetailEvent(prev => prev && prev.id === event.id ? { ...prev, progress: newProgress } : prev);
      notifyTasksUpdated();
    } catch { /* ignore */
    }
  }, []);

  const handleDetailDelete = useCallback(async (id) => {
    try {
      await schedulingService.delete(id);
      setTasks(prev => prev.filter(t => t.id !== id));
      setDetailEvent(null);
      notifyTasksUpdated();
    } catch { /* ignore */
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
      const updated = await schedulingService.update(task.id, data);
      setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
      setEditingTask(null);
      editingTaskRef.current = null;
      notifyTasksUpdated();
    } catch (err) {
      console.error("Failed to update task:", err);
    }
  }, []);

  return (
    <div className="nt-container">
      <div className="nt-header">
        <div className="nt-icon-box">
          <ListChecks size={14} color="white" />
        </div>
        <h2 className="nt-title">Next Tasks</h2>
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
            <div className="skeleton-card skeleton-shimmer" />
          </motion.div>
        ) : nextTasks.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="nt-empty">
              <ClipboardList size={28} color="var(--color-border)" style={{ marginBottom: 8 }} />
              <p className="nt-empty-title">No upcoming tasks.</p>
              <p className="nt-empty-sub">Enjoy the break, or create a new task to get started.</p>
            </div>
          </motion.div>
        ) : (
          <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            {expanded ? (
              <div className="nt-expanded">
                {nextTasks.map((task, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.04 * index, ease: "easeOut" }}
                  >
                    <TaskItem task={task} onClick={setDetailEvent} />
                  </motion.div>
                ))}
              </div>
            ) : (
              visibleTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.04 * index, ease: "easeOut" }}
                >
                  <TaskItem task={task} onClick={setDetailEvent} />
                </motion.div>
              ))
            )}

            {showExpand && (
              <button
                onClick={() => expanded ? collapse() : setExpanded(true)}
                className="nt-show-more"
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
          </motion.div>
        )}
      </AnimatePresence>

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
