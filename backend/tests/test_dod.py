import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

try:
    from app.models import Base, Case, Field, UboHolding
    from app.seed import seed_database
except ImportError:
    from backend.app.models import Base, Case, Field, UboHolding
    from backend.app.seed import seed_database

TEST_DB_URL = "sqlite:///:memory:"
test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="module")
def seeded_session():
    Base.metadata.create_all(bind=test_engine)
    session = TestingSessionLocal()
    seed_database(session, reset=True)
    yield session
    session.close()
    Base.metadata.drop_all(bind=test_engine)


def test_dod_case_1_three_fields_at_96_percent_or_higher(seeded_session):
    """
    DoD 3: Case 1 has three fields at 96% or higher.
    """
    c1 = seeded_session.query(Case).filter(Case.id == "CASE-2024-8841").first()
    assert c1 is not None, "Case 1 (Apex Logistics Ltd) must exist"
    fields = seeded_session.query(Field).filter(Field.case_id == c1.id).all()
    assert len(fields) == 3, f"Expected 3 fields, found {len(fields)}"

    # All three fields must be >= 0.96 (96%)
    for f in fields:
        assert f.confidence >= 0.96, f"Field '{f.name}' confidence {f.confidence} is below 0.96 (96%)"


def test_dod_case_2_names_elena_vance_as_controller(seeded_session):
    """
    DoD 3: Case 2 names Elena Vance as the controller.
    """
    c2 = seeded_session.query(Case).filter(Case.id == "CASE-2024-8839").first()
    assert c2 is not None, "Case 2 (Meridian Green LLP) must exist"
    fields = seeded_session.query(Field).filter(Field.case_id == c2.id).all()

    # Check field that names Elena Vance as the controller
    controller_field = next(
        (f for f in fields if "Elena Vance" in f.ai_value and ("controller" in f.name.lower() or "controller" in f.ai_value.lower())),
        None,
    )
    assert controller_field is not None, "Case 2 must have a field naming Elena Vance as the controller"

    # Also check UBO holding notes / description
    elena_ubo = (
        seeded_session.query(UboHolding)
        .filter(UboHolding.case_id == c2.id, UboHolding.holder_name == "Elena Vance")
        .first()
    )
    assert elena_ubo is not None
    assert "control" in (elena_ubo.notes or "").lower() or "managing" in (elena_ubo.notes or "").lower()


def test_dod_case_3_shows_70_percent_effective_holding(seeded_session):
    """
    DoD 3: Case 3 shows 70.0% effective holding.
    """
    c3 = seeded_session.query(Case).filter(Case.id == "CASE-2024-8835").first()
    assert c3 is not None, "Case 3 (Veloce FinTech AG) must exist"

    # Natural person Henrik Lindqvist
    lindqvist_ubo = (
        seeded_session.query(UboHolding)
        .filter(UboHolding.case_id == c3.id, UboHolding.holder_name == "Henrik Lindqvist")
        .first()
    )
    assert lindqvist_ubo is not None, "Henrik Lindqvist UBO record must exist in Case 3"
    assert lindqvist_ubo.effective_percentage == 70.0, (
        f"Expected 70.0% effective holding, got {lindqvist_ubo.effective_percentage}%"
    )

    # Check field AI value references 70.0% effective holding
    fields = seeded_session.query(Field).filter(Field.case_id == c3.id).all()
    assert any("70.0%" in f.ai_value for f in fields)


def test_dod_case_4_flags_nominee_field_at_54_percent(seeded_session):
    """
    DoD 3: Case 4 flags the nominee field at 54%.
    """
    c4 = seeded_session.query(Case).filter(Case.id == "CASE-2024-8820").first()
    assert c4 is not None, "Case 4 (Nautilus Offshore BVI) must exist"
    assert c4.is_flagged is True, "Case 4 must be flagged as an exception"

    fields = seeded_session.query(Field).filter(Field.case_id == c4.id).all()
    nominee_field = next(
        (f for f in fields if "nominee" in f.name.lower() or "nominee" in f.ai_value.lower()),
        None,
    )
    assert nominee_field is not None, "Case 4 must have a nominee field"
    assert round(nominee_field.confidence, 2) == 0.54, (
        f"Expected nominee confidence 0.54 (54%), got {nominee_field.confidence}"
    )
    assert nominee_field.is_exception is True, "Nominee field must be flagged as an exception"
