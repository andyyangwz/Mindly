"""Groq API provider — thin wrapper around the official Groq SDK.

Handles client creation, request execution, and response extraction.
All Groq-specific configuration lives here.
"""

import logging
from groq import Groq

logger = logging.getLogger(__name__)

MAX_RETRIES = 2


class GroqProvider:
    """Low-level Groq API client.

    Usage:
        provider = GroqProvider(api_key, model)
        reply = provider.chat(messages, max_tokens=500, temperature=0.7)
    """

    def __init__(self, api_key: str, model: str):
        if not api_key:
            raise ValueError("GROQ_API_KEY is not configured")
        self.client = Groq(api_key=api_key)
        self.model = model

    def chat(self, messages: list[dict], *, max_tokens: int = 500,
             temperature: float = 0.7, timeout: int = 30) -> str:
        """Send a chat completion request and return the assistant's reply.

        Args:
            messages: List of {role, content} dicts (system/user/assistant).
            max_tokens: Maximum tokens in the response.
            temperature: Sampling temperature (0.0–1.0).
            timeout: Request timeout in seconds.

        Returns:
            The assistant's response text.

        Raises:
            groq.APIError, groq.RateLimitError, groq.AuthenticationError, etc.
            ValueError: If the response is empty after retries.
        """
        logger.info(
            "Groq request: model=%s messages=%d max_tokens=%d temperature=%.1f",
            self.model, len(messages), max_tokens, temperature,
        )

        for attempt in range(1, MAX_RETRIES + 1):
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
                timeout=timeout,
            )

            content = response.choices[0].message.content
            finish_reason = response.choices[0].finish_reason
            usage = response.usage

            prompt_tokens = usage.prompt_tokens if usage else 0
            completion_tokens = usage.completion_tokens if usage else 0
            total_tokens = usage.total_tokens if usage else 0

            logger.info("=== GROQ TOKEN USAGE ===")
            logger.info("Model: %s", self.model)
            logger.info("Attempt: %d/%d", attempt, MAX_RETRIES)
            logger.info("Input tokens (actual): %d", prompt_tokens)
            logger.info("Output tokens (actual): %d", completion_tokens)
            logger.info("Total tokens: %d", total_tokens)
            logger.info("Finish reason: %s", finish_reason)
            logger.info("Reply preview: %s", repr((content or "")[:100]))
            logger.info("=== END USAGE ===")

            # If response is empty or whitespace-only, retry
            if not content or not content.strip():
                logger.warning(
                    "Groq returned empty response (attempt %d/%d). "
                    "finish_reason=%s, completion_tokens=%d",
                    attempt, MAX_RETRIES, finish_reason, completion_tokens,
                )
                if attempt < MAX_RETRIES:
                    # Retry with slightly higher temperature to break out of degenerate state
                    temperature = min(temperature + 0.2, 1.0)
                    logger.info("Retrying with temperature=%.1f", temperature)
                    continue
                raise ValueError(
                    f"Groq returned empty response after {MAX_RETRIES} attempts "
                    f"(finish_reason={finish_reason})"
                )

            return content

        # Should not reach here, but fallback
        raise ValueError("Groq returned empty response after all retries")
