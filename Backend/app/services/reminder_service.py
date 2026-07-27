from datetime import datetime, timedelta
import logging

from app.extensions import db
from app.models.reminder import Reminder

logger = logging.getLogger(__name__)


def _parse_datetime(value):
    return datetime.strptime(value, "%Y-%m-%dT%H:%M")


class ReminderService:
    @staticmethod
    def get_all_reminders(user_id):
        reminders = (
            Reminder.query
            .filter(Reminder.user_id == user_id)
            .order_by(Reminder.datetime)
            .all()
        )
        logger.info("[REMINDER] get_all_reminders — count=%d", len(reminders))
        return reminders

    @staticmethod
    def get_reminders_by_date(user_id, date):
        day_start = datetime.combine(date, datetime.min.time())
        day_end = day_start + timedelta(days=1)
        reminders = (
            Reminder.query
            .filter(
                Reminder.user_id == user_id,
                Reminder.datetime >= day_start,
                Reminder.datetime < day_end,
            )
            .order_by(Reminder.datetime)
            .all()
        )
        logger.info("[REMINDER] get_reminders_by_date %s — count=%d", date, len(reminders))
        return reminders

    @staticmethod
    def get_reminder_by_id(reminder_id, user_id):
        reminder = Reminder.query.filter_by(id=reminder_id, user_id=user_id).first()
        if reminder:
            logger.info("[REMINDER] get_reminder_by_id %s — found", reminder_id)
        else:
            logger.info("[REMINDER] get_reminder_by_id %s — not found", reminder_id)
        return reminder

    @staticmethod
    def create_reminder(user_id, data):
        dt = _parse_datetime(data["datetime"])
        reminder = Reminder(
            user_id=user_id,
            title=data["title"].strip(),
            description=data.get("description", "").strip() or None,
            datetime=dt,
            color=data.get("color", "#7C3AED"),
            priority=data.get("priority", "medium"),
        )
        db.session.add(reminder)
        db.session.commit()
        logger.info("[REMINDER] create_reminder — title=%s", data.get("title"))
        return reminder

    @staticmethod
    def update_reminder(reminder_id, user_id, data):
        reminder = Reminder.query.filter_by(id=reminder_id, user_id=user_id).first()
        if not reminder:
            return None

        if "title" in data:
            reminder.title = data["title"].strip()
        if "description" in data:
            reminder.description = data["description"].strip() or None
        if "datetime" in data:
            reminder.datetime = _parse_datetime(data["datetime"])
        if "color" in data:
            reminder.color = data["color"]
        if "priority" in data:
            reminder.priority = data["priority"]

        db.session.commit()
        logger.info("[REMINDER] update_reminder %s", reminder_id)
        return reminder

    @staticmethod
    def delete_reminder(reminder_id, user_id):
        reminder = Reminder.query.filter_by(id=reminder_id, user_id=user_id).first()
        if not reminder:
            return None

        db.session.delete(reminder)
        db.session.commit()
        logger.info("[REMINDER] delete_reminder %s", reminder_id)
        return {"deleted_ids": [str(reminder.id)]}
