"""Voice processing routes — transcribes audio and parses into structured form data.

Endpoints:
    POST /api/voice/process — Accept audio → transcribe (Whisper) → parse (LLM) → structured JSON
"""
import json
import logging
import traceback
from datetime import datetime

from flask import Blueprint, jsonify, request, current_app

from app.auth.decorators import require_auth
from app.services.ai.groq_provider import GroqProvider

logger = logging.getLogger(__name__)

voice_bp = Blueprint("voice", __name__, url_prefix="/api/voice")

TRANSCRIPTION_MODEL = "whisper-large-v3-turbo"
PARSER_MODEL = "llama-3.3-70b-versatile"

PARSER_SYSTEM_PROMPT = """You are a calendar form parser. Your ONLY job is to extract structured form data from natural language.

RULES:
- Return ONLY valid JSON, no explanation, no markdown, no code blocks.
- If the utterance describes a time-block activity (gym, meeting, study session, etc.), set "type": "activity".
- If the utterance describes a deadline-oriented objective (assignment due, submit report, finish project, etc.), set "type": "task".
- For relative dates (tomorrow, tonight, next Monday, etc.), resolve them against the current date provided.
- If a field is not mentioned, set it to null (not an empty string).
- Do NOT hallucinate values.

TEMPORAL REASONING (critical — apply BEFORE outputting times):
- Use the reference date as the anchor for "today". All dates are resolved relative to this reference, not the real system date.
- Convert colloquial times to 24-hour HH:MM format: "midnight" = 00:00, "noon" = 12:00, "7 PM" = 19:00, "12 AM" = 00:00, etc.
- If the user says "until 1 AM", "till 2 AM", "to midnight", or similar, the end time is in the early morning — determine whether the end date should be the next day.
- If start_time and end_time ARE both provided and end_time (in 24h) is numerically LESS than start_time, then the end crosses midnight: set start_date to the reference/anchor date and end_date to the FOLLOWING day.
- If only one time is mentioned (e.g. "at 7 PM"), leave the other time null. Do NOT invent a second time.
- If only times are mentioned without explicit dates, anchor start_date to the reference date provided.
- Understand natural range connectors: "until", "to", "till", "from ... to", "from ... until", "from ... till", "around", "~".
- Understand time-of-day words: "morning" → 06:00-11:59, "afternoon" → 12:00-17:59, "evening" → 18:00-21:59, "night" → 22:00-23:59 or 00:00-05:00.

Current date and time for reference: {current_datetime}

ACTIVITY fields (when type="activity"):
- title (string): clear concise title
- description (string or null)
- start_date (string: YYYY-MM-DD or null)
- start_time (string: HH:MM or null)
- end_date (string: YYYY-MM-DD or null) — only set to next day when end_time crosses midnight (otherwise null)
- end_time (string: HH:MM or null)
- color (string: one of "purple", "blue", "green", "yellow", "orange", "red", "pink", "teal" or null) — extract when user explicitly mentions a color
- productivity_level (string: one of "productive", "neutral", "unproductive" or null)

TASK fields (when type="task"):
- title (string): clear concise title
- description (string or null)
- start_date (string: YYYY-MM-DD or null) — when the user plans to start
- start_time (string: HH:MM or null)
- end_date (string: YYYY-MM-DD or null) — the deadline date
- end_time (string: HH:MM or null) — the deadline time
- color (string: one of "purple", "blue", "green", "yellow", "orange", "red", "pink", "teal" or null) — extract when user explicitly mentions a color
- productivity_level (string: one of "productive", "neutral" or null)

EXAMPLES:
Input: "Gym tomorrow at 7 PM"
Output: {{"type": "activity", "title": "Gym Session", "description": null, "start_date": "2026-05-25", "start_time": "19:00", "end_time": null, "color": null, "productivity_level": "productive"}}

Input: "Create a blue study session from 8 to 10"
Output: {{"type": "activity", "title": "Study Session", "description": null, "start_date": "2026-05-24", "start_time": "08:00", "end_time": "10:00", "color": "blue", "productivity_level": "productive"}}

Input: "I play Counter Strike from 10:30 until 1 AM"
Output: {{"type": "activity", "title": "Counter Strike", "description": null, "start_date": "2026-05-24", "start_time": "22:30", "end_date": "2026-05-25", "end_time": "01:00", "color": null, "productivity_level": null}}

Input: "study from 9 PM until 2 AM"
Output: {{"type": "activity", "title": "Study", "description": null, "start_date": "2026-05-24", "start_time": "21:00", "end_date": "2026-05-25", "end_time": "02:00", "color": null, "productivity_level": "productive"}}

Input: "movie marathon from 8 PM to 3 AM"
Output: {{"type": "activity", "title": "Movie Marathon", "description": null, "start_date": "2026-05-24", "start_time": "20:00", "end_date": "2026-05-25", "end_time": "03:00", "color": null, "productivity_level": null}}

Input: "Finish database assignment before Friday midnight"
Output: {{"type": "task", "title": "Database Assignment", "description": null, "start_date": "2026-05-24", "start_time": null, "end_date": "2026-05-29", "end_time": "23:59", "color": null, "productivity_level": "productive"}}

Input: "Add a red gym workout tomorrow at 7"
Output: {{"type": "activity", "title": "Gym Workout", "description": null, "start_date": "2026-05-25", "start_time": "19:00", "end_time": null, "color": "red", "productivity_level": "productive"}}

Input: "work from 11 PM to midnight"
Output: {{"type": "activity", "title": "Work", "description": null, "start_date": "2026-05-24", "start_time": "23:00", "end_date": "2026-05-25", "end_time": "00:00", "color": null, "productivity_level": null}}

Input: "Study later"
Output: {{"type": "activity", "title": "Study", "description": null, "start_date": null, "start_time": null, "end_time": null, "color": null, "productivity_level": null}}

Remember: JSON only. No extra text."""


