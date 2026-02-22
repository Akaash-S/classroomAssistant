import os
import json
import logging
import google.generativeai as genai

logger = logging.getLogger(__name__)

genai.configure(api_key=os.getenv("GEMINI_API_KEY", ""))

_SCHEMA = {
    "type": "object",
    "properties": {
        "summary": {"type": "string"},
        "key_points": {"type": "array", "items": {"type": "string"}},
        "exam_notes": {"type": "array", "items": {"type": "string"}},
        "tasks": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "description": {"type": "string"},
                    "due_date": {"type": "string"},
                    "subject": {"type": "string"},
                },
                "required": ["title", "description", "due_date", "subject"],
            },
        },
    },
    "required": ["summary", "key_points", "exam_notes", "tasks"],
}

_EMPTY = {"summary": "", "key_points": [], "exam_notes": [], "tasks": []}

_PROMPT_TEMPLATE = """Analyze the following lecture transcript and extract key information as valid JSON.

Transcript:
{transcript}

Return ONLY a JSON object matching this schema — no markdown, no explanation:
{{
  "summary": "Short lecture summary",
  "key_points": ["point1", "point2"],
  "exam_notes": ["important definition", "formula"],
  "tasks": [
    {{
      "title": "Assignment Title",
      "description": "Task description",
      "due_date": "YYYY-MM-DD",
      "subject": "Subject Name"
    }}
  ]
}}"""


def extract_lecture_data(transcript: str) -> dict:
    """Send transcript to Gemini and return structured lecture data."""
    try:
        model = genai.GenerativeModel(
            model_name="gemini-2.0-flash",
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
            ),
        )
        response = model.generate_content(_PROMPT_TEMPLATE.format(transcript=transcript))
        text = response.text or ""
        data = json.loads(text)

        # Validate required keys
        for key in _EMPTY:
            if key not in data:
                data[key] = _EMPTY[key]

        return data
    except json.JSONDecodeError as e:
        logger.error(f"[Gemini] Failed to parse JSON response: {e}")
        return _EMPTY
    except Exception as e:
        logger.error(f"[Gemini] API error: {e}")
        return _EMPTY
