import uuid
from datetime import datetime

from app.extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(
        db.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    first_name = db.Column(db.String(255), nullable=False)
    last_name = db.Column(db.String(255), nullable=False)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=True)
    verified_at = db.Column(db.DateTime, nullable=True)
    verification_token = db.Column(db.String(128), nullable=True, unique=True)
    verification_token_expires_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(
        db.DateTime, default=datetime.utcnow, server_default=db.func.now()
    )
    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        server_default=db.func.now(),
    )

    journals = db.relationship("Journal", backref="owner", lazy="dynamic")
    productivity_events = db.relationship(
        "ProductivityEvent", backref="owner", lazy="dynamic"
    )
    chat_sessions = db.relationship(
        "ChatSession", backref="owner", lazy="dynamic"
    )
    habit_goals = db.relationship(
        "HabitGoal", backref="owner", lazy="dynamic"
    )

    def to_dict(self):
        return {
            "id": str(self.id),
            "first_name": self.first_name,
            "last_name": self.last_name,
            "username": self.username,
            "email": self.email,
            "verified_at": self.verified_at.isoformat() if self.verified_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
