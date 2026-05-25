from app.extensions import db
from app.models.chat import ChatSession, ChatMessage


class ChatService:
    @staticmethod
    def get_sessions(user_id):
        return (
            ChatSession.query
            .filter_by(user_id=user_id)
            .order_by(ChatSession.last_message_at.desc().nullslast())
            .all()
        )

    @staticmethod
    def get_session(session_id, user_id):
        return ChatSession.query.filter_by(id=session_id, user_id=user_id).first()

    @staticmethod
    def create_session(user_id, title):
        session = ChatSession(user_id=user_id, title=title.strip())
        db.session.add(session)
        db.session.commit()
        return session

    @staticmethod
    def rename_session(session_id, user_id, title):
        session = ChatSession.query.filter_by(id=session_id, user_id=user_id).first()
        if not session:
            return None
        session.title = title.strip()
        db.session.commit()
        return session

    @staticmethod
    def delete_session(session_id, user_id):
        session = ChatSession.query.filter_by(id=session_id, user_id=user_id).first()
        if not session:
            return False
        db.session.delete(session)
        db.session.commit()
        return True

    @staticmethod
    def get_messages(session_id, user_id):
        session = ChatSession.query.filter_by(id=session_id, user_id=user_id).first()
        if not session:
            return None
        return (
            ChatMessage.query
            .filter_by(session_id=session_id)
            .order_by(ChatMessage.created_at)
            .all()
        )

    @staticmethod
    def create_message(session_id, user_id, role, content, personality_mode=None):
        session = ChatSession.query.filter_by(id=session_id, user_id=user_id).first()
        if not session:
            return None
        message = ChatMessage(
            session_id=session_id,
            role=role,
            content=content.strip(),
            personality_mode=personality_mode,
        )
        db.session.add(message)
        session.updated_at = db.func.now()
        session.last_message_at = db.func.now()
        db.session.commit()
        return message

    @staticmethod
    def set_personality(session_id, user_id, personality):
        """Update the personality type for a chat session."""
        session = ChatSession.query.filter_by(id=session_id, user_id=user_id).first()
        if not session:
            return None
        old = session.personality_type
        session.personality_type = personality
        db.session.commit()
        return session
