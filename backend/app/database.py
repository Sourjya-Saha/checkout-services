import os
from typing import Optional
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

_supabase_client: Optional[Client] = None


def get_supabase_client() -> Optional[Client]:
    """
    Initializes and returns the Supabase client using service role key for backend operations.
    Returns None if environment variables are not configured.
    """
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not url or not key or "your-project" in url:
        return None

    _supabase_client = create_client(url, key)
    return _supabase_client
