from app.models.user import User
from app.extensions import db
from .password_utils import hash_password, verify_password


class AuthService:

    @staticmethod
    def create_user(first_name, last_name, username, email, password):
        if not first_name or not first_name.strip():
            raise ValueError("First name is required")
        if User.query.filter_by(username=username).first():
            raise ValueError("Username already exists")
        if User.query.filter_by(email=email).first():
            raise ValueError("Email already exists")

        user = User(
            first_name=first_name.strip(),
            last_name=(last_name or "").strip(),
            username=username,
            email=email,
            password_hash=hash_password(password),
        )
        db.session.add(user)
        db.session.commit()
        return user

    @staticmethod
    def authenticate(login, password):
        user = User.query.filter(
            (User.username == login) | (User.email == login)
        ).first()
        if not user or not user.password_hash:
            return None
        if not verify_password(password, user.password_hash):
            return None
        return user

    @staticmethod
    def get_user_by_id(user_id):
        return User.query.get(user_id)