def _get_provider():
    api_key = current_app.config.get("GROQ_API_KEY", "")
    if not api_key:
        raise ValueError("GROQ_API_KEY is not configured")
    return GroqProvider(api_key, PARSER_MODEL)


@voice_bp.route("/process", methods=["POST"])
@require_auth
def process_voice(user_id):
    """Accept audio file, transcribe with Whisper, parse with LLM, return structured JSON."""
    if "audio" not in request.files:
        return jsonify({"error": "No audio file provided. Use multipart/form-data with field name 'audio'."}), 400

    audio_file = request.files["audio"]
    if not audio_file.filename:
        return jsonify({"error": "Audio file has no filename."}), 400

    audio_data = audio_file.read()
    if not audio_data or len(audio_data) < 100:
        return jsonify({"error": "Audio file is empty or too small."}), 400

    content_type = audio_file.content_type or "audio/webm"
    filename = audio_file.filename or "recording.webm"

    logger.info(
        "Voice process: user=%s file=%s size=%d bytes content_type=%s",
        user_id, filename, len(audio_data), content_type,
    )

    # Step 1: Transcribe with Whisper
    try:
        api_key = current_app.config.get("GROQ_API_KEY", "")
        if not api_key:
            return jsonify({"error": "GROQ_API_KEY is not configured"}), 500

        from groq import Groq
        groq_client = Groq(api_key=api_key)

        logger.info("Transcribing with model=%s ...", TRANSCRIPTION_MODEL)
        transcription = groq_client.audio.transcriptions.create(
            file=(filename, audio_data, content_type),
            model=TRANSCRIPTION_MODEL,
            response_format="text",
        )
        transcript = transcription.strip()
        logger.info("Transcription result: %s", transcript[:200])

        if not transcript:
            return jsonify({
                "error": "Transcription returned empty result. Please try speaking more clearly.",
                "step": "transcription",
            }), 422

    except Exception as e:
        logger.error("Transcription error: %s: %s\n%s", type(e).__name__, str(e), traceback.format_exc())
        return jsonify({
            "error": f"Transcription failed: {str(e)}",
            "step": "transcription",
            "type": type(e).__name__,
        }), 500

    # Step 2: Parse with LLM
    try:
        ref_date_str = request.args.get("reference_date")
        if ref_date_str:
            try:
                ref_date = datetime.strptime(ref_date_str, "%Y-%m-%d")
                now_dt = datetime.now()
                combined = ref_date.replace(hour=now_dt.hour, minute=now_dt.minute)
                now = combined.strftime("%Y-%m-%d %H:%M %A")
            except ValueError:
                now = datetime.now().strftime("%Y-%m-%d %H:%M %A")
        else:
            now = datetime.now().strftime("%Y-%m-%d %H:%M %A")
        system_prompt = PARSER_SYSTEM_PROMPT.format(current_datetime=now)

        provider = _get_provider()
        logger.info("Parsing transcript with model=%s ...", PARSER_MODEL)
        raw = provider.chat(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": transcript},
            ],
            max_tokens=500,
            temperature=0.1,
        )

        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[-1]
            cleaned = cleaned.rsplit("```", 1)[0]
        cleaned = cleaned.strip()

        parsed = json.loads(cleaned)
        logger.info("Parse result: %s", json.dumps(parsed, indent=2))

    except json.JSONDecodeError as e:
        logger.error("Parse JSON error: %s\nRaw output: %s", str(e), raw[:500])
        return jsonify({
            "error": "Failed to parse your request. Please try being more specific.",
            "step": "parsing",
            "raw": raw[:500],
        }), 422
    except Exception as e:
        logger.error("Parse error: %s: %s\n%s", type(e).__name__, str(e), traceback.format_exc())
        return jsonify({
            "error": f"Parsing failed: {str(e)}",
            "step": "parsing",
            "type": type(e).__name__,
        }), 500

    # Step 3: Validate the parsed structure
    event_type = parsed.get("type")
    if event_type not in ("activity", "task"):
        return jsonify({
            "error": f"Could not determine if this is an activity or task. Got: {event_type}",
            "step": "validation",
        }), 422

    logger.info(
        "Voice process complete: user=%s type=%s title=%s",
        user_id, event_type, parsed.get("title", ""),
    )

    return jsonify({
        "transcript": transcript,
        "parsed": parsed,
    })
