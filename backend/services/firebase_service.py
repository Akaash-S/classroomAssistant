import os
import json
import logging
import firebase_admin
from firebase_admin import credentials, auth

logger = logging.getLogger(__name__)
_initialized = False

def _init_firebase():
    global _initialized
    if _initialized or firebase_admin._apps:
        _initialized = True
        return

    key = os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY")
    if not key:
        logger.warning("FIREBASE_SERVICE_ACCOUNT_KEY not set — auth features disabled.")
        return

    try:
        sa = json.loads(key)
        cred = credentials.Certificate(sa)
        firebase_admin.initialize_app(cred)
        _initialized = True
        logger.info("Firebase Admin initialized.")
    except Exception as e:
        logger.error(f"Firebase Admin init failed: {e}")


def verify_token(id_token: str) -> dict:
    """Verify a Firebase ID token and return the decoded claims."""
    _init_firebase()
    if not _initialized:
        raise RuntimeError("Firebase Admin not configured")
    return auth.verify_id_token(id_token)
