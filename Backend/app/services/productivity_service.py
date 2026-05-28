import uuid
from datetime import datetime, timedelta, date as date_type

from app.extensions import db
from app.models.productivity import ProductivityEvent


def _parse_date(value):
    return datetime.strptime(value, "%Y-%m-%d").date()


def _parse_time(value):
    return datetime.strptime(value, "%H:%M").time()


def _parse_datetime(value):
    return datetime.strptime(value, "%Y-%m-%dT%H:%M")


def _build_event(user_id, data, overrides=None):
    kwargs = {
        "user_id": user_id,
        "title": data["title"].strip(),
        "description": data.get("description", "").strip(),
        "color": data.get("color", "#7C3AED"),
        "priority": data.get("priority", "medium"),
        "productivity_level": data.get("productivity_level", "neutral"),
        "status": data.get("status", "To Do"),
        "has_deadline": data.get("has_deadline", False),
        "is_deadline_marker": False,
        "task_group_id": None,
    }

    sd = _parse_datetime(data["start_datetime"])
    ed = _parse_datetime(data["end_datetime"])
    if ed <= sd:
        ed += timedelta(days=1)
    if (ed - sd) > timedelta(days=2):
        raise ValueError("Activities cannot span more than 2 days")
    kwargs["start_datetime"] = sd
    kwargs["end_datetime"] = ed

    if overrides:
        kwargs.update(overrides)
    return ProductivityEvent(**kwargs)


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
            .filter(
                ProductivityEvent.user_id == user_id,
                ProductivityEvent.is_deadline_marker == False,
            )
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
    def create_event(user_id, data):
        task_group_id = uuid.uuid4() if data.get("has_deadline") else None
        overrides = {"task_group_id": task_group_id}
        if data.get("has_deadline"):
            overrides["deadline_date"] = _parse_date(data["deadline_date"])
            overrides["deadline_time"] = _parse_time(data["deadline_time"])
        event = _build_event(user_id, data, overrides=overrides)
        db.session.add(event)
        result = {"event": event, "linked_event": None}

        if data.get("has_deadline"):
            if not data.get("deadline_date") or not data.get("deadline_time"):
                db.session.rollback()
                raise ValueError("deadline_date and deadline_time are required when has_deadline is true")

            dd = _parse_date(data["deadline_date"])
            dt = _parse_time(data["deadline_time"])
            linked_sd = datetime.combine(dd, dt)
            linked_ed = linked_sd

            linked = ProductivityEvent(
                user_id=user_id,
                title=f"{data['title'].strip()} Deadline",
                description=data.get("description", "").strip(),
                start_datetime=linked_sd,
                end_datetime=linked_ed,
                color=data.get("color", "#7C3AED"),
                priority=data.get("priority", "medium"),
                productivity_level=data.get("productivity_level", "neutral"),
                status="To Do",
                has_deadline=True,
                is_deadline_marker=True,
                task_group_id=task_group_id,
                deadline_date=dd,
                deadline_time=dt,
            )
            db.session.add(linked)
            result["linked_event"] = linked

        db.session.commit()
        return result

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
            if val not in ProductivityEvent.VALID_LEVELS:
                raise ValueError(f"Invalid productivity level: {val}")
            event.productivity_level = val
        if "status" in data:
            val = data["status"]
            if val not in ProductivityEvent.VALID_STATUSES:
                raise ValueError(f"Invalid status: {val}")
            event.status = val
            event.status_change_at = datetime.utcnow()

        if not event.has_deadline:
            if "start_datetime" in data:
                event.start_datetime = _parse_datetime(data["start_datetime"])
            if "end_datetime" in data:
                ed = _parse_datetime(data["end_datetime"])
                if ed <= event.start_datetime:
                    ed += timedelta(days=1)
                event.end_datetime = ed

        result = {"event": event, "linked_event": None}

        sync_fields = {"title", "color", "priority", "productivity_level", "description"}
        changed_sync = sync_fields & set(data.keys())

        if event.task_group_id and changed_sync:
            linked = (
                ProductivityEvent.query
                .filter(
                    ProductivityEvent.task_group_id == event.task_group_id,
                    ProductivityEvent.id != event.id,
                )
                .first()
            )
            if linked:
                for field in changed_sync:
                    if field == "title" and not linked.is_deadline_marker:
                        setattr(linked, field, data[field].strip())
                    elif field == "title" and linked.is_deadline_marker:
                        if event.is_deadline_marker:
                            setattr(linked, field, data[field].strip())
                        else:
                            linked.title = f"{data[field].strip()} Deadline"
                    else:
                        setattr(linked, field, data[field])
                result["linked_event"] = linked

        db.session.commit()
        return result

    @staticmethod
    def sync_day_statuses(user_id, date_str, current_datetime=None, today_date=None):
        """Recalculate status for all activities on a given day based on date/time logic."""
        date = _parse_date(date_str)
        today = _parse_date(today_date) if today_date else datetime.utcnow().date()
        day_start = datetime.combine(date, datetime.min.time())
        day_end = day_start + timedelta(days=1)

        events = (
            ProductivityEvent.query
            .filter(
                ProductivityEvent.user_id == user_id,
                ProductivityEvent.start_datetime < day_end,
                ProductivityEvent.end_datetime > day_start,
                ProductivityEvent.is_deadline_marker == False,
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

        deleted_ids = [str(event.id)]

        if event.task_group_id:
            linked = (
                ProductivityEvent.query
                .filter(
                    ProductivityEvent.task_group_id == event.task_group_id,
                    ProductivityEvent.id != event.id,
                )
                .all()
            )
            for l in linked:
                db.session.delete(l)
                deleted_ids.append(str(l.id))

        db.session.delete(event)
        db.session.commit()
        return {"deleted_ids": deleted_ids}
