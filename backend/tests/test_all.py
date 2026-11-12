import pytest
from decimal import Decimal
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

try:
    from app.models import Base, Case, Field, SourceLine, AuditEvent, SubmissionStaging, UboHolding
    from app.main import set_field_decision, set_risk_rating, sign_case
    from app.schemas import CandidateField, FieldDecisionRequest, RiskRatingRequest, CaseSignRequest
    from app.ubo import compute_effective_ubo, calculate_simple_effective_percentage, OwnershipLink
    from app.guardrail import check_guardrails
    from app.audit import AppendOnlyAuditViolation, write_audit_event
    from app.llm import GeminiLLMAdapter, MockLLMAdapter
    from app.orchestrator import process_case_pipeline
except ImportError:
    from backend.app.models import Base, Case, Field, SourceLine, AuditEvent, SubmissionStaging, UboHolding
    from backend.app.main import set_field_decision, set_risk_rating, sign_case
    from backend.app.schemas import CandidateField, FieldDecisionRequest, RiskRatingRequest, CaseSignRequest
    from backend.app.ubo import compute_effective_ubo, calculate_simple_effective_percentage, OwnershipLink
    from backend.app.guardrail import check_guardrails
    from backend.app.audit import AppendOnlyAuditViolation, write_audit_event
    from backend.app.llm import GeminiLLMAdapter, MockLLMAdapter
    from backend.app.orchestrator import process_case_pipeline

# In-memory SQLite for testing
TEST_DB_URL = "sqlite:///:memory:"
test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=test_engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=test_engine)


# =========================================================================
# 1. Citation verbatim check
# =========================================================================
def test_citation_verbatim_check(db_session):
    case = Case(
        id="CASE-TEST-01",
        entity_name="Test Ingest Entity Ltd",
        entity_type="UK Private Limited",
        jurisdiction="GB",
        registration_number="12345678",
        document_name="test_doc.pdf",
        page_count=2,
        ocr_info="OCR 300 DPI",
        status="ready",
        assigned_analyst="Test Analyst",
    )
    db_session.add(case)
    db_session.commit()

    lines_data = [
        (1, 1, "NORTHGATE COMMERCIAL BANK REGISTER"),
        (1, 2, "Entity: Test Ingest Entity Ltd is registered at Companies House."),
        (2, 5, "Beneficial Owner: Jane Doe holding 80.0% Ordinary Voting Shares."),
    ]
    for p, l, text in lines_data:
        db_session.add(SourceLine(case_id=case.id, page_number=p, line_number=l, text=text))
    db_session.commit()

    class CustomTestAdapter:
        def scan_citations(self, lines, case_context=None):
            return [
                CandidateField(
                    name="Legal Entity Name",
                    value="Test Ingest Entity Ltd",
                    quoted_span="Test Ingest Entity Ltd",  # Exists verbatim at (1, 2)
                    page=1,
                    line=2,
                    confidence=0.98,
                ),
                CandidateField(
                    name="Hallucinated Owner",
                    value="Fake Owner Inc",
                    quoted_span="Fake Owner Inc",  # Does NOT exist verbatim
                    page=2,
                    line=5,
                    confidence=0.95,
                ),
                CandidateField(
                    name="Wrong Line Owner",
                    value="Jane Doe",
                    quoted_span="Jane Doe",  # Exists at line 5, but cited at line 1
                    page=2,
                    line=1,
                    confidence=0.90,
                ),
            ], {"model_name": "test-adapter", "prompt_hash": "abc", "latency_ms": 10, "is_mock": True}

    res = process_case_pipeline(session=db_session, case=case, lines_data=lines_data, llm_adapter=CustomTestAdapter())

    # Only the first candidate has verbatim presence at cited page and line
    assert len(res.verified_fields) == 1
    assert res.verified_fields[0].name == "Legal Entity Name"
    assert len(res.dropped_candidates) == 2

    # Verify dropped candidates were logged in append-only audit
    drop_events = (
        db_session.query(AuditEvent)
        .filter(AuditEvent.case_id == case.id, AuditEvent.action == "citation_verification_failed")
        .all()
    )
    assert len(drop_events) == 2


