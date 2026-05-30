from datetime import datetime

from app.utils.productivity_constants import VALID_PRIORITIES, VALID_COLORS, VALID_PRODUCTIVITY_LEVELS, VALID_STATUSES


def validate_event_data(data, require_all=True):
    errors = {}

    if require_all or "title" in data:
        title = data.get("title", "")
        if not title or not title.strip():
            errors["title"] = "Title is required"

    sd_key = "start_datetime"
    ed_key = "end_datetime"

    if require_all or sd_key in data:
        sd_val = data.get(sd_key)
        if not sd_val:
            errors[sd_key] = "Start datetime is required"
        else:
            try:
                datetime.strptime(sd_val, "%Y-%m-%dT%H:%M")
            except (ValueError, TypeError):
                try:
                    datetime.strptime(sd_val, "%Y-%m-%d %H:%M")
                except (ValueError, TypeError):
                    errors[sd_key] = "Invalid format (use YYYY-MM-DDTHH:MM)"

    if require_all or ed_key in data:
        ed_val = data.get(ed_key)
        if not ed_val:
            errors[ed_key] = "End datetime is required"
        else:
            try:
                datetime.strptime(ed_val, "%Y-%m-%dT%H:%M")
            except (ValueError, TypeError):
                try:
                    datetime.strptime(ed_val, "%Y-%m-%d %H:%M")
                except (ValueError, TypeError):
                    errors[ed_key] = "Invalid format (use YYYY-MM-DDTHH:MM)"

    if "priority" in data and data["priority"] not in VALID_PRIORITIES:
        errors["priority"] = f"Priority must be one of: {', '.join(sorted(VALID_PRIORITIES))}"

    if "color" in data and data["color"] not in VALID_COLORS:
        errors["color"] = "Invalid color value"

    if "productivity_level" in data and data["productivity_level"] is not None:
        val = data["productivity_level"]
        if val not in VALID_PRODUCTIVITY_LEVELS:
            levels = ", ".join(VALID_PRODUCTIVITY_LEVELS.keys())
            errors["productivity_level"] = f"Must be one of: {levels}"

    if "status" in data and data["status"] not in VALID_STATUSES:
        errors["status"] = f"Status must be one of: {', '.join(sorted(VALID_STATUSES))}"

    return errors
