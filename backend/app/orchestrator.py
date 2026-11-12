from decimal import Decimal
from typing import List, Tuple, Dict, Any, Optional
from sqlalchemy.orm import Session
import uuid

try:
    from app.models import Case, Field, SourceLine, UboHolding
    from app.schemas import CandidateField
    from app.llm import LLMAdapter, get_llm_adapter
    from app.guardrail import check_guardrails
    from app.ubo import compute_effective_ubo, OwnershipLink
    from app.audit import write_audit_event, log_llm_call
except ImportError:
    from backend.app.models import Case, Field, SourceLine, UboHolding
    from backend.app.schemas import CandidateField
    from backend.app.llm import LLMAdapter, get_llm_adapter
    from backend.app.guardrail import check_guardrails
    from backend.app.ubo import compute_effective_ubo, OwnershipLink
    from backend.app.audit import write_audit_event, log_llm_call


class OrchestratorResult:
    def __init__(
        self,
        case: Case,
        verified_fields: List[Field],
        dropped_candidates: List[CandidateField],
        guardrail_passed: bool,
        guardrail_reason: Optional[str] = None,
    ):
        self.case = case
        self.verified_fields = verified_fields
        self.dropped_candidates = dropped_candidates
        self.guardrail_passed = guardrail_passed
        self.guardrail_reason = guardrail_reason


def process_case_pipeline(
    session: Session,
    case: Case,
    lines_data: List[Tuple[int, int, str]],
    llm_adapter: Optional[LLMAdapter] = None,
) -> OrchestratorResult:
    """
    Executes the deterministic orchestration pipeline:
    1. Citation scanner (LLM via adapter or mock)
    2. Deterministic verbatim verification (drop & log non-verbatim citations)
    3. Guardrail hard stop check
    4. Exception routing (confidence < 0.70 or conflict)
    5. Deterministic UBO arithmetic (Decimal arithmetic, no LLM)
    """
    if llm_adapter is None:
        llm_adapter = get_llm_adapter()

    # Build lines map: (page, line) -> text
    lines_map: Dict[Tuple[int, int], str] = {
        (p, l): text for p, l, text in lines_data
    }

    # 1. Run Citation Scanner
    context_str = f"Entity: {case.entity_name}, Jurisdiction: {case.jurisdiction}"
    candidates, metadata = llm_adapter.scan_citations(lines_data, case_context=context_str)

    # Log LLM scan in audit
    log_llm_call(
        session=session,
        case_id=case.id,
        model_name=metadata.get("model_name", "unknown"),
        prompt_hash=metadata.get("prompt_hash", "none"),
        latency_ms=metadata.get("latency_ms", 0),
        is_mock=metadata.get("is_mock", True),
        candidate_count=len(candidates),
        fallback_reason=metadata.get("fallback_reason"),
    )

    # 2. Verify verbatim citations
    verified_candidates: List[CandidateField] = []
    dropped_candidates: List[CandidateField] = []

    for candidate in candidates:
        stored_text = lines_map.get((candidate.page, candidate.line))
        # Verbatim check: quoted_span must appear verbatim at the cited page and line
        if stored_text is not None and candidate.quoted_span.strip() and candidate.quoted_span in stored_text:
            verified_candidates.append(candidate)
        else:
            dropped_candidates.append(candidate)
            write_audit_event(
                session=session,
                case_id=case.id,
                actor="ai",
                action="citation_verification_failed",
                payload={
                    "field_name": candidate.name,
                    "quoted_span": candidate.quoted_span,
                    "page": candidate.page,
                    "line": candidate.line,
                    "stored_text": stored_text,
                    "reason": "Quoted span does not appear verbatim at the cited page and line",
                },
            )

    # 3. Guardrail check before analyst view
    candidate_dicts = [
        {"name": c.name, "value": c.value, "quoted_span": c.quoted_span}
        for c in verified_candidates
    ]
    guardrail_res = check_guardrails(candidate_dicts)

    if not guardrail_res.passed:
        write_audit_event(
            session=session,
            case_id=case.id,
            actor="ai",
            action="guardrail_blocked",
            payload={"reason": guardrail_res.reason},
        )
        case.status = "exception"
        case.is_flagged = True
        case.flag_reason = guardrail_res.reason
        session.commit()
        return OrchestratorResult(
            case=case,
            verified_fields=[],
            dropped_candidates=dropped_candidates,
            guardrail_passed=False,
            guardrail_reason=guardrail_res.reason,
        )

    # 4. Route fields & create Field records
    created_fields: List[Field] = []
    has_exception = False
    flag_reasons = []

    for idx, cand in enumerate(verified_candidates, start=1):
        field_id = f"{case.id}-f{idx}"
        is_exc = False
        exc_reason = None

        # Route to exception queue if confidence < 0.70
        if cand.confidence < 0.70:
            is_exc = True
            exc_reason = f"Low confidence ({cand.confidence * 100:.1f}%) below regulatory 70.0% threshold"
            has_exception = True
            flag_reasons.append(f"{cand.name}: {exc_reason}")

        # Check category
        category = "General"
        if "owner" in cand.name.lower() or "share" in cand.name.lower() or "holding" in cand.name.lower():
            category = "Beneficial Ownership"
        elif "director" in cand.name.lower() or "controller" in cand.name.lower() or "member" in cand.name.lower():
            category = "Control & Governance"
        elif "nominee" in cand.name.lower():
            category = "Nominee / Risk"

        field_rec = Field(
            id=field_id,
            case_id=case.id,
            name=cand.name,
            ai_value=cand.value,
            confidence=cand.confidence,
            page=cand.page,
            line=cand.line,
            quoted_span=cand.quoted_span,
            decision=None,
            override_value=None,
            status="pending",
            is_exception=is_exc,
            exception_reason=exc_reason,
            category=category,
        )
        session.add(field_rec)
        created_fields.append(field_rec)

    if has_exception:
        case.status = "exception"
        case.is_flagged = True
        case.flag_reason = " | ".join(flag_reasons)
    else:
        case.status = "ready"
        case.is_flagged = False
        case.flag_reason = None

    # 5. UBO math if holding links exist
    ubo_links = session.query(UboHolding).filter(UboHolding.case_id == case.id).all()
    if ubo_links:
        # Convert to OwnershipLink models
        calc_links = [
            OwnershipLink(
                holder=link.holder_name,
                holder_type=link.holder_type,
                target=link.target_name,
                percentage=Decimal(str(link.direct_percentage)),
                citation=link.citation,
                notes=link.notes,
            )
            for link in ubo_links
        ]
        results = compute_effective_ubo(calc_links, target_entity=case.entity_name)
        # Update effective_percentage on corresponding natural person records
        for res in results:
            for link in ubo_links:
                if link.holder_name.lower().strip() == res.natural_person.lower().strip():
                    link.effective_percentage = res.effective_percentage
                    write_audit_event(
                        session=session,
                        case_id=case.id,
                        actor="ai",
                        action="ubo_calculated",
                        payload={
                            "natural_person": res.natural_person,
                            "effective_percentage": res.effective_percentage,
                            "formula": res.formula,
                        },
                    )

    session.commit()

    return OrchestratorResult(
        case=case,
        verified_fields=created_fields,
        dropped_candidates=dropped_candidates,
        guardrail_passed=True,
        guardrail_reason=None,
    )
