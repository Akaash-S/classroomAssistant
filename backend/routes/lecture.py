import logging
from flask import Blueprint, request, jsonify, g
from routes.middleware import require_auth
from services import stt_service, gemini_service, firestore_service

lecture_bp = Blueprint("lecture", __name__)
logger = logging.getLogger(__name__)


@lecture_bp.post("/process-lecture")
@require_auth
def process_lecture():
    """
    Body: { audioUrl, subject, teacherId }
    1. Verify caller is the teacher
    2. STT → transcript
    3. Gemini → AI data
    4. Store lecture + summary + tasks in Firestore
    """
    data = request.get_json(silent=True) or {}
    audio_url = data.get("audioUrl")
    subject = data.get("subject")
    teacher_id = data.get("teacherId")

    if not audio_url or not subject or not teacher_id:
        return jsonify({"error": "audioUrl, subject, and teacherId are required"}), 400

    if g.uid != teacher_id:
        return jsonify({"error": "Forbidden"}), 403

    try:
        # 1. Speech-to-text
        transcript = stt_service.transcribe(audio_url)

        # 2. Gemini extraction
        ai_data = gemini_service.extract_lecture_data(transcript)

        # 3. Persist
        lecture_id = firestore_service.create_lecture(teacher_id, subject, audio_url, transcript)
        firestore_service.save_summary(lecture_id, ai_data)
        firestore_service.save_tasks(ai_data.get("tasks", []), lecture_id, teacher_id)

        return jsonify({
            "lectureId": lecture_id,
            "transcript": transcript,
            "summary": ai_data.get("summary"),
            "tasksCount": len(ai_data.get("tasks", [])),
        })
    except Exception as e:
        logger.exception("process-lecture error")
        return jsonify({"error": str(e)}), 500


@lecture_bp.get("/lectures/<teacher_id>")
@require_auth
def get_lectures(teacher_id: str):
    """GET all lectures for a teacher. Caller must be the same teacher."""
    if g.uid != teacher_id:
        return jsonify({"error": "Forbidden"}), 403
    try:
        lectures = firestore_service.get_lectures_by_teacher(teacher_id)
        return jsonify(lectures)
    except Exception as e:
        logger.exception("get-lectures error")
        return jsonify({"error": str(e)}), 500
