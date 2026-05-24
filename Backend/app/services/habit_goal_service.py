from app.extensions import db
from app.models.habit_goal import HabitGoal
from app.utils.errors import NotFoundError, ValidationError


class HabitGoalService:

    @staticmethod
    def get_all(user_id):
        return HabitGoal.query.filter_by(user_id=user_id).order_by(HabitGoal.created_at.asc()).all()

    @staticmethod
    def get_equipped(user_id):
        return HabitGoal.query.filter_by(
            user_id=user_id, is_equipped=True
        ).order_by(HabitGoal.equipped_order.asc()).all()

    @staticmethod
    def get_by_id(goal_id, user_id):
        goal = HabitGoal.query.filter_by(id=goal_id, user_id=user_id).first()
        if not goal:
            raise NotFoundError(f"Habit goal with id '{goal_id}' not found")
        return goal

    @staticmethod
    def create(data, user_id):
        goal = HabitGoal(
            user_id=user_id,
            icon=data.get("icon", "FaStar"),
            title=data["title"],
            current_progress=data.get("current_progress", 0),
            target=data["target"],
            is_equipped=False,
            equipped_order=None,
        )
        db.session.add(goal)
        db.session.commit()
        return goal

    @staticmethod
    def update(goal, data):
        if "icon" in data:
            goal.icon = data["icon"]
        if "title" in data:
            goal.title = data["title"]
        if "current_progress" in data:
            goal.current_progress = data["current_progress"]
        if "target" in data:
            goal.target = data["target"]
        if "is_equipped" in data:
            goal.is_equipped = data["is_equipped"]
        if "equipped_order" in data:
            goal.equipped_order = data["equipped_order"]
        db.session.commit()
        return goal

    @staticmethod
    def _compact_orders(user_id):
        equipped = (
            HabitGoal.query
            .filter_by(user_id=user_id, is_equipped=True)
            .order_by(HabitGoal.equipped_order.asc().nulls_last())
            .all()
        )
        for i, relic in enumerate(equipped):
            relic.equipped_order = i

    @staticmethod
    def unequip_slot(user_id, relic_id):
        relic = HabitGoal.query.filter_by(id=relic_id, user_id=user_id).first()
        if not relic:
            raise NotFoundError(f"Relic with id '{relic_id}' not found")

        relic.is_equipped = False
        relic.equipped_order = None

        HabitGoalService._compact_orders(user_id)
        db.session.commit()
        return relic.to_dict()

    @staticmethod
    def delete(goal):
        db.session.delete(goal)
        db.session.commit()

    @staticmethod
    def equip_slot(user_id, slot, relic_id):
        if slot not in (0, 1, 2):
            raise ValidationError("Slot must be 0, 1, or 2")

        relic = HabitGoal.query.filter_by(id=relic_id, user_id=user_id).first()
        if not relic:
            raise NotFoundError(f"Relic with id '{relic_id}' not found")

        current = HabitGoal.query.filter_by(
            user_id=user_id, equipped_order=slot
        ).first()

        if current:
            current.is_equipped = False
            current.equipped_order = None

        relic.is_equipped = True
        relic.equipped_order = slot

        HabitGoalService._compact_orders(user_id)
        db.session.commit()

        return {
            "unequipped": current.to_dict() if current else None,
            "equipped": relic.to_dict(),
        }
