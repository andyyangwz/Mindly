from sqlalchemy.dialects.postgresql import UUID
from app.extensions import db


class Reminder(db.Model):
    __tablename__ = "reminders"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=db.func.gen_random_uuid())
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id"), nullable=False, index=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    datetime = db.Column(db.DateTime, nullable=False)
    color = db.Column(db.String(7), nullable=False, default="#7C3AED")
    priority = db.Column(db.String(10), nullable=False, default="medium")
    created_at = db.Column(db.DateTime, default=db.func.now())
    updated_at = db.Column(db.DateTime, default=db.func.now(), onupdate=db.func.now())

    def to_dict(self):
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "title": self.title,
            "description": self.description or "",
            "datetime": self.datetime.isoformat() if self.datetime else None,
            "color": self.color,
            "priority": self.priority,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
