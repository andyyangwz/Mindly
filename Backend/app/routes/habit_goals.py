from flask import Blueprint, request, jsonify
from uuid import UUID

from app.auth.decorators import require_auth
from app.services.habit_goal_service import HabitGoalService
from app.schemas.habit_goal_schema import validate_create, validate_update

habit_goals_bp = Blueprint("habit_goals", __name__, url_prefix="/api/habit-goals")


@habit_goals_bp.route("", methods=["GET"])
@require_auth
def get_habit_goals(user_id):
    goals = HabitGoalService.get_all(user_id=user_id)
    return jsonify({
        "habit_goals": [g.to_dict() for g in goals],
    })


@habit_goals_bp.route("/equipped", methods=["GET"])
@require_auth
def get_equipped(user_id):
    goals = HabitGoalService.get_equipped(user_id=user_id)
    return jsonify({
        "habit_goals": [g.to_dict() for g in goals],
    })


@habit_goals_bp.route("/<uuid:goal_id>", methods=["GET"])
@require_auth
def get_habit_goal(user_id, goal_id):
    goal = HabitGoalService.get_by_id(goal_id, user_id)
    return jsonify({"habit_goal": goal.to_dict()})


@habit_goals_bp.route("", methods=["POST"])
@require_auth
def create_habit_goal(user_id):
    data = request.get_json(silent=True)
    validated = validate_create(data)
    goal = HabitGoalService.create(validated, user_id)
    return jsonify({"habit_goal": goal.to_dict()}), 201


@habit_goals_bp.route("/<uuid:goal_id>", methods=["PUT"])
@require_auth
def update_habit_goal(user_id, goal_id):
    goal = HabitGoalService.get_by_id(goal_id, user_id)
    data = request.get_json(silent=True)
    validated = validate_update(data)
    goal = HabitGoalService.update(goal, validated)
    return jsonify({"habit_goal": goal.to_dict()})


@habit_goals_bp.route("/<uuid:goal_id>", methods=["DELETE"])
@require_auth
def delete_habit_goal(user_id, goal_id):
    goal = HabitGoalService.get_by_id(goal_id, user_id)
    HabitGoalService.delete(goal)
    return jsonify({"message": "Habit goal deleted successfully"}), 200


@habit_goals_bp.route("/unequip", methods=["POST"])
@require_auth
def unequip_relic(user_id):
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body is required"}), 400

    relic_id = data.get("relic_id")
    if not relic_id:
        return jsonify({"error": "relic_id is required"}), 400

    try:
        relic_id = UUID(relic_id)
    except ValueError:
        return jsonify({"error": "Invalid relic_id"}), 400

    try:
        result = HabitGoalService.unequip_slot(user_id, relic_id)
    except Exception as e:
        return jsonify({"error": str(e)}), 400

    return jsonify({"habit_goal": result}), 200


@habit_goals_bp.route("/equip", methods=["POST"])
@require_auth
def equip_relic(user_id):
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body is required"}), 400

    relic_id = data.get("relic_id")
    slot = data.get("slot")

    if not relic_id:
        return jsonify({"error": "relic_id is required"}), 400
    if slot is None or slot not in (0, 1, 2):
        return jsonify({"error": "slot must be 0, 1, or 2"}), 400

    try:
        relic_id = UUID(relic_id)
    except ValueError:
        return jsonify({"error": "Invalid relic_id"}), 400

    try:
        result = HabitGoalService.equip_slot(user_id, slot, relic_id)
    except Exception as e:
        return jsonify({"error": str(e)}), 400

    return jsonify(result), 200
