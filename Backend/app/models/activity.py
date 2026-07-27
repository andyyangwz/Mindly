from sqlalchemy.dialects.postgresql import UUID
from app.extensions import db


class Activity(db.Model):
    __tablename__ = "activities"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=db.func.gen_random_uuid())
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id"), nullable=False, index=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    start_datetime = db.Column(db.DateTime, nullable=False)
    end_datetime = db.Column(db.DateTime, nullable=False)
    color = db.Column(db.String(7), nullable=False, default="#7C3AED")
    productivity_level = db.Column(db.String(20), nullable=False, default="neutral")
    status = db.Column(db.String(20), nullable=False, default="To Do")
    created_at = db.Column(db.DateTime, default=db.func.now())
    updated_at = db.Column(db.DateTime, default=db.func.now(), onupdate=db.func.now())

    def to_dict(self):
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "title": self.title,
            "description": self.description or "",
            "start_datetime": self.start_datetime.isoformat() if self.start_datetime else None,
            "end_datetime": self.end_datetime.isoformat() if self.end_datetime else None,
            "color": self.color,
            "productivity_level": self.productivity_level,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
