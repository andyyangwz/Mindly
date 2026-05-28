"""Journal voice routes — transcription, smoothen, restructure, and auto-format for journal entries.

ALL endpoints preserve rich text structure:
    POST /api/journals/voice/transcribe   — audio → Whisper → raw text
    POST /api/journals/voice/smoothen     — HTML → HTML with text cleaned (preserve structure)
    POST /api/journals/voice/restructure  — HTML → HTML with text restructured (preserve structure)
    POST /api/journals/voice/autoformat   — raw text → structured HTML (create structure)
"""
import logging

from flask import Blueprint, jsonify, request, current_app

from app.auth.decorators import require_auth

logger = logging.getLogger(__name__)

journal_voice_bp = Blueprint("journal_voice", __name__, url_prefix="/api/journals/voice")

TRANSCRIPTION_MODEL = "whisper-large-v3-turbo"

SMOOTHEN_SYSTEM_PROMPT = """You are a gentle journaling companion. Your ONLY job is to lightly clean up speech noise inside HTML, while keeping ALL HTML tags and structure EXACTLY as-is.

You receive a full HTML document. You must return the SAME HTML with ONLY the text content cleaned.

RULES:
- Remove filler words from text content only (umm, uh, like, you know, literally, etc.)
- Remove stuttering and repeated words/phrases from text content
- Lightly fix punctuation and capitalization only where needed in text content
- Do NOT change, add, remove, or reorder ANY HTML tags or attributes
- Do NOT change the HTML structure in any way
- Preserve the person's exact wording, sentence structure, and personality
- Keep it feeling like the exact same person speaking naturally, just a little cleaner

EXAMPLE:
Input: <div><h3>My Morning</h3><p>Umm I was like thinking about going to the uh gym but uhhh maybe not</p><blockquote>I'm so tired ugh</blockquote></div>
Output: <div><h3>My Morning</h3><p>I was thinking about going to the gym but maybe not</p><blockquote>I'm so tired.</blockquote></div>

Return ONLY the cleaned HTML. No explanations, no markdown, no code blocks."""

RESTRUCTURE_SYSTEM_PROMPT = """You are an emotionally articulate journaling companion. Your ONLY job is to restructure the text content inside HTML for deeper clarity and emotional resonance, while keeping ALL HTML tags and structure EXACTLY as-is.

You receive a full HTML document. You must return the SAME HTML with ONLY the text content restructured.

RULES:
- Rewrite text content to improve emotional clarity and flow
- Reorganize wording for better articulation
- Strengthen emotional expression while preserving authenticity
- Do NOT change, add, remove, or reorder ANY HTML tags or attributes
- Do NOT change the HTML structure in any way
- Do NOT add facts or details the person didn't say
- Do NOT make it sound corporate, robotic, or therapeutic
- Preserve the person's emotional intent and core meaning
- Make it feel like the same person, just expressing themselves more clearly

EXAMPLE:
Input: <div><h3>My Evening</h3><p>I want to go to the gym but I also want to go to the club. It's soo confusing ughhh</p></div>
Output: <div><h3>My Evening</h3><p>I feel conflicted between going to the gym and going to the club. I'm unsure which choice I genuinely want to make.</p></div>

Return ONLY the restructured HTML. No explanations, no markdown, no code blocks."""

