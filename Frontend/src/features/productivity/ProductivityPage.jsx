import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Clock3, ChevronDown, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { theme } from "../../theme";
import { productivityService } from "../../services/productivityService";
import { STATUS_META } from "./utils/calendarConstants";
import ProductivityCalendar from "./calendar/ProductivityCalendar";
import AIPlanningAssistant from "./components/AIPlanningAssistant";
import QuickAddModal from "./components/QuickAddModal";
import ActivityDetailModal from "./modals/ActivityDetailModal";
import { notifyTasksUpdated, EVENT_TASKS_UPDATED } from "../../utils/events";
import TaskProgressBar from "../home/components/TaskProgressBar";

const priorityColor = {
  high: theme.primary,
  medium: theme.secondary,
  low: theme.accent,
};


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

export default function ProductivityPage() {
  const { t } = useTranslation();
  const [allTasks, setAllTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [activeTaskTab, setActiveTaskTab] = useState("In Progress");
  const [detailEvent, setDetailEvent] = useState(null);
  const [donePage, setDonePage] = useState(1);
  const [doneLoading, setDoneLoading] = useState(false);
  const doneScrollRef = useRef(null);
  const calendarRef = useRef(null);
  const [calendarRefreshKey, setCalendarRefreshKey] = useState(0);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [selectedPlanDate, setSelectedPlanDate] = useState(() => new Date());
  const datePickerRef = useRef(null);
  const [isCompact, setIsCompact] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState("all");

  function toDateStr(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function isSameDay(a, b) {
    return toDateStr(a) === toDateStr(b);
  }

  function getNoPlanMessage(date) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (isSameDay(date, today)) return "No plan for today.";
    if (isSameDay(date, tomorrow)) return "No plan for tomorrow.";
    if (isSameDay(date, yesterday)) return "No plan for yesterday.";
    return `No plan for ${date.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}.`;
  }

  function getPlanTitle(date) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (isSameDay(date, today)) return t("productivity.page.todaysPlan");
    if (isSameDay(date, tomorrow)) return t("productivity.page.tomorrowsPlan");
    if (isSameDay(date, yesterday)) return t("productivity.page.yesterdaysPlan");
    return date.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" }) + "'s Plan";
  }

  const DONE_PAGE_SIZE = 10;

  const tabs = ["To Do", "In Progress", "Done"];

  const tStatus = (s) => {
    const k = { "To Do": "todo", "In Progress": "inProgress", "Done": "done" };
    return t(`productivity.status.${k[s]}`);
  };

  const fetchAllTasks = useCallback(async () => {
    try {
      const result = await productivityService.getAll();
      setAllTasks(result.events);
    } catch {
      setAllTasks([]);
    } finally {
      setTasksLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllTasks();
  }, [fetchAllTasks]);

  useEffect(() => {
    const handler = () => fetchAllTasks();
    window.addEventListener(EVENT_TASKS_UPDATED, handler);
    return () => window.removeEventListener(EVENT_TASKS_UPDATED, handler);
  }, [fetchAllTasks]);

  const handleDetailStatusChange = useCallback(async (event, newStatus) => {
    try {
      const update = { status: newStatus };
      if (newStatus === "Done" && event.hasDeadline) {
        update.progress = 100;
      }
      await productivityService.update(event.id, update);
      setAllTasks(prev =>
        prev.map(t => (t.id === event.id ? { ...t, ...update } : t))
      );
      setDetailEvent(prev => prev && prev.id === event.id ? { ...prev, ...update } : prev);
      setCalendarRefreshKey(k => k + 1);
      notifyTasksUpdated();
    } catch {
    }
  }, []);

  const handleDetailProgressChange = useCallback(async (event, newProgress) => {
    try {
      await productivityService.update(event.id, { progress: newProgress });
      setAllTasks(prev =>
        prev.map(t => (t.id === event.id ? { ...t, progress: newProgress } : t))
      );
      setDetailEvent(prev => prev && prev.id === event.id ? { ...prev, progress: newProgress } : prev);
      setCalendarRefreshKey(k => k + 1);
      notifyTasksUpdated();
    } catch {
    }
  }, []);

  const handleDetailDelete = useCallback(async (id) => {
    try {
      await productivityService.delete(id);
      setAllTasks(prev => prev.filter(t => t.id !== id));
      setDetailEvent(null);
      setCalendarRefreshKey(k => k + 1);
      notifyTasksUpdated();
    } catch {
    }
  }, []);

  const handleTaskClick = useCallback((task) => {
    setDetailEvent(task);
  }, []);

  const handleDetailEdit = useCallback((activity) => {
    setDetailEvent(null);
    calendarRef.current?.editActivity(activity);
  }, []);

  useEffect(() => {
    setDonePage(1);
  }, [activeTaskTab, allTasks.length]);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 1000px)")
    setIsCompact(mql.matches)
    const handler = (e) => setIsCompact(e.matches)
    mql.addEventListener("change", handler)
    return () => mql.removeEventListener("change", handler)
  }, [])

  const handleDoneScroll = useCallback(() => {
    const el = doneScrollRef.current;
    if (!el || doneLoading) return;
    if (activeTaskTab !== "Done") return;
    const totalDone = allTasks.filter(t => t.status === "Done").length;
    if (donePage * DONE_PAGE_SIZE >= totalDone) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 40) {
      setDoneLoading(true);
      setTimeout(() => {
        setDonePage(p => p + 1);
        setDoneLoading(false);
      }, 200);
    }
  }, [doneLoading, activeTaskTab, donePage, allTasks]);

  const handlePlanCircleToggle = useCallback(async (e, item) => {
    e.stopPropagation();
    const nextStatus = item.status === "Done" ? "In Progress" : "Done";
    try {
      await productivityService.update(item.id, { status: nextStatus });
      setAllTasks(prev =>
        prev.map(t => (t.id === item.id ? { ...t, status: nextStatus } : t))
      );
      setCalendarRefreshKey(k => k + 1);
      notifyTasksUpdated();
    } catch {
    }
  }, []);

  const filteredTasks = allTasks
    .filter(t => {
      if (t.hasDeadline !== true) return false;
      if (activeTaskTab === "Done") return t.status === "Done";
      if (activeTaskTab === "In Progress") return t.status === "In Progress";
      if (activeTaskTab === "To Do") return t.status === "To Do";
      return false;
    })
    .filter(t => priorityFilter === "all" || t.priority === priorityFilter)
    .sort((a, b) => {
      if (activeTaskTab === "Done") {
        const tsA = a.statusChangeAt ? new Date(a.statusChangeAt).getTime() : 0;
        const tsB = b.statusChangeAt ? new Date(b.statusChangeAt).getTime() : 0;
        return tsB - tsA;
      }
      const dateA = a.startDatetime ? a.startDatetime.slice(0, 10) : "";
      const dateB = b.startDatetime ? b.startDatetime.slice(0, 10) : "";
      const cmp = dateA.localeCompare(dateB);
      if (cmp !== 0) return cmp;
      return (a.id || "").localeCompare(b.id || "");
    });

  const visibleTasks = activeTaskTab === "Done"
    ? filteredTasks.slice(0, donePage * DONE_PAGE_SIZE)
    : filteredTasks;

  const planItems = useMemo(() => {
    const dateStr = toDateStr(selectedPlanDate);
    return allTasks
      .filter(e => (e.startDatetime ? e.startDatetime.slice(0, 10) : "") === dateStr && !e.hasDeadline)
      .sort((a, b) => {
        if (!a.startTime) return 1;
        if (!b.startTime) return -1;
        return a.startTime.localeCompare(b.startTime);
      });
  }, [allTasks, selectedPlanDate]);

  const planLoading = tasksLoading;

  const scrollToOverview = useCallback(() => {
    const el = document.getElementById("overview-cards")
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [])

  return (
    <div style={{ padding: isCompact ? "20px 16px" : "28px 32px", maxWidth: 1200, margin: "0 auto" }}>
      <button
        onClick={scrollToOverview}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
            padding: "8px 16px",
          marginBottom: 16,
          background: "var(--color-card, white)",
          border: `1px solid ${theme.border}`,
          borderRadius: 12,
          color: theme.dark,
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          transition: "all 0.15s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = theme.primary
          e.currentTarget.style.color = theme.primary
          e.currentTarget.style.background = `color-mix(in srgb, ${theme.primary} 8%, transparent)`
          e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = theme.border
          e.currentTarget.style.color = theme.dark
          e.currentTarget.style.background = "var(--color-card, white)"
          e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)"
        }}
      >
        <ChevronDown size={16} />
        {t("productivity.page.viewPlanAndTasks")}
      </button>

      <ProductivityCalendar ref={calendarRef} onActivityUpdated={fetchAllTasks} calendarRefreshKey={calendarRefreshKey} onQuickAdd={() => setQuickAddOpen(true)} />

      <div style={{ marginTop: 12 }}>
        <AIPlanningAssistant />
      </div>

      <div id="overview-cards" style={{ display: "grid", gridTemplateColumns: isCompact ? "1fr" : "1fr 1fr", gap: 20, marginTop: 24, alignItems: "start" }}>
        <div style={{ background: "var(--color-card, white)", borderRadius: 16, border: `1px solid ${theme.border}`, padding: "18px 20px", display: "flex", flexDirection: "column", maxHeight: 500, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, flexShrink: 0 }}>
            <h3 style={{ fontSize: 12, fontWeight: 600, color: theme.dark, flex: 1 }}>{getPlanTitle(selectedPlanDate)}</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
              <button
                onClick={() => {
                  const prev = new Date(selectedPlanDate);
                  prev.setDate(prev.getDate() - 1);
                  setSelectedPlanDate(prev);
                }}
                style={{
                  width: 26, height: 26, borderRadius: 6, border: `1px solid ${theme.border}`,
                  background: "var(--color-card, white)", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: theme.muted, transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = theme.primary; e.currentTarget.style.color = theme.primary }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.color = theme.muted }}
                aria-label="Previous day"
              >
                <ChevronLeft size={14} />
              </button>
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => datePickerRef.current?.click()}
                  style={{
                    padding: "0 8px", height: 26, borderRadius: 6, border: `1px solid ${theme.border}`,
                    background: "var(--color-card, white)", cursor: "pointer",
                    fontSize: 11, fontWeight: 500, color: theme.dark,
                    display: "flex", alignItems: "center", gap: 4,
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = theme.primary }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = theme.border }}
                >
                  {selectedPlanDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </button>
                <input
                  ref={datePickerRef}
                  type="date"
                  value={toDateStr(selectedPlanDate)}
                  onChange={(e) => {
                    if (e.target.value) {
                      const parts = e.target.value.split("-");
                      setSelectedPlanDate(new Date(+parts[0], +parts[1] - 1, +parts[2]));
                    }
                  }}
                  style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
                />
              </div>
              <button
                onClick={() => {
                  const next = new Date(selectedPlanDate);
                  next.setDate(next.getDate() + 1);
                  setSelectedPlanDate(next);
                }}
                style={{
                  width: 26, height: 26, borderRadius: 6, border: `1px solid ${theme.border}`,
                  background: "var(--color-card, white)", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: theme.muted, transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = theme.primary; e.currentTarget.style.color = theme.primary }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.color = theme.muted }}
                aria-label="Next day"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
          {planLoading && <p style={{ fontSize: 12, color: theme.muted, textAlign: "center", padding: "20px 0" }}>{t("productivity.page.loading")}</p>}
          {!planLoading && planItems.length === 0 && (
            <p style={{ fontSize: 12, color: theme.muted, textAlign: "center", padding: "20px 0" }}>{getNoPlanMessage(selectedPlanDate)}</p>
          )}
          {planItems.map((item, i) => {
            const sm = STATUS_META[item.status] || null;
            return (
              <div key={item.id} onClick={() => setDetailEvent(item)} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 10, border: `1px solid ${theme.border}`, marginBottom: 6, background: "var(--color-card, white)", opacity: item.status === "Done" ? 0.75 : 1 }}>
                <div style={{ width: 6, height: 36, borderRadius: 3, background: item.color || theme.primary, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 500, color: theme.dark, textDecoration: item.status === "Done" ? "line-through" : "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</p>
                  {item.startTime && <p style={{ fontSize: 11, color: theme.muted }}>{item.startTime}</p>}
                </div>
                {sm && (
                  <span style={{ fontSize: 8, fontWeight: 600, padding: "1px 6px", borderRadius: 3, background: sm.bg, color: sm.color, border: `1px solid ${sm.border}`, flexShrink: 0, lineHeight: 1.4, letterSpacing: "0.01em" }}>
                    {tStatus(item.status)}
                  </span>
                )}
                <div onClick={(e) => handlePlanCircleToggle(e, item)} style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${priorityColor[item.priority] || theme.border}`, background: "transparent", flexShrink: 0, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {item.status === "Done" && <Check size={11} strokeWidth={3} color={priorityColor[item.priority] || theme.border} />}
                </div>
              </div>
            );
          })}
          </div>
        </div>

        <div style={{ background: "var(--color-card, white)", borderRadius: 16, border: `1px solid ${theme.border}`, padding: "18px 20px", display: "flex", flexDirection: "column", maxHeight: 500, overflow: "hidden" }}>
          <h3 style={{           fontSize: 12, fontWeight: 600, color: theme.dark, marginBottom: 12, flexShrink: 0 }}>
            {t("productivity.page.yourTasks")}
            {tasksLoading && <span style={{ fontSize: 11, fontWeight: 400, color: theme.muted, marginLeft: 6 }}>{t("productivity.page.loading")}</span>}
          </h3>
          <div style={{ display: "flex", gap: 4, background: theme.bg, borderRadius: 10, padding: 3, marginBottom: 14, flexShrink: 0 }}>
            {tabs.map((tab) => (
              <button key={tab} onClick={() => setActiveTaskTab(tab)} style={{ flex: 1, padding: "6px 4px", borderRadius: 8, border: "none", cursor: "pointer", background: activeTaskTab === tab ? "var(--color-card, white)" : "transparent", color: activeTaskTab === tab ? theme.primaryText : theme.muted, fontSize: 11, fontWeight: 500, transition: "all 0.15s", boxShadow: activeTaskTab === tab ? "0 1px 4px rgba(0,0,0,0.08)" : "none" }}>
                {tStatus(tab)}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 4, background: theme.bg, borderRadius: 10, padding: 3, marginBottom: 14, flexShrink: 0 }}>
            {["all", "high"].map(p => (
              <button key={p} onClick={() => setPriorityFilter(p)} style={{ flex: 1, padding: "6px 4px", borderRadius: 8, border: "none", cursor: "pointer", background: priorityFilter === p ? "var(--color-card, white)" : "transparent", color: priorityFilter === p ? theme.primaryText : theme.muted, fontSize: 11, fontWeight: 500, transition: "all 0.15s", boxShadow: priorityFilter === p ? "0 1px 4px rgba(0,0,0,0.08)" : "none" }}>
                {p === "all" ? "All" : `${t("productivity.eventForm.priority_high")} Priority`}
              </button>
            ))}
          </div>
          <div ref={doneScrollRef} onScroll={handleDoneScroll} style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
            {filteredTasks.length === 0 && !tasksLoading && (
              <p style={{ fontSize: 12, color: theme.muted, textAlign: "center", padding: "20px 0" }}>{t("productivity.page.noTasks")}</p>
            )}
            {visibleTasks.map(task => (
              <div key={task.id} onClick={() => handleTaskClick(task)}
                style={{ position: "relative", padding: "10px 12px", borderRadius: 10, border: `1px solid ${theme.border}`, marginBottom: 6, cursor: "pointer", transition: "all 0.15s", overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: theme.dark, textDecoration: "none", opacity: task.status === "Done" ? 0.6 : 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.title}</p>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: task.color || priorityColor[task.priority] || theme.secondary, flexShrink: 0, marginLeft: 8 }} />
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 10, color: theme.muted, display: "flex", alignItems: "center", gap: 3 }}>
                    <Clock3 size={10} />{task.status === "Done" && task.statusChangeAt ? `${t("productivity.page.finishOn")} ${formatFinishDate(task.statusChangeAt.slice(0, 10))}` : formatDateRange(task.startDatetime?.slice(0, 10), task.endDatetime?.slice(0, 10))}
                  </span>
                  {STATUS_META[task.status] && (
                    <span style={{ fontSize: 8, fontWeight: 600, padding: "1px 6px", borderRadius: 3, background: STATUS_META[task.status].bg, color: STATUS_META[task.status].color, border: `1px solid ${STATUS_META[task.status].border}`, lineHeight: 1.4, letterSpacing: "0.01em" }}>
                      {tStatus(task.status)}
                    </span>
                  )}
                </div>
                <TaskProgressBar progress={task.progress ?? 0} color={task.color || "#6366F1"} />
              </div>
            ))}
            {doneLoading && activeTaskTab === "Done" && (
              <p style={{ fontSize: 12, color: theme.muted, textAlign: "center", padding: "12px 0" }}>{t("productivity.page.loading")}</p>
            )}
          </div>
        </div>

      </div>

      <QuickAddModal open={quickAddOpen} onClose={() => setQuickAddOpen(false)} />

      <ActivityDetailModal
        activity={detailEvent}
        open={!!detailEvent}
        onClose={() => setDetailEvent(null)}
        onStatusChange={handleDetailStatusChange}
        onProgressChange={handleDetailProgressChange}
        onEdit={handleDetailEdit}
        onDelete={handleDetailDelete}
      />
    </div>
  );
}
