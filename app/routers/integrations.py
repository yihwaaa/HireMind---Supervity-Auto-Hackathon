# app/routers/integrations.py
"""
Aggregated live status for the Data Manager page — one call, real checks
against every connected system, not hardcoded rows.
"""
from fastapi import APIRouter

from ..services.integrations import check_supabase_connection
from ..services.supervity import supervity

router = APIRouter(prefix="/integrations", tags=["Integrations"])


@router.get("/status")
async def integrations_status():
    """
    Live health for everything the Data Manager needs to show. Add an entry
    here for each new system as you connect it (Slack, Airtable, etc.) —
    each should do an actual reachability check, not just report configured.
    """
    supervity_status = await supervity.check_orchestrator_connection()
    supabase_status = await check_supabase_connection()
    return {
        "supervity_auto": {
            "name": "Supervity Auto (Orchestrator)",
            "category": "Orchestration",
            **supervity_status,
        },
        "supabase": {
            "name": "Supabase",
            "category": "System of Record",
            **supabase_status,
        },
    }
