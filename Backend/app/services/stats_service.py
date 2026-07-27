from datetime import date, datetime, timedelta
from collections import defaultdict
import logging
from sqlalchemy import or_, and_
from app.models.activity import Activity
from app.models.task import Task

logger = logging.getLogger(__name__)


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
        week_start = today - timedelta(days=6)
        week_end = today

        week_start_dt = datetime.combine(week_start, datetime.min.time())
        week_end_dt = datetime.combine(week_end, datetime.max.time())

        all_tasks = Task.query.filter(
            Task.user_id == user_id,
            or_(
                and_(
                    Task.start_datetime <= week_end_dt,
                    Task.deadline_datetime >= week_start_dt,
                ),
                Task.status == "In Progress",
            ),
        ).all()

        done_count = sum(1 for t in all_tasks if t.status == "Done")
        task_left_count = sum(1 for t in all_tasks if t.status == "In Progress")
        total_tasks = len(all_tasks)

        done_activities = Activity.query.filter(
            Activity.user_id == user_id,
            Activity.status == "Done",
            Activity.start_datetime < week_end_dt,
            Activity.end_datetime > week_start_dt,
        ).all()

        productive_minutes = 0
        unproductive_minutes = 0
        total_minutes = 0

        for ev in done_activities:
            duration = _overlap_minutes(ev, week_start_dt, week_end_dt)
            total_minutes += duration
            level = ev.productivity_level
            if level == "productive":
                productive_minutes += duration
            elif level == "unproductive":
                unproductive_minutes += duration

        if total_minutes == 0:
            productivity_pct = None
        else:
            productivity_pct = round((productive_minutes / total_minutes) * 100)

        logger.info(
            "[STATS] get_home_stats — tasks=%d done=%d left=%d, activities=%d total_min=%d productive_min=%d unproductive_min=%d, pct=%s%%",
            total_tasks, done_count, task_left_count,
            len(done_activities), round(total_minutes), round(productive_minutes), round(unproductive_minutes),
            productivity_pct,
        )

        return {
            "tasks_completed": str(done_count),
            "tasks_total": str(total_tasks),
            "task_left": task_left_count,
            "productivity_pct": productivity_pct,
            "total_unproductive_minutes": round(unproductive_minutes),
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

        completed_tasks = Task.query.filter(
            Task.user_id == user_id,
            Task.status == "Done",
            Task.status_changed_at >= start_dt,
            Task.status_changed_at <= end_dt,
        ).all()

        tasks_by_day = defaultdict(set)
        for t in completed_tasks:
            if t.status_changed_at:
                day = t.status_changed_at.date()
                tasks_by_day[day].add(t.id)

        all_done_activities = Activity.query.filter(
            Activity.user_id == user_id,
            Activity.status == "Done",
            Activity.start_datetime < end_dt,
            Activity.end_datetime > start_dt,
        ).all()

        productive_activities = [a for a in all_done_activities if a.productivity_level == "productive"]

        logger.info(
            "[STATS] get_weekly_stats — tasks_table=%d completed, activities=%d total done, %d productive",
            len(completed_tasks), len(all_done_activities), len(productive_activities),
        )

        all_minutes_by_day = defaultdict(float)
        for ev in all_done_activities:
            for day in dates:
                m = _day_minutes(ev, day)
                if m:
                    all_minutes_by_day[day] += m

        productive_minutes_by_day = defaultdict(float)
        for ev in productive_activities:
            for day in dates:
                m = _day_minutes(ev, day)
                if m:
                    productive_minutes_by_day[day] += m

        week_days = []
        total_all_minutes = 0
        total_productive_minutes = 0
        total_tasks = 0

        for i, day in enumerate(dates):
            tasks = len(tasks_by_day.get(day, set()))
            day_all_minutes = all_minutes_by_day.get(day, 0)
            day_productive_minutes = productive_minutes_by_day.get(day, 0)
            total_all_minutes += day_all_minutes
            total_productive_minutes += day_productive_minutes
            total_tasks += tasks
            month_names_short = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                                   "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
            week_days.append({
                "label": day.strftime("%a"),
                "tasks": tasks,
                "minutes": round(day_all_minutes),
                "productiveMinutes": round(day_productive_minutes),
                "dayOfMonth": day.day,
                "month": month_names_short[day.month - 1],
                "isPast": day < today,
                "isToday": day == today,
                "isFuture": day > today,
            })

        total_hours_recorded = round(total_all_minutes / 60, 1)
        total_productive_hours = round(total_productive_minutes / 60, 1)

        month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                       "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

        if week_start.month == week_end.month:
            date_range = f"{month_names[week_start.month - 1]} {week_start.day} - {week_end.day}"
        else:
            date_range = f"{month_names[week_start.month - 1]} {week_start.day} - {month_names[week_end.month - 1]} {week_end.day}"

        return {
            "weekDays": week_days,
            "totalHoursRecorded": total_hours_recorded,
            "totalProductiveHours": total_productive_hours,
            "tasksDone": total_tasks,
            "dateRange": date_range,
        }
