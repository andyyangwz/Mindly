import logging

from flask import current_app
from app.extensions import db
from app.models.user import User
from .password_utils import hash_password

logger = logging.getLogger(__name__)


def verify_google_id_token(credential):
    client_id = current_app.config.get("GOOGLE_CLIENT_ID", "")
    if not client_id:
        logger.error("GOOGLE_CLIENT_ID not configured")
        return None

    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests

        info = id_token.verify_oauth2_token(
            credential, requests.Request(), client_id
        )
        return info
    except ValueError as e:
        logger.warning("Google token verification failed: %s", e)
        return None
    except ImportError:
        logger.error("google-auth package not installed")
        return None


def google_auth(credential):
    info = verify_google_id_token(credential)
    if not info:
        return None

    google_email = info.get("email", "")
    google_name = info.get("name", "")
    google_sub = info.get("sub", "")

    if not google_email:
        logger.warning("Google token missing email")
        return None

    user = User.query.filter_by(email=google_email).first()

    if user:
        if not user.verified_at:
            user.verified_at = db.func.now()
            db.session.commit()
        return user

    name_parts = google_name.split(" ", 1)
    first_name = name_parts[0] if name_parts else "User"
    last_name = name_parts[1] if len(name_parts) > 1 else ""

    base_username = google_email.split("@")[0][:20]
    username = base_username
    counter = 1
    while User.query.filter_by(username=username).first():
        username = f"{base_username[:16]}{counter}"
        counter += 1

    user = User(
        first_name=first_name,
        last_name=last_name,
        username=username,
        email=google_email,
        password_hash=None,
        verified_at=db.func.now(),
    )
    db.session.add(user)
    db.session.commit()

    logger.info("Google user created: %s (%s)", user.first_name, user.email)
    return user