AUTOFORMAT_SYSTEM_PROMPT = """You are a lightweight journal structuring assistant. Your job is to organize plain journal text into clean, readable HTML.

You may lightly restructure wording and rephrase for clarity, as long as the author's original meaning, voice, and emotional tone remain intact. You are improving readability, not replacing the author's writing.

FORMATTING TARGETS:
- Split content into natural paragraphs on major topic shifts (reflection → plan, work → personal, observation → conclusion). Do NOT split on every temporal marker or sentence break.
- Use <h3> for obvious section-intent phrases the user wrote: "Things I learned", "Tomorrow", "Reflection", "What happened today", "Goals", "Plans", as well as lines that are clearly in ALL CAPS or Title Case and act as headings. Do NOT invent headings for implied topics.
- Use <ol> for sequential or numbered steps.
- Use <ul> for natural collections: action items, grouped thoughts, goals, items after a colon, or comma-separated short items introduced by a colon.
- Use <blockquote> for text that reads as a quotation, even without quotation marks, when it has a clear citation or attribution — such as ending with "— Source", "(Author)", "~ Author", a book/chapter/verse citation, or similar. Quote marks + attribution also qualify. Never use for casual reported speech, internal thoughts, reflections, or emotional moments.
- Use <strong> or <em> very sparingly — only for ALL CAPS words or words the user strongly emphasizes (e.g., "absolutely", "cannot", "so much" in context). Never use for emotional dramatization.

STYLISTIC BOUNDARIES:
- NEVER change the author's meaning, remove content, or add facts they didn't write
- NEVER add quotation marks around words for dramatic effect
- NEVER make the writing sound theatrical, poetic, or like a novel
- NEVER split every sentence into its own paragraph
- NEVER convert normal reflective prose into a list

When in doubt, simpler formatting is better.

OUTPUT:
- Valid HTML only, wrapped in a single <div>
- No markdown, no code blocks, no explanations

EXAMPLES:

Input: Morning Reflection

Today felt heavy at first, but things became better after I started working instead of overthinking.

Things I learned:

* clean desk = clearer mind
* starting is harder than continuing
* distractions grow fast

"Small daily improvements are the key to long-term growth." — Unknown

Goals for tomorrow:

1. finish the journal tutorial
2. fix the calendar bugs
3. sleep earlier
Output:
<div>
  <h3>Morning Reflection</h3>
  <p>Today felt heavy at first, but things became better after I started working instead of overthinking.</p>
  <h3>Things I learned</h3>
  <ul>
    <li>clean desk = clearer mind</li>
    <li>starting is harder than continuing</li>
    <li>distractions grow fast</li>
  </ul>
  <blockquote>Small daily improvements are the key to long-term growth. — Unknown</blockquote>
  <h3>Goals for tomorrow</h3>
  <ol>
    <li>finish the journal tutorial</li>
    <li>fix the calendar bugs</li>
    <li>sleep earlier</li>
  </ol>
</div>

Input: "Today was exhausting. I learned something important though. Tomorrow I want to focus on my goals."
Output:
<div>
  <p>Today was exhausting. I learned something important though.</p>
  <p>Tomorrow I want to focus on my goals.</p>
</div>

Input: "Things I learned today: focus matters more than motivation discipline is consistency sleep affects everything"
Output:
<div>
  <h3>Things I learned today</h3>
  <ul>
    <li>focus matters more than motivation</li>
    <li>discipline is consistency</li>
    <li>sleep affects everything</li>
  </ul>
</div>

Input: "Need to buy: eggs, milk, bread, cheese"
Output:
<div>
  <p>Need to buy:</p>
  <ul>
    <li>eggs</li>
    <li>milk</li>
    <li>bread</li>
    <li>cheese</li>
  </ul>
</div>

Input: "I am SO tired today. I absolutely cannot do this again."
Output:
<div>
  <p>I am <strong>SO</strong> tired today. I <strong>absolutely cannot</strong> do this again.</p>
</div>"""


@journal_voice_bp.route("/transcribe", methods=["POST"])
@require_auth
def transcribe(user_id):
    """Receive audio, transcribe with Whisper, return raw text."""
    if "audio" not in request.files:
        return jsonify({"error": "No audio file provided."}), 400

    audio_file = request.files["audio"]
    audio_data = audio_file.read()
    if not audio_data or len(audio_data) < 100:
        return jsonify({"error": "Audio is empty or too small."}), 400

    content_type = audio_file.content_type or "audio/webm"
    filename = audio_file.filename or "recording.webm"

    logger.info(
        "Journal voice transcribe: user=%s size=%d",
        user_id, len(audio_data),
    )

    try:
        api_key = current_app.config.get("GROQ_API_KEY", "")
        if not api_key:
            return jsonify({"error": "GROQ_API_KEY is not configured"}), 500

        from groq import Groq
        client = Groq(api_key=api_key)

        result = client.audio.transcriptions.create(
            file=(filename, audio_data, content_type),
            model=TRANSCRIPTION_MODEL,
            response_format="text",
        )
        text = result.strip()
        logger.info("Transcription result: %s", text[:200])

        if not text:
            return jsonify({"error": "Transcription returned empty."}), 422

        return jsonify({"text": text})

    except Exception as e:
        logger.error("Transcription error: %s: %s", type(e).__name__, str(e))
        return jsonify({"error": f"Transcription failed: {str(e)}"}), 500


