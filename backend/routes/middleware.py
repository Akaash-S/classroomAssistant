import functools
import logging
from flask import request, jsonify, g
from services.firebase_service import verify_token

logger = logging.getLogger(__name__)


def require_auth(f):
    """Decorator: verify Firebase Bearer token and attach uid + role to g."""
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Unauthorized"}), 401
        token = auth_header.split("Bearer ", 1)[1]
        try:
            claims = verify_token(token)
            g.uid = claims["uid"]
            g.claims = claims
        except Exception as e:
            logger.warning(f"Token verification failed: {e}")
            return jsonify({"error": "Invalid token"}), 401
        return f(*args, **kwargs)
    return decorated
