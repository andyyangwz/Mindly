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

HARD RULE — STANDALONE SPOKEN NUMBERS ARE ALWAYS TIMES, NEVER YEARS. READ THIS FIRST.
- You are building a SCHEDULE. Any standalone spoken number ("nineteen fifty", "twenty twenty", "zero eight thirty", "six fifteen", "2020", "1950") ALWAYS means a TIME in 24h HH:MM. NEVER a year.
- A year alone has no month and no day, so it CANNOT be scheduled. A time alone CAN be scheduled (attached to today's date or another inferred date). Therefore a time is always the correct interpretation of a standalone number.
- NEVER put a year-derived value into start_date or end_date based on a standalone number.
- A year may ONLY appear when the user explicitly states a COMPLETE calendar date (day, month, and year together), such as:
  - "1 January 2020" → 2020-01-01
  - "January 1st, 2020" → 2020-01-01
  - "2020-01-01" → 2020-01-01
  - "on January 1st, 2020" → 2020-01-01
  - "in the year 2020" (only when a month and day are also stated or clearly known)
- "in the year 2020" WITHOUT a month and day is not a schedulable date; do NOT invent a date from it.
- If a number could be a time or a year, it is a TIME. Always. This is a hard parsing rule, not a preference or heuristic. Violating it is a parsing error.
- Apply this BEFORE classifying the item's "type" and to every field: start_date, end_date, start_time, end_time.

SCHEMA — each item inside "activities" is an object with these fields:
- "type": "activity" | "task" | "reminder"
  - "reminder" = an item that does NOT have BOTH a start time and an end time (a single point in time, or no time at all).
  - "activity" = an item with BOTH a start time and an end time on the SAME day.
  - "task" = an item with BOTH a start time and an end time on DIFFERENT days.
- "title": string (required)
- "description": string or null
- "start_date": "YYYY-MM-DD" or null
- "start_time": "HH:MM" (24h) or null
- "end_date": "YYYY-MM-DD" or null
- "end_time": "HH:MM" (24h) or null
- "color": "purple"|"dark blue"|"blue"|"green"|"yellow"|"orange"|"red"|"pink"|"teal" or null
- "productivity_level": "productive"|"neutral"|"unproductive" or null

TYPE CLASSIFICATION RULES — determine "type" STRICTLY from the temporal fields ONLY. Do NOT infer the type from the meaning of the sentence, and do NOT use keywords such as "meeting", "assignment", "study", "remind", "workout", "gym", "lunch", "dinner" to decide it. The type depends EXCLUSIVELY on which time fields are present and whether the dates span multiple days. Follow these rules IN ORDER:
1. If BOTH start_time and end_time are present:
   - If start_date == end_date → "activity".
   - If start_date != end_date → "task".
2. Otherwise (start_time missing, end_time missing, or both missing) → "reminder".
   - Put the single point in time in start_date + start_time. Leave end_date and end_time null.

RULES:
- Return ONLY valid JSON. No explanation, no markdown, no code blocks.
- For relative dates (tomorrow, tonight, next Monday), resolve against the current date provided.
- If a field is not mentioned, set it to null. Do NOT use empty strings.
- Do NOT hallucinate values.
- Always set the "type" field using the TYPE CLASSIFICATION RULES above.
- Follow the HARD RULE above: standalone spoken numbers are times, never years.

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
Output: {{"activities": [{{"type": "reminder", "title": "Gym Session", "description": null, "start_date": "2026-05-25", "start_time": "19:00", "end_date": null, "end_time": null, "color": null, "productivity_level": "productive"}}]}}

Input: "Create a blue study session from 8 to 10"
Output: {{"activities": [{{"type": "activity", "title": "Study Session", "description": null, "start_date": "2026-05-24", "start_time": "08:00", "end_date": null, "end_time": "10:00", "color": "blue", "productivity_level": "productive"}}]}}

Input: "I play Counter Strike from 10:30 until 1 AM"
Output: {{"activities": [{{"type": "task", "title": "Counter Strike", "description": null, "start_date": "2026-05-24", "start_time": "22:30", "end_date": "2026-05-25", "end_time": "01:00", "color": null, "productivity_level": null}}]}}

Input: "Finish database assignment before Friday midnight"
Output: {{"activities": [{{"type": "reminder", "title": "Database Assignment", "description": null, "start_date": "2026-05-29", "start_time": "23:59", "end_date": null, "end_time": null, "color": null, "productivity_level": "productive"}}]}}

Input: "Gym at 7 PM then dinner at 8:30"
Output: {{"activities": [{{"type": "reminder", "title": "Gym Session", "description": null, "start_date": "2026-05-24", "start_time": "19:00", "end_date": null, "end_time": null, "color": null, "productivity_level": "productive"}}, {{"type": "reminder", "title": "Dinner", "description": null, "start_date": "2026-05-24", "start_time": "20:30", "end_date": null, "end_time": null, "color": null, "productivity_level": "neutral"}}]}}

Input: "Study from 9 to 11 then gym from 11:30 to 1"
Output: {{"activities": [{{"type": "activity", "title": "Study", "description": null, "start_date": "2026-05-24", "start_time": "09:00", "end_date": null, "end_time": "11:00", "color": null, "productivity_level": "productive"}}, {{"type": "activity", "title": "Gym Session", "description": null, "start_date": "2026-05-24", "start_time": "11:30", "end_date": null, "end_time": "13:00", "color": null, "productivity_level": "productive"}}]}}

Input: "Meeting at 10 AM, lunch at noon, and deep work from 2 to 5"
Output: {{"activities": [{{"type": "reminder", "title": "Meeting", "description": null, "start_date": "2026-05-24", "start_time": "10:00", "end_date": null, "end_time": null, "color": null, "productivity_level": "neutral"}}, {{"type": "reminder", "title": "Lunch", "description": null, "start_date": "2026-05-24", "start_time": "12:00", "end_date": null, "end_time": null, "color": null, "productivity_level": "neutral"}}, {{"type": "activity", "title": "Deep Work", "description": null, "start_date": "2026-05-24", "start_time": "14:00", "end_date": null, "end_time": "17:00", "color": null, "productivity_level": "productive"}}]}}

Input: "Study twenty twenty tomorrow"
Output: {{"activities": [{{"type": "reminder", "title": "Study", "description": null, "start_date": "2026-05-25", "start_time": "20:20", "end_date": null, "end_time": null, "color": null, "productivity_level": "productive"}}]}}

Input: "Team standup nineteen fifty"
Output: {{"activities": [{{"type": "reminder", "title": "Team Standup", "description": null, "start_date": "2026-05-24", "start_time": "19:50", "end_date": null, "end_time": null, "color": null, "productivity_level": "neutral"}}]}}

Input: "Call mom zero eight thirty"
Output: {{"activities": [{{"type": "reminder", "title": "Call Mom", "description": null, "start_date": "2026-05-24", "start_time": "08:30", "end_date": null, "end_time": null, "color": null, "productivity_level": "neutral"}}]}}

WRONG vs CORRECT — HARD RULE enforcement (do NOT repeat the WRONG output):
Input: "Study twenty twenty"
WRONG: {{"activities": [{{"type": "reminder", "title": "Study", "description": null, "start_date": "2020-01-01", "start_time": null, "end_date": null, "end_time": null, "color": null, "productivity_level": null}}]}}
CORRECT: {{"activities": [{{"type": "reminder", "title": "Study", "description": null, "start_date": "2026-05-24", "start_time": "20:20", "end_date": null, "end_time": null, "color": null, "productivity_level": null}}]}}

Input: "Gym nineteen fifty until twenty twenty"
WRONG: {{"activities": [{{"type": "task", "title": "Gym", "description": null, "start_date": "1950-01-01", "start_time": null, "end_date": "2020-12-31", "end_time": null, "color": null, "productivity_level": null}}]}}
CORRECT: {{"activities": [{{"type": "activity", "title": "Gym", "description": null, "start_date": "2026-05-24", "start_time": "19:50", "end_date": "2026-05-24", "end_time": "20:20", "color": null, "productivity_level": null}}]}}

Input: "Book hotel for 1 January 2020"
Output: {{"activities": [{{"type": "reminder", "title": "Book Hotel", "description": null, "start_date": "2020-01-01", "start_time": null, "end_date": null, "end_time": null, "color": null, "productivity_level": "neutral"}}]}}

Input: "Study later"
Output: {{"activities": [{{"type": "reminder", "title": "Study", "description": null, "start_date": null, "start_time": null, "end_date": null, "end_time": null, "color": null, "productivity_level": null}}]}}

FINAL REMINDER: Output ONE JSON object. The top-level key is "activities". Every item goes inside that array. JSON only."""


def _get_provider():
    api_key = current_app.config.get("GROQ_API_KEY", "")
    if not api_key:
        raise ValueError("GROQ_API_KEY is not configured")
    return GroqProvider(api_key, PARSER_MODEL)


_MONTH_TOKENS = {
    "january", "february", "march", "april", "may", "june", "july",
    "august", "september", "october", "november", "december",
    "jan", "feb", "mar", "apr", "jun", "jul", "aug", "sep", "oct", "nov", "dec",
}
_WEEKDAY_TOKENS = {
    "monday", "tuesday", "wednesday", "thursday", "friday",
    "saturday", "sunday", "mon", "tue", "wed", "thu", "fri", "sat", "sun",
}


def _has_explicit_date_context(transcript):
    """True when the spoken text supplies enough calendar info to justify a year."""
    import re
    lowered = transcript.lower()
    if any(token in lowered for token in _WEEKDAY_TOKENS):
        return True
    if any(token in lowered for token in _MONTH_TOKENS):
        return True
    if re.search(r"\d{4}-\d{2}(-\d{2})?", lowered):
        return True
    for word in ("year", "tomorrow", "today", "tonight", "weekend",
                 "week", "weeks", "month", "months", "day", "days",
                 "next", "due", "deadline", "date", "midnight"):
        if word in lowered:
            return True
    return False


def _has_standalone_number(transcript):
    """True when the transcript itself contains a spoken numeric token (digits
    or word forms like "twenty twenty", "twelve thirty", "seven oh five")."""
    import re
    if re.search(r"\b\d{1,2}:\d{2}\b", transcript):
        return True
    if re.search(r"\b\d{2,4}\b", transcript):
        return True
    tens = r"(?:ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty)"
    ones = r"(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|oh)"
    lowered = transcript.lower()
    if re.search(rf"\b{tens}\s+{ones}\b", lowered):
        return True
    if re.search(rf"\b(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+oh\s+(?:one|two|three|four|five|six|seven|eight|nine)\b", lowered):
        return True
    return False


def _extract_year(raw):
    """Pull a 4-digit year out of a date-ish value like '2020' or '2020-01-01'."""
    import re
    if not isinstance(raw, str):
        return None
    match = re.match(r"^(\d{4})", raw.strip())
    if not match:
        return None
    return int(match.group(1))


def _time_from_year(year):
    """Map a misinterpreted year (e.g. 2020) to HH:MM (20:20)."""
    if not (1900 <= year <= 9999):
        return None
    hh, mm = divmod(year, 100)
    if hh > 23 or mm > 59:
        return None
    return f"{hh:02d}:{mm:02d}"


def _reclassify_type(item):
    """Recompute the item type from the enforced time/date fields."""
    if not item.get("start_time") or not item.get("end_time"):
        return "reminder"
    start_date = item.get("start_date")
    end_date = item.get("end_date")
    if start_date and end_date and start_date != end_date:
        return "task"
    return "activity"


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
            # If it's a bare activity/task/reminder object, wrap it
            if isinstance(result, dict) and result.get("type") in ("activity", "task", "reminder"):
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

        # If we have a single bare activity/task/reminder object, wrap it
        if len(all_objects) == 1 and all_objects[0].get("type") in ("activity", "task", "reminder"):
            logger.info("Wrapped single object into activities array")
            return {"activities": all_objects}

        # Multiple objects: filter to activity/task/reminder items and merge into activities array
        activity_items = [o for o in all_objects if o.get("type") in ("activity", "task", "reminder")]
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
        if item_type not in ("activity", "task", "reminder"):
            logger.warning("Item missing valid type, defaulting to 'activity': %s", json.dumps(item))
            item["type"] = "activity"

    # Enforce the time-first rule at the code level as a safety net. A standalone
    # spoken number ("twenty twenty", "nineteen fifty", "2020") is a TIME, never
    # a year. The model may still invent a full date like "2020-01-01" from it,
    # so whenever an item carries a date but no time and the user gave no
    # explicit calendar context, treat the date as a misinterpreted year and
    # convert its digits to HH:MM (attaching the date to today is left to the
    # frontend, which already defaults missing dates to today).
    explicit_date = _has_explicit_date_context(transcript)
    has_number = _has_standalone_number(transcript)
    today_str = ref_date_str if ref_date_str else datetime.now().date().isoformat()
    today_year = int(today_str[:4])
    for item in activities:
        converted = False
        for field, time_field in (("start_date", "start_time"), ("end_date", "end_time")):
            raw = item.get(field)
            if item.get(time_field) or not isinstance(raw, str) or not raw:
                continue
            year = _extract_year(raw)
            if year is None:
                continue
            time_val = _time_from_year(year)
            if time_val is None:
                continue
            if explicit_date:
                # The user gave a real calendar date; keep it.
                continue
            if year == today_year and not has_number:
                # Probably a legitimately resolved relative date (e.g. today).
                continue
            item[time_field] = time_val
            item[field] = None
            converted = True
            logger.info(
                "Time-first enforcement: converted year-like date '%s' to %s",
                raw, time_val,
            )
        if converted:
            item["type"] = _reclassify_type(item)

    # Type is authoritative at the code level too: recompute it from the temporal
    # fields ONLY (never from keywords or sentence meaning), exactly like the
    # TYPE CLASSIFICATION RULES in the prompt. Single-point reminders are
    # normalized onto start_date + start_time.
    for item in activities:
        item["type"] = _reclassify_type(item)
        if item["type"] == "reminder" and not item.get("start_time") and item.get("end_time"):
            item["start_time"] = item.get("end_time")
            item["start_date"] = item.get("end_date")
            item["end_time"] = None
            item["end_date"] = None

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