@journal_voice_bp.route("/smoothen", methods=["POST"])
@require_auth
def smoothen(user_id):
    """Lightly clean up speech artifacts from journal HTML — preserves all tags."""
    data = request.get_json(silent=True)
    if not data or not (data.get("html", "") or data.get("text", "")).strip():
        return jsonify({"error": "html is required"}), 400

    html = data.get("html", "") or data.get("text", "")
    html = html.strip()
    logger.info("Journal voice smoothen: user=%s len=%d", user_id, len(html))

    try:
        api_key = current_app.config.get("GROQ_API_KEY", "")
        model = current_app.config.get("GROQ_MODEL", "llama-3.3-70b-versatile")
        if not api_key:
            return jsonify({"error": "GROQ_API_KEY is not configured"}), 500

        from app.services.ai.groq_provider import GroqProvider
        provider = GroqProvider(api_key, model)

        result = provider.chat(
            messages=[
                {"role": "system", "content": SMOOTHEN_SYSTEM_PROMPT},
                {"role": "user", "content": html},
            ],
            max_tokens=len(html) * 2 + 500,
            temperature=0.3,
        )
        logger.info("Smoothen result: %s", result[:200])
        return jsonify({"html": result.strip()})

    except Exception as e:
        logger.error("Smoothen error: %s: %s", type(e).__name__, str(e))
        return jsonify({"error": f"Smoothen failed: {str(e)}"}), 500


@journal_voice_bp.route("/restructure", methods=["POST"])
@require_auth
def restructure(user_id):
    """Deeply restructure text content inside HTML — preserves all tags."""
    data = request.get_json(silent=True)
    if not data or not (data.get("html", "") or data.get("text", "")).strip():
        return jsonify({"error": "html is required"}), 400

    html = data.get("html", "") or data.get("text", "")
    html = html.strip()
    logger.info("Journal voice restructure: user=%s len=%d", user_id, len(html))

    try:
        api_key = current_app.config.get("GROQ_API_KEY", "")
        model = current_app.config.get("GROQ_MODEL", "llama-3.3-70b-versatile")
        if not api_key:
            return jsonify({"error": "GROQ_API_KEY is not configured"}), 500

        from app.services.ai.groq_provider import GroqProvider
        provider = GroqProvider(api_key, model)

        result = provider.chat(
            messages=[
                {"role": "system", "content": RESTRUCTURE_SYSTEM_PROMPT},
                {"role": "user", "content": html},
            ],
            max_tokens=len(html) * 2 + 500,
            temperature=0.5,
        )
        logger.info("Restructure result: %s", result[:200])
        return jsonify({"html": result.strip()})

    except Exception as e:
        logger.error("Restructure error: %s: %s", type(e).__name__, str(e))
        return jsonify({"error": f"Restructure failed: {str(e)}"}), 500


@journal_voice_bp.route("/autoformat", methods=["POST"])
@require_auth
def autoformat(user_id):
    """Apply intelligent rich text formatting (headings, lists, paragraphs) to plain text.

    Returns valid HTML that the TipTap editor renders natively.
    """
    data = request.get_json(silent=True)
    if not data or not data.get("text", "").strip():
        return jsonify({"error": "text is required"}), 400

    text = data["text"].strip()
    logger.info("Journal voice autoformat: user=%s len=%d", user_id, len(text))

    try:
        api_key = current_app.config.get("GROQ_API_KEY", "")
        model = current_app.config.get("GROQ_MODEL", "llama-3.3-70b-versatile")
        if not api_key:
            return jsonify({"error": "GROQ_API_KEY is not configured"}), 500

        from app.services.ai.groq_provider import GroqProvider
        provider = GroqProvider(api_key, model)

        result = provider.chat(
            messages=[
                {"role": "system", "content": AUTOFORMAT_SYSTEM_PROMPT},
                {"role": "user", "content": text},
            ],
            max_tokens=2000,
            temperature=0.4,
        )
        logger.info("Autoformat result: %s", result[:300])
        return jsonify({"html": result.strip()})

    except Exception as e:
        logger.error("Autoformat error: %s: %s", type(e).__name__, str(e))
        return jsonify({"error": f"Autoformat failed: {str(e)}"}), 500


