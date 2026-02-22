import os
import logging
import requests

logger = logging.getLogger(__name__)

RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY", "")
RAPIDAPI_HOST = os.getenv("RAPIDAPI_HOST", "")

PLACEHOLDER_TRANSCRIPT = (
    "This is a placeholder transcript used when STT is unavailable. "
    "In a real lecture, we would discuss the importance of network protocols "
    "like TCP and UDP. Your assignment is to solve chapter 3 problems by March 20th 2026."
)


def transcribe(audio_url: str) -> str:
    """Send audio URL to RapidAPI Whisper and return transcript text."""
    if not RAPIDAPI_KEY or not RAPIDAPI_HOST:
        logger.warning("RapidAPI credentials not set — using placeholder transcript.")
        return PLACEHOLDER_TRANSCRIPT

    try:
        response = requests.post(
            f"https://{RAPIDAPI_HOST}/whisper/url",
            json={"url": audio_url},
            headers={
                "x-rapidapi-key": RAPIDAPI_KEY,
                "x-rapidapi-host": RAPIDAPI_HOST,
                "Content-Type": "application/json",
            },
            timeout=120,
        )
        response.raise_for_status()
        data = response.json()
        transcript = data.get("text") or data.get("transcript") or ""
        if not transcript:
            logger.warning("STT returned empty text — using placeholder.")
            return PLACEHOLDER_TRANSCRIPT
        return transcript
    except Exception as e:
        logger.error(f"STT request failed: {e} — using placeholder transcript.")
        return PLACEHOLDER_TRANSCRIPT
