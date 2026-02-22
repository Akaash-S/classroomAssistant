import os
import json
import logging
import firebase_admin
from firebase_admin import firestore as admin_firestore

logger = logging.getLogger(__name__)

def get_db():
    if not firebase_admin._apps:
        raise RuntimeError("Firebase Admin not initialized")
    return admin_firestore.client()


# ── Lectures ────────────────────────────────────────────────────────────────

def create_lecture(teacher_id: str, subject: str, audio_url: str, transcript: str) -> str:
    db = get_db()
    ref = db.collection("lectures").add({
        "teacherId": teacher_id,
        "subject": subject,
        "audioUrl": audio_url,
        "transcript": transcript,
        "createdAt": admin_firestore.SERVER_TIMESTAMP,
    })
    return ref[1].id


def get_lectures_by_teacher(teacher_id: str) -> list:
    db = get_db()
    docs = (
        db.collection("lectures")
        .where("teacherId", "==", teacher_id)
        .order_by("createdAt", direction=admin_firestore.Query.DESCENDING)
        .stream()
    )
    return [{"id": d.id, **d.to_dict()} for d in docs]


# ── Summaries ────────────────────────────────────────────────────────────────

def save_summary(lecture_id: str, ai_data: dict):
    db = get_db()
    db.collection("summaries").document(lecture_id).set({
        "lectureId": lecture_id,
        "shortSummary": ai_data.get("summary", ""),
        "keyPoints": ai_data.get("key_points", []),
        "examNotes": ai_data.get("exam_notes", []),
        "createdAt": admin_firestore.SERVER_TIMESTAMP,
    })


def get_summary(lecture_id: str) -> dict | None:
    db = get_db()
    doc = db.collection("summaries").document(lecture_id).get()
    return {"id": doc.id, **doc.to_dict()} if doc.exists else None


# ── Tasks ────────────────────────────────────────────────────────────────────

def save_tasks(tasks: list, lecture_id: str, teacher_id: str):
    db = get_db()
    for task in tasks:
        db.collection("tasks").add({
            **task,
            "lectureId": lecture_id,
            "teacherId": teacher_id,
            "approved": False,
            "createdAt": admin_firestore.SERVER_TIMESTAMP,
        })


def get_tasks_for_user(approved_only: bool = True) -> list:
    db = get_db()
    q = db.collection("tasks")
    if approved_only:
        q = q.where("approved", "==", True)
    docs = q.order_by("dueDate", direction=admin_firestore.Query.ASCENDING).stream()
    return [{"id": d.id, **d.to_dict()} for d in docs]


def update_task_approval(task_id: str, approved: bool):
    db = get_db()
    db.collection("tasks").document(task_id).update({"approved": approved})


# ── Notifications ────────────────────────────────────────────────────────────

def create_notification(user_id: str, message: str, notif_type: str = "task"):
    db = get_db()
    db.collection("notifications").add({
        "userId": user_id,
        "message": message,
        "type": notif_type,
        "read": False,
        "createdAt": admin_firestore.SERVER_TIMESTAMP,
    })
