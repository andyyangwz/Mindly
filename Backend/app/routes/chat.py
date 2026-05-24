import uuid

from flask import Blueprint, jsonify, request

from app.auth.decorators import require_auth
from app.schemas.chat_schema import (
    validate_create_message,
    validate_create_session,
    validate_rename_session,
)
from app.services.chat_service import ChatService

chat_bp = Blueprint("chat", __name__, url_prefix="/api/chats")


@chat_bp.route("", methods=["GET"])
@require_auth
def list_sessions(user_id):
    sessions = ChatService.get_sessions(user_id)
    return jsonify({"sessions": [s.to_dict() for s in sessions]})


@chat_bp.route("/<session_id>", methods=["GET"])
@require_auth
def get_session(user_id, session_id):
    try:
        sid = uuid.UUID(session_id)
    except ValueError:
        return jsonify({"error": "Invalid session ID"}), 400

    session = ChatService.get_session(sid, user_id)
    if not session:
        return jsonify({"error": "Session not found"}), 404

    return jsonify({"session": session.to_dict()})


@chat_bp.route("", methods=["POST"])
@require_auth
def create_session(user_id):
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body is required"}), 400

    errors = validate_create_session(data)
    if errors:
        return jsonify({"error": "Validation failed", "details": errors}), 400

    session = ChatService.create_session(user_id, data["title"])
    return jsonify({"session": session.to_dict()}), 201


@chat_bp.route("/<session_id>", methods=["PUT"])
@require_auth
def rename_session(user_id, session_id):
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body is required"}), 400

    errors = validate_rename_session(data)
    if errors:
        return jsonify({"error": "Validation failed", "details": errors}), 400

    try:
        sid = uuid.UUID(session_id)
    except ValueError:
        return jsonify({"error": "Invalid session ID"}), 400

    session = ChatService.rename_session(sid, user_id, data["title"])
    if not session:
        return jsonify({"error": "Session not found"}), 404

    return jsonify({"session": session.to_dict()})


@chat_bp.route("/<session_id>", methods=["DELETE"])
@require_auth
def delete_session(user_id, session_id):
    try:
        sid = uuid.UUID(session_id)
    except ValueError:
        return jsonify({"error": "Invalid session ID"}), 400

    deleted = ChatService.delete_session(sid, user_id)
    if not deleted:
        return jsonify({"error": "Session not found"}), 404

    return jsonify({"message": "Session deleted"})


@chat_bp.route("/<session_id>/messages", methods=["GET"])
@require_auth
def list_messages(user_id, session_id):
    try:
        sid = uuid.UUID(session_id)
    except ValueError:
        return jsonify({"error": "Invalid session ID"}), 400

    messages = ChatService.get_messages(sid, user_id)
    if messages is None:
        return jsonify({"error": "Session not found"}), 404

    return jsonify({"messages": [m.to_dict() for m in messages]})


@chat_bp.route("/<session_id>/messages", methods=["POST"])
@require_auth
def create_message(user_id, session_id):
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body is required"}), 400

    errors = validate_create_message(data)
    if errors:
        return jsonify({"error": "Validation failed", "details": errors}), 400

    try:
        sid = uuid.UUID(session_id)
    except ValueError:
        return jsonify({"error": "Invalid session ID"}), 400

    message = ChatService.create_message(sid, user_id, data.get("role", "user"), data["content"])
    if not message:
        return jsonify({"error": "Session not found"}), 404

    return jsonify({"message": message.to_dict()}), 201
