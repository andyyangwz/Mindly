from datetime import datetime

from app.utils.productivity_constants import VALID_PRIORITIES, VALID_COLORS, VALID_PRODUCTIVITY_LEVELS, VALID_STATUSES


def validate_event_data(data, require_all=True):
    errors = {}

    if require_all or "title" in data:
        title = data.get("title", "")
        if not title or not title.strip():
            errors["title"] = "Title is required"

    if require_all or "event_date" in data:
        date_val = data.get("event_date")
        if not date_val:
            errors["event_date"] = "Date is required"
        else:
            try:
                datetime.strptime(date_val, "%Y-%m-%d").date()
            except (ValueError, TypeError):
                errors["event_date"] = "Invalid date format (use YYYY-MM-DD)"

    if require_all or "start_time" in data:
        start = data.get("start_time")
        if not start:
            errors["start_time"] = "Start time is required"
        else:
            try:
                datetime.strptime(start, "%H:%M").time()
            except (ValueError, TypeError):
                errors["start_time"] = "Invalid time format (use HH:MM)"

    if require_all or "end_time" in data:
        end = data.get("end_time")
        if not end:
            errors["end_time"] = "End time is required"
        else:
            try:
                datetime.strptime(end, "%H:%M").time()
            except (ValueError, TypeError):
                errors["end_time"] = "Invalid time format (use HH:MM)"

    if "start_time" in data and "end_time" in data:
        try:
            start_t = datetime.strptime(data["start_time"], "%H:%M").time()
            end_t = datetime.strptime(data["end_time"], "%H:%M").time()
            if end_t <= start_t:
                errors["end_time"] = "End time must be after start time"
        except (ValueError, TypeError):
            pass

    if "priority" in data and data["priority"] not in VALID_PRIORITIES:
        errors["priority"] = f"Priority must be one of: {', '.join(sorted(VALID_PRIORITIES))}"

    if "color" in data and data["color"] not in VALID_COLORS:
        errors["color"] = "Invalid color value"

    if "productivity_level" in data:
        val = data["productivity_level"]
        if val not in VALID_PRODUCTIVITY_LEVELS:
            levels = ", ".join(VALID_PRODUCTIVITY_LEVELS.keys())
            errors["productivity_level"] = f"Must be one of: {levels}"
        elif data.get("has_deadline") and val == "unproductive":
            errors["productivity_level"] = "Deadline tasks cannot have productivity level 'Unproductive'"

    if "status" in data and data["status"] not in VALID_STATUSES:
        errors["status"] = f"Status must be one of: {', '.join(sorted(VALID_STATUSES))}"

    if data.get("has_deadline"):
        if not data.get("deadline_date"):
            errors["deadline_date"] = "Deadline date is required when has_deadline is true"
        else:
            try:
                datetime.strptime(data["deadline_date"], "%Y-%m-%d").date()
            except (ValueError, TypeError):
                errors["deadline_date"] = "Invalid date format (use YYYY-MM-DD)"
        if not data.get("deadline_time"):
            errors["deadline_time"] = "Deadline time is required when has_deadline is true"
        else:
            try:
                datetime.strptime(data["deadline_time"], "%H:%M").time()
            except (ValueError, TypeError):
                errors["deadline_time"] = "Invalid time format (use HH:MM)"

    return errors
