import uuid
from datetime import datetime

from flask import Blueprint, jsonify, request

from app.auth.decorators import require_auth
from app.schemas.productivity_schema import validate_event_data
from app.services.productivity_service import ProductivityService

productivity_bp = Blueprint("productivity", __name__, url_prefix="/api/productivity")


@productivity_bp.route("", methods=["GET"])
@require_auth
def get_events(user_id):
    all_param = request.args.get("all", "false").lower() == "true"

    if all_param:
        events = ProductivityService.get_all_events(user_id)
    else:
        date_str = request.args.get("date") or request.args.get("week")
        if not date_str:
            return jsonify({"error": "date, week, or all parameter is required"}), 400

        try:
            date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except (ValueError, TypeError):
            return jsonify({"error": "Invalid date format (use YYYY-MM-DD)"}), 400

        if "week" in request.args:
            events = ProductivityService.get_events_by_week(user_id, date)
        else:
            events = ProductivityService.get_events_by_date(user_id, date)

    plan_view = request.args.get("plan", "false").lower() == "true"
    return jsonify({"events": [e.to_dict(plan=plan_view) for e in events]})


@productivity_bp.route("", methods=["POST"])
@require_auth
def create_event(user_id):
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body is required"}), 400

    errors = validate_event_data(data, require_all=True)
    if errors:
        return jsonify({"error": "Validation failed", "details": errors}), 400

    try:
        result = ProductivityService.create_event(user_id, data)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    response = {"event": result["event"].to_dict()}
    if result.get("linked_event"):
        response["linked_event"] = result["linked_event"].to_dict()

    return jsonify(response), 201


@productivity_bp.route("/<event_id>", methods=["PUT"])
@require_auth
def update_event(user_id, event_id):
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body is required"}), 400

    errors = validate_event_data(data, require_all=False)
    if errors:
        return jsonify({"error": "Validation failed", "details": errors}), 400

    try:
        eid = uuid.UUID(event_id)
    except ValueError:
        return jsonify({"error": "Invalid event ID"}), 400

    try:
        result = ProductivityService.update_event(eid, user_id, data)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    if not result:
        return jsonify({"error": "Event not found"}), 404

    response = {"event": result["event"].to_dict()}
    if result.get("linked_event"):
        response["linked_event"] = result["linked_event"].to_dict()

    return jsonify(response)


@productivity_bp.route("/<event_id>", methods=["DELETE"])
@require_auth
def delete_event(user_id, event_id):
    try:
        eid = uuid.UUID(event_id)
    except ValueError:
        return jsonify({"error": "Invalid event ID"}), 400

    result = ProductivityService.delete_event(eid, user_id)
    if not result:
        return jsonify({"error": "Event not found"}), 404

    return jsonify({
        "message": "Event(s) deleted",
        "deleted_ids": result["deleted_ids"],
    })
