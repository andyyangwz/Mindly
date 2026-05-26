from sqlalchemy.dialects.postgresql import UUID
from app.extensions import db


class Folder(db.Model):
    __tablename__ = "folders"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=db.func.gen_random_uuid())
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id"), nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    emoji = db.Column(db.String(10), default="📁")
    created_at = db.Column(db.DateTime, default=db.func.now())
    updated_at = db.Column(db.DateTime, default=db.func.now(), onupdate=db.func.now())

    journals = db.relationship("Journal", secondary="journal_folders", back_populates="folders", lazy="select")

    def to_dict(self):
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "name": self.name,
            "emoji": self.emoji or "📁",
            "journal_count": len(self.journals) if self.journals else 0,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class JournalFolder(db.Model):
    __tablename__ = "journal_folders"

    journal_id = db.Column(UUID(as_uuid=True), db.ForeignKey("journals.id", ondelete="CASCADE"), primary_key=True)
    folder_id = db.Column(UUID(as_uuid=True), db.ForeignKey("folders.id", ondelete="CASCADE"), primary_key=True)
