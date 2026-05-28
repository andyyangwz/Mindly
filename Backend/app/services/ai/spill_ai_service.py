"""Spill AI service — orchestrates conversation context and AI provider calls.

Separates concerns:
- Personality-based system prompt selection
- Journal context injection (from journal_context field)
- Message formatting for the provider
- Context window management (truncation)
- Provider invocation

Does NOT handle HTTP routes or database persistence.
"""

import logging

from app.services.ai.groq_provider import GroqProvider
from app.services.ai.personalities import get_personality_prompt, DEFAULT_PERSONALITY

logger = logging.getLogger(__name__)

# Maximum number of recent messages to send to the AI provider.
MAX_CONTEXT_MESSAGES = 16


class SpillAIService:
    """High-level Spill AI service."""

    def __init__(self, api_key: str, model: str):
        self.provider = GroqProvider(api_key, model)

    def _format_messages(self, history: list, personality: str,
                         current_journal_context: dict | None = None) -> list[dict]:
        """Convert ORM message objects into provider-compatible dicts.

        Journal context is ONLY injected for the CURRENT message being sent,
        NOT for all historical messages. Once the AI has processed a journal,
        it remains in conversational context naturally.
        """
        # Truncate to recent messages
        recent = history[-MAX_CONTEXT_MESSAGES:] if len(history) > MAX_CONTEXT_MESSAGES else history

        # Inject personality-specific system prompt
        system_prompt = get_personality_prompt(personality)
        formatted = [{"role": "system", "content": system_prompt}]

        # Diagnostics tracking
        section_sizes = {
            "personality_prompt_chars": len(system_prompt),
            "journal_injections": 0,
            "journal_total_chars": 0,
            "user_messages": 0,
            "assistant_messages": 0,
            "system_injections": 0,
            "user_total_chars": 0,
            "assistant_total_chars": 0,
        }

        for msg in recent:
            role = msg.role if msg.role in ("user", "assistant", "system") else "user"

            # Only inject journal context for the CURRENT message (not historical ones)
            if role == "user" and current_journal_context and msg is recent[-1]:
                jc = current_journal_context
                journal_note = (
                    f"[Referenced Journal: {jc.get('title', 'Untitled')}]\n"
                    f"{jc.get('content', '')}\n"
                    f"---\n"
                    f"The user is referencing the journal above. "
                    f"Consider its context when responding to their message."
                )
                formatted.append({"role": "system", "content": journal_note})
                section_sizes["journal_injections"] += 1
                section_sizes["journal_total_chars"] += len(journal_note)
                section_sizes["system_injections"] += 1

            formatted.append({"role": role, "content": msg.content})

            if role == "user":
                section_sizes["user_messages"] += 1
                section_sizes["user_total_chars"] += len(msg.content)
            elif role == "assistant":
                section_sizes["assistant_messages"] += 1
                section_sizes["assistant_total_chars"] += len(msg.content)

        total_chars = sum(len(m["content"]) for m in formatted)
        section_sizes["total_chars"] = total_chars
        section_sizes["total_messages"] = len(formatted)
        section_sizes["estimated_input_tokens"] = total_chars // 4  # rough estimate

        logger.info("=== TOKEN DIAGNOSTICS ===")
        logger.info("Personality: %s", personality)
        logger.info("Total messages in payload: %d", section_sizes["total_messages"])
        logger.info("Personality prompt: %d chars (~%d tokens)", section_sizes["personality_prompt_chars"], section_sizes["personality_prompt_chars"] // 4)
        logger.info("User messages: %d (%d chars, ~%d tokens)", section_sizes["user_messages"], section_sizes["user_total_chars"], section_sizes["user_total_chars"] // 4)
        logger.info("Assistant messages: %d (%d chars, ~%d tokens)", section_sizes["assistant_messages"], section_sizes["assistant_total_chars"], section_sizes["assistant_total_chars"] // 4)
        logger.info("Journal context injections: %d (%d chars, ~%d tokens)", section_sizes["journal_injections"], section_sizes["journal_total_chars"], section_sizes["journal_total_chars"] // 4)
        logger.info("Total payload: %d chars (~%d estimated input tokens)", section_sizes["total_chars"], section_sizes["estimated_input_tokens"])
        logger.info("=== END DIAGNOSTICS ===")

        return formatted

    def chat(self, history: list, personality: str = DEFAULT_PERSONALITY,
             *, current_journal_context: dict | None = None,
             max_tokens: int = 500, temperature: float = 0.7,
             timeout: int = 30) -> str:
        """Get an AI response for the given conversation history."""
        messages = self._format_messages(history, personality, current_journal_context)
        return self.provider.chat(
            messages,
            max_tokens=max_tokens,
            temperature=temperature,
            timeout=timeout,
        )

    def chat_stream(self, history: list, personality: str = DEFAULT_PERSONALITY,
                    *, current_journal_context: dict | None = None,
                    max_tokens: int = 500, temperature: float = 0.7,
                    timeout: int = 30):
        """Yield content chunks from a streaming AI response.

        Same interface as chat() but yields content incrementally
        instead of returning a single string.
        """
        messages = self._format_messages(history, personality, current_journal_context)
        yield from self.provider.chat_stream(
            messages,
            max_tokens=max_tokens,
            temperature=temperature,
            timeout=timeout,
        )
