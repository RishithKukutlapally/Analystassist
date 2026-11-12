from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy.orm import Session

try:
    from app.models import Case, Field, SourceLine, UboHolding, SubmissionStaging
    from app.audit import write_audit_event
    from app.ubo import compute_effective_ubo, OwnershipLink
except ImportError:
    from backend.app.models import Case, Field, SourceLine, UboHolding, SubmissionStaging
    from backend.app.audit import write_audit_event
    from backend.app.ubo import compute_effective_ubo, OwnershipLink


def seed_database(session: Session, reset: bool = False):
    """
    Seeds the four synthetic cases if empty or if reset is requested.
    """
    if reset:
        # Note: AuditEvent is append-only so we only delete other tables for dev reset
        session.query(Field).delete()
        session.query(SourceLine).delete()
        session.query(UboHolding).delete()
        session.query(SubmissionStaging).delete()
        session.query(Case).delete()
        session.commit()
    else:
        existing_cases_count = session.query(Case).count()
        if existing_cases_count > 0:
            return  # Already seeded

    # ==========================================
    # Case 1: Apex Logistics Ltd (UK 04829104)
    # DoD: Case 1 has three fields at 96% or higher
    # ==========================================
    c1 = Case(
        id="CASE-2024-8841",
        entity_name="Apex Logistics Ltd",
        entity_type="UK Private Limited (04829104)",
        jurisdiction="GB",
        registration_number="04829104",
        document_name="Articles_of_Association_ApexLogistics_vFinal.pdf",
        page_count=50,
        ocr_info="OCR 300 DPI",
        status="ready",
        assigned_analyst="Sarah Jenkins, CAMS",
        risk_rating=None,  # Empty until MLRO sets it
        sla_time="01:45:12",
        primary_owner_summary="John Sterling (75.0% Voting & Shares • Direct)",
        is_flagged=False,
        flag_reason=None,
    )
    session.add(c1)

    c1_lines = [
        (1, 1, "NORTHGATE COMMERCIAL ONBOARDING ENCLAVE - VERIFIED REGISTRY DOCUMENT"),
        (1, 2, "COMPANIES ACT 2006 - PRIVATE COMPANY LIMITED BY SHARES"),
        (1, 3, "ARTICLES OF ASSOCIATION OF"),
        (1, 4, "Name of Company: Apex Logistics Ltd (Company No. 04829104)"),
        (1, 5, "Incorporated in England and Wales on 14 February 2012."),
        (2, 10, "3.1 The Company hereby registers and acknowledges the following beneficial interests:"),
        (2, 11, "3.2 Under Part 21A of the Companies Act 2006, notification is hereby recorded for"),
        (2, 12, "    registrable relevant legal entities and individual registrable persons."),
        (2, 13, ">>> Line 13: Name of Registrable Person: JOHN STERLING"),
        (2, 14, ">>> Line 14: Residential Address: 14 St. Dunstan’s Hill, London EC3R 8HL, United Kingdom"),
        (2, 15, ">>> Line 15: Nature of Control: Ownership of shares – 75% or more of voting rights"),
        (2, 16, ">>> Line 16: Effective Percentage Holding: 75.00% Ordinary Voting Capital directly held."),
        (2, 17, "3.3 Date on which person became a registrable person: 12 March 2019."),
        (2, 18, "3.4 No intermediary corporate holding entities or nominee agreements are registered."),
        (2, 19, "3.5 The register was duly verified and countersigned by the Corporate Secretary."),
        (4, 20, "SECTION 5: GOVERNANCE AND BOARD POWERS"),
        (4, 21, "5.1 Powers of Directors and Executive Officers"),
        (4, 22, ">>> Line 22: Managing Director Appointment: John Sterling is confirmed as Sole Managing Director with executive authority."),
        (4, 23, "5.2 Quorum for transaction of business shall be one director."),
    ]
    for p, l, text in c1_lines:
        session.add(SourceLine(case_id=c1.id, page_number=p, line_number=l, text=text))

    # 3 fields at 96% or higher: 98%, 97%, 96%
    f1_1 = Field(
        id=f"{c1.id}-f1",
        case_id=c1.id,
        name="Legal Entity Name",
        ai_value="Apex Logistics Ltd",
        confidence=0.98,
        page=1,
        line=4,
        quoted_span="Apex Logistics Ltd",
        decision="accepted",
        status="accepted",
        is_exception=False,
        category="Entity Identification",
    )
    f1_2 = Field(
        id=f"{c1.id}-f2",
        case_id=c1.id,
        name="Beneficial Owner & Holding",
        ai_value="John Sterling (75.00% Ordinary Voting Shares)",
        confidence=0.97,
        page=2,
        line=13,
        quoted_span="JOHN STERLING",
        decision="accepted",
        status="accepted",
        is_exception=False,
        category="Beneficial Ownership",
    )
    f1_3 = Field(
        id=f"{c1.id}-f3",
        case_id=c1.id,
        name="Director / Controller Identity",
        ai_value="John Sterling (Sole Managing Director)",
        confidence=0.96,
        page=4,
        line=22,
        quoted_span="John Sterling",
        decision=None,
        status="pending",
        is_exception=False,
        category="Control & Governance",
    )
    session.add_all([f1_1, f1_2, f1_3])

    u1 = UboHolding(
        case_id=c1.id,
        holder_name="John Sterling",
        holder_type="natural_person",
        target_name="Apex Logistics Ltd",
        direct_percentage=75.0,
        effective_percentage=75.0,
        layer=1,
        citation="Page 2, Line 13",
        notes="Ordinary Voting Capital directly held. Exceeds 25% statutory PSC threshold.",
    )
    session.add(u1)

    write_audit_event(
        session=session,
        case_id=c1.id,
        actor="ai",
        action="case_ingested",
        payload={"message": "Apex Logistics Ltd ingested with 3 statutory fields", "confidence_avg": 0.97},
    )

    # ==========================================
    # Case 2: Meridian Green LLP (UK OC391820)
    # DoD: Case 2 names Elena Vance as the controller
    # ==========================================
    c2 = Case(
        id="CASE-2024-8839",
        entity_name="Meridian Green LLP",
        entity_type="UK Limited Liability Partnership (OC391820)",
        jurisdiction="GB",
        registration_number="OC391820",
        document_name="Partnership_Deed_and_Capital_Contribution_Schedule.pdf",
        page_count=38,
        ocr_info="OCR 300 DPI",
        status="ready",
        assigned_analyst="Sarah Jenkins, CAMS",
        risk_rating=None,
        sla_time="02:10:00",
        primary_owner_summary="Elena Vance (50%), Marcus Thorne (50%) Equal Designated Members",
        is_flagged=False,
        flag_reason=None,
    )
    session.add(c2)

    c2_lines = [
        (1, 1, "LIMITED LIABILITY PARTNERSHIPS ACT 2000"),
        (1, 2, "PARTNERSHIP DEED OF MERIDIAN GREEN LLP"),
        (1, 3, "REGISTERED IN ENGLAND AND WALES OC391820"),
        (1, 4, "THIS DEED is made the 18th day of July 2020"),
        (1, 5, "Between the partners of Meridian Green LLP as named herein."),
        (3, 10, "SECTION 4: CAPITAL AND EQUITY CONTRIBUTIONS"),
        (3, 11, "4.1 The capital of the LLP shall be subscribed by the designated members:"),
        (3, 12, ">>> Line 12: Elena Vance: 50.0% capital contribution; Marcus Thorne: 50.0% capital contribution."),
        (3, 13, "4.2 Profits and losses shall be divided equally subject to executive distributions."),
        (6, 16, "SECTION 8: EXECUTIVE MANAGEMENT AND CONTROLLER APPOINTMENT"),
        (6, 17, "8.1 Designated Managing Member Clause:"),
        (6, 18, ">>> Line 18: Elena Vance is named as the Controller and Designated Managing Partner with sole operational control and casting vote."),
        (6, 19, "8.2 In the event of partner deadlock, Elena Vance's determination shall be final and binding."),
    ]
    for p, l, text in c2_lines:
        session.add(SourceLine(case_id=c2.id, page_number=p, line_number=l, text=text))

    f2_1 = Field(
        id=f"{c2.id}-f1",
        case_id=c2.id,
        name="Legal Entity Name",
        ai_value="Meridian Green LLP",
        confidence=0.98,
        page=1,
        line=5,
        quoted_span="Meridian Green LLP",
        decision="accepted",
        status="accepted",
        is_exception=False,
        category="Entity Identification",
    )
    f2_2 = Field(
        id=f"{c2.id}-f2",
        case_id=c2.id,
        name="Designated Members Capital Share",
        ai_value="Elena Vance (50%), Marcus Thorne (50%)",
        confidence=0.94,
        page=3,
        line=12,
        quoted_span="Elena Vance",
        decision="accepted",
        status="accepted",
        is_exception=False,
        category="Beneficial Ownership",
    )
    f2_3 = Field(
        id=f"{c2.id}-f3",
        case_id=c2.id,
        name="Corporate Controller / Managing Partner",
        ai_value="Elena Vance (Designated Controller & Managing Partner with sole operational control & casting vote)",
        confidence=0.96,
        page=6,
        line=18,
        quoted_span="Elena Vance is named as the Controller",
        decision=None,
        status="pending",
        is_exception=False,
        category="Control & Governance",
    )
    session.add_all([f2_1, f2_2, f2_3])

    u2_1 = UboHolding(
        case_id=c2.id,
        holder_name="Elena Vance",
        holder_type="natural_person",
        target_name="Meridian Green LLP",
        direct_percentage=50.0,
        effective_percentage=50.0,
        layer=1,
        citation="Page 3, Line 12",
        notes="Designated Managing Member with sole operational control and casting vote under Clause 8.2",
    )
    u2_2 = UboHolding(
        case_id=c2.id,
        holder_name="Marcus Thorne",
        holder_type="natural_person",
        target_name="Meridian Green LLP",
        direct_percentage=50.0,
        effective_percentage=50.0,
        layer=1,
        citation="Page 3, Line 12",
        notes="Equal Designated Member, minority operational control",
    )
    session.add_all([u2_1, u2_2])

    write_audit_event(
        session=session,
        case_id=c2.id,
        actor="ai",
        action="case_ingested",
        payload={"message": "Meridian Green LLP ingested. Elena Vance named as controller.", "controller": "Elena Vance"},
    )

    # ==========================================
    # Case 3: Veloce FinTech AG (Switzerland CHE-109.281.942)
    # DoD: Case 3 shows 70.0% effective holding
    # ==========================================
    c3 = Case(
        id="CASE-2024-8835",
        entity_name="Veloce FinTech AG",
        entity_type="Switzerland AG (CHE-109.281.942)",
        jurisdiction="CH",
        registration_number="CHE-109.281.942",
        document_name="Commercial_Register_Extract_and_Shareholder_List.pdf",
        page_count=44,
        ocr_info="Verified Registry API",
        status="signed",
        assigned_analyst="Sarah Jenkins, CAMS",
        risk_rating="Low",
        sla_time="00:00:00",
        primary_owner_summary="Henrik Lindqvist (Effective 70.0% via Lindqvist Holding SE)",
        is_flagged=False,
        flag_reason=None,
    )
    session.add(c3)

    c3_lines = [
        (1, 1, "HANDELSREGISTERAMT DES KANTONS ZURICH - BEGLAUBIGTER AUSZUG"),
        (1, 2, "AKTIENGESELLSCHAFT STATUTENDATUM: 04.11.2018"),
        (1, 3, "Firma: Veloce FinTech AG, CHE-109.281.942, Sitz: Zurich, Schweiz."),
        (1, 4, "Zweck: Entwicklung und Betrieb automatisierter Banktechnologieplattformen."),
        (8, 12, "LINDQVIST HOLDING SE - BOLAGSVERKET EXTRACT REGISTRATION #556912-3841"),
        (8, 13, "Aktiebolag med säte i Stockholm, Sverige."),
        (8, 14, ">>> Line 14: Henrik Lindqvist holds 100.0% direct ordinary equity and sole voting power of Lindqvist Holding SE."),
        (8, 15, "Swedish passport verified SE-9912048, Tax domicile Stockholm."),
        (12, 18, "VELOCE FINTECH AG - SHARE REGISTER & CAPITAL SCHEDULE"),
        (12, 19, "Total nominal capital: CHF 1,000,000 divided into 1,000,000 registered voting shares."),
        (12, 20, ">>> Line 20: Lindqvist Holding SE holds 70.0% registered voting stock (700,000 shares) in Veloce FinTech AG."),
        (12, 21, "Direct holding registered in official share ledger."),
    ]
    for p, l, text in c3_lines:
        session.add(SourceLine(case_id=c3.id, page_number=p, line_number=l, text=text))

    f3_1 = Field(
        id=f"{c3.id}-f1",
        case_id=c3.id,
        name="Legal Entity Name",
        ai_value="Veloce FinTech AG",
        confidence=0.99,
        page=1,
        line=3,
        quoted_span="Veloce FinTech AG",
        decision="accepted",
        status="accepted",
        is_exception=False,
        category="Entity Identification",
    )
    f3_2 = Field(
        id=f"{c3.id}-f2",
        case_id=c3.id,
        name="Tier-1 Intermediary Corporate Shareholder",
        ai_value="Lindqvist Holding SE (70.0% Registered Voting Stock)",
        confidence=0.95,
        page=12,
        line=20,
        quoted_span="Lindqvist Holding SE",
        decision="accepted",
        status="accepted",
        is_exception=False,
        category="Corporate Intermediary",
    )
    f3_3 = Field(
        id=f"{c3.id}-f3",
        case_id=c3.id,
        name="Ultimate Beneficial Owner Holding",
        ai_value="Henrik Lindqvist (100% of Lindqvist Holding SE × 70.0% of Veloce FinTech AG = 70.0% effective holding)",
        confidence=0.96,
        page=8,
        line=14,
        quoted_span="Henrik Lindqvist",
        decision="accepted",
        status="accepted",
        is_exception=False,
        category="Beneficial Ownership",
    )
    session.add_all([f3_1, f3_2, f3_3])

    u3_1 = UboHolding(
        case_id=c3.id,
        holder_name="Henrik Lindqvist",
        holder_type="natural_person",
        target_name="Lindqvist Holding SE",
        direct_percentage=100.0,
        effective_percentage=70.0,  # 100% * 70% = 70.0%
        layer=2,
        citation="Page 8, Line 14",
        notes="100.0% Direct Equity in Parent. Multiplied through chain: 100% × 70.0% = 70.0% effective holding.",
    )
    u3_2 = UboHolding(
        case_id=c3.id,
        holder_name="Lindqvist Holding SE",
        holder_type="corporate",
        target_name="Veloce FinTech AG",
        direct_percentage=70.0,
        effective_percentage=70.0,
        layer=1,
        citation="Page 12, Line 20",
        notes="70.0% Direct Equity in Target Entity.",
    )
    session.add_all([u3_1, u3_2])

    # Record sign-off staging and audit
    session.add(
        SubmissionStaging(
            case_id=c3.id,
            risk_rating="Low",
            signed_by="Sarah Jenkins, CAMS",
            signed_at=datetime.now(timezone.utc),
            payload="Synthetic sign-off completed for Veloce FinTech AG.",
        )
    )
    write_audit_event(
        session=session,
        case_id=c3.id,
        actor="ai",
        action="case_ingested",
        payload={"message": "Veloce FinTech AG ingested. UBO calculated at 70.0% effective holding."},
    )
    write_audit_event(
        session=session,
        case_id=c3.id,
        actor="mlro",
        action="case_signed",
        payload={"risk_rating": "Low", "effective_ubo": "Henrik Lindqvist (70.0%)"},
    )

    # ==========================================
    # Case 4: Nautilus Offshore BVI (IBC-782910)
    # DoD: Case 4 flags the nominee field at 54%
    # ==========================================
    c4 = Case(
        id="CASE-2024-8820",
        entity_name="Nautilus Offshore BVI",
        entity_type="BVI Business Company (IBC-782910)",
        jurisdiction="VG",
        registration_number="IBC-782910",
        document_name="Certificate_of_Incumbency_and_MA.pdf",
        page_count=62,
        ocr_info="Mismatch Detected",
        status="exception",
        assigned_analyst="Sarah Jenkins, CAMS",
        risk_rating=None,
        sla_time="00:32:15",
        primary_owner_summary="Flagged Nominee Director (Michael Sterling) • Bearer Trust Conflict",
        is_flagged=True,
        flag_reason="Nominee Director Michael Sterling: Low confidence (54.0%) below regulatory 70.0% threshold | Bearer Shares Conflict",
    )
    session.add(c4)

    c4_lines = [
        (1, 1, "BRITISH VIRGIN ISLANDS - BVI BUSINESS COMPANIES ACT 2004"),
        (1, 2, "CERTIFICATE OF INCUMBENCY AND STATUTORY REGISTER"),
        (1, 3, "Entity: Nautilus Offshore BVI, IBC-782910, Road Town, Tortola, British Virgin Islands."),
        (14, 7, "Line 07: ...in accordance with International Business Companies Act 1984..."),
        (14, 8, "Line 08: ...the capital shall be divided into 50,000 registered voting units..."),
        (14, 9, "Line 09: ...registered nominee director Michael Sterling holds powers of appointment under Nominee Agreement dated 14/01/2018..."),
        (14, 10, "Line 10: ...executed under corporate seal in Road Town, Tortola, British Virgin Islands."),
        (22, 16, "Line 16: ...special resolution passed by extraordinary general session..."),
        (22, 17, "Line 17: ...authorizing issuance of bearer equity without public record..."),
        (22, 18, "Line 18: ...voting capital is represented by 50,000 Bearer Share Certificates issued to bearer and deposited with unregistered offshore custodian..."),
        (22, 19, "Line 19: ...and physical title shall determine ultimate beneficial entitlement."),
    ]
    for p, l, text in c4_lines:
        session.add(SourceLine(case_id=c4.id, page_number=p, line_number=l, text=text))

    f4_1 = Field(
        id=f"{c4.id}-f1",
        case_id=c4.id,
        name="Legal Entity Name",
        ai_value="Nautilus Offshore BVI",
        confidence=0.95,
        page=1,
        line=3,
        quoted_span="Nautilus Offshore BVI",
        decision="accepted",
        status="accepted",
        is_exception=False,
        category="Entity Identification",
    )
    # DoD requirement: Case 4 flags the nominee field at 54%
    f4_2 = Field(
        id=f"{c4.id}-f2",
        case_id=c4.id,
        name="Nominee Director Appointment",
        ai_value="Michael Sterling (Nominee Director under 2018 Agreement)",
        confidence=0.54,  # Exactly 54%
        page=14,
        line=9,
        quoted_span="Michael Sterling",
        decision=None,
        status="pending",
        is_exception=True,
        exception_reason="Confidence 54% is below 70% threshold. Mass corporate secretary hit (840 entities) & nominee agreement detected.",
        category="Nominee / Risk",
    )
    f4_3 = Field(
        id=f"{c4.id}-f3",
        case_id=c4.id,
        name="Bearer Share Custody Clause",
        ai_value="50,000 Bearer Share Certificates issued to bearer and deposited with unregistered offshore custodian",
        confidence=0.62,
        page=22,
        line=18,
        quoted_span="50,000 Bearer Share Certificates",
        decision=None,
        status="pending",
        is_exception=True,
        exception_reason="Confidence 62% is below 70% threshold. Physical bearer warrants undisclosed in registry.",
        category="Beneficial Ownership Conflict",
    )
    session.add_all([f4_1, f4_2, f4_3])

    u4_1 = UboHolding(
        case_id=c4.id,
        holder_name="Michael Sterling",
        holder_type="nominee",
        target_name="Nautilus Offshore BVI",
        direct_percentage=0.0,
        effective_percentage=0.0,
        layer=1,
        citation="Page 14, Line 9",
        notes="0.00% Direct (Nominee Proxy). Mass corporate secretary hit.",
    )
    u4_2 = UboHolding(
        case_id=c4.id,
        holder_name="Trident Nominees Corp",
        holder_type="nominee",
        target_name="Nautilus Offshore Ltd",
        direct_percentage=100.0,
        effective_percentage=0.0,
        layer=2,
        citation="Page 14, Line 9",
        notes="Direct Holding in Nautilus: 100.0% Nominee",
    )
    u4_3 = UboHolding(
        case_id=c4.id,
        holder_name="Nautilus Offshore Ltd",
        holder_type="corporate",
        target_name="Nautilus Offshore BVI",
        direct_percentage=30.0,
        effective_percentage=0.0,
        layer=1,
        citation="Page 22, Line 18",
        notes="Holds 30.0% Equity. Non-cooperative jurisdiction, unverified bearer trust.",
    )
    session.add_all([u4_1, u4_2, u4_3])

    write_audit_event(
        session=session,
        case_id=c4.id,
        actor="ai",
        action="exception_flagged",
        payload={
            "field": "Nominee Director Appointment",
            "confidence": 0.54,
            "reason": "Nominee trap detected below 70% threshold.",
        },
    )

    session.commit()
