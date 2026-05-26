from uuid import UUID

from app.extensions import db
from app.models.folder import Folder, JournalFolder
from app.models.journal import Journal
from app.utils.errors import NotFoundError


class FolderService:

    @staticmethod
    def get_all(user_id):
        return (Folder.query
                .filter_by(user_id=user_id)
                .order_by(Folder.created_at.desc())
                .all())

    @staticmethod
    def get_by_id(folder_id, user_id):
        folder = Folder.query.filter_by(id=folder_id, user_id=user_id).first()
        if not folder:
            raise NotFoundError(f"Folder with id '{folder_id}' not found")
        return folder

    @staticmethod
    def create(data, user_id):
        folder = Folder(
            user_id=user_id,
            name=data["name"].strip(),
            emoji=data.get("emoji", "📁"),
        )
        db.session.add(folder)
        db.session.commit()
        return folder

    @staticmethod
    def update(folder, data):
        if "name" in data:
            folder.name = data["name"].strip()
        if "emoji" in data:
            folder.emoji = data["emoji"]
        db.session.commit()
        return folder

    @staticmethod
    def delete(folder):
        db.session.delete(folder)
        db.session.commit()

    @staticmethod
    def set_journal_folders(journal_id, user_id, folder_ids):
        journal = Journal.query.filter_by(id=journal_id, user_id=user_id).first()
        if not journal:
            raise NotFoundError(f"Journal with id '{journal_id}' not found")

        JournalFolder.query.filter_by(journal_id=journal_id).delete()

        for fid in folder_ids:
            folder_uuid = UUID(fid)
            folder = Folder.query.filter_by(id=folder_uuid, user_id=user_id).first()
            if folder:
                db.session.add(JournalFolder(journal_id=journal_id, folder_id=folder_uuid))

        db.session.commit()
        return journal

    @staticmethod
    def get_journal_folder_ids(journal_id, user_id):
        journal = Journal.query.filter_by(id=journal_id, user_id=user_id).first()
        if not journal:
            raise NotFoundError(f"Journal with id '{journal_id}' not found")
        return [str(f.id) for f in journal.folders]

    @staticmethod
    def get_journals_by_folder(folder_id, user_id, search=None, sort_by="created_at", sort_order="desc",
                                favorites=None, pinned=None, page=1, per_page=20):
        from sqlalchemy import or_

        folder = Folder.query.filter_by(id=folder_id, user_id=user_id).first()
        if not folder:
            raise NotFoundError(f"Folder with id '{folder_id}' not found")

        query = (Journal.query
                 .join(JournalFolder, Journal.id == JournalFolder.journal_id)
                 .filter(JournalFolder.folder_id == folder_id, Journal.user_id == user_id))

        if search:
            search_filter = or_(
                Journal.title.ilike(f"%{search}%"),
                Journal.content.ilike(f"%{search}%"),
            )
            query = query.filter(search_filter)
        if favorites is not None:
            query = query.filter(Journal.is_favorite == favorites)
        if pinned is not None:
            query = query.filter(Journal.is_pinned == pinned)

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
