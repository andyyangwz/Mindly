import logging

from flask import Blueprint, jsonify, request

from .auth_service import AuthService
from .jwt_utils import create_access_token
from .decorators import require_auth
from .google_service import google_auth

logger = logging.getLogger(__name__)

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body is required"}), 400

    first_name = (data.get("first_name") or "").strip()
    last_name = (data.get("last_name") or "").strip()
    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip()
    password = data.get("password") or ""

    errors = []
    if not first_name or len(first_name) < 2:
        errors.append("First name is required")
    if len(username) < 3:
        errors.append("Username must be at least 3 characters")
    if not email or "@" not in email:
        errors.append("Valid email is required")
    if len(password) < 6:
        errors.append("Password must be at least 6 characters")

    if errors:
        return jsonify({"error": "Validation failed", "details": errors}), 400

    try:
        user = AuthService.create_user(first_name, last_name, username, email, password)
        token = create_access_token(user.id)
        logger.info("User signed up: %s %s (%s)", user.first_name, user.last_name, user.email)
        return jsonify({"user": user.to_dict(), "token": token}), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 409


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body is required"}), 400

    login_id = (data.get("login") or "").strip()
    password = data.get("password") or ""

    if not login_id or not password:
        return jsonify({"error": "Login and password are required"}), 400

    user = AuthService.authenticate(login_id, password)
    if not user:
        logger.warning("Failed login attempt for: %s", login_id)
        return jsonify({"error": "Invalid credentials"}), 401

    token = create_access_token(user.id)
    logger.info("User logged in: %s (%s)", user.username, user.email)
    return jsonify({"user": user.to_dict(), "token": token}), 200


@auth_bp.route("/google", methods=["POST"])
def google():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body is required"}), 400

    credential = data.get("credential", "")
    if not credential:
        return jsonify({"error": "Google credential is required"}), 400

    user = google_auth(credential)
    if not user:
        return jsonify({"error": "Google authentication failed"}), 401

    token = create_access_token(user.id)
    logger.info("Google auth: %s (%s)", user.first_name, user.email)
    return jsonify({"user": user.to_dict(), "token": token}), 200


@auth_bp.route("/me", methods=["GET"])
@require_auth
def get_me(user_id):
    user = AuthService.get_user_by_id(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"user": user.to_dict()}), 200