# =========================================================================
# 2. UBO effective percentage (100% × 70% = 70%)
# =========================================================================
def test_ubo_effective_percentage():
    # Simple chain multiplication test using Decimal
    chain = [Decimal("100.0"), Decimal("70.0")]
    calc = calculate_simple_effective_percentage(chain)
    assert calc == Decimal("70.00")

    # Full graph traversal test
    links = [
        OwnershipLink(
            holder="Henrik Lindqvist",
            holder_type="natural_person",
            target="Lindqvist Holding SE",
            percentage=Decimal("100.0"),
            citation="Page 8, Line 14",
        ),
        OwnershipLink(
            holder="Lindqvist Holding SE",
            holder_type="corporate",
            target="Veloce FinTech AG",
            percentage=Decimal("70.0"),
            citation="Page 12, Line 20",
        ),
    ]

    results = compute_effective_ubo(links, target_entity="Veloce FinTech AG")
    assert len(results) == 1
    res = results[0]
    assert res.natural_person == "Henrik Lindqvist"
    assert res.target_entity == "Veloce FinTech AG"
    assert res.effective_percentage == 70.0
    assert "100% × 70% = 70.0%" in res.formula or "100" in res.formula and "70" in res.formula


# =========================================================================
# 3. Guardrail blocks a risk rating
# =========================================================================
def test_guardrail_blocks_risk_rating():
    # Attempt 1: Output contains risk_rating field name
    res1 = check_guardrails([{"name": "risk_rating", "value": "Low", "quoted_span": "none"}])
    assert res1.passed is False
    assert "risk_rating" in res1.reason

    # Attempt 2: Text contains "high risk"
    res2 = check_guardrails([{"name": "Status", "value": "The client is high risk", "quoted_span": "high risk"}])
    assert res2.passed is False
    assert "high risk" in res2.reason

    # Attempt 3: Text contains "approved"
    res3 = check_guardrails([{"name": "Verdict", "value": "Entity is approved", "quoted_span": "approved"}])
    assert res3.passed is False
    assert "approved" in res3.reason

    # Attempt 4: Text contains "suspicious"
    res4 = check_guardrails([{"name": "Note", "value": "Suspicious activity detected", "quoted_span": "Suspicious"}])
    assert res4.passed is False
    assert "suspicious" in res4.reason

    # Attempt 5: Text contains "clearance"
    res5 = check_guardrails([{"name": "AML Note", "value": "Compliance clearance issued", "quoted_span": "clearance"}])
    assert res5.passed is False
    assert "clearance" in res5.reason

    # Attempt 6: Risk context classification ("risk tier: medium")
    res6 = check_guardrails([{"name": "Assessment", "value": "Assigned risk tier: medium", "quoted_span": "medium"}])
    assert res6.passed is False

    # Attempt 7: Valid compliance field without forbidden terms
    res7 = check_guardrails([
        {"name": "Legal Entity Name", "value": "Apex Logistics Ltd", "quoted_span": "Apex Logistics Ltd"},
        {"name": "Shareholder", "value": "John Sterling", "quoted_span": "John Sterling"},
    ])
    assert res7.passed is True
    assert res7.reason is None


