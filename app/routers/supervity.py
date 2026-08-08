# app/routers/supervity.py
"""
Proxy endpoints for the Supervity Auto integration.

The Next.js frontend never calls Supervity directly — it calls this backend,
which holds the API key server-side (see app/services/supervity.py) and
forwards the request. This matches Supervity's own guidance: proxy workflow
endpoints through your backend rather than exposing a JWT/API key to the
browser.

Wire the Command Center to these routes:
  - Dashboard "Escalate ..." action buttons -> POST /supervity/workflows/{id}/run
  - AI Manager "trigger the Orchestrator" -> POST /supervity/workflows/{id}/run/stream
  - Data Manager "Supervity Auto" row health -> GET /supervity/workflows
  - Workbench audit trail -> GET /supervity/workflow-runs/{run_id}
"""

import logging

import httpx
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..models.supervity_run import SupervityRun
from ..services.supervity import (
    SUPERVITY_ORCHESTRATOR_WORKFLOW_ID,
    SupervityAPIError,
    SupervityConfigError,
    supervity,
)

log = logging.getLogger(__name__)

router = APIRouter(prefix="/supervity", tags=["Supervity Auto"])


@router.get("/status")
async def connection_status():
    """
    Real health check for the Data Manager — hits Supervity, doesn't guess.
    Returns connected=True only if GET /workflows/{orchestrator_id} actually
    succeeded against your configured SUPERVITY_ORCHESTRATOR_WORKFLOW_ID.
    """
    return await supervity.check_orchestrator_connection()


def _persist_run(
    db: Session,
    *,
    workflow_id: str,
    inputs: dict | None,
    status: str,
    error_message: str | None = None,
    trigger_source: str = "api",
) -> SupervityRun:
    """
    Writes one row per trigger attempt. Since execute_workflow() returns
    before the run finishes (Supervity confirmed this — {"accepted": true}
    with no run_id), this only records that a run was *triggered*, not its
    outcome. Update `status`/`outputs`/`completed_at` on this row later once
    you have a reliable way to fetch the outcome (poll workflow-runs once
    that endpoint is working for your key, a webhook, or manual entry from
    the Workbench when a human resolves the linked exception).
    """
    run = SupervityRun(
        workflow_id=workflow_id,
        inputs=inputs,
        status=status,
        error_message=error_message,
        trigger_source=trigger_source,
    )
    db.add(run)
    db.commit()
    db.refresh(run)
    return run


