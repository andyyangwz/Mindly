from app.extensions import db
from app.models.habit_goal import HabitGoal


def _entries(user_id):
    return [
        HabitGoal(
            user_id=user_id,
            icon="FaDumbbell",
            title="Gym",
            current_progress=120,
            target=100,
            is_equipped=True,
            equipped_order=0,
        ),
        HabitGoal(
            user_id=user_id,
            icon="FaBook",
            title="Reading",
            current_progress=42,
            target=50,
            is_equipped=True,
            equipped_order=1,
        ),
        HabitGoal(
            user_id=user_id,
            icon="FaCode",
            title="Coding",
            current_progress=30,
            target=100,
            is_equipped=True,
            equipped_order=2,
        ),
        HabitGoal(
            user_id=user_id,
            icon="MdBedtime",
            title="Sleep",
            current_progress=27,
            target=30,
            is_equipped=False,
            equipped_order=None,
        ),
        HabitGoal(
            user_id=user_id,
            icon="GiMeditation",
            title="Meditation",
            current_progress=7,
            target=7,
            is_equipped=False,
            equipped_order=None,
        ),
        HabitGoal(
            user_id=user_id,
            icon="FaPen",
            title="Journaling",
            current_progress=5,
            target=5,
            is_equipped=False,
            equipped_order=None,
        ),
        HabitGoal(
            user_id=user_id,
            icon="FaSun",
            title="Morning Routine",
            current_progress=6,
            target=10,
            is_equipped=False,
            equipped_order=None,
        ),
    ]


def seed_habit_goals(user_id, force=False):
    existing = HabitGoal.query.filter_by(user_id=user_id).count()
    if existing > 0:
        if force:
            HabitGoal.query.filter_by(user_id=user_id).delete()
            db.session.commit()
        else:
            raise RuntimeError(
                f"User {user_id} already has {existing} habit goals. "
                "Use --force to delete existing entries and re-seed."
            )

    entries = _entries(user_id)
    for e in entries:
        db.session.add(e)
    db.session.commit()
    return entries
