import uuid
import logging

from app.extensions import db
from app.models.user import User
from app.auth.password_utils import hash_password
from .journal_seeds import seed_journals
from .productivity_seeds import seed_productivity
from .habit_goal_seeds import seed_habit_goals

logger = logging.getLogger(__name__)

SEEDED_USER_ID = uuid.UUID("550e8400-e29b-41d4-a716-446655440000")


def get_or_create_seeded_user():
    """Get or create the default Andy Yang user.

    Idempotent — safe to call multiple times.
    The migration also creates this user, but this function
    serves as a fallback for fresh databases or testing.
    """
    user = User.query.get(SEEDED_USER_ID)
    if not user:
        user = User(
            id=SEEDED_USER_ID,
            first_name="Andy",
            last_name="Yang",
            username="andyyang",
            email="andyyangwz@gmail.com",
            password_hash=hash_password("admin"),
        )
        db.session.add(user)
        db.session.commit()
        logger.info("Created seeded user: Andy Yang (andyyang / admin)")
    return user


def seed_all(force=False):
    user = get_or_create_seeded_user()
    results = {}
    results["journals"] = seed_journals(user_id=user.id, force=force)
    results["productivity"] = seed_productivity(user_id=user.id, force=force)
    results["habit_goals"] = seed_habit_goals(user_id=user.id, force=force)
    return results
