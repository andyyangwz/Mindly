"""Spill AI routes — HTTP endpoints for the Spill AI chat feature.

Endpoints:
    POST /api/spill-ai/chat          — Main chat endpoint
    POST /api/spill-ai/personality   — Change personality for a session
    POST /api/spill-ai/transcribe    — Transcribe audio via Whisper
    POST /api/spill-ai/test          — Direct AI test (no persistence)
"""

import logging
import traceback
import uuid

from flask import Blueprint, jsonify, request, current_app

from app.auth.decorators import require_auth
from app.extensions import db
from app.models.chat import ChatSession, ChatMessage
from app.services.ai.spill_ai_service import SpillAIService, MAX_CONTEXT_MESSAGES
from app.services.ai.personalities import (
    get_personality_prompt, get_personality_info,
    DEFAULT_PERSONALITY, VALID_PERSONALITIES,
)

logger = logging.getLogger(__name__)

spill_ai_bp = Blueprint("spill_ai", __name__, url_prefix="/api/spill-ai")


def _get_spill_service():
    """Create a SpillAIService instance from current app config.

    Raises ValueError if GROQ_API_KEY is not configured.
    """
    api_key = current_app.config.get("GROQ_API_KEY", "")
    model = current_app.config.get("GROQ_MODEL", "llama-3.3-70b-versatile")

    if not api_key:
        raise ValueError("GROQ_API_KEY is not configured in environment")

    return SpillAIService(api_key, model)


@spill_ai_bp.route("/chat", methods=["POST"])
@require_auth
def chat(user_id):
    """Main Spill AI chat endpoint."""
    data = request.get_json(silent=True)
    if not data or not data.get("message", "").strip():
        return jsonify({"error": "Message is required"}), 400

    message_text = data["message"].strip()
    session_id = data.get("session_id")
    personality = data.get("personality", DEFAULT_PERSONALITY)
    forwarded_journal = data.get("forwarded_journal")

    if personality not in VALID_PERSONALITIES:
        return jsonify({
            "error": f"Invalid personality. Must be one of: {', '.join(VALID_PERSONALITIES)}",
            "type": "ValidationError",
        }), 400

    journal_context = None
    if forwarded_journal:
        if not forwarded_journal.get("title") or not forwarded_journal.get("content"):
            return jsonify({"error": "forwarded_journal requires title and content"}), 400
        journal_context = {
            "id": forwarded_journal.get("id"),
            "title": forwarded_journal["title"],
            "content": forwarded_journal["content"],
        }

    logger.info(
        "Spill AI chat: user=%s session=%s personality=%s message_len=%d journal=%s",
        user_id, session_id or "new", personality, len(message_text),
        "yes" if journal_context else "no",
    )

    try:
        spill_service = _get_spill_service()
    except ValueError as e:
        logger.error("Spill AI config error: %s", str(e))
        return jsonify({
            "error": "AI service is not configured",
            "type": "ConfigurationError",
            "details": str(e),
        }), 500

    try:
        if session_id:
            try:
                sid = uuid.UUID(session_id)
            except ValueError:
                return jsonify({"error": "Invalid session ID"}), 400
            session = ChatSession.query.filter_by(id=sid, user_id=user_id).first()
            if not session:
                return jsonify({"error": "Session not found"}), 404
        else:
            title = message_text[:80]
            session = ChatSession(user_id=user_id, title=title, personality_type=personality)
            db.session.add(session)
            db.session.flush()

        if personality != session.personality_type:
            session.personality_type = personality
            logger.info(
                "Spill AI personality changed: session=%s old=%s new=%s",
                session.id, session.personality_type, personality,
            )

        user_msg = ChatMessage(
            session_id=session.id,
            role="user",
            content=message_text,
            journal_context=journal_context,
        )
        db.session.add(user_msg)
        db.session.flush()

        history = (
            ChatMessage.query
            .filter_by(session_id=session.id)
            .order_by(ChatMessage.created_at)
            .limit(MAX_CONTEXT_MESSAGES)
            .all()
        )

        logger.info("=== ROUTE DIAGNOSTICS ===")
        logger.info("History fetched from DB: %d messages", len(history))
        for i, msg in enumerate(history):
            jc_info = " [HAS JOURNAL CONTEXT]" if getattr(msg, "journal_context", None) else ""
            logger.info("  [%d] %s: %d chars%s", i, msg.role, len(msg.content or ""), jc_info)
        logger.info("=== END ROUTE DIAGNOSTICS ===")

        reply = spill_service.chat(
            history,
            personality=session.personality_type,
            current_journal_context=journal_context,
        )

        ai_msg = ChatMessage(
            session_id=session.id,
            role="assistant",
            content=reply,
            personality_mode=personality,
        )
        db.session.add(ai_msg)
        session.updated_at = db.func.now()
        session.last_message_at = db.func.now()

        db.session.commit()

        logger.info(
            "Spill AI chat success: session=%s personality=%s reply_len=%d",
            session.id, session.personality_type, len(reply),
        )

        return jsonify({
            "response": reply,
            "session_id": str(session.id),
            "ai_message_id": str(ai_msg.id),
            "personality": session.personality_type,
        }), 201

    except Exception as e:
        db.session.rollback()
        logger.error(
            "Spill AI chat error: %s: %s\n%s",
            type(e).__name__, str(e), traceback.format_exc(),
        )

        error_type = type(e).__name__
        error_details = str(e)

        if "api_key" in error_details.lower() or "authentication" in error_details.lower():
            return jsonify({
                "error": "Invalid or missing Groq API key",
                "type": "AuthenticationError",
                "details": error_details,
            }), 500

        if "rate" in error_details.lower():
            return jsonify({
                "error": "Groq rate limit exceeded. Please wait a moment and try again.",
                "type": "RateLimitError",
                "details": error_details,
            }), 429

        if "timeout" in error_details.lower():
            return jsonify({
                "error": "AI request timed out. Please try again.",
                "type": "TimeoutError",
                "details": error_details,
            }), 504

        return jsonify({
            "error": "AI service error",
            "type": error_type,
            "details": error_details,
        }), 500


