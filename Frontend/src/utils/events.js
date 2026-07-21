export const EVENT_TASKS_UPDATED = "tasks-updated";

export function notifyTasksUpdated() {
  window.dispatchEvent(new CustomEvent(EVENT_TASKS_UPDATED));
}
