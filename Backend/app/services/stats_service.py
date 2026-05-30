from datetime import date, datetime, timedelta
from collections import defaultdict
from sqlalchemy import or_, and_
from app.models.productivity import ProductivityEvent




def _overlap_minutes(ev, range_start, range_end):
    overlap_start = max(ev.start_datetime, range_start)
    overlap_end = min(ev.end_datetime, range_end)
    return max(0, (overlap_end - overlap_start).total_seconds() / 60)


def _day_minutes(ev, target_date):
    target_start = datetime.combine(target_date, datetime.min.time())
    target_end = datetime.combine(target_date, datetime.max.time())
    return _overlap_minutes(ev, target_start, target_end)


class StatsService:
    @staticmethod
    def get_home_stats(user_id):
        today = date.today()
        today_start = datetime.combine(today, datetime.min.time())
        today_end = datetime.combine(today, datetime.max.time())

        all_tasks = ProductivityEvent.query.filter(
            ProductivityEvent.user_id == user_id,
            ProductivityEvent.has_deadline == True,
            or_(
                and_(
                    ProductivityEvent.start_datetime <= today_end,
                    ProductivityEvent.end_datetime >= today_start,
                ),
                ProductivityEvent.status == "In Progress",
            ),
        ).all()
        y = sum(1 for ev in all_tasks if ev.status == "Done")
        x = len(all_tasks)

        today_events = ProductivityEvent.query.filter(
            ProductivityEvent.user_id == user_id,
            ProductivityEvent.has_deadline == False,
            ProductivityEvent.status == "Done",
            ProductivityEvent.start_datetime < today_end,
            ProductivityEvent.end_datetime > today_start,
        ).all()

        productive_minutes = 0
        unproductive_minutes = 0

        for ev in today_events:
            level = ev.productivity_level
            if level not in ("productive", "unproductive"):
                continue
            duration = _overlap_minutes(ev, today_start, today_end)
            if level == "productive":
                productive_minutes += duration
            elif level == "unproductive":
                unproductive_minutes += duration

        total_minutes = productive_minutes + unproductive_minutes
        if total_minutes == 0:
            productivity_pct = None
        else:
            productivity_pct = round((productive_minutes / total_minutes) * 100)

        return {
            "tasks_completed": str(y),
            "tasks_total": str(x),
            "productivity_pct": productivity_pct,
        }

    @staticmethod
    def get_weekly_stats(user_id, week_start=None):
        today = date.today()
        if week_start is None:
            week_start = today - timedelta(days=6)
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
        ).all()

        tasks_by_day = defaultdict(set)
        for ev in completed_tasks:
            if ev.status_change_at:
                day = ev.status_change_at.date()
                tasks_by_day[day].add(ev.id)

        done_events = ProductivityEvent.query.filter(
            ProductivityEvent.user_id == user_id,
            ProductivityEvent.has_deadline == False,
            ProductivityEvent.productivity_level == "productive",
            ProductivityEvent.status == "Done",
            ProductivityEvent.start_datetime < end_dt,
            ProductivityEvent.end_datetime > start_dt,
        ).all()

        minutes_by_day = defaultdict(float)
        for ev in done_events:
            for day in dates:
                m = _day_minutes(ev, day)
                if m:
                    minutes_by_day[day] += m

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
                "label": day.strftime("%a"),
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
