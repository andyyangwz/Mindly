from datetime import datetime, timedelta, date as date_type
import logging

from app.extensions import db
from app.models.productivity import ProductivityEvent

logger = logging.getLogger(__name__)


def _parse_datetime(value):
    return datetime.strptime(value, "%Y-%m-%dT%H:%M")


def _build_event(user_id, data):
    sd = _parse_datetime(data["start_datetime"])
    ed = _parse_datetime(data["end_datetime"])
    if ed <= sd:
        ed += timedelta(days=1)
    if not data.get("has_deadline") and (ed - sd) > timedelta(days=2):
        raise ValueError("Activity cannot span more than 2 days")
    return ProductivityEvent(
        user_id=user_id,
        title=data["title"].strip(),
        description=data.get("description", "").strip(),
        start_datetime=sd,
        end_datetime=ed,
        color=data.get("color", "#7C3AED"),
        priority=data.get("priority", "medium"),
        productivity_level=data.get("productivity_level", "neutral"),
        has_deadline=data.get("has_deadline", False),
        status=data.get("status", "To Do"),
        progress=data.get("progress", 0) if data.get("has_deadline") else 0,
    )


class ProductivityService:
    @staticmethod
    def get_events_by_date(user_id, date):
        day_start = datetime.combine(date, datetime.min.time())
        day_end = day_start + timedelta(days=1)
        return (
            ProductivityEvent.query
            .filter(
                ProductivityEvent.user_id == user_id,
                ProductivityEvent.start_datetime < day_end,
                ProductivityEvent.end_datetime > day_start,
            )
            .order_by(ProductivityEvent.start_datetime)
            .all()
        )

    @staticmethod
    def get_all_events(user_id):
        return (
            ProductivityEvent.query
            .filter(ProductivityEvent.user_id == user_id)
            .order_by(ProductivityEvent.start_datetime)
            .all()
        )

    @staticmethod
    def get_events_by_week(user_id, date):
        start_of_week = date - timedelta(days=date.weekday())
        end_of_week = start_of_week + timedelta(days=6)
        week_end_dt = datetime.combine(end_of_week, datetime.max.time())
        week_start_dt = datetime.combine(start_of_week, datetime.min.time())
        return (
            ProductivityEvent.query
            .filter(
                ProductivityEvent.user_id == user_id,
                ProductivityEvent.start_datetime < week_end_dt,
                ProductivityEvent.end_datetime > week_start_dt,
            )
            .order_by(ProductivityEvent.start_datetime)
            .all()
        )

    @staticmethod
    def get_event_by_id(event_id, user_id):
        return ProductivityEvent.query.filter_by(id=event_id, user_id=user_id).first()

    @staticmethod
    def create_event(user_id, data):
        event = _build_event(user_id, data)
        db.session.add(event)
        db.session.commit()
        return {"event": event}

    @staticmethod
    def update_event(event_id, user_id, data):
        event = ProductivityEvent.query.filter_by(id=event_id, user_id=user_id).first()
        if not event:
            return None

        if "title" in data:
            event.title = data["title"].strip()
        if "description" in data:
            event.description = data["description"].strip()
        if "color" in data:
            event.color = data["color"]
        if "priority" in data:
            event.priority = data["priority"]
        if "productivity_level" in data:
            val = data["productivity_level"]
            if val is not None and val not in ProductivityEvent.VALID_LEVELS:
                raise ValueError(f"Invalid productivity level: {val}")
            if val is not None:
                event.productivity_level = val
        if "status" in data:
            val = data["status"]
            if val not in ProductivityEvent.VALID_STATUSES:
                raise ValueError(f"Invalid status: {val}")
            event.status = val
            event.status_change_at = datetime.utcnow()
        if "has_deadline" in data:
            event.has_deadline = bool(data["has_deadline"])
        if "progress" in data and event.has_deadline:
            val = data["progress"]
            if isinstance(val, float):
                val = int(val)
            if not isinstance(val, int) or val < 0 or val > 100:
                raise ValueError("Progress must be an integer between 0 and 100")
            logger.info("Updating progress for event %s: %s -> %s", event.id, event.progress, val)
            event.progress = val
        if "start_datetime" in data:
            event.start_datetime = _parse_datetime(data["start_datetime"])
        if "end_datetime" in data:
            ed = _parse_datetime(data["end_datetime"])
            if ed <= event.start_datetime:
                ed += timedelta(days=1)
            event.end_datetime = ed

        db.session.commit()
        return {"event": event}

    @staticmethod
    def sync_day_statuses(user_id, date_str, current_datetime=None, today_date=None):
        """Recalculate status for all activities on a given day based on date/time logic."""
        date = datetime.strptime(date_str, "%Y-%m-%d").date()
        today = datetime.strptime(today_date, "%Y-%m-%d").date() if today_date else datetime.utcnow().date()
        day_start = datetime.combine(date, datetime.min.time())
        day_end = day_start + timedelta(days=1)

        events = (
            ProductivityEvent.query
            .filter(
                ProductivityEvent.user_id == user_id,
                ProductivityEvent.start_datetime < day_end,
                ProductivityEvent.end_datetime > day_start,
            )
            .all()
        )

        now = None
        if date < today:
            bulk_status = "Done"
        elif date > today:
            bulk_status = "To Do"
        else:
            bulk_status = None
            now = _parse_datetime(current_datetime) if current_datetime else datetime.utcnow()

        updated = []
        for event in events:
            if bulk_status:
                new_status = bulk_status
            else:
                new_status = event.status
                if event.end_datetime and event.end_datetime <= now:
                    new_status = "Done"
                elif event.start_datetime and event.start_datetime > now:
                    new_status = "To Do"
                elif event.start_datetime and event.end_datetime and event.start_datetime <= now <= event.end_datetime:
                    new_status = "In Progress"

            if new_status != event.status:
                event.status = new_status
                event.status_change_at = datetime.utcnow()
                updated.append(str(event.id))

        db.session.commit()
        return {"updated_ids": updated, "total": len(events)}

    @staticmethod
    def delete_event(event_id, user_id):
        event = ProductivityEvent.query.filter_by(id=event_id, user_id=user_id).first()
        if not event:
            return None

        db.session.delete(event)
        db.session.commit()
        return {"deleted_ids": [str(event.id)]}
