from datetime import datetime, timedelta, date as date_type
import logging

from app.extensions import db
from app.models.activity import Activity
from app.models.task import Task
from app.utils.productivity_constants import VALID_STATUSES

logger = logging.getLogger(__name__)


def _parse_datetime(value):
    return datetime.strptime(value, "%Y-%m-%dT%H:%M")


class _TaskEventAdapter:
    """Wraps a Task row to match the unified event shape for read-only consumers."""

    __tablename__ = "tasks"
    _source_table = "tasks"

    def __init__(self, task):
        self.id = task.id
        self.user_id = task.user_id
        self.title = task.title
        self.description = task.description
        self.start_datetime = task.start_datetime
        self.end_datetime = task.deadline_datetime
        self.color = task.color
        self.priority = task.priority
        self.productivity_level = "neutral"
        self.has_deadline = True
        self.status = task.status
        self.status_change_at = task.status_changed_at
        self.progress = task.progress
        self.created_at = task.created_at
        self.updated_at = task.updated_at

    def to_dict(self, plan=False):
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "title": self.title,
            "description": self.description or "",
            "start_datetime": self.start_datetime.isoformat() if self.start_datetime else None,
            "end_datetime": self.end_datetime.isoformat() if self.end_datetime else None,
            "color": self.color,
            "priority": self.priority,
            "productivity_level": self.productivity_level,
            "has_deadline": self.has_deadline,
            "status": self.status,
            "status_change_at": self.status_change_at.isoformat() if self.status_change_at else None,
            "progress": self.progress,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class _ActivityEventAdapter:
    """Wraps an Activity row to match the unified event shape for read-only consumers."""

    __tablename__ = "activities"
    _source_table = "activities"

    def __init__(self, activity):
        self.id = activity.id
        self.user_id = activity.user_id
        self.title = activity.title
        self.description = activity.description
        self.start_datetime = activity.start_datetime
        self.end_datetime = activity.end_datetime
        self.color = activity.color
        self.priority = "medium"
        self.productivity_level = activity.productivity_level
        self.has_deadline = False
        self.status = activity.status
        self.status_change_at = None
        self.progress = 0
        self.created_at = activity.created_at
        self.updated_at = activity.updated_at

    def to_dict(self, plan=False):
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "title": self.title,
            "description": self.description or "",
            "start_datetime": self.start_datetime.isoformat() if self.start_datetime else None,
            "end_datetime": self.end_datetime.isoformat() if self.end_datetime else None,
            "color": self.color,
            "priority": self.priority,
            "productivity_level": self.productivity_level,
            "has_deadline": self.has_deadline,
            "status": self.status,
            "status_change_at": self.status_change_at.isoformat() if self.status_change_at else None,
            "progress": self.progress,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


def _build_task(user_id, data):
    sd = _parse_datetime(data["start_datetime"])
    ed = _parse_datetime(data["end_datetime"])
    if ed <= sd:
        ed += timedelta(days=1)
    return Task(
        user_id=user_id,
        title=data["title"].strip(),
        description=data.get("description", "").strip(),
        start_datetime=sd,
        deadline_datetime=ed,
        color=data.get("color", "#7C3AED"),
        priority=data.get("priority", "medium"),
        status=data.get("status", "To Do"),
        progress=data.get("progress", 0),
    )


def _build_activity(user_id, data):
    sd = _parse_datetime(data["start_datetime"])
    ed = _parse_datetime(data["end_datetime"])
    if ed <= sd:
        ed += timedelta(days=1)
    if (ed - sd) > timedelta(days=2):
        raise ValueError("Activity cannot span more than 2 days")
    return Activity(
        user_id=user_id,
        title=data["title"].strip(),
        description=data.get("description", "").strip(),
        start_datetime=sd,
        end_datetime=ed,
        color=data.get("color", "#7C3AED"),
        productivity_level=data.get("productivity_level", "neutral"),
        status=data.get("status", "To Do"),
    )


