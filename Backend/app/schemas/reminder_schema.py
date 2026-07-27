from datetime import datetime

from app.utils.productivity_constants import VALID_PRIORITIES, VALID_COLORS


def validate_reminder_data(data, require_all=True):
    errors = {}

    if require_all or "title" in data:
        title = data.get("title", "")
        if not title or not title.strip():
            errors["title"] = "Title is required"

    if require_all or "datetime" in data:
        dt_val = data.get("datetime")
        if not dt_val:
            errors["datetime"] = "Date & time is required"
        else:
            try:
                datetime.strptime(dt_val, "%Y-%m-%dT%H:%M")
            except (ValueError, TypeError):
                try:
                    datetime.strptime(dt_val, "%Y-%m-%d %H:%M")
                except (ValueError, TypeError):
                    errors["datetime"] = "Invalid format (use YYYY-MM-DDTHH:MM)"

    if "priority" in data and data["priority"] not in VALID_PRIORITIES:
        errors["priority"] = f"Priority must be one of: {', '.join(sorted(VALID_PRIORITIES))}"

    if "color" in data and data["color"] not in VALID_COLORS:
        errors["color"] = "Invalid color value"

    return errors
