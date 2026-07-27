import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Clock3, ChevronLeft, ChevronRight, Check, Bell, ChevronUp, ChevronDown, Filter } from "lucide-react";
import { theme } from "../../theme";
import { productivityService } from "../../services/productivityService";
import { reminderService } from "../../services/reminderService";
import { STATUS_META } from "./utils/calendarConstants";
import ProductivityCalendar from "./calendar/ProductivityCalendar";
import AIPlanningAssistant from "./components/AIPlanningAssistant";
import QuickAddModal from "./components/QuickAddModal";
import RightDrawer from "./components/RightDrawer";
import ActivityDetailModal from "./modals/ActivityDetailModal";
import ReminderDetailModal from "./reminders/ReminderDetailModal";
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState("plan");
  const [allReminders, setAllReminders] = useState([]);
  const [remindersLoading, setRemindersLoading] = useState(true);
  const [viewingReminder, setViewingReminder] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isWideScreen, setIsWideScreen] = useState(false);
  const [taskStatusFilter, setTaskStatusFilter] = useState("all");
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const filterBtnRef = useRef(null);

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

  const fetchAllReminders = useCallback(async () => {
    try {
      const result = await reminderService.getAll();
      setAllReminders(result.reminders);
    } catch {
      setAllReminders([]);
    } finally {
      setRemindersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllReminders();
  }, [fetchAllReminders]);

  useEffect(() => {
    const handler = () => { fetchAllTasks(); fetchAllReminders(); };
    window.addEventListener(EVENT_TASKS_UPDATED, handler);
    return () => window.removeEventListener(EVENT_TASKS_UPDATED, handler);
  }, [fetchAllTasks, fetchAllReminders]);

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

  const handleReminderClick = useCallback((reminder) => {
    setViewingReminder(reminder);
  }, []);

  const handleReminderEdit = useCallback((reminder) => {
    setViewingReminder(null);
    calendarRef.current?.editActivity({ ...reminder, hasDeadline: false, _isReminder: true });
  }, []);

  const handleReminderDelete = useCallback(async (id) => {
    try {
      await reminderService.delete(id);
      setAllReminders(prev => prev.filter(r => r.id !== id));
      setViewingReminder(null);
      notifyTasksUpdated();
    } catch {
    }
  }, []);

  useEffect(() => {
    setDonePage(1);
  }, [taskStatusFilter, allTasks.length]);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 1000px)")
    setIsCompact(mql.matches)
    const handler = (e) => setIsCompact(e.matches)
    mql.addEventListener("change", handler)
    return () => mql.removeEventListener("change", handler)
  }, [])

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 1024px)")
    setIsMobile(mql.matches)
    const handler = (e) => setIsMobile(e.matches)
    mql.addEventListener("change", handler)
    return () => mql.removeEventListener("change", handler)
  }, [])

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1100px)")
    setIsWideScreen(mql.matches)
    const handler = (e) => setIsWideScreen(e.matches)
    mql.addEventListener("change", handler)
    return () => mql.removeEventListener("change", handler)
  }, [])

  useEffect(() => {
    if (!showFilterPopover) return
    const handler = (e) => {
      if (filterBtnRef.current && !filterBtnRef.current.contains(e.target)) {
        setShowFilterPopover(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [showFilterPopover])

  const handleDoneScroll = useCallback(() => {
    const el = doneScrollRef.current;
    if (!el || doneLoading) return;
    if (taskStatusFilter !== "Done") return;
    const totalDone = allTasks.filter(t => t.status === "Done").length;
    if (donePage * DONE_PAGE_SIZE >= totalDone) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 40) {
      setDoneLoading(true);
      setTimeout(() => {
        setDonePage(p => p + 1);
        setDoneLoading(false);
      }, 200);
    }
  }, [doneLoading, taskStatusFilter, donePage, allTasks]);

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
      if (taskStatusFilter !== "all" && t.status !== taskStatusFilter) return false;
      return true;
    })
    .filter(t => priorityFilter === "all" || t.priority === priorityFilter)
    .sort((a, b) => {
      if (taskStatusFilter === "Done") {
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

  const visibleTasks = taskStatusFilter === "Done"
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

  const isDrawerDetailOpen = !!detailEvent || !!viewingReminder;

  const isDrawerInline = isWideScreen

  return (
    <div style={{ position: "fixed", top: 0, left: isMobile ? 0 : 260, right: 0, bottom: 0, display: "flex", flexDirection: "column", background: theme.bg }}>
      {/* Workspace: calendar + inline panel */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>
        <div style={{ flex: 1, minWidth: 0, overflowY: "auto", transition: "width 280ms cubic-bezier(0.4, 0, 0.2, 1)" }}>
          <ProductivityCalendar ref={calendarRef} onActivityUpdated={fetchAllTasks} calendarRefreshKey={calendarRefreshKey} onQuickAdd={() => setQuickAddOpen(true)} onDrawerToggle={() => setDrawerOpen(true)} showDrawerToggle={!isDrawerInline} />
        </div>

        {/* Drawer handle */}
        {isDrawerInline && (
          <button
            onClick={() => setDrawerOpen(v => !v)}
            aria-label={drawerOpen ? "Close side panel" : "Open side panel"}
            style={{
              position: "absolute",
              right: drawerOpen ? 320 : 0,
              top: "50%",
              transform: `translateY(-50%) rotate(${drawerOpen ? 180 : 0}deg)`,
              zIndex: 11,
              width: 28,
              height: 72,
              borderRadius: "10px 0 0 10px",
              border: "none",
              background: theme.bg,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: theme.muted,
              transition: "right 280ms cubic-bezier(0.4, 0, 0.2, 1), transform 280ms cubic-bezier(0.4, 0, 0.2, 1), color 0.15s, background 0.15s",
              boxShadow: "-1px 0 6px rgba(0,0,0,0.04)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = theme.dark; e.currentTarget.style.background = `color-mix(in srgb, ${theme.border} 30%, ${theme.bg})` }}
            onMouseLeave={(e) => { e.currentTarget.style.color = theme.muted; e.currentTarget.style.background = theme.bg }}
          >
            <ChevronLeft size={22} strokeWidth={2.5} />
          </button>
        )}

        <RightDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          isModalOpen={isDrawerDetailOpen}
          variant={isDrawerInline ? "inline" : "overlay"}
          header={
          <div style={{ display: "flex", flexDirection: "column" }}>
            {/* Section Selector */}
            <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${theme.border}`, marginBottom: drawerTab === "plan" ? 14 : 12 }}>
              {[
                { key: "plan", label: t("productivity.page.todaysPlan") },
                { key: "tasks", label: t("productivity.page.yourTasks") },
                { key: "reminders", label: "Reminders" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setDrawerTab(key)}
                  style={{
                    flex: 1,
                    padding: "8px 0",
                    background: "none",
              border: `1px solid ${theme.border}`,
              borderRight: "none",
                    borderBottom: `2px solid ${drawerTab === key ? theme.primary : "transparent"}`,
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: drawerTab === key ? 600 : 500,
                    color: drawerTab === key ? theme.primary : theme.muted,
                    transition: "all 0.15s",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Plan: date picker row */}
            {drawerTab === "plan" && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h3 style={{ fontSize: 12, fontWeight: 600, color: theme.dark, flex: 1 }}>{getPlanTitle(selectedPlanDate)}</h3>
                <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <button
                    onClick={() => { const prev = new Date(selectedPlanDate); prev.setDate(prev.getDate() - 1); setSelectedPlanDate(prev); }}
                    style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${theme.border}`, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: theme.muted, transition: "all 0.15s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = theme.primary; e.currentTarget.style.color = theme.primary }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.color = theme.muted }}
                    aria-label="Previous day"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <div style={{ position: "relative" }}>
                    <button
                      onClick={() => datePickerRef.current?.click()}
                      style={{ padding: "0 8px", height: 26, borderRadius: 6, border: `1px solid ${theme.border}`, background: "transparent", cursor: "pointer", fontSize: 11, fontWeight: 500, color: theme.dark, display: "flex", alignItems: "center", gap: 4, transition: "all 0.15s" }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = theme.primary }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = theme.border }}
                    >
                      {selectedPlanDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </button>
                    <input
                      ref={datePickerRef}
                      type="date"
                      value={toDateStr(selectedPlanDate)}
                      onChange={(e) => { if (e.target.value) { const parts = e.target.value.split("-"); setSelectedPlanDate(new Date(+parts[0], +parts[1] - 1, +parts[2])); } }}
                      style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
                    />
                  </div>
                  <button
                    onClick={() => { const next = new Date(selectedPlanDate); next.setDate(next.getDate() + 1); setSelectedPlanDate(next); }}
                    style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${theme.border}`, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: theme.muted, transition: "all 0.15s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = theme.primary; e.currentTarget.style.color = theme.primary }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.color = theme.muted }}
                    aria-label="Next day"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Tasks: title + filter */}
            {drawerTab === "tasks" && (
              <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
                <h3 style={{ fontSize: 12, fontWeight: 600, color: theme.dark, flex: 1 }}>
                  {t("productivity.page.yourTasks")}
                  {tasksLoading && <span style={{ fontSize: 11, fontWeight: 400, color: theme.muted, marginLeft: 6 }}>{t("productivity.page.loading")}</span>}
                </h3>
                <div ref={filterBtnRef} style={{ position: "relative" }}>
                  <button
                    onClick={() => setShowFilterPopover(v => !v)}
                    style={{
                      width: 26, height: 26, borderRadius: 6,
                      border: `1px solid ${(taskStatusFilter !== "all" || priorityFilter !== "all") ? theme.primary : theme.border}`,
                      background: (taskStatusFilter !== "all" || priorityFilter !== "all")
                        ? `color-mix(in srgb, ${theme.primary} 8%, transparent)`
                        : "transparent",
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                      color: (taskStatusFilter !== "all" || priorityFilter !== "all") ? theme.primary : theme.muted,
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = theme.primary; e.currentTarget.style.color = theme.primary }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = (taskStatusFilter !== "all" || priorityFilter !== "all") ? theme.primary : theme.border;
                      e.currentTarget.style.color = (taskStatusFilter !== "all" || priorityFilter !== "all") ? theme.primary : theme.muted;
                    }}
                  >
                    <Filter size={12} />
                  </button>

                  {showFilterPopover && (
                    <div style={{
                      position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: theme.z.dropdown,
                      background: "var(--color-card, white)", borderRadius: 10,
                      border: `1px solid ${theme.border}`, boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                      padding: 10, width: 160,
                    }}>
                      <p style={{ fontSize: 10, fontWeight: 600, color: theme.muted, textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 6px 0" }}>Status</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 10 }}>
                        {[{ key: "all", label: "All" }, { key: "To Do", label: tStatus("To Do") }, { key: "In Progress", label: tStatus("In Progress") }, { key: "Done", label: tStatus("Done") }].map(({ key, label }) => (
                          <button key={key} onClick={() => setTaskStatusFilter(key)} style={{
                            padding: "5px 8px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 500, textAlign: "left",
                            background: taskStatusFilter === key ? `color-mix(in srgb, ${theme.primary} 10%, transparent)` : "transparent",
                            color: taskStatusFilter === key ? theme.primary : theme.dark,
                            transition: "all 0.1s",
                          }}
                            onMouseEnter={(e) => { if (taskStatusFilter !== key) e.currentTarget.style.background = theme.bg }}
                            onMouseLeave={(e) => { if (taskStatusFilter !== key) e.currentTarget.style.background = "transparent" }}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      <div style={{ height: 1, background: theme.border, margin: "0 0 8px 0" }} />
                      <p style={{ fontSize: 10, fontWeight: 600, color: theme.muted, textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 6px 0" }}>Priority</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {[{ key: "all", label: "All" }, { key: "high", label: `${t("productivity.eventForm.priority_high")}` }].map(({ key, label }) => (
                          <button key={key} onClick={() => setPriorityFilter(key)} style={{
                            padding: "5px 8px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 500, textAlign: "left",
                            background: priorityFilter === key ? `color-mix(in srgb, ${theme.primary} 10%, transparent)` : "transparent",
                            color: priorityFilter === key ? theme.primary : theme.dark,
                            transition: "all 0.1s",
                          }}
                            onMouseEnter={(e) => { if (priorityFilter !== key) e.currentTarget.style.background = theme.bg }}
                            onMouseLeave={(e) => { if (priorityFilter !== key) e.currentTarget.style.background = "transparent" }}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        }
      >
        {/* Scrollable content */}
        {drawerTab === "plan" && (
          <div>
            {planLoading && <p style={{ fontSize: 12, color: theme.muted, textAlign: "center", padding: "20px 0" }}>{t("productivity.page.loading")}</p>}
            {!planLoading && planItems.length === 0 && (
              <p style={{ fontSize: 12, color: theme.muted, textAlign: "center", padding: "20px 0" }}>{getNoPlanMessage(selectedPlanDate)}</p>
            )}
            {planItems.map((item) => {
              const sm = STATUS_META[item.status] || null;
              return (
                <div key={item.id} onClick={() => setDetailEvent(item)} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, border: `1px solid ${theme.border}`, marginBottom: 8, transition: "all 0.15s", opacity: item.status === "Done" ? 0.75 : 1 }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = theme.accent; e.currentTarget.style.background = theme.bg }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.background = "transparent" }}
                >
                  <div style={{ width: 4, height: 32, borderRadius: 2, background: item.color || theme.primary, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: theme.dark, textDecoration: item.status === "Done" ? "line-through" : "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</p>
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
        )}

        {drawerTab === "tasks" && (
          <div ref={doneScrollRef} onScroll={handleDoneScroll}>
            {filteredTasks.length === 0 && !tasksLoading && (
              <p style={{ fontSize: 12, color: theme.muted, textAlign: "center", padding: "20px 0" }}>{t("productivity.page.noTasks")}</p>
            )}
            {visibleTasks.map(task => (
              <div key={task.id} onClick={() => handleTaskClick(task)}
                style={{ position: "relative", padding: "10px 12px", borderRadius: 10, border: `1px solid ${theme.border}`, marginBottom: 8, cursor: "pointer", transition: "all 0.15s" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = theme.accent; e.currentTarget.style.background = theme.bg }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.background = "transparent" }}
              >
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
            {doneLoading && taskStatusFilter === "Done" && (
              <p style={{ fontSize: 12, color: theme.muted, textAlign: "center", padding: "12px 0" }}>{t("productivity.page.loading")}</p>
            )}
          </div>
        )}

        {drawerTab === "reminders" && (
          <div>
            {remindersLoading && <p style={{ fontSize: 12, color: theme.muted, textAlign: "center", padding: "20px 0" }}>{t("productivity.page.loading")}</p>}
            {!remindersLoading && allReminders.length === 0 && (
              <p style={{ fontSize: 12, color: theme.muted, textAlign: "center", padding: "20px 0" }}>No reminders yet.</p>
            )}
            {allReminders.map((rem) => (
              <div key={rem.id} onClick={() => handleReminderClick(rem)} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                borderRadius: 10, border: `1px solid ${theme.border}`, marginBottom: 8,
                transition: "all 0.15s", cursor: "pointer",
              }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = theme.accent; e.currentTarget.style.background = theme.bg }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.background = "transparent" }}
              >
                <div style={{ width: 4, height: 32, borderRadius: 2, background: rem.color || "#F59E0B", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: theme.dark, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>{rem.title}</p>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 2 }}>
                    {rem.datetime && (
                      <span style={{ fontSize: 10, color: theme.muted, display: "flex", alignItems: "center", gap: 3 }}>
                        <Bell size={9} />{rem.datetime.slice(0, 10)} {rem.datetime.slice(11, 16)}
                      </span>
                    )}
                  </div>
                </div>
                <span style={{ fontSize: 8, fontWeight: 600, padding: "1px 6px", borderRadius: 3, background: `${rem.color}18`, color: rem.color, lineHeight: 1.4, letterSpacing: "0.01em", flexShrink: 0 }}>
                  {rem.priority}
                </span>
              </div>
            ))}
          </div>
        )}
      </RightDrawer>
      </div>

      <div style={{
        padding: isCompact ? "12px 16px" : "16px 32px",
        background: theme.bg,
        borderTop: `1px solid ${theme.border}`,
        flexShrink: 0,
      }}>
        <AIPlanningAssistant />
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
        elevated
      />

      <ReminderDetailModal
        reminder={viewingReminder}
        open={!!viewingReminder}
        onClose={() => setViewingReminder(null)}
        onEdit={handleReminderEdit}
        onDelete={handleReminderDelete}
        elevated
      />
    </div>
  );
}
