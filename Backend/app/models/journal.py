from sqlalchemy.dialects.postgresql import UUID, ARRAY
from app.extensions import db


class Journal(db.Model):
    __tablename__ = "journals"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=db.func.gen_random_uuid())
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id"), nullable=False, index=True)
    title = db.Column(db.String(255), nullable=False)
    content = db.Column(db.Text, nullable=False)
    emojis = db.Column(ARRAY(db.String), default=[])
    is_favorite = db.Column(db.Boolean, default=False)
    is_pinned = db.Column(db.Boolean, default=False)
    ai_enabled = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=db.func.now())
    updated_at = db.Column(db.DateTime, default=db.func.now(), onupdate=db.func.now())

    def to_dict(self):
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "title": self.title,
            "content": self.content,
            "emojis": self.emojis or [],
            "is_favorite": self.is_favorite,
            "is_pinned": self.is_pinned,
            "ai_enabled": self.ai_enabled,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
