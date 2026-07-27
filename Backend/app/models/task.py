from sqlalchemy.dialects.postgresql import UUID
from app.extensions import db


class Task(db.Model):
    __tablename__ = "tasks"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=db.func.gen_random_uuid())
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id"), nullable=False, index=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    start_datetime = db.Column(db.DateTime, nullable=False)
    deadline_datetime = db.Column(db.DateTime, nullable=False)
    color = db.Column(db.String(7), nullable=False, default="#7C3AED")
    priority = db.Column(db.String(10), nullable=False, default="medium")
    status = db.Column(db.String(20), nullable=False, default="To Do")
    status_changed_at = db.Column(db.DateTime, nullable=True)
    progress = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.DateTime, default=db.func.now())
    updated_at = db.Column(db.DateTime, default=db.func.now(), onupdate=db.func.now())

    def to_dict(self):
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "title": self.title,
            "description": self.description or "",
            "start_datetime": self.start_datetime.isoformat() if self.start_datetime else None,
            "deadline_datetime": self.deadline_datetime.isoformat() if self.deadline_datetime else None,
            "color": self.color,
            "priority": self.priority,
            "status": self.status,
            "status_changed_at": self.status_changed_at.isoformat() if self.status_changed_at else None,
            "progress": self.progress,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
