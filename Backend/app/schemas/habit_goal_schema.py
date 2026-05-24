from app.utils.errors import ValidationError


def validate_create(data):
    if not data:
        raise ValidationError("Request body is required")

    errors = {}

    title = data.get("title")
    if not title or not isinstance(title, str) or not title.strip():
        errors["title"] = "Title is required and must be a non-empty string"

    icon = data.get("icon")
    if icon is not None:
        if not isinstance(icon, str) or not icon.strip():
            errors["icon"] = "Icon must be a non-empty string"
    else:
        icon = "FaStar"

    current_progress = data.get("current_progress", 0)
    if not isinstance(current_progress, int) or current_progress < 0:
        errors["current_progress"] = "Current progress must be a non-negative integer"

    target = data.get("target")
    if target is None:
        errors["target"] = "Target is required"
    elif not isinstance(target, int) or target <= 0:
        errors["target"] = "Target must be a positive integer"

    if errors:
        raise ValidationError(str(errors))

    return {
        "icon": icon.strip(),
        "title": title.strip(),
        "current_progress": current_progress,
        "target": target,
    }


def validate_update(data):
    if not data:
        raise ValidationError("Request body is required")

    allowed = {"icon", "title", "current_progress", "target", "is_equipped", "equipped_order"}
    invalid = set(data.keys()) - allowed
    if invalid:
        raise ValidationError(f"Unexpected fields: {', '.join(sorted(invalid))}")

    errors = {}

    if "icon" in data:
        icon = data["icon"]
        if not isinstance(icon, str) or not icon.strip():
            errors["icon"] = "Icon must be a non-empty string"

    if "title" in data:
        title = data["title"]
        if not title or not isinstance(title, str) or not title.strip():
            errors["title"] = "Title must be a non-empty string"

    if "current_progress" in data:
        cp = data["current_progress"]
        if not isinstance(cp, int) or cp < 0:
            errors["current_progress"] = "Current progress must be a non-negative integer"

    if "target" in data:
        target = data["target"]
        if not isinstance(target, int) or target <= 0:
            errors["target"] = "Target must be a positive integer"

    if errors:
        raise ValidationError(str(errors))

    return data
