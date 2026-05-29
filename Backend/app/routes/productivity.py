import uuid
import json
import logging
from datetime import datetime

from flask import Blueprint, jsonify, request, current_app

from app.auth.decorators import require_auth
from app.schemas.productivity_schema import validate_event_data
from app.services.productivity_service import ProductivityService
from app.services.ai.groq_provider import GroqProvider

logger = logging.getLogger(__name__)

productivity_bp = Blueprint("productivity", __name__, url_prefix="/api/productivity")

CLASSIFY_MODEL = "llama-3.3-70b-versatile"

CLASSIFY_SYSTEM_PROMPT = """You are an activity classifier. Your ONLY job is to classify an activity title.

Return ONLY valid JSON, no explanation, no markdown, no code blocks.

Rules:
- productivity_level must be one of: "productive", "neutral", "unproductive", "obligation"
- priority must be one of: "low", "medium", "high"
- "productive" = intentional growth activities (learning, exercise, creation, deep work)
- "obligation" = necessary but not growth-oriented (bills, chores, admin, errands)
- "neutral" = routine / maintenance / unclear
- "unproductive" = distraction, procrastination, time-wasting
- priority: "high" for urgent/important, "low" for optional/leisure, "medium" otherwise

Examples:
Title: "Gym Session" → {{"productivity_level": "productive", "priority": "medium"}}
Title: "Pay electricity bill" → {{"productivity_level": "obligation", "priority": "high"}}
Title: "Watch Netflix" → {{"productivity_level": "unproductive", "priority": "low"}}
Title: "Team standup" → {{"productivity_level": "neutral", "priority": "medium"}}

Remember: JSON only. No extra text."""


@productivity_bp.route("/classify", methods=["POST"])
@require_auth
def classify_activity(user_id):
    data = request.get_json(silent=True)
    if not data or not data.get("title"):
        return jsonify({"error": "title is required"}), 400

    title = data["title"].strip()
    if not title:
        return jsonify({"error": "title must not be empty"}), 400

    try:
        api_key = current_app.config.get("GROQ_API_KEY", "")
        if not api_key:
            raise ValueError("GROQ_API_KEY is not configured")
        provider = GroqProvider(api_key, CLASSIFY_MODEL)
        raw = provider.chat(
            messages=[
                {"role": "system", "content": CLASSIFY_SYSTEM_PROMPT},
                {"role": "user", "content": title},
            ],
            max_tokens=100,
            temperature=0.1,
        )
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[-1]
            cleaned = cleaned.rsplit("```", 1)[0]
        cleaned = cleaned.strip()
        result = json.loads(cleaned)
    except Exception as e:
        logger.warning("Title classification failed for %r: %s", title, e)
        result = {"productivity_level": "neutral", "priority": "medium"}

    return jsonify({
        "productivity_level": result.get("productivity_level", "neutral"),
        "priority": result.get("priority", "medium"),
    })


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

    return jsonify({"event": result["event"].to_dict()}), 201


@productivity_bp.route("/sync-status", methods=["POST"])
@require_auth
def sync_day_statuses(user_id):
    data = request.get_json(silent=True)
    if not data or not data.get("date"):
        return jsonify({"error": "date is required"}), 400
    try:
        result = ProductivityService.sync_day_statuses(
            user_id,
            data["date"],
            current_datetime=data.get("current_datetime"),
            today_date=data.get("today_date"),
        )
    except Exception as e:
        logger.error("Status sync failed: %s", e)
        return jsonify({"error": str(e)}), 500
    return jsonify(result)


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

    logger.info("Updating event %s (user %s): start_datetime=%s end_datetime=%s",
                event_id, user_id, data.get("start_datetime"), data.get("end_datetime"))

    try:
        result = ProductivityService.update_event(eid, user_id, data)
    except ValueError as e:
        logger.warning("Validation error updating event %s: %s", event_id, e)
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logger.error("Unexpected error updating event %s: %s", event_id, e, exc_info=True)
        return jsonify({"error": "Internal server error"}), 500

    if not result:
        return jsonify({"error": "Event not found"}), 404

    logger.info("Event %s updated successfully: start_datetime=%s end_datetime=%s",
                event_id, result["event"].start_datetime, result["event"].end_datetime)
    return jsonify({"event": result["event"].to_dict()})


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