@router.get("/runs")
def list_persisted_runs(
    workflow_id: str | None = None,
    status: str | None = None,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """
    Run history from OUR OWN database — not Supervity's flaky list endpoint.
    This is what the Dashboard / Workbench / Data Manager should read from
    for "has the agent run recently" style questions, since it's reliable
    regardless of whatever's going on with Supervity's read-scope on your key.
    """
    query = db.query(SupervityRun)
    if workflow_id:
        query = query.filter(SupervityRun.workflow_id == workflow_id)
    if status:
        query = query.filter(SupervityRun.status == status)
    runs = query.order_by(SupervityRun.triggered_at.desc()).limit(limit).all()
    return [
        {
            "id": r.id,
            "workflow_id": r.workflow_id,
            "workflow_name": r.workflow_name,
            "inputs": r.inputs,
            "status": r.status,
            "supervity_run_id": r.supervity_run_id,
            "outputs": r.outputs,
            "error_message": r.error_message,
            "trigger_source": r.trigger_source,
            "triggered_at": r.triggered_at.isoformat() if r.triggered_at else None,
            "completed_at": r.completed_at.isoformat() if r.completed_at else None,
        }
        for r in runs
    ]


@router.post("/orchestrator/run")
async def run_orchestrator(body: dict, db: Session = Depends(get_db)):
    """
    Same as POST /workflows/{id}/run, but uses SUPERVITY_ORCHESTRATOR_WORKFLOW_ID
    from .env so callers (Dashboard buttons, Workbench, AI Manager) never
    need to know or pass the raw workflow ID. Persists the attempt to our
    own DB either way — success or failure.

    Body: {"inputs": {...}, "envs": {...}, "trigger_source": "workbench"}
    """
    if not SUPERVITY_ORCHESTRATOR_WORKFLOW_ID:
        raise HTTPException(
            status_code=503,
            detail="SUPERVITY_ORCHESTRATOR_WORKFLOW_ID is not set in .env",
        )
    inputs = body.get("inputs")
    trigger_source = body.get("trigger_source", "api")
    try:
        result = await supervity.execute_workflow(
            SUPERVITY_ORCHESTRATOR_WORKFLOW_ID,
            inputs=inputs,
            envs=body.get("envs"),
        )
        _persist_run(
            db,
            workflow_id=SUPERVITY_ORCHESTRATOR_WORKFLOW_ID,
            inputs=inputs,
            status="triggered",
            trigger_source=trigger_source,
        )
        return result
    except Exception as exc:
        _persist_run(
            db,
            workflow_id=SUPERVITY_ORCHESTRATOR_WORKFLOW_ID,
            inputs=inputs,
            status="failed",
            error_message=str(exc),
            trigger_source=trigger_source,
        )
        _handle(exc)


def _handle(exc: Exception):
    if isinstance(exc, SupervityConfigError):
        raise HTTPException(status_code=503, detail=str(exc))
    if isinstance(exc, SupervityAPIError):
        raise HTTPException(status_code=exc.status_code, detail=exc.detail)
    if isinstance(exc, (httpx.ConnectError, httpx.ConnectTimeout)):
        log.exception("Could not reach auto.supervity.ai")
        raise HTTPException(
            status_code=502,
            detail=(
                "Could not reach auto.supervity.ai from the backend container. "
                "Check the container has outbound internet access and that "
                "SUPERVITY_BASE_URL is correct."
            ),
        )
    log.exception("Unexpected Supervity integration error")
    raise HTTPException(status_code=502, detail="Supervity Auto request failed")


@router.get("/workflows")
async def list_workflows(page: int = 1, limit: int = 20, search: str | None = None):
    """List workflows visible to this org — use this to find your Orchestrator's ID."""
    try:
        return await supervity.list_workflows(page=page, limit=limit, search=search)
    except Exception as exc:
        _handle(exc)


@router.get("/workflows/{workflow_id}")
async def get_workflow(workflow_id: str):
    try:
        return await supervity.get_workflow(workflow_id)
    except Exception as exc:
        _handle(exc)


@router.post("/workflows/{workflow_id}/run")
async def run_workflow(workflow_id: str, body: dict, db: Session = Depends(get_db)):
    """
    Kicks off the run. Supervity queues it and returns immediately —
    {"accepted": true, "message": "Execution started"} — it does NOT wait
    for the Orchestrator to finish. Follow up with GET /workflow-runs
    (filtered by this workflow_id) to find the run, then poll
    GET /workflow-runs/{run_id} for status/outputs. For live progress
    instead of polling, use the /run/stream endpoint below.

    Body: {"inputs": {...}, "envs": {...}, "trigger_source": "dashboard"}
    """
    inputs = body.get("inputs")
    trigger_source = body.get("trigger_source", "api")
    try:
        result = await supervity.execute_workflow(
            workflow_id,
            inputs=inputs,
            envs=body.get("envs"),
        )
        _persist_run(
            db,
            workflow_id=workflow_id,
            inputs=inputs,
            status="triggered",
            trigger_source=trigger_source,
        )
        return result
    except Exception as exc:
        _persist_run(
            db,
            workflow_id=workflow_id,
            inputs=inputs,
            status="failed",
            error_message=str(exc),
            trigger_source=trigger_source,
        )
        _handle(exc)


@router.post("/workflows/{workflow_id}/run/stream")
async def run_workflow_stream(workflow_id: str, body: dict):
    """
    Streaming execution (SSE) — forwards live progress as the Orchestrator
    delegates to its Operators, so the AI Manager / Workbench UI can show
    it happening in real time instead of a blank spinner.
    """
    try:
        return StreamingResponse(
            supervity.stream_workflow(
                workflow_id,
                inputs=body.get("inputs"),
                envs=body.get("envs"),
            ),
            media_type="text/event-stream",
        )
    except Exception as exc:
        _handle(exc)


@router.get("/workflow-runs")
async def list_workflow_runs(
    workflow_id: str | None = None,
    status: str | None = None,
    page: int = 1,
    limit: int = 10,
):
    try:
        return await supervity.list_workflow_runs(
            workflow_id=workflow_id, status=status, page=page, limit=limit
        )
    except Exception as exc:
        _handle(exc)


@router.get("/workflow-runs/{run_id}")
async def get_workflow_run(run_id: str):
    try:
        return await supervity.get_workflow_run(run_id)
    except Exception as exc:
        _handle(exc)


@router.get("/workflow-runs/dashboard/{workflow_id}")
async def get_dashboard_stats(workflow_id: str):
    """Run-count breakdown by status — feed straight into a KpiGrid card."""
    try:
        return await supervity.get_dashboard_stats(workflow_id)
    except Exception as exc:
        _handle(exc)
