"""Supabase client helpers."""

from functools import lru_cache
from typing import Any, Iterable

from fastapi import HTTPException
from supabase import Client, create_client

from app.core.config import settings


class SupabaseConfigurationError(RuntimeError):
    """Raised when Supabase credentials are missing."""


@lru_cache()
def get_supabase_client() -> Client:
    """Return a shared Supabase client instance."""
    if not settings.SUPABASE_URL or not settings.SUPABASE_ANON_KEY:
        raise SupabaseConfigurationError(
            "Supabase credentials are not configured. "
            "Set SUPABASE_URL and SUPABASE_ANON_KEY in the environment."
        )
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)


def ensure_data(response: Any) -> list[dict[str, Any]]:
    """Validate a Supabase response and return its data payload."""
    error = getattr(response, "error", None)
    if error:
        message = getattr(error, "message", str(error))
        raise HTTPException(status_code=500, detail=f"Supabase error: {message}")
    data = getattr(response, "data", None) or []
    if isinstance(data, Iterable):
        return list(data)
    return [data]

