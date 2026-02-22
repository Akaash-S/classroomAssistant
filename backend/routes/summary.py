import logging
from flask import Blueprint, jsonify, g
from routes.middleware import require_auth
from services import firestore_service

summary_bp = Blueprint("summary", __name__)
logger = logging.getLogger(__name__)


@summary_bp.get("/summary/<lecture_id>")
@require_auth
def get_summary(lecture_id: str):
    try:
        summary = firestore_service.get_summary(lecture_id)
        if not summary:
            return jsonify({"error": "Summary not found"}), 404
        return jsonify(summary)
    except Exception as e:
        logger.exception("get-summary error")
        return jsonify({"error": str(e)}), 500
