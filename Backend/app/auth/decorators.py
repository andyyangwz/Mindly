import uuid
from functools import wraps

from flask import request, jsonify

from .jwt_utils import decode_access_token
from app.models.user import User


def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid Authorization header"}), 401

        token = auth_header.split(" ", 1)[1]
        user_id_str = decode_access_token(token)
        if not user_id_str:
            return jsonify({"error": "Invalid or expired token"}), 401

        kwargs["user_id"] = uuid.UUID(user_id_str)
        return f(*args, **kwargs)

    return decorated


def require_verified(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid Authorization header"}), 401

        token = auth_header.split(" ", 1)[1]
        user_id_str = decode_access_token(token)
        if not user_id_str:
            return jsonify({"error": "Invalid or expired token"}), 401

        user = User.query.get(uuid.UUID(user_id_str))
        if not user:
            return jsonify({"error": "User not found"}), 404

        if not user.verified_at:
            return jsonify({"error": "Email not verified", "code": "EMAIL_NOT_VERIFIED"}), 403

        kwargs["user_id"] = uuid.UUID(user_id_str)
        return f(*args, **kwargs)

    return decorated
