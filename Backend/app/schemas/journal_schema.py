from app.utils.errors import ValidationError


def validate_create(data):
    if not data:
        raise ValidationError("Request body is required")

    errors = {}

    title = data.get("title")
    if not title or not isinstance(title, str) or not title.strip():
        errors["title"] = "Title is required and must be a non-empty string"

    content = data.get("content")
    if not content or not isinstance(content, str) or not content.strip():
        errors["content"] = "Content is required and must be a non-empty string"

    if "emojis" in data:
        if not isinstance(data["emojis"], list):
            errors["emojis"] = "Emojis must be a list"
        elif not all(isinstance(e, str) for e in data["emojis"]):
            errors["emojis"] = "Each emoji must be a string"

    if errors:
        raise ValidationError(str(errors))

    return {
        "title": title.strip(),
        "content": content.strip(),
        "emojis": data.get("emojis", []),
        "is_favorite": bool(data.get("is_favorite", False)),
        "is_pinned": bool(data.get("is_pinned", False)),
        "ai_enabled": bool(data.get("ai_enabled", False)),
    }


def validate_update(data):
    if not data:
        raise ValidationError("Request body is required")

    allowed = {"title", "content", "emojis", "is_favorite", "is_pinned", "ai_enabled"}
    invalid = set(data.keys()) - allowed
    if invalid:
        raise ValidationError(f"Unexpected fields: {', '.join(sorted(invalid))}")

    if "title" in data:
        if not isinstance(data["title"], str) or not data["title"].strip():
            raise ValidationError("Title must be a non-empty string")

    if "content" in data:
        if not isinstance(data["content"], str) or not data["content"].strip():
            raise ValidationError("Content must be a non-empty string")

    if "emojis" in data:
        if not isinstance(data["emojis"], list):
            raise ValidationError("Emojis must be a list")
        if not all(isinstance(e, str) for e in data["emojis"]):
            raise ValidationError("Each emoji must be a string")

    return data
