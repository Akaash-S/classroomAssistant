import os
import logging
from supabase import create_client, Client

logger = logging.getLogger(__name__)

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

_client: Client | None = None

def _get_client() -> Client:
    global _client
    if _client is None:
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise RuntimeError("Supabase credentials not configured")
        _client = create_client(SUPABASE_URL, SUPABASE_KEY)
    return _client


def get_signed_url(bucket: str, path: str, expires_in: int = 3600) -> str:
    """Generate a signed URL for a private Supabase Storage object."""
    client = _get_client()
    res = client.storage.from_(bucket).create_signed_url(path, expires_in)
    return res["signedURL"]


def get_public_url(bucket: str, path: str) -> str:
    """Get the public URL for a public Supabase Storage object."""
    client = _get_client()
    return client.storage.from_(bucket).get_public_url(path)
