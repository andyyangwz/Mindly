import uuid
import logging
from datetime import datetime

from flask import Blueprint, jsonify, request

from app.auth.decorators import require_auth
from app.schemas.reminder_schema import validate_reminder_data
from app.services.reminder_service import ReminderService

logger = logging.getLogger(__name__)

reminder_bp = Blueprint("reminders", __name__, url_prefix="/api/reminders")


@reminder_bp.route("", methods=["GET"])
@require_auth
def get_reminders(user_id):
    date_str = request.args.get("date")
    if date_str:
        try:
            date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except (ValueError, TypeError):
            return jsonify({"error": "Invalid date format (use YYYY-MM-DD)"}), 400
        reminders = ReminderService.get_reminders_by_date(user_id, date)
    else:
        reminders = ReminderService.get_all_reminders(user_id)

    return jsonify({"reminders": [r.to_dict() for r in reminders]})


@reminder_bp.route("", methods=["POST"])
@require_auth
def create_reminder(user_id):
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body is required"}), 400

    errors = validate_reminder_data(data, require_all=True)
    if errors:
        return jsonify({"error": "Validation failed", "details": errors}), 400

    try:
        reminder = ReminderService.create_reminder(user_id, data)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    return jsonify({"reminder": reminder.to_dict()}), 201


@reminder_bp.route("/<reminder_id>", methods=["GET"])
@require_auth
def get_reminder(user_id, reminder_id):
    try:
        rid = uuid.UUID(reminder_id)
    except ValueError:
        return jsonify({"error": "Invalid reminder ID"}), 400

    reminder = ReminderService.get_reminder_by_id(rid, user_id)
    if not reminder:
        return jsonify({"error": "Reminder not found"}), 404

    return jsonify({"reminder": reminder.to_dict()})


@reminder_bp.route("/<reminder_id>", methods=["PUT"])
@require_auth
def update_reminder(user_id, reminder_id):
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body is required"}), 400

    errors = validate_reminder_data(data, require_all=False)
    if errors:
        return jsonify({"error": "Validation failed", "details": errors}), 400

    try:
        rid = uuid.UUID(reminder_id)
    except ValueError:
        return jsonify({"error": "Invalid reminder ID"}), 400

    try:
        result = ReminderService.update_reminder(rid, user_id, data)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    if not result:
        return jsonify({"error": "Reminder not found"}), 404

    return jsonify({"reminder": result.to_dict()})


@reminder_bp.route("/<reminder_id>", methods=["DELETE"])
@require_auth
def delete_reminder(user_id, reminder_id):
    try:
        rid = uuid.UUID(reminder_id)
    except ValueError:
        return jsonify({"error": "Invalid reminder ID"}), 400

    result = ReminderService.delete_reminder(rid, user_id)
    if not result:
        return jsonify({"error": "Reminder not found"}), 404

    return jsonify({
        "message": "Reminder deleted",
        "deleted_ids": result["deleted_ids"],
    })
