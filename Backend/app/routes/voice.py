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

PARSER_SYSTEM_PROMPT = """OUTPUT FORMAT — MANDATORY. READ THIS FIRST.

Your output MUST be exactly ONE JSON object. Nothing else. No text before, no text after.
The object MUST have this exact shape:

{{"activities": [ <one or more objects here> ]}}

If the input describes nothing useful, return: {{"activities": []}}

NEVER return multiple top-level JSON objects.
NEVER return a bare JSON object without the "activities" wrapper.
NEVER return two separate JSON objects on separate lines.
ALWAYS wrap every item inside the "activities" array.

SCHEMA — each item inside "activities" is an object with these fields:
- "type": "activity" | "task"
  - "activity" = time-block event (gym, meeting, study, dinner, work session)
  - "task" = deadline-oriented goal (assignment due, submit report)
- "title": string (required)
- "description": string or null
- "start_date": "YYYY-MM-DD" or null
- "start_time": "HH:MM" (24h) or null
- "end_date": "YYYY-MM-DD" or null — only set when end_time crosses midnight
- "end_time": "HH:MM" (24h) or null
- "color": "purple"|"blue"|"green"|"yellow"|"orange"|"red"|"pink"|"teal" or null
- "productivity_level": "productive"|"neutral"|"unproductive" or null

RULES:
- Return ONLY valid JSON. No explanation, no markdown, no code blocks.
- For relative dates (tomorrow, tonight, next Monday), resolve against the current date provided.
- If a field is not mentioned, set it to null. Do NOT use empty strings.
- Do NOT hallucinate values.

TEMPORAL REASONING:
- Use the reference date as the anchor for "today". All dates are relative to this reference.
- Convert colloquial times to 24h HH:MM: "midnight" = 00:00, "noon" = 12:00, "7 PM" = 19:00.
- If end_time is numerically less than start_time (e.g. "from 10 PM to 1 AM"), the end crosses midnight: set start_date to the reference date and end_date to the following day.
- If only one time is mentioned, leave the other null. Do NOT invent a second time.
- Understand connectors: "until", "to", "till", "from ... to", "from ... until", "~".
- Understand time-of-day: "morning" = 06:00-11:59, "afternoon" = 12:00-17:59, "evening" = 18:00-21:59, "night" = 22:00-05:00.

CURRENT DATE AND TIME: {current_datetime}

MULTI-ACTIVITY RULES:
- Only split into multiple items when there are CLEARLY DISTINCT time blocks.
- If unsure, keep it as a single item.
- Each item gets its own time range. Overlapping times are fine — the user decides.

EXAMPLES:

Input: "Gym tomorrow at 7 PM"
Output: {{"activities": [{{"type": "activity", "title": "Gym Session", "description": null, "start_date": "2026-05-25", "start_time": "19:00", "end_date": null, "end_time": null, "color": null, "productivity_level": "productive"}}]}}

Input: "Create a blue study session from 8 to 10"
Output: {{"activities": [{{"type": "activity", "title": "Study Session", "description": null, "start_date": "2026-05-24", "start_time": "08:00", "end_date": null, "end_time": "10:00", "color": "blue", "productivity_level": "productive"}}]}}

Input: "I play Counter Strike from 10:30 until 1 AM"
Output: {{"activities": [{{"type": "activity", "title": "Counter Strike", "description": null, "start_date": "2026-05-24", "start_time": "22:30", "end_date": "2026-05-25", "end_time": "01:00", "color": null, "productivity_level": null}}]}}

Input: "Finish database assignment before Friday midnight"
Output: {{"activities": [{{"type": "task", "title": "Database Assignment", "description": null, "start_date": "2026-05-24", "start_time": null, "end_date": "2026-05-29", "end_time": "23:59", "color": null, "productivity_level": "productive"}}]}}

Input: "Gym at 7 PM then dinner at 8:30"
Output: {{"activities": [{{"type": "activity", "title": "Gym Session", "description": null, "start_date": "2026-05-24", "start_time": "19:00", "end_date": null, "end_time": null, "color": null, "productivity_level": "productive"}}, {{"type": "activity", "title": "Dinner", "description": null, "start_date": "2026-05-24", "start_time": "20:30", "end_date": null, "end_time": null, "color": null, "productivity_level": "neutral"}}]}}

Input: "Study from 9 to 11 then gym from 11:30 to 1"
Output: {{"activities": [{{"type": "activity", "title": "Study", "description": null, "start_date": "2026-05-24", "start_time": "09:00", "end_date": null, "end_time": "11:00", "color": null, "productivity_level": "productive"}}, {{"type": "activity", "title": "Gym Session", "description": null, "start_date": "2026-05-24", "start_time": "11:30", "end_date": null, "end_time": "13:00", "color": null, "productivity_level": "productive"}}]}}

Input: "Meeting at 10 AM, lunch at noon, and deep work from 2 to 5"
Output: {{"activities": [{{"type": "activity", "title": "Meeting", "description": null, "start_date": "2026-05-24", "start_time": "10:00", "end_date": null, "end_time": null, "color": null, "productivity_level": "neutral"}}, {{"type": "activity", "title": "Lunch", "description": null, "start_date": "2026-05-24", "start_time": "12:00", "end_date": null, "end_time": null, "color": null, "productivity_level": "neutral"}}, {{"type": "activity", "title": "Deep Work", "description": null, "start_date": "2026-05-24", "start_time": "14:00", "end_date": null, "end_time": "17:00", "color": null, "productivity_level": "productive"}}]}}

Input: "Study later"
Output: {{"activities": [{{"type": "activity", "title": "Study", "description": null, "start_date": null, "start_time": null, "end_date": null, "end_time": null, "color": null, "productivity_level": null}}]}}

FINAL REMINDER: Output ONE JSON object. The top-level key is "activities". Every item goes inside that array. JSON only."""


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

    def _extract_json(text):
        """Extract and parse JSON from LLM output, handling various malformed formats."""
        import re
        text = text.strip()

        # Strip markdown code fences
        if text.startswith("```"):
            text = text.split("\n", 1)[-1]
            text = text.rsplit("```", 1)[0]
            text = text.strip()

        # Direct parse attempt
        try:
            result = json.loads(text)
            # If it's already the correct format, return it
            if isinstance(result, dict) and "activities" in result:
                return result
            # If it's a bare activity/task object, wrap it
            if isinstance(result, dict) and result.get("type") in ("activity", "task"):
                logger.info("Wrapped bare object into activities array")
                return {"activities": [result]}
            # Return as-is (validation will check)
            return result
        except json.JSONDecodeError:
            pass

        # The LLM may have returned multiple separate JSON objects or a bare object
        # without the "activities" wrapper. Find ALL JSON objects and merge them.
        all_objects = []
        pos = 0
        while pos < len(text):
            # Find next opening brace
            obj_start = -1
            while pos < len(text):
                if text[pos] == "{":
                    obj_start = pos
                    break
                pos += 1

            if obj_start == -1:
                break

            # Find matching closing brace using depth tracking
            depth = 0
            in_string = False
            escape = False
            obj_end = -1
            for i in range(obj_start, len(text)):
                c = text[i]
                if escape:
                    escape = False
                    continue
                if c == "\\":
                    escape = True
                    continue
                if c == '"':
                    in_string = not in_string
                    continue
                if in_string:
                    continue
                if c == "{":
                    depth += 1
                elif c == "}":
                    depth -= 1
                    if depth == 0:
                        obj_end = i
                        break

            if obj_end == -1:
                break

            obj_str = text[obj_start:obj_end + 1]
            try:
                obj = json.loads(obj_str)
                if isinstance(obj, dict):
                    all_objects.append(obj)
            except json.JSONDecodeError:
                pass

            pos = obj_end + 1

        if not all_objects:
            return None

        # Check if the first object is already the correct format
        if len(all_objects) == 1 and "activities" in all_objects[0]:
            return all_objects[0]

        # If we have a single bare activity/task object, wrap it
        if len(all_objects) == 1 and all_objects[0].get("type") in ("activity", "task"):
            logger.info("Wrapped single object into activities array")
            return {"activities": all_objects}

        # Multiple objects: filter to activity/task items and merge into activities array
        activity_items = [o for o in all_objects if o.get("type") in ("activity", "task")]
        if activity_items:
            logger.info("Merged %d separate objects into activities array", len(activity_items))
            return {"activities": activity_items}

        # Fallback: if we found objects but none are activities, return the first one
        if all_objects:
            first = all_objects[0]
            if "activities" in first:
                return first
            return {"activities": [first]}

        return None

    provider = _get_provider()
    logger.info("=== VOICE PIPELINE: Step 2 - LLM Parse ===")
    logger.info("Transcript: %s", transcript)
    logger.info("Reference date for prompt: %s", now)

    raw = None
    parsed = None

    # First attempt
    try:
        raw = provider.chat(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": transcript},
            ],
            max_tokens=1000,
            temperature=0.1,
        )
        logger.info("LLM raw response (attempt 1): %s", repr(raw[:500]))
        parsed = _extract_json(raw)
    except Exception as e:
        logger.error("LLM call failed (attempt 1): %s: %s", type(e).__name__, str(e))

    # Retry once if JSON parsing failed
    if parsed is None and raw is not None:
        logger.warning("JSON extraction failed on attempt 1. Raw was: %s", repr(raw[:500]))
        logger.info("Retrying LLM with higher temperature...")
        try:
            raw = provider.chat(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": transcript},
                ],
                max_tokens=1000,
                temperature=0.3,
            )
            logger.info("LLM raw response (attempt 2): %s", repr(raw[:500]))
            parsed = _extract_json(raw)
        except Exception as e:
            logger.error("LLM call failed (attempt 2): %s: %s", type(e).__name__, str(e))

    if parsed is None:
        logger.error("Failed to extract JSON from LLM output after retries. Raw: %s", repr((raw or "")[:500]))
        return jsonify({
            "error": "Failed to parse your request. Please try being more specific.",
            "step": "parsing",
            "raw": (raw or "")[:500],
        }), 422

    logger.info("Parsed result: %s", json.dumps(parsed, indent=2))

    # Step 3: Validate the parsed structure — always expect {"activities": [...]}
    activities = parsed.get("activities")
    logger.info("=== VOICE PIPELINE: Step 3 - Validation ===")

    if not isinstance(activities, list):
        logger.error("Response missing 'activities' array. parsed=%s", json.dumps(parsed))
        return jsonify({
            "error": "Invalid response format: expected 'activities' array.",
            "step": "validation",
        }), 422

    for item in activities:
        if not isinstance(item, dict):
            logger.error("Non-object item in activities array: %s", json.dumps(item))
            return jsonify({
                "error": "Invalid item in activities array.",
                "step": "validation",
            }), 422
        item_type = item.get("type")
        if item_type not in ("activity", "task"):
            logger.warning("Item missing valid type, defaulting to 'activity': %s", json.dumps(item))
            item["type"] = "activity"

    count = len(activities)
    logger.info("=== VOICE PIPELINE: Complete - %d item(s) detected ===", count)
    for i, item in enumerate(activities):
        logger.info("Item %d: type=%s title=%s start=%s %s end=%s %s",
            i + 1, item.get("type"), item.get("title"),
            item.get("start_date"), item.get("start_time"),
            item.get("end_date"), item.get("end_time"))

    return jsonify({
        "transcript": transcript,
        "parsed": {"activities": activities},
    })
