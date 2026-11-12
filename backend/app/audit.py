import json
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from sqlalchemy import event
from sqlalchemy.orm import Session

try:
    from app.models import AuditEvent
except ImportError:
    from backend.app.models import AuditEvent


class AppendOnlyAuditViolation(Exception):
    """Raised when an attempt is made to update or delete an immutable audit event."""
    pass


@event.listens_for(AuditEvent, "before_update")
def receive_before_update(mapper, connection, target):
    raise AppendOnlyAuditViolation("Audit log is append-only. Updates are strictly prohibited.")


@event.listens_for(AuditEvent, "before_delete")
def receive_before_delete(mapper, connection, target):
    raise AppendOnlyAuditViolation("Audit log is append-only. Deletes are strictly prohibited.")


def write_audit_event(
    session: Session,
    case_id: str,
    actor: str,
    action: str,
    payload: Any,
) -> AuditEvent:
    """
    Appends an audit event to the append-only log.
    Actor must be 'ai', 'analyst', or 'mlro'.
    """
    payload_str = json.dumps(payload) if not isinstance(payload, str) else payload
    event_entry = AuditEvent(
        timestamp=datetime.now(timezone.utc),
        case_id=case_id,
        actor=actor,
        action=action,
        payload=payload_str,
    )
    session.add(event_entry)
    session.flush()
    return event_entry


def log_llm_call(
    session: Session,
    case_id: str,
    model_name: str,
    prompt_hash: str,
    latency_ms: int,
    is_mock: bool,
    candidate_count: int,
    fallback_reason: Optional[str] = None,
) -> AuditEvent:
    """
    Logs each Gemini call with model name, prompt hash, and latency.
    """
    payload = {
        "model_name": model_name,
        "prompt_hash": prompt_hash,
        "latency_ms": latency_ms,
        "is_mock": is_mock,
        "candidate_count": candidate_count,
        "fallback_reason": fallback_reason,
    }
    return write_audit_event(
        session=session,
        case_id=case_id,
        actor="ai",
        action="llm_scan_executed",
        payload=payload,
    )
