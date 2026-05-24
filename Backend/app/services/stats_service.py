from datetime import date, datetime, timedelta
from collections import defaultdict
from app.models.productivity import ProductivityEvent


DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]


class StatsService:
    @staticmethod
    def get_home_stats(user_id):
        today = date.today()
        week_start = today - timedelta(days=today.weekday())

        task_events = ProductivityEvent.query.filter(
            ProductivityEvent.user_id == user_id,
            ProductivityEvent.has_deadline == True,
            ProductivityEvent.task_group_id.isnot(None),
        ).all()

        groups = defaultdict(list)
        for ev in task_events:
            groups[ev.task_group_id].append(ev)

        y = 0
        x = 0

        for events in groups.values():
            start = next((e for e in events if not e.is_deadline_marker), None)
            deadline = next((e for e in events if e.is_deadline_marker), None)
            if not start or not deadline:
                continue

            if start.event_date > today:
                continue

            if start.status == "Done":
                y += 1

            if deadline.deadline_date and deadline.deadline_date >= today:
                x += 1

        week_events = ProductivityEvent.query.filter(
            ProductivityEvent.user_id == user_id,
            ProductivityEvent.event_date >= week_start,
            ProductivityEvent.event_date <= today,
            ProductivityEvent.has_deadline == False,
            ProductivityEvent.status == "Done",
        ).all()

        productive_minutes = 0
        unproductive_minutes = 0

        for ev in week_events:
            level = ev.productivity_level
            if level not in ("productive", "unproductive"):
                continue
            start_mins = ev.start_time.hour * 60 + ev.start_time.minute
            end_mins = ev.end_time.hour * 60 + ev.end_time.minute
            duration = max(0, end_mins - start_mins)
            if level == "productive":
                productive_minutes += duration
            elif level == "unproductive":
                unproductive_minutes += duration

        total_minutes = productive_minutes + unproductive_minutes
        if total_minutes == 0:
            productivity_pct = 0
        else:
            productivity_pct = round((productive_minutes / total_minutes) * 100)

        return {
            "tasks_completed": str(y),
            "tasks_total": str(x + y),
            "productivity_pct": productivity_pct,
        }

    @staticmethod
    def get_weekly_stats(user_id, week_start=None):
        today = date.today()
        if week_start is None:
            week_start = today - timedelta(days=today.weekday())
        elif isinstance(week_start, str):
            week_start = datetime.strptime(week_start, "%Y-%m-%d").date()
        week_end = week_start + timedelta(days=6)

        start_dt = datetime.combine(week_start, datetime.min.time())
        end_dt = datetime.combine(week_end, datetime.max.time())

        dates = []
        cur = week_start
        while cur <= week_end:
            dates.append(cur)
            cur += timedelta(days=1)

        completed_tasks = ProductivityEvent.query.filter(
            ProductivityEvent.user_id == user_id,
            ProductivityEvent.has_deadline == True,
            ProductivityEvent.status == "Done",
            ProductivityEvent.status_change_at >= start_dt,
            ProductivityEvent.status_change_at <= end_dt,
            ProductivityEvent.is_deadline_marker == False,
        ).all()

        tasks_by_day = defaultdict(set)
        for ev in completed_tasks:
            if ev.status_change_at:
                day = ev.status_change_at.date()
                tasks_by_day[day].add(ev.task_group_id)

        productive_events = ProductivityEvent.query.filter(
            ProductivityEvent.user_id == user_id,
            ProductivityEvent.has_deadline == False,
            ProductivityEvent.productivity_level == "productive",
            ProductivityEvent.status == "Done",
            ProductivityEvent.event_date >= week_start,
            ProductivityEvent.event_date <= week_end,
        ).all()

        minutes_by_day = defaultdict(float)
        for ev in productive_events:
            start_mins = ev.start_time.hour * 60 + ev.start_time.minute
            end_mins = ev.end_time.hour * 60 + ev.end_time.minute
            duration = max(0, end_mins - start_mins)
            minutes_by_day[ev.event_date] += duration

        week_days = []
        total_minutes = 0
        total_tasks = 0

        for i, day in enumerate(dates):
            tasks = len(tasks_by_day.get(day, set()))
            minutes = minutes_by_day.get(day, 0)
            total_minutes += minutes
            total_tasks += tasks
            month_names_short = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                                   "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
            week_days.append({
                "label": DAY_LABELS[i],
                "tasks": tasks,
                "minutes": round(minutes),
                "dayOfMonth": day.day,
                "month": month_names_short[day.month - 1],
                "isPast": day < today,
                "isToday": day == today,
                "isFuture": day > today,
            })

        total_hours = round(total_minutes / 60, 1)
        avg_hours = round(total_hours / 7, 1) if len(dates) > 0 else 0

        month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                       "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

        if week_start.month == week_end.month:
            date_range = f"{month_names[week_start.month - 1]} {week_start.day} - {week_end.day}"
        else:
            date_range = f"{month_names[week_start.month - 1]} {week_start.day} - {month_names[week_end.month - 1]} {week_end.day}"

        return {
            "weekDays": week_days,
            "totalHours": total_hours,
            "tasksDone": total_tasks,
            "avgHours": avg_hours,
            "dateRange": date_range,
        }