# =========================================================================
# 4. Sign-off blocked without all decisions and a rating
# =========================================================================
def test_sign_off_blocked_without_all_decisions_and_rating(db_session):
    c = Case(
        id="CASE-SIGNOFF-TEST",
        entity_name="Signoff Test Entity",
        entity_type="UK Limited",
        jurisdiction="GB",
        registration_number="99887766",
        document_name="test_doc.pdf",
        page_count=5,
        ocr_info="OCR 300 DPI",
        status="ready",
        assigned_analyst="Sarah Jenkins, CAMS",
        risk_rating=None,  # Not set yet
    )
    db_session.add(c)

    f1 = Field(
        id="f-sign-1",
        case_id=c.id,
        name="Field 1",
        ai_value="Val 1",
        confidence=0.95,
        page=1,
        line=1,
        quoted_span="Val 1",
        decision="accepted",
        status="accepted",
    )
    f2 = Field(
        id="f-sign-2",
        case_id=c.id,
        name="Field 2",
        ai_value="Val 2",
        confidence=0.92,
        page=1,
        line=2,
        quoted_span="Val 2",
        decision=None,  # PENDING!
        status="pending",
    )
    db_session.add_all([f1, f2])
    db_session.commit()

    # Step A: Try to sign while f2 is pending decision -> Must raise HTTPException 400
    with pytest.raises(HTTPException) as exc1:
        sign_case(c.id, CaseSignRequest(signed_by="Sarah Jenkins, CAMS"), db_session)
    assert exc1.value.status_code == 400
    assert "All fields require explicit analyst decisions" in exc1.value.detail

    # Step B: Analyst decides on f2
    dec_res = set_field_decision(
        c.id,
        f2.id,
        FieldDecisionRequest(decision="accepted", actor="analyst"),
        db_session,
    )
    assert dec_res.status == "accepted"

    # Step C: Try to sign without MLRO risk rating -> Must raise HTTPException 400
    with pytest.raises(HTTPException) as exc2:
        sign_case(c.id, CaseSignRequest(signed_by="Sarah Jenkins, CAMS"), db_session)
    assert exc2.value.status_code == 400
    assert "MLRO risk rating must be classified" in exc2.value.detail

    # Step D: MLRO sets risk rating
    risk_res = set_risk_rating(
        c.id,
        RiskRatingRequest(risk_rating="Medium", actor="mlro"),
        db_session,
    )
    assert risk_res["risk_rating"] == "Medium"

    # Step E: Now sign-off must succeed (200) and write to submission_staging
    sign_res = sign_case(c.id, CaseSignRequest(signed_by="Sarah Jenkins, CAMS"), db_session)
    assert sign_res["status"] == "signed"
    assert sign_res["risk_rating"] == "Medium"

    # Verify database state
    staging_rows = db_session.query(SubmissionStaging).filter(SubmissionStaging.case_id == c.id).all()
    assert len(staging_rows) == 1
    assert staging_rows[0].risk_rating == "Medium"


# =========================================================================
# 5. Audit log rejects update and delete
# =========================================================================
def test_audit_log_rejects_update_and_delete(db_session):
    ev = write_audit_event(
        session=db_session,
        case_id="CASE-AUDIT-TEST",
        actor="analyst",
        action="initial_action",
        payload={"message": "Created for immutability test"},
    )
    db_session.commit()

    # Verify record was stored
    saved_ev = db_session.query(AuditEvent).filter(AuditEvent.id == ev.id).first()
    assert saved_ev is not None

    # Test Update Rejection: Attempting update must raise AppendOnlyAuditViolation
    with pytest.raises(AppendOnlyAuditViolation):
        saved_ev.actor = "hacker"
        db_session.commit()

    db_session.rollback()

    # Test Delete Rejection: Attempting delete must raise AppendOnlyAuditViolation
    with pytest.raises(AppendOnlyAuditViolation):
        db_session.delete(saved_ev)
        db_session.commit()

    db_session.rollback()


# =========================================================================
# 6. Gemini failure falls back to mock
# =========================================================================
def test_gemini_failure_falls_back_to_mock():
    # Pass an invalid API key to trigger failure
    adapter = GeminiLLMAdapter(api_key="invalid_dummy_key_12345", model="gemini-2.5-flash")

    lines_data = [
        (1, 4, "Name of Company: Apex Logistics Ltd (Company No. 04829104)"),
        (2, 13, ">>> Line 13: Name of Registrable Person: JOHN STERLING"),
    ]

    candidates, metadata = adapter.scan_citations(lines_data, case_context="Apex Logistics Ltd")

    # Must fall back gracefully to mock
    assert metadata["is_mock"] is True
    assert "fallback_reason" in metadata
    assert len(candidates) > 0
    # Returned candidate fields from mock adapter
    assert any("Apex Logistics" in c.value for c in candidates)


# =========================================================================
# 7. Health Check and SPA Routing Tests
# =========================================================================
def test_health_check_endpoint():
    try:
        from app.main import health_check
    except ImportError:
        from backend.app.main import health_check

    res = health_check()
    assert res == {"status": "healthy"}


def test_spa_routing_rules():
    try:
        from app.main import serve_spa
    except ImportError:
        from backend.app.main import serve_spa

    # api/ prefixed unknown routes must raise 404
    with pytest.raises(HTTPException) as exc_info:
        coro = serve_spa("api/unknown_endpoint")
        coro.send(None)
    assert exc_info.value.status_code == 404

    # SPA fallback returns FileResponse for index.html
    coro2 = serve_spa("")
    with pytest.raises(StopIteration) as ret_info:
        coro2.send(None)
    assert ret_info.value.value is not None

