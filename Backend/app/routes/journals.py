from flask import Blueprint, request, jsonify

from app.auth.decorators import require_auth
from app.services.journal_service import JournalService
from app.schemas.journal_schema import validate_create, validate_update


journals_bp = Blueprint("journals", __name__, url_prefix="/api/journals")


def _parse_bool(value):
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.lower() in ("true", "1", "yes")
    return None


@journals_bp.route("", methods=["GET"])
@require_auth
def get_journals(user_id):
    search = request.args.get("search")
    sort_by = request.args.get("sort_by", "created_at")
    sort_order = request.args.get("sort_order", "desc")
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)

    favorites = _parse_bool(request.args.get("favorites"))
    pinned = _parse_bool(request.args.get("pinned"))

    pagination = JournalService.get_all(
        user_id=user_id,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
        favorites=favorites,
        pinned=pinned,
        page=page,
        per_page=per_page,
    )

    return jsonify({
        "journals": [j.to_dict() for j in pagination.items],
        "pagination": {
            "page": pagination.page,
            "per_page": pagination.per_page,
            "total": pagination.total,
            "pages": pagination.pages,
            "has_next": pagination.has_next,
            "has_prev": pagination.has_prev,
        },
    })


@journals_bp.route("/<uuid:journal_id>", methods=["GET"])
@require_auth
def get_journal(user_id, journal_id):
    journal = JournalService.get_by_id(journal_id, user_id)
    return jsonify({"journal": journal.to_dict()})


@journals_bp.route("", methods=["POST"])
@require_auth
def create_journal(user_id):
    data = request.get_json(silent=True)
    validated = validate_create(data)

    journal = JournalService.create(validated, user_id)
    return jsonify({"journal": journal.to_dict()}), 201


@journals_bp.route("/<uuid:journal_id>", methods=["PUT"])
@require_auth
def update_journal(user_id, journal_id):
    journal = JournalService.get_by_id(journal_id, user_id)

    data = request.get_json(silent=True)
    validated = validate_update(data)

    journal = JournalService.update(journal, validated)
    return jsonify({"journal": journal.to_dict()})


@journals_bp.route("/<uuid:journal_id>", methods=["DELETE"])
@require_auth
def delete_journal(user_id, journal_id):
    journal = JournalService.get_by_id(journal_id, user_id)
    JournalService.delete(journal)
    return jsonify({"message": "Journal deleted successfully"}), 200


@journals_bp.route("/forwardable", methods=["GET"])
@require_auth
def get_forwardable_journals(user_id):
    journals = JournalService.get_forwardable(user_id)
    return jsonify({
        "journals": [j.to_dict() for j in journals],
    })
