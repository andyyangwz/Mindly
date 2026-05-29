from flask import Flask
from sqlalchemy import text
from .config import Config
from .extensions import db, migrate, cors
import logging


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s [%(name)s] %(message)s',
        datefmt='%H:%M:%S',
    )

    print("=" * 60)
    print("  Spill AI Backend — Initializing")
    print("=" * 60)

    db.init_app(app)
    migrate.init_app(app, db)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}})
    print("  ✓ Database initialized")
    print("  ✓ CORS enabled for /api/*")

    from .utils.errors import register_error_handlers
    register_error_handlers(app)
    print("  ✓ Error handlers registered")

    from .auth.auth_routes import auth_bp
    app.register_blueprint(auth_bp)
    print("  ✓ Auth blueprint registered")

    from .routes.journals import journals_bp
    app.register_blueprint(journals_bp)
    print("  ✓ Journals blueprint registered")

    from .routes.productivity import productivity_bp
    app.register_blueprint(productivity_bp)
    print("  ✓ Productivity blueprint registered")

    from .routes.chat import chat_bp
    app.register_blueprint(chat_bp)
    print("  ✓ Chat blueprint registered")

    from .routes.spill_ai_routes import spill_ai_bp
    app.register_blueprint(spill_ai_bp)
    print("  ✓ Spill AI blueprint registered")

    from .routes.habit_goals import habit_goals_bp
    app.register_blueprint(habit_goals_bp)
    print("  ✓ Habit goals blueprint registered")

    from .routes.journal_voice import journal_voice_bp
    app.register_blueprint(journal_voice_bp)
    print("  ✓ Journal voice blueprint registered")

    from .routes.stats import stats_bp
    app.register_blueprint(stats_bp)
    print("  ✓ Stats blueprint registered")
    from .routes.voice import voice_bp
    app.register_blueprint(voice_bp)
    print("  ✓ Voice blueprint registered")

    groq_key = app.config.get("GROQ_API_KEY", "")
    groq_model = app.config.get("GROQ_MODEL", "NOT SET")
    if groq_key:
        print(f"  ✓ Groq AI configured (model: {groq_model})")
    else:
        print(f"  ⚠ Groq AI NOT configured — set GROQ_API_KEY in .env")

    print("=" * 60)
    return app


def verify_db(app):
    with app.app_context():
        try:
            db.session.execute(text("SELECT 1"))
            db.session.commit()
            print("  ✓ Database connection verified")
            return True
        except Exception as e:
            print(f"  ✗ Database connection FAILED: {e}")
            return False
