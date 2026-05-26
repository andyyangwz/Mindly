from app.utils.errors import ValidationError


def validate_create(data):
    if not data:
        raise ValidationError("Request body is required")
    name = data.get("name")
    if not name or not isinstance(name, str) or not name.strip():
        raise ValidationError("Folder name is required")
    if len(name.strip()) > 100:
        raise ValidationError("Folder name must be 100 characters or less")
    if "emoji" in data and not isinstance(data["emoji"], str):
        raise ValidationError("Emoji must be a string")
    return {
        "name": name.strip(),
        "emoji": data.get("emoji", "📁"),
    }


def validate_update(data):
    if not data:
        raise ValidationError("Request body is required")
    allowed = {"name", "emoji"}
    invalid = set(data.keys()) - allowed
    if invalid:
        raise ValidationError(f"Unexpected fields: {', '.join(sorted(invalid))}")
    if "name" in data:
        if not isinstance(data["name"], str) or not data["name"].strip():
            raise ValidationError("Folder name must be a non-empty string")
        if len(data["name"].strip()) > 100:
            raise ValidationError("Folder name must be 100 characters or less")
    if "emoji" in data and not isinstance(data["emoji"], str):
        raise ValidationError("Emoji must be a string")
    return data


def validate_folder_ids(data):
    if not data or "folder_ids" not in data:
        raise ValidationError("folder_ids is required")
    if not isinstance(data["folder_ids"], list):
        raise ValidationError("folder_ids must be a list")
    for fid in data["folder_ids"]:
        if not isinstance(fid, str) or not fid.strip():
            raise ValidationError("Each folder_id must be a non-empty string")
    return data["folder_ids"]