EMOJI_SYSTEM_PROMPT = """You are an emotionally intelligent journaling companion. Analyze the journal text and suggest exactly 3 emojis that capture its emotional tone, mood, and topic.

RULES:
- Return ONLY valid JSON: ["emoji1", "emoji2", "emoji3"]
- EXACTLY 3 emojis — no more, no less
- No explanations, no markdown, no code blocks
- Choose emojis that feel emotionally connected and meaningful
- Avoid generic or random emoji spam
- Consider: emotional tone, mood, topic, intent, atmosphere

EXAMPLES:
Input: "Today I finally finished my assignment after stressing about it for days. I feel relieved but exhausted."
Output: ["📚", "😮‍💨", "✅"]

Input: "I went to the gym today and honestly I feel stronger mentally."
Output: ["💪", "🧠", "🔥"]

Input: "I feel emotionally confused lately. I don't really know what I want anymore."
Output: ["🌧️", "🫠", "💭"]

Return ONLY valid JSON. No explanations, no markdown, no code blocks."""


@journal_voice_bp.route("/emojis", methods=["POST"])
@require_auth
def suggest_emojis(user_id):
    """Analyze journal text and suggest 3 emotionally relevant emojis."""
    data = request.get_json(silent=True)
    if not data or not data.get("text", "").strip():
        return jsonify({"error": "text is required"}), 400

    text = data["text"].strip()
    logger.info("Journal voice emojis: user=%s len=%d", user_id, len(text))

    try:
        api_key = current_app.config.get("GROQ_API_KEY", "")
        model = current_app.config.get("GROQ_MODEL", "llama-3.3-70b-versatile")
        if not api_key:
            return jsonify({"error": "GROQ_API_KEY is not configured"}), 500

        from app.services.ai.groq_provider import GroqProvider
        provider = GroqProvider(api_key, model)

        result = provider.chat(
            messages=[
                {"role": "system", "content": EMOJI_SYSTEM_PROMPT},
                {"role": "user", "content": text},
            ],
            max_tokens=100,
            temperature=0.6,
        )

        import re
        import json as json_lib

        cleaned = result.strip()
        emojis = []

        # Try parsing as JSON array first
        try:
            parsed = json_lib.loads(cleaned)
            if isinstance(parsed, list) and len(parsed) > 0:
                emojis = [str(e).strip() for e in parsed]
        except (json_lib.JSONDecodeError, ValueError):
            pass

        # Fallback: extract emoji characters via regex
        if len(emojis) < 3:
            emoji_pattern = re.compile(
                "[\U0001F300-\U0001FAFF"
                "\U0001F600-\U0001F64F"
                "\U0001F680-\U0001F6FF"
                "\U0001F900-\U0001F9FF"
                "\u2600-\u27BF"
                "\u2B50\u2934\u2935"
                "\u00A9\u00AE\u203C\u2049\u2122\u2139"
                "\u3030\u303D\u3297\u3299"
                "\u231A\u231B\u2328\u23CF"
                "\u23E9-\u23F3\u25AA\u25AB"
                "\u25B6\u25C0\u25FB-\u25FE"
                "\u2B05\u2B06\u2B07\u2B1B\u2B1C\u2B55"
                "]+"
            )
            found = emoji_pattern.findall(cleaned)
            emojis = [e.strip() for e in found if e.strip()]

        # Validate: exactly 3, pad or truncate
        if len(emojis) < 3:
            emojis = (emojis + ["✨"] * 3)[:3]
        else:
            emojis = emojis[:3]

        logger.info("Emoji suggestion result: %s", emojis)
        return jsonify({"emojis": emojis})

    except Exception as e:
        logger.error("Emoji suggestion error: %s: %s", type(e).__name__, str(e))
        return jsonify({"error": f"Emoji suggestion failed: {str(e)}"}), 500
