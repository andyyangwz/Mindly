from sqlalchemy import or_
from app.extensions import db
from app.models.journal import Journal
from app.utils.errors import NotFoundError


class JournalService:

    @staticmethod
    def get_all(user_id, search=None, sort_by="created_at", sort_order="desc",
                favorites=None, pinned=None, page=1, per_page=20):
        query = Journal.query.filter_by(user_id=user_id)

        if search:
            search_filter = or_(
                Journal.title.ilike(f"%{search}%"),
                Journal.content.ilike(f"%{search}%"),
            )
            query = query.filter(search_filter)

        if favorites is not None:
            query = query.filter_by(is_favorite=favorites)

        if pinned is not None:
            query = query.filter_by(is_pinned=pinned)

        allowed_sorts = {"created_at", "updated_at", "title"}
        if sort_by not in allowed_sorts:
            sort_by = "created_at"

        sort_column = getattr(Journal, sort_by)
        if sort_order == "asc":
            query = query.order_by(sort_column.asc())
        else:
            query = query.order_by(sort_column.desc())

        pagination = query.paginate(page=page, per_page=per_page, error_out=False)

        return pagination

    @staticmethod
    def get_by_id(journal_id, user_id):
        journal = Journal.query.filter_by(id=journal_id, user_id=user_id).first()
        if not journal:
            raise NotFoundError(f"Journal with id '{journal_id}' not found")
        return journal

    @staticmethod
    def create(data, user_id):
        journal = Journal(
            user_id=user_id,
            title=data["title"],
            content=data["content"],
            emojis=data.get("emojis", []),
            is_favorite=data.get("is_favorite", False),
            is_pinned=data.get("is_pinned", False),
            ai_enabled=data.get("ai_enabled", False),
        )
        db.session.add(journal)
        db.session.commit()
        return journal

    @staticmethod
    def update(journal, data):
        if "title" in data:
            journal.title = data["title"]
        if "content" in data:
            journal.content = data["content"]
        if "emojis" in data:
            journal.emojis = data["emojis"]
        if "is_favorite" in data:
            journal.is_favorite = data["is_favorite"]
        if "is_pinned" in data:
            journal.is_pinned = data["is_pinned"]
            if not data["is_pinned"]:
                journal.navbar_order = None
        if "ai_enabled" in data:
            journal.ai_enabled = data["ai_enabled"]
        if "navbar_order" in data:
            journal.navbar_order = data["navbar_order"]

        db.session.commit()
        return journal

    @staticmethod
    def delete(journal):
        user_id = journal.user_id
        db.session.delete(journal)
        db.session.commit()
        JournalService.reindex_navbar(user_id)

    @staticmethod
    def reindex_navbar(user_id):
        journals = (
            Journal.query
            .filter_by(user_id=user_id)
            .filter(Journal.navbar_order.isnot(None))
            .order_by(Journal.navbar_order.asc())
            .all()
        )
        for i, j in enumerate(journals, start=1):
            j.navbar_order = i
        db.session.commit()

    @staticmethod
    def set_navbar_orders(user_id, orders):
        """Set navbar orders from a list of {id, order} dicts.
        Clears all existing navbar orders first, then assigns new ones.
        """
        existing = Journal.query.filter_by(user_id=user_id).filter(
            Journal.navbar_order.isnot(None)
        ).all()
        for j in existing:
            j.navbar_order = None
        db.session.flush()

        for item in orders:
            journal = Journal.query.filter_by(id=item["id"], user_id=user_id).first()
            if journal:
                journal.navbar_order = item["order"]
        db.session.commit()

    @staticmethod
    def get_forwardable(user_id):
        """Return journals with ai_enabled=true, sorted latest first.

        Used by the Spill AI "Forward Journal" feature.
        """
        return (
            Journal.query
            .filter_by(user_id=user_id, ai_enabled=True)
            .order_by(Journal.created_at.desc())
            .all()
        )

    @staticmethod
    def mark_opened(journal_id, user_id):
        """Set last_opened_at to now for the given journal."""
        journal = Journal.query.filter_by(id=journal_id, user_id=user_id).first()
        if not journal:
            raise NotFoundError(f"Journal with id '{journal_id}' not found")
        from datetime import datetime, timezone
        journal.last_opened_at = datetime.now(timezone.utc)
        db.session.commit()
        return journal

    @staticmethod
    def get_latest_opened(user_id):
        """Return the most recently opened journal for the user, or None."""
        return (
            Journal.query
            .filter_by(user_id=user_id)
            .filter(Journal.last_opened_at.isnot(None))
            .order_by(Journal.last_opened_at.desc())
            .first()
        )