class ProductivityService:
    @staticmethod
    def get_events_by_date(user_id, date):
        day_start = datetime.combine(date, datetime.min.time())
        day_end = day_start + timedelta(days=1)

        tasks = (
            Task.query
            .filter(
                Task.user_id == user_id,
                Task.start_datetime < day_end,
                Task.deadline_datetime > day_start,
            )
            .order_by(Task.start_datetime)
            .all()
        )
        activities = (
            Activity.query
            .filter(
                Activity.user_id == user_id,
                Activity.start_datetime < day_end,
                Activity.end_datetime > day_start,
            )
            .order_by(Activity.start_datetime)
            .all()
        )
        combined = [_TaskEventAdapter(t) for t in tasks] + [_ActivityEventAdapter(a) for a in activities]
        combined.sort(key=lambda e: e.start_datetime or datetime.min)

        logger.info(
            "[MIGRATION] get_events_by_date %s — tasks=%d, activities=%d, total=%d",
            date, len(tasks), len(activities), len(combined),
        )

        return combined

    @staticmethod
    def get_all_events(user_id):
        tasks = (
            Task.query
            .filter(Task.user_id == user_id)
            .order_by(Task.start_datetime)
            .all()
        )
        activities = (
            Activity.query
            .filter(Activity.user_id == user_id)
            .order_by(Activity.start_datetime)
            .all()
        )
        combined = [_TaskEventAdapter(t) for t in tasks] + [_ActivityEventAdapter(a) for a in activities]
        combined.sort(key=lambda e: e.start_datetime or datetime.min)

        logger.info(
            "[MIGRATION] get_all_events — tasks=%d, activities=%d, total=%d",
            len(tasks), len(activities), len(combined),
        )

        return combined

    @staticmethod
    def get_events_by_week(user_id, date):
        start_of_week = date - timedelta(days=date.weekday())
        end_of_week = start_of_week + timedelta(days=6)
        week_end_dt = datetime.combine(end_of_week, datetime.max.time())
        week_start_dt = datetime.combine(start_of_week, datetime.min.time())

        tasks = (
            Task.query
            .filter(
                Task.user_id == user_id,
                Task.start_datetime < week_end_dt,
                Task.deadline_datetime > week_start_dt,
            )
            .order_by(Task.start_datetime)
            .all()
        )
        activities = (
            Activity.query
            .filter(
                Activity.user_id == user_id,
                Activity.start_datetime < week_end_dt,
                Activity.end_datetime > week_start_dt,
            )
            .order_by(Activity.start_datetime)
            .all()
        )
        combined = [_TaskEventAdapter(t) for t in tasks] + [_ActivityEventAdapter(a) for a in activities]
        combined.sort(key=lambda e: e.start_datetime or datetime.min)

        logger.info(
            "[MIGRATION] get_events_by_week %s — tasks=%d, activities=%d, total=%d",
            date, len(tasks), len(activities), len(combined),
        )

        return combined

    @staticmethod
    def get_event_by_id(event_id, user_id):
        task = Task.query.filter_by(id=event_id, user_id=user_id).first()
        if task:
            logger.info("[MIGRATION] get_event_by_id %s → source=tasks", event_id)
            return _TaskEventAdapter(task)
        activity = Activity.query.filter_by(id=event_id, user_id=user_id).first()
        if activity:
            logger.info("[MIGRATION] get_event_by_id %s → source=activities", event_id)
            return _ActivityEventAdapter(activity)
        logger.info("[MIGRATION] get_event_by_id %s → not found", event_id)
        return None

    @staticmethod
    def create_event(user_id, data):
        is_task = bool(data.get("has_deadline"))
        if is_task:
            event = _build_task(user_id, data)
            db.session.add(event)
            db.session.commit()
            logger.info("[MIGRATION] create_event → table=tasks title=%s", data.get("title"))
            return {"event": _TaskEventAdapter(event)}
        else:
            event = _build_activity(user_id, data)
            db.session.add(event)
            db.session.commit()
            logger.info("[MIGRATION] create_event → table=activities title=%s", data.get("title"))
            return {"event": _ActivityEventAdapter(event)}

    @staticmethod
    def update_event(event_id, user_id, data):
        task = Task.query.filter_by(id=event_id, user_id=user_id).first()
        if task:
            if "title" in data:
                task.title = data["title"].strip()
            if "description" in data:
                task.description = data["description"].strip()
            if "color" in data:
                task.color = data["color"]
            if "priority" in data:
                task.priority = data["priority"]
            if "status" in data:
                val = data["status"]
                if val not in VALID_STATUSES:
                    raise ValueError(f"Invalid status: {val}")
                task.status = val
                task.status_changed_at = datetime.utcnow()
            if "progress" in data:
                val = data["progress"]
                if isinstance(val, float):
                    val = int(val)
                if not isinstance(val, int) or val < 0 or val > 100:
                    raise ValueError("Progress must be an integer between 0 and 100")
                task.progress = val
            if "start_datetime" in data:
                task.start_datetime = _parse_datetime(data["start_datetime"])
            if "end_datetime" in data:
                ed = _parse_datetime(data["end_datetime"])
                if ed <= task.start_datetime:
                    ed += timedelta(days=1)
                task.deadline_datetime = ed
            db.session.commit()
            logger.info("[MIGRATION] update_event %s → table=tasks", event_id)
            return {"event": _TaskEventAdapter(task)}

        activity = Activity.query.filter_by(id=event_id, user_id=user_id).first()
        if activity:
            if "title" in data:
                activity.title = data["title"].strip()
            if "description" in data:
                activity.description = data["description"].strip()
            if "color" in data:
                activity.color = data["color"]
            if "productivity_level" in data:
                val = data["productivity_level"]
                if val is not None:
                    activity.productivity_level = val
            if "status" in data:
                val = data["status"]
                if val not in VALID_STATUSES:
                    raise ValueError(f"Invalid status: {val}")
                activity.status = val
            if "start_datetime" in data:
                activity.start_datetime = _parse_datetime(data["start_datetime"])
            if "end_datetime" in data:
                ed = _parse_datetime(data["end_datetime"])
                if ed <= activity.start_datetime:
                    ed += timedelta(days=1)
                activity.end_datetime = ed
            db.session.commit()
            logger.info("[MIGRATION] update_event %s → table=activities", event_id)
            return {"event": _ActivityEventAdapter(activity)}

        return None

    @staticmethod
    def sync_day_statuses(user_id, date_str, current_datetime=None, today_date=None):
        """Recalculate status for all activities on a given day based on date/time logic.

        Only updates Activity records. Tasks are never modified by auto sync —
        their status is always controlled manually by the user.
        """
        date = datetime.strptime(date_str, "%Y-%m-%d").date()
        today = datetime.strptime(today_date, "%Y-%m-%d").date() if today_date else datetime.utcnow().date()
        day_start = datetime.combine(date, datetime.min.time())
        day_end = day_start + timedelta(days=1)

        now = None
        if date < today:
            bulk_status = "Done"
        elif date > today:
            bulk_status = "To Do"
        else:
            bulk_status = None
            now = _parse_datetime(current_datetime) if current_datetime else datetime.utcnow()

        updated = []

        activities = (
            Activity.query
            .filter(
                Activity.user_id == user_id,
                Activity.start_datetime < day_end,
                Activity.end_datetime > day_start,
            )
            .all()
        )
        for act in activities:
            if bulk_status:
                new_status = bulk_status
            else:
                new_status = act.status
                if act.end_datetime and act.end_datetime <= now:
                    new_status = "Done"
                elif act.start_datetime and act.start_datetime > now:
                    new_status = "To Do"
                elif act.start_datetime and act.end_datetime and act.start_datetime <= now <= act.end_datetime:
                    new_status = "In Progress"
            if new_status != act.status:
                act.status = new_status
                updated.append(str(act.id))

        db.session.commit()

        logger.info(
            "sync_day_statuses %s — activities=%d, updated=%d",
            date_str, len(activities), len(updated),
        )

        return {"updated_ids": updated, "total": len(activities)}

    @staticmethod
    def delete_event(event_id, user_id):
        task = Task.query.filter_by(id=event_id, user_id=user_id).first()
        if task:
            db.session.delete(task)
            db.session.commit()
            logger.info("[MIGRATION] delete_event %s → table=tasks", event_id)
            return {"deleted_ids": [str(task.id)]}

        activity = Activity.query.filter_by(id=event_id, user_id=user_id).first()
        if activity:
            db.session.delete(activity)
            db.session.commit()
            logger.info("[MIGRATION] delete_event %s → table=activities", event_id)
            return {"deleted_ids": [str(activity.id)]}

        return None
