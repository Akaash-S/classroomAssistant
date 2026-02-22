import logging
from flask import Blueprint, jsonify, g
from routes.middleware import require_auth

auth_bp = Blueprint("auth", __name__)
logger = logging.getLogger(__name__)


@auth_bp.post("/verify-token")
@require_auth
def verify_token_route():
    """Return the decoded token claims — used by the frontend to confirm auth."""
    return jsonify({
        "uid": g.uid,
        "email": g.claims.get("email"),
        "name": g.claims.get("name"),
    })
