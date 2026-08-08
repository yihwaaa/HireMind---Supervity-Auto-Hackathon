# app/models/supervity_run.py
"""
Persists every attempt to trigger the Supervity Auto Orchestrator, plus its
eventual outcome once known. This is what 6.5 in the Round 2 guide asks for
("Runs, decisions, policy evaluations, and exceptions should be written to
the database so the dashboard, the audit trail, and the Insights layer have
real history to work with") — right now, calling execute_workflow() doesn't
persist anything, so a page refresh loses it.

`outputs` is intentionally a flexible JSON blob rather than typed columns,
because at model-design time the exact shape your Operators return wasn't
known yet. Once real output samples are available, add typed columns or a
view on top of this table for whichever fields the Dashboard/Insights need
most often (e.g. risk_score, employee_id) — this table stays the raw record.
"""
from sqlalchemy import Column, DateTime, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func

from ..core.database import Base


class SupervityRun(Base):
    __tablename__ = "supervity_runs"

    id = Column(Integer, primary_key=True, index=True)

    # Which workflow, and what we sent it
    workflow_id = Column(String(255), nullable=False, index=True)
    workflow_name = Column(String(255), nullable=True)
    inputs = Column(JSONB, nullable=True)

    # What Supervity told us back
    # 'triggered' -> we called execute and got {"accepted": true}
    # 'completed' / 'failed' -> filled in later, once outcome is known
    # (via polling, a webhook, or manual reconciliation with the Auto UI)
    status = Column(String(50), nullable=False, default="triggered", index=True)
    supervity_run_id = Column(String(255), nullable=True, index=True)
    outputs = Column(JSONB, nullable=True)
    error_message = Column(Text, nullable=True)

    # Who/what triggered this from the Command Center side
    triggered_by = Column(String(255), nullable=True)
    trigger_source = Column(String(100), nullable=True)  # e.g. "dashboard", "workbench", "ai_manager"

    triggered_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