@spill_ai_bp.route("/personality", methods=["POST"])
@require_auth
def set_personality(user_id):
    """Change the personality for an existing chat session."""
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body is required"}), 400

    session_id = data.get("session_id")
    personality = data.get("personality")

    if not session_id:
        return jsonify({"error": "session_id is required"}), 400
    if not personality:
        return jsonify({"error": "personality is required"}), 400
    if personality not in VALID_PERSONALITIES:
        return jsonify({
            "error": f"Invalid personality. Must be one of: {', '.join(VALID_PERSONALITIES)}",
            "type": "ValidationError",
        }), 400

    try:
        sid = uuid.UUID(session_id)
    except ValueError:
        return jsonify({"error": "Invalid session ID"}), 400

    session = ChatSession.query.filter_by(id=sid, user_id=user_id).first()
    if not session:
        return jsonify({"error": "Session not found"}), 404

    old_personality = session.personality_type
    session.personality_type = personality
    session.updated_at = db.func.now()
    db.session.commit()

    info = get_personality_info(personality)
    logger.info(
        "Spill AI personality changed: session=%s old=%s new=%s",
        session.id, old_personality, personality,
    )

    return jsonify({
        "session_id": str(session.id),
        "personality": personality,
        "name": info["name"],
        "description": info["description"],
    }), 200


@spill_ai_bp.route("/transcribe", methods=["POST"])
@require_auth
def transcribe_audio(user_id):
    """Receive audio, transcribe with Whisper, return text."""
    if "audio" not in request.files:
        return jsonify({"error": "No audio file provided"}), 400

    audio_file = request.files["audio"]
    audio_data = audio_file.read()

    if not audio_data or len(audio_data) < 100:
        return jsonify({"error": "Audio file is empty or too small"}), 400

    content_type = audio_file.content_type or "audio/webm"
    filename = audio_file.filename or "recording.webm"

    logger.info(
        "Spill AI transcribe: user=%s size=%d bytes",
        user_id, len(audio_data),
    )

    try:
        api_key = current_app.config.get("GROQ_API_KEY", "")
        if not api_key:
            return jsonify({"error": "GROQ_API_KEY is not configured"}), 500

        from groq import Groq
        client = Groq(api_key=api_key)
        model = "whisper-large-v3-turbo"

        transcription = client.audio.transcriptions.create(
            file=(filename, audio_data, content_type),
            model=model,
            response_format="text",
        )
        text = transcription.strip()

        if not text:
            return jsonify({
                "error": "Transcription returned empty result",
                "text": "",
            }), 422

        logger.info("Spill AI transcribe success: text=%s", text[:100])
        return jsonify({"text": text}), 200

    except Exception as e:
        logger.error(
            "Spill AI transcribe error: %s: %s\n%s",
            type(e).__name__, str(e), traceback.format_exc(),
        )
        return jsonify({
            "error": f"Transcription failed: {str(e)}",
            "type": type(e).__name__,
        }), 500


@spill_ai_bp.route("/test", methods=["POST"])
@require_auth
def test_groq(user_id):
    """Isolated test endpoint for debugging Groq API connectivity."""
    body = request.get_json(silent=True) or {}
    test_message = body.get("message", "Say 'Groq connection OK' and nothing else.")
    personality = body.get("personality", DEFAULT_PERSONALITY)

    if personality not in VALID_PERSONALITIES:
        personality = DEFAULT_PERSONALITY

    try:
        api_key = current_app.config.get("GROQ_API_KEY", "")
        model = current_app.config.get("GROQ_MODEL", "llama-3.3-70b-versatile")
        key_loaded = bool(api_key)

        logger.info(
            "Spill AI test: key_loaded=%s model=%s personality=%s",
            key_loaded, model, personality,
        )

        if not key_loaded:
            return jsonify({
                "success": False,
                "error": "GROQ_API_KEY is not configured",
                "key_loaded": False,
                "model": model,
            }), 500

        system_prompt = get_personality_prompt(personality)
        service = SpillAIService(api_key, model)
        reply = service.provider.chat(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": test_message},
            ],
            max_tokens=200,
            temperature=0.7,
        )

        logger.info("Spill AI test success: reply=%s", reply[:100])

        info = get_personality_info(personality)
        return jsonify({
            "success": True,
            "reply": reply,
            "model": model,
            "provider": "groq",
            "personality": personality,
            "personality_name": info["name"],
        })

    except Exception as e:
        logger.error(
            "Spill AI test error: %s: %s\n%s",
            type(e).__name__, str(e), traceback.format_exc(),
        )
        return jsonify({
            "success": False,
            "error": type(e).__name__,
            "details": str(e),
            "key_loaded": bool(current_app.config.get("GROQ_API_KEY")),
            "model": current_app.config.get("GROQ_MODEL", "NOT SET"),
            "provider": "groq",
        }), 500
