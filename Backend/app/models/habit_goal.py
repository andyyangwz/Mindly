from sqlalchemy.dialects.postgresql import UUID
from app.extensions import db


class HabitGoal(db.Model):
    __tablename__ = "habit_goals"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=db.func.gen_random_uuid())
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id"), nullable=False, index=True)
    icon = db.Column(db.String(50), nullable=False, default="FaStar")
    title = db.Column(db.String(255), nullable=False)
    current_progress = db.Column(db.Integer, nullable=False, default=0)
    target = db.Column(db.Integer, nullable=False)
    is_equipped = db.Column(db.Boolean, nullable=False, default=False)
    equipped_order = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime, default=db.func.now())
    updated_at = db.Column(db.DateTime, default=db.func.now(), onupdate=db.func.now())

    def to_dict(self):
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "icon": self.icon,
            "title": self.title,
            "current_progress": self.current_progress,
            "target": self.target,
            "is_equipped": self.is_equipped,
            "equipped_order": self.equipped_order,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
