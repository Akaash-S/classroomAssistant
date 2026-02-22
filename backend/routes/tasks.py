import logging
from flask import Blueprint, request, jsonify, g
from routes.middleware import require_auth
from services import firestore_service

tasks_bp = Blueprint("tasks", __name__)
logger = logging.getLogger(__name__)


@tasks_bp.get("/tasks/<user_id>")
@require_auth
def get_tasks(user_id: str):
    """Return all approved tasks. Caller must match user_id."""
    if g.uid != user_id:
        return jsonify({"error": "Forbidden"}), 403
    try:
        tasks = firestore_service.get_tasks_for_user(approved_only=True)
        return jsonify(tasks)
    except Exception as e:
        logger.exception("get-tasks error")
        return jsonify({"error": str(e)}), 500


@tasks_bp.put("/tasks/approve/<task_id>")
@require_auth
def approve_task(task_id: str):
    """
    Body: { approved: bool }
    Only the owning teacher (verified via Firestore) can approve/reject.
    """
    data = request.get_json(silent=True) or {}
    approved = data.get("approved")
    if approved is None:
        return jsonify({"error": "'approved' field is required"}), 400

    try:
        db = firestore_service.get_db()
        task_ref = db.collection("tasks").document(task_id)
        task_doc = task_ref.get()

        if not task_doc.exists:
            return jsonify({"error": "Task not found"}), 404

        task_data = task_doc.to_dict()
        if task_data.get("teacherId") != g.uid:
            return jsonify({"error": "Forbidden — not your task"}), 403

        task_ref.update({"approved": approved})

        # Create notification for students when approved
        if approved:
            # Notify all students (simplified — in production, filter by enrolled students)
            firestore_service.create_notification(
                user_id="all",  # Frontend filters by their own userId; use a broadcast pattern
                message=f"New task available: {task_data.get('title')} — Due {task_data.get('dueDate') or task_data.get('due_date', 'TBD')}",
                notif_type="task_approved",
            )

        return jsonify({"success": True, "approved": approved})
    except Exception as e:
        logger.exception("approve-task error")
        return jsonify({"error": str(e)}), 500
