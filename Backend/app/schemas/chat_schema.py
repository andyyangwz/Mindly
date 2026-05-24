VALID_ROLES = {"user", "assistant", "system"}


def validate_create_session(data):
    errors = {}
    title = data.get("title", "")
    if not title or not title.strip():
        errors["title"] = "Title is required"
    return errors


def validate_create_message(data):
    errors = {}
    if not data.get("content") or not data["content"].strip():
        errors["content"] = "Message content is required"
    role = data.get("role", "user")
    if role not in VALID_ROLES:
        errors["role"] = f"Role must be one of: {', '.join(sorted(VALID_ROLES))}"
    return errors


def validate_rename_session(data):
    errors = {}
    title = data.get("title", "")
    if not title or not title.strip():
        errors["title"] = "Title is required"
    return errors
