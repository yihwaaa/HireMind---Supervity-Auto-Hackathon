# app/services/supervity.py
"""
Supervity Auto integration service.

Wraps the Supervity Auto platform API (https://auto.supervity.ai) so the rest
of the app never has to touch the Supervity API key directly. Handles auth
headers, org context, and the blocking/streaming workflow-execution split.

Setup:
    1. In Supervity Auto: Settings -> Developer Settings -> generate a
       Custom API Key.
    2. Copy your organization key (visible in the org switcher / URL).
    3. Set the following in your .env:
         SUPERVITY_API_KEY=...
         SUPERVITY_ORG_KEY=...
         SUPERVITY_BASE_URL=https://auto.supervity.ai   (default)

Usage:
    from app.services.supervity import supervity

    run = await supervity.execute_workflow(workflow_id, inputs={"employee_id": "123"})
    runs = await supervity.list_workflow_runs(workflow_id=workflow_id, status="running")
"""

import json
import logging
import os
from typing import Any, AsyncIterator, Optional

import httpx

log = logging.getLogger(__name__)

SUPERVITY_BASE_URL = os.getenv("SUPERVITY_BASE_URL", "https://auto.supervity.ai").rstrip("/")
SUPERVITY_API_KEY = os.getenv("SUPERVITY_API_KEY")
SUPERVITY_ORG_KEY = os.getenv("SUPERVITY_ORG_KEY")
# Your Orchestrator's workflow ID (from the Auto UI, or via GET /workflows).
# Set this so the Command Center never has to hardcode/pass it per-call.
SUPERVITY_ORCHESTRATOR_WORKFLOW_ID = os.getenv("SUPERVITY_ORCHESTRATOR_WORKFLOW_ID")


class SupervityConfigError(RuntimeError):
    """Raised when the service is used before it's configured."""


class SupervityAPIError(RuntimeError):
    """Raised when Supervity returns a non-2xx response."""

    def __init__(self, status_code: int, detail: Any):
        self.status_code = status_code
        self.detail = detail
        super().__init__(f"Supervity API error {status_code}: {detail}")


