import uuid
from datetime import datetime, timedelta

from app.extensions import db
from app.models.productivity import ProductivityEvent


def _parse_date(value):
    return datetime.strptime(value, "%Y-%m-%d").date()


def _parse_time(value):
    return datetime.strptime(value, "%H:%M").time()


def _build_event(user_id, data, overrides=None):
    kwargs = {
        "user_id": user_id,
        "title": data["title"].strip(),
        "description": data.get("description", "").strip(),
        "event_date": _parse_date(data["event_date"]),
        "start_time": _parse_time(data["start_time"]),
        "end_time": _parse_time(data["end_time"]),
        "color": data.get("color", "#7C3AED"),
        "priority": data.get("priority", "medium"),
        "productivity_level": data.get("productivity_level", "neutral"),
        "status": data.get("status", "To Do"),
        "has_deadline": data.get("has_deadline", False),
        "is_deadline_marker": False,
        "task_group_id": None,
    }
    if overrides:
        kwargs.update(overrides)
    return ProductivityEvent(**kwargs)


class ProductivityService:
    @staticmethod
    def get_events_by_date(user_id, date):
        return (
            ProductivityEvent.query
            .filter_by(user_id=user_id, event_date=date)
            .order_by(ProductivityEvent.start_time)
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
            .order_by(ProductivityEvent.event_date, ProductivityEvent.start_time)
            .all()
        )

    @staticmethod
    def get_events_by_week(user_id, date):
        start_of_week = date - timedelta(days=date.weekday())
        end_of_week = start_of_week + timedelta(days=6)
        return (
            ProductivityEvent.query
            .filter(
                ProductivityEvent.user_id == user_id,
                ProductivityEvent.event_date >= start_of_week,
                ProductivityEvent.event_date <= end_of_week,
            )
            .order_by(ProductivityEvent.event_date, ProductivityEvent.start_time)
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

            linked = ProductivityEvent(
                user_id=user_id,
                title=f"{data['title'].strip()} Deadline",
                description=data.get("description", "").strip(),
                event_date=_parse_date(data["deadline_date"]),
                start_time=_parse_time(data["deadline_time"]),
                end_time=_parse_time(data["deadline_time"]),
                color=data.get("color", "#7C3AED"),
                priority=data.get("priority", "medium"),
                productivity_level=data.get("productivity_level", "neutral"),
                status="To Do",
                has_deadline=True,
                is_deadline_marker=True,
                task_group_id=task_group_id,
                deadline_date=_parse_date(data["deadline_date"]),
                deadline_time=_parse_time(data["deadline_time"]),
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
        if "event_date" in data:
            event.event_date = _parse_date(data["event_date"])
        if "start_time" in data:
            event.start_time = _parse_time(data["start_time"])
        if "end_time" in data:
            event.end_time = _parse_time(data["end_time"])
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
