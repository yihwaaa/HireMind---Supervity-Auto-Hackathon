# app/services/integrations.py
"""
Live health checks for external systems shown in the Data Manager (7.5 in
the Round 2 guide: "whether the connection is healthy" — a real check, not
an asserted label). Supervity Auto's check lives in services/supervity.py;
this module covers the other integrations you connect directly.
"""
import os

import httpx

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")  # anon or service_role key


async def check_supabase_connection() -> dict:
    """
    Pings Supabase's PostgREST root (`/rest/v1/`) with the API key. A 200
    means the project is reachable and the key is valid — it doesn't prove
    your Operators' specific tables exist, just that the connection itself
    is live, which is what the Data Manager needs to show.
    """
    if not SUPABASE_URL or not SUPABASE_KEY:
        return {
            "configured": False,
            "connected": False,
            "detail": "SUPABASE_URL and/or SUPABASE_KEY not set in .env",
        }
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                f"{SUPABASE_URL.rstrip('/')}/rest/v1/",
                headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"},
            )
        if resp.status_code == 200:
            return {"configured": True, "connected": True, "url": SUPABASE_URL}
        return {
            "configured": True,
            "connected": False,
            "status_code": resp.status_code,
            "detail": resp.text[:300],
        }
    except httpx.HTTPError as exc:
        return {"configured": True, "connected": False, "detail": str(exc)}
