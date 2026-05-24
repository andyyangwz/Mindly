from flask import Blueprint, jsonify, request

from app.auth.decorators import require_auth
from app.services.stats_service import StatsService

stats_bp = Blueprint("stats", __name__, url_prefix="/api/stats")


@stats_bp.route("/home", methods=["GET"])
@require_auth
def get_home_stats(user_id):
    data = StatsService.get_home_stats(user_id)
    return jsonify(data), 200


@stats_bp.route("/weekly", methods=["GET"])
@require_auth
def get_weekly_stats(user_id):
    week_start = request.args.get("week_start")
    data = StatsService.get_weekly_stats(user_id, week_start)
    return jsonify(data), 200
