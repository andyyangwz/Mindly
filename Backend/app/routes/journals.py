from flask import Blueprint, request, jsonify

from app.auth.decorators import require_auth
from app.services.journal_service import JournalService
from app.services.folder_service import FolderService
from app.schemas.journal_schema import validate_create, validate_update
from app.schemas.folder_schema import validate_create as validate_folder_create
from app.schemas.folder_schema import validate_update as validate_folder_update
from app.schemas.folder_schema import validate_folder_ids


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
    folder_id = request.args.get("folder_id")

    favorites = _parse_bool(request.args.get("favorites"))
    pinned = _parse_bool(request.args.get("pinned"))

    if folder_id:
        pagination = FolderService.get_journals_by_folder(
            folder_id, user_id=user_id, search=search,
            sort_by=sort_by, sort_order=sort_order,
            favorites=favorites, pinned=pinned,
            page=page, per_page=per_page,
        )
    else:
        pagination = JournalService.get_all(
            user_id=user_id, search=search,
            sort_by=sort_by, sort_order=sort_order,
            favorites=favorites, pinned=pinned,
            page=page, per_page=per_page,
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

    folder_ids = validated.pop("folder_ids", None) if isinstance(validated, dict) else None
    journal = JournalService.create(validated, user_id)

    if folder_ids:
        FolderService.set_journal_folders(journal.id, user_id, folder_ids)

    return jsonify({"journal": journal.to_dict()}), 201


@journals_bp.route("/<uuid:journal_id>", methods=["PUT"])
@require_auth
def update_journal(user_id, journal_id):
    journal = JournalService.get_by_id(journal_id, user_id)

    data = request.get_json(silent=True)
    validated = validate_update(data)

    journal = JournalService.update(journal, validated)

    if "folder_ids" in data:
        fids = validate_folder_ids(data)
        journal = FolderService.set_journal_folders(journal.id, user_id, fids)

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


# ---- Folder routes ----

@journals_bp.route("/folders", methods=["GET"])
@require_auth
def get_folders(user_id):
    folders = FolderService.get_all(user_id)
    return jsonify({"folders": [f.to_dict() for f in folders]})


@journals_bp.route("/folders", methods=["POST"])
@require_auth
def create_folder(user_id):
    data = request.get_json(silent=True)
    validated = validate_folder_create(data)
    folder = FolderService.create(validated, user_id)
    return jsonify({"folder": folder.to_dict()}), 201


@journals_bp.route("/folders/<uuid:folder_id>", methods=["PUT"])
@require_auth
def update_folder(user_id, folder_id):
    folder = FolderService.get_by_id(folder_id, user_id)
    data = request.get_json(silent=True)
    validated = validate_folder_update(data)
    folder = FolderService.update(folder, validated)
    return jsonify({"folder": folder.to_dict()})


@journals_bp.route("/folders/<uuid:folder_id>", methods=["DELETE"])
@require_auth
def delete_folder(user_id, folder_id):
    folder = FolderService.get_by_id(folder_id, user_id)
    FolderService.delete(folder)
    return jsonify({"message": "Folder deleted successfully"}), 200


@journals_bp.route("/<uuid:journal_id>/folders", methods=["POST"])
@require_auth
def set_journal_folders(user_id, journal_id):
    data = request.get_json(silent=True)
    fids = validate_folder_ids(data)
    journal = FolderService.set_journal_folders(journal_id, user_id, fids)
    return jsonify({"folder_ids": [str(f.id) for f in journal.folders]})


@journals_bp.route("/<uuid:journal_id>/folders", methods=["GET"])
@require_auth
def get_journal_folders(user_id, journal_id):
    fids = FolderService.get_journal_folder_ids(journal_id, user_id)
    return jsonify({"folder_ids": fids})
