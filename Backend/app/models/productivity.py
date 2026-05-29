from sqlalchemy.dialects.postgresql import UUID
from app.extensions import db
from app.utils.productivity_constants import VALID_PRODUCTIVITY_LEVELS, VALID_STATUSES


class ProductivityEvent(db.Model):
    __tablename__ = "productivity_events"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=db.func.gen_random_uuid())
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id"), nullable=False, index=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, default="")
    start_datetime = db.Column(db.DateTime, nullable=False)
    end_datetime = db.Column(db.DateTime, nullable=False)
    color = db.Column(db.String(7), default="#7C3AED")
    priority = db.Column(db.String(10), default="medium")
    productivity_level = db.Column(db.String(20), default="neutral")
    has_deadline = db.Column(db.Boolean, default=False, nullable=False)
    status = db.Column(db.String(20), default="To Do", nullable=False)
    status_change_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=db.func.now())
    updated_at = db.Column(db.DateTime, default=db.func.now(), onupdate=db.func.now())

    VALID_LEVELS = set(VALID_PRODUCTIVITY_LEVELS.keys())
    VALID_STATUSES = VALID_STATUSES

    def to_dict(self, plan=False):
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "title": self.title,
            "description": self.description or "",
            "start_datetime": self.start_datetime.isoformat() if self.start_datetime else None,
            "end_datetime": self.end_datetime.isoformat() if self.end_datetime else None,
            "color": self.color,
            "priority": self.priority,
            "productivity_level": self.productivity_level,
            "has_deadline": self.has_deadline,
            "status": self.status,
            "status_change_at": self.status_change_at.isoformat() if self.status_change_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
