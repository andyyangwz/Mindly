import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, Clock3, Check, Bell, Filter } from "lucide-react";
import { schedulingService } from "../../services/schedulingService";
import { reminderService } from "../../services/reminderService";
import { STATUS_META } from "./utils/calendarConstants";
import SchedulingCalendar from "./calendar/SchedulingCalendar";
import AIPlanningAssistant from "./components/AIPlanningAssistant";
import QuickAddModal from "./components/QuickAddModal";
import RightDrawer from "./components/RightDrawer";
import ActivityDetailModal from "./modals/ActivityDetailModal";
import ReminderDetailModal from "./reminders/ReminderDetailModal";
import { notifyTasksUpdated, EVENT_TASKS_UPDATED } from "../../utils/events";
import TaskProgressBar from "../dashboard/components/TaskProgressBar";
import "../../styles/scheduling/index.css"

const priorityColor = {
  high: "var(--color-primary)",
  medium: "var(--color-secondary)",
  low: "var(--color-accent)",
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

export default function SchedulingPage() {
  const { t } = useTranslation();
  const [allTasks, setAllTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [detailEvent, setDetailEvent] = useState(null);
  const [donePage, setDonePage] = useState(1);
  const [doneLoading, setDoneLoading] = useState(false);
  const doneScrollRef = useRef(null);
  const calendarRef = useRef(null);
  const calScrollRef = useRef(null);
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

    if (isSameDay(date, today)) return t("scheduling.page.todaysPlan");
    if (isSameDay(date, tomorrow)) return t("scheduling.page.tomorrowsPlan");
    if (isSameDay(date, yesterday)) return t("scheduling.page.yesterdaysPlan");
    return date.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" }) + "'s Plan";
  }

  const DONE_PAGE_SIZE = 10;

  const tStatus = (s) => {
    const k = { "To Do": "todo", "In Progress": "inProgress", "Done": "done" };
    return t(`scheduling.status.${k[s]}`);
  };

  const fetchAllTasks = useCallback(async () => {
    try {
      const result = await schedulingService.getAll();
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
      await schedulingService.update(event.id, update);
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
      await schedulingService.update(event.id, { progress: newProgress });
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
      await schedulingService.delete(id);
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
      await schedulingService.update(item.id, { status: nextStatus });
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
    <div className="pp-container" style={{ left: isMobile ? 0 : 260 }}>
      {/* Workspace: calendar + inline panel */}
      <div className="pp-workspace">
        <div ref={calScrollRef} className="pp-calendar-area">
          <SchedulingCalendar ref={calendarRef} scrollContainerRef={calScrollRef} onActivityUpdated={fetchAllTasks} calendarRefreshKey={calendarRefreshKey} onQuickAdd={() => setQuickAddOpen(true)} onDrawerToggle={() => setDrawerOpen(true)} showDrawerToggle={!isDrawerInline} />
        </div>

        {isDrawerInline && (
          <button
            onClick={() => setDrawerOpen(v => !v)}
            aria-label={drawerOpen ? "Close side panel" : "Open side panel"}
            className="pp-drawer-btn"
            style={{
              right: drawerOpen ? 320 : 0,
              transform: `translateY(-50%) rotate(${drawerOpen ? 180 : 0}deg)`,
            }}
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
          <div className="pp-drawer-header">
            <div className="pp-tab-bar" style={{ marginBottom: drawerTab === "plan" ? 14 : 12 }}>
              {[
                { key: "plan", label: t("scheduling.page.todaysPlan") },
                { key: "tasks", label: t("scheduling.page.yourTasks") },
                { key: "reminders", label: "Reminders" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setDrawerTab(key)}
                  className={`pp-tab-btn${drawerTab === key ? " pp-tab-btn-active" : ""}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {drawerTab === "plan" && (
              <div className="pp-plan-header">
                <h3 className="pp-plan-title">{getPlanTitle(selectedPlanDate)}</h3>
                <div className="pp-plan-nav">
                  <button
                    onClick={() => { const prev = new Date(selectedPlanDate); prev.setDate(prev.getDate() - 1); setSelectedPlanDate(prev); }}
                    className="pp-nav-btn"
                    aria-label="Previous day"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <div className="pp-date-picker-wrapper">
                    <button
                      onClick={() => datePickerRef.current?.click()}
                      className="pp-date-picker-btn"
                    >
                      {selectedPlanDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </button>
                    <input
                      ref={datePickerRef}
                      type="date"
                      value={toDateStr(selectedPlanDate)}
                      onChange={(e) => { if (e.target.value) { const parts = e.target.value.split("-"); setSelectedPlanDate(new Date(+parts[0], +parts[1] - 1, +parts[2])); } }}
                      className="pp-hidden-date-input"
                    />
                  </div>
                  <button
                    onClick={() => { const next = new Date(selectedPlanDate); next.setDate(next.getDate() + 1); setSelectedPlanDate(next); }}
                    className="pp-nav-btn"
                    aria-label="Next day"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {drawerTab === "tasks" && (
              <div className="pp-tasks-header">
                <h3 className="pp-tasks-title">
                  {t("scheduling.page.yourTasks")}
                  {tasksLoading && <span className="pp-loading-hint">{t("scheduling.page.loading")}</span>}
                </h3>
                <div ref={filterBtnRef} className="pp-filter-wrapper">
                  <button
                    onClick={() => setShowFilterPopover(v => !v)}
                    className={`pp-filter-btn ${(taskStatusFilter !== "all" || priorityFilter !== "all") ? "pp-filter-btn-active" : "pp-filter-btn-inactive"}`}
                  >
                    <Filter size={12} />
                  </button>

                  {showFilterPopover && (
                    <div className="pp-filter-popover">
                      <p className="pp-filter-section-title">Status</p>
                      <div className="pp-filter-options pp-filter-options--mb">
                        {[{ key: "all", label: "All" }, { key: "To Do", label: tStatus("To Do") }, { key: "In Progress", label: tStatus("In Progress") }, { key: "Done", label: tStatus("Done") }].map(({ key, label }) => (
                          <button
                            key={key}
                            onClick={() => setTaskStatusFilter(key)}
                            className="pp-filter-option"
                            style={{
                              background: taskStatusFilter === key ? `color-mix(in srgb, var(--color-primary) 10%, transparent)` : "transparent",
                              color: taskStatusFilter === key ? "var(--color-primary)" : "var(--color-dark)",
                            }}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      <div className="pp-filter-separator" />
                      <p className="pp-filter-section-title">Priority</p>
                      <div className="pp-filter-options">
                        {[{ key: "all", label: "All" }, { key: "high", label: `${t("scheduling.eventForm.priority_high")}` }].map(({ key, label }) => (
                          <button
                            key={key}
                            onClick={() => setPriorityFilter(key)}
                            className="pp-filter-option"
                            style={{
                              background: priorityFilter === key ? `color-mix(in srgb, var(--color-primary) 10%, transparent)` : "transparent",
                              color: priorityFilter === key ? "var(--color-primary)" : "var(--color-dark)",
                            }}
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
            {planLoading && <p className="pp-empty-state">{t("scheduling.page.loading")}</p>}
            {!planLoading && planItems.length === 0 && (
              <p className="pp-empty-state">{getNoPlanMessage(selectedPlanDate)}</p>
            )}
            {planItems.map((item) => {
              const sm = STATUS_META[item.status] || null;
              return (
                <div
                  key={item.id}
                  onClick={() => setDetailEvent(item)}
                  className={`pp-list-item${item.status === "Done" ? " pp-list-item-done" : ""}`}
                >
                  <div className="pp-color-bar" style={{ background: item.color || "var(--color-primary)" }} />
                  <div className="pp-item-body">
                    <p className={`pp-item-title${item.status === "Done" ? " pp-item-title-done" : ""}`}>{item.title}</p>
                    {item.startTime && <p className="pp-item-time">{item.startTime}</p>}
                  </div>
                  {sm && (
                    <span className="pp-status-badge" style={{ background: sm.bg, color: sm.color, border: `1px solid ${sm.border}` }}>
                      {tStatus(item.status)}
                    </span>
                  )}
                  <div
                    onClick={(e) => handlePlanCircleToggle(e, item)}
                    className="pp-check-circle"
                    style={{ border: `2px solid ${priorityColor[item.priority] || "var(--color-border)"}` }}
                  >
                    {item.status === "Done" && <Check size={11} strokeWidth={3} color={priorityColor[item.priority] || "var(--color-border)"} />}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {drawerTab === "tasks" && (
          <div ref={doneScrollRef} onScroll={handleDoneScroll}>
            {filteredTasks.length === 0 && !tasksLoading && (
              <p className="pp-empty-state">{t("scheduling.page.noTasks")}</p>
            )}
            {visibleTasks.map(task => (
              <div key={task.id} onClick={() => handleTaskClick(task)} className="pp-task-card">
                <div className="pp-task-top-row">
                  <p className={`pp-item-title${task.status === "Done" ? " pp-item-title-task-done" : ""}`}>{task.title}</p>
                  <div className="pp-task-dot" style={{ background: task.color || priorityColor[task.priority] || "var(--color-secondary)" }} />
                </div>
                <div className="pp-task-meta">
                  <span className="pp-task-meta-icon">
                    <Clock3 size={10} />{task.status === "Done" && task.statusChangeAt ? `${t("scheduling.page.finishOn")} ${formatFinishDate(task.statusChangeAt.slice(0, 10))}` : formatDateRange(task.startDatetime?.slice(0, 10), task.endDatetime?.slice(0, 10))}
                  </span>
                  {STATUS_META[task.status] && (
                    <span className="pp-status-badge" style={{ background: STATUS_META[task.status].bg, color: STATUS_META[task.status].color, border: `1px solid ${STATUS_META[task.status].border}` }}>
                      {tStatus(task.status)}
                    </span>
                  )}
                </div>
                <TaskProgressBar progress={task.progress ?? 0} color={task.color || "#6366F1"} />
              </div>
            ))}
            {doneLoading && taskStatusFilter === "Done" && (
              <p className="pp-loading-state">{t("scheduling.page.loading")}</p>
            )}
          </div>
        )}

        {drawerTab === "reminders" && (
          <div>
            {remindersLoading && <p className="pp-empty-state">{t("scheduling.page.loading")}</p>}
            {!remindersLoading && allReminders.length === 0 && (
              <p className="pp-empty-state">No reminders yet.</p>
            )}
            {allReminders.map((rem) => (
              <div
                key={rem.id}
                onClick={() => handleReminderClick(rem)}
                className="pp-list-item"
              >
                <div className="pp-color-bar" style={{ background: rem.color || "#F59E0B" }} />
                <div className="pp-item-body">
                  <p className="pp-item-title">{rem.title}</p>
                  <div className="pp-task-meta pp-task-meta--reminder">
                    {rem.datetime && (
                      <span className="pp-task-meta-icon">
                        <Bell size={9} />{rem.datetime.slice(0, 10)} {rem.datetime.slice(11, 16)}
                      </span>
                    )}
                  </div>
                </div>
                <span className="pp-status-badge" style={{ background: `${rem.color}18`, color: rem.color }}>
                  {rem.priority}
                </span>
              </div>
            ))}
          </div>
        )}
      </RightDrawer>
      </div>

      <div className="pp-ai-bar" style={{ padding: isCompact ? "12px 16px" : "16px 32px" }}>
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