class SupervityClient:
    """Thin async wrapper around the Supervity Auto REST API."""

    def __init__(self) -> None:
        self._base_url = SUPERVITY_BASE_URL

    def _require_config(self) -> tuple[str, Optional[str]]:
        if not SUPERVITY_API_KEY:
            raise SupervityConfigError(
                "SUPERVITY_API_KEY must be set in the environment before "
                "calling the Supervity integration. Generate one at "
                "https://auto.supervity.ai/u/api-keys."
            )
        return SUPERVITY_API_KEY, SUPERVITY_ORG_KEY

    def _headers(self) -> dict[str, str]:
        api_key, org_key = self._require_config()
        headers: dict[str, str] = {
            # Supervity Custom/Workflow API keys authenticate via the same
            # Authorization: Bearer header as a user JWT — they are NOT sent
            # as X-API-Key. The x-source header is what tells the server
            # this is an external API key rather than a session token.
            "Authorization": f"Bearer {api_key}",
            "x-source": "external",
        }
        if org_key:
            # Optional, but recommended by Supervity's docs — only added
            # when set, since httpx rejects a literal None header value.
            headers["x-active-org"] = org_key
        return headers

    # ------------------------------------------------------------------
    # Workflows
    # ------------------------------------------------------------------

    async def list_workflows(
        self, *, page: int = 1, limit: int = 20, search: Optional[str] = None
    ) -> dict[str, Any]:
        params: dict[str, Any] = {"page": page, "limit": limit}
        if search:
            params["search"] = search
        async with httpx.AsyncClient(base_url=self._base_url, timeout=30) as client:
            resp = await client.get(
                "/api/v1/workflows", headers=self._headers(), params=params
            )
        return self._unwrap(resp)

    async def get_workflow(self, workflow_id: str) -> dict[str, Any]:
        async with httpx.AsyncClient(base_url=self._base_url, timeout=30) as client:
            resp = await client.get(
                f"/api/v1/workflows/{workflow_id}", headers=self._headers()
            )
        return self._unwrap(resp)

    async def check_orchestrator_connection(self) -> dict[str, Any]:
        """
        Real connection-health check for the Data Manager / a status badge —
        not a guess. Uses GET /workflows/{id} (a single-resource fetch)
        rather than the list endpoints, since those have proven unreliable
        with a Workflow API key; this is the same call proven to work when
        execute succeeded, minus actually running anything.
        """
        if not SUPERVITY_API_KEY:
            return {
                "configured": False,
                "connected": False,
                "detail": "SUPERVITY_API_KEY not set in .env",
            }
        if not SUPERVITY_ORCHESTRATOR_WORKFLOW_ID:
            return {
                "configured": False,
                "connected": False,
                "detail": "SUPERVITY_ORCHESTRATOR_WORKFLOW_ID not set in .env",
            }
        try:
            workflow = await self.get_workflow(SUPERVITY_ORCHESTRATOR_WORKFLOW_ID)
            return {
                "configured": True,
                "connected": True,
                "workflow_id": SUPERVITY_ORCHESTRATOR_WORKFLOW_ID,
                "workflow_name": workflow.get("name") or workflow.get("workflowName"),
                "raw": workflow,
            }
        except SupervityAPIError as exc:
            return {
                "configured": True,
                "connected": False,
                "workflow_id": SUPERVITY_ORCHESTRATOR_WORKFLOW_ID,
                "status_code": exc.status_code,
                "detail": exc.detail,
            }

    # ------------------------------------------------------------------
    # Workflow runs
    # ------------------------------------------------------------------

    async def execute_workflow(
        self,
        workflow_id: str,
        inputs: Optional[dict[str, Any]] = None,
        envs: Optional[dict[str, str]] = None,
        *,
        timeout: float = 120.0,
    ) -> dict[str, Any]:
        """
        Confirmed empirically (not just from docs): this endpoint does NOT
        block until the run finishes. Supervity queues the run and returns
        immediately with {"accepted": true, "message": "Execution started"}
        — no run_id in that response. To get the actual result, call
        list_workflow_runs(workflow_id=...) right after and take the most
        recent run, then poll get_workflow_run(run_id) until its status is
        terminal. Use stream_workflow() instead if you want live progress
        pushed to the UI rather than polling.
        """
        data: dict[str, Any] = {"workflowId": workflow_id}
        if inputs:
            data["inputs"] = inputs
        if envs:
            data["envs"] = envs

        async with httpx.AsyncClient(base_url=self._base_url, timeout=timeout) as client:
            resp = await client.post(
                "/api/v1/workflow-runs/execute",
                headers=self._headers(),
                files=self._as_multipart(data),
            )
        return self._unwrap(resp)

    async def stream_workflow(
        self,
        workflow_id: str,
        inputs: Optional[dict[str, Any]] = None,
        envs: Optional[dict[str, str]] = None,
    ) -> AsyncIterator[bytes]:
        """
        Executes a workflow and yields raw SSE bytes as they arrive, so a
        FastAPI route can forward them straight to the browser via
        StreamingResponse (media_type="text/event-stream").
        """
        data: dict[str, Any] = {"workflowId": workflow_id}
        if inputs:
            data["inputs"] = inputs
        if envs:
            data["envs"] = envs

        async with httpx.AsyncClient(base_url=self._base_url, timeout=None) as client:
            async with client.stream(
                "POST",
                "/api/v1/workflow-runs/execute/stream",
                headers=self._headers(),
                files=self._as_multipart(data),
            ) as resp:
                if resp.status_code >= 400:
                    body = await resp.aread()
                    raise SupervityAPIError(resp.status_code, body.decode(errors="replace"))
                async for chunk in resp.aiter_bytes():
                    yield chunk

    async def list_workflow_runs(
        self,
        *,
        workflow_id: Optional[str] = None,
        status: Optional[str] = None,
        page: int = 1,
        limit: int = 10,
        search: Optional[str] = None,
    ) -> dict[str, Any]:
        params: dict[str, Any] = {"page": page, "limit": limit}
        if workflow_id:
            params["workflowId"] = workflow_id
        if status:
            params["status"] = status
        if search:
            params["search"] = search
        async with httpx.AsyncClient(base_url=self._base_url, timeout=30) as client:
            resp = await client.get(
                "/api/v1/workflow-runs", headers=self._headers(), params=params
            )
        return self._unwrap(resp)

    async def get_workflow_run(self, run_id: str) -> dict[str, Any]:
        async with httpx.AsyncClient(base_url=self._base_url, timeout=30) as client:
            resp = await client.get(
                f"/api/v1/workflow-runs/{run_id}", headers=self._headers()
            )
        return self._unwrap(resp)

    async def get_dashboard_stats(self, workflow_id: str) -> dict[str, Any]:
        """Run-count breakdown by status — handy for feeding a KpiGrid card."""
        async with httpx.AsyncClient(base_url=self._base_url, timeout=30) as client:
            resp = await client.get(
                f"/api/v1/workflow-runs/dashboard/{workflow_id}", headers=self._headers()
            )
        return self._unwrap(resp)

    async def cancel_runs(
        self,
        *,
        run_ids: Optional[list[str]] = None,
        workflow_id: Optional[str] = None,
        reason: Optional[str] = None,
    ) -> dict[str, Any]:
        if not run_ids and not workflow_id:
            raise ValueError("Provide either run_ids or workflow_id to cancel_runs().")
        body: dict[str, Any] = {}
        if run_ids:
            body["runIds"] = run_ids
        if workflow_id:
            body["workflowId"] = workflow_id
        if reason:
            body["reason"] = reason
        async with httpx.AsyncClient(base_url=self._base_url, timeout=30) as client:
            resp = await client.post(
                "/api/v1/workflow-runs/cancel", headers=self._headers(), json=body
            )
        return self._unwrap(resp)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _as_multipart(data: dict[str, Any]) -> dict[str, tuple[None, str]]:
        """
        Supervity's execute endpoints require a true multipart/form-data
        body, not application/x-www-form-urlencoded. httpx only sends real
        multipart when given a `files=` mapping, so each field is wrapped
        as (filename=None, value) — a standard trick for form-field-only
        multipart requests. Non-string values are JSON-encoded first.
        """
        result: dict[str, tuple[None, str]] = {}
        for key, value in data.items():
            result[key] = (None, value if isinstance(value, str) else json.dumps(value))
        return result

    @staticmethod
    def _unwrap(resp: httpx.Response) -> dict[str, Any]:
        if resp.status_code == 429:
            log.warning("Supervity rate limit hit; retry-after=%s", resp.headers.get("Retry-After"))
        if resp.status_code >= 400:
            try:
                detail = resp.json()
            except ValueError:
                detail = resp.text
            raise SupervityAPIError(resp.status_code, detail)
        if resp.status_code == 204 or not resp.content:
            return {}
        return resp.json()


# Module-level singleton — import this, not the class.
supervity = SupervityClient()
