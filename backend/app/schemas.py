from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, ConfigDict, Field as PydanticField


class CandidateField(BaseModel):
    name: str
    value: str
    quoted_span: str
    page: int
    line: int
    confidence: float = PydanticField(ge=0.0, le=1.0)


class FieldDecisionRequest(BaseModel):
    decision: str  # 'accepted', 'edited', 'rejected'
    override_value: Optional[str] = None
    actor: str = "analyst"


class RiskRatingRequest(BaseModel):
    risk_rating: str  # 'Low', 'Medium', 'High', 'Prohibited'
    actor: str = "mlro"


class CaseSignRequest(BaseModel):
    signed_by: str = "Sarah Jenkins, CAMS"


class FieldResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    case_id: str
    name: str
    ai_value: str
    confidence: float
    page: int
    line: int
    quoted_span: str
    decision: Optional[str] = None
    override_value: Optional[str] = None
    status: str
    is_exception: bool = False
    exception_reason: Optional[str] = None
    category: Optional[str] = None


class SourceLineResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    page_number: int
    line_number: int
    text: str


class SourceResponse(BaseModel):
    case_id: str
    document_name: str
    lines: List[SourceLineResponse]


class UboHoldingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: Optional[int] = None
    case_id: str
    holder_name: str
    holder_type: str
    target_name: str
    direct_percentage: float
    effective_percentage: Optional[float] = None
    layer: int
    citation: str
    notes: Optional[str] = None


class CaseSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    entity_name: str
    entity_type: str
    jurisdiction: str
    registration_number: str
    document_name: str
    page_count: int
    ocr_info: str
    status: str
    assigned_analyst: str
    risk_rating: Optional[str] = None
    sla_time: str
    primary_owner_summary: Optional[str] = None
    is_flagged: bool
    flag_reason: Optional[str] = None
    low_confidence_count: int = 0
    total_fields: int = 0
    reviewed_fields: int = 0


class CaseDetailResponse(CaseSummaryResponse):
    fields: List[FieldResponse] = []
    ubo_holdings: List[UboHoldingResponse] = []
    guardrail_status: str = "PASS"
    guardrail_reason: Optional[str] = None


class AuditEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    timestamp: datetime
    case_id: str
    actor: str
    action: str
    payload: Any


class MetricsResponse(BaseModel):
    minutes_per_file: float
    baseline_minutes: float = 180.0
    field_correction_rate: float  # (edited + rejected) / total
    citation_click_through: float  # share of edited/rejected where citation was opened
    total_cases: int
    signed_cases: int
    total_fields: int
    corrected_fields: int
    citations_opened: int


class CreateCaseRequest(BaseModel):
    entity_name: str
    entity_type: str
    jurisdiction: str
    registration_number: str
    document_name: str
    content: Optional[str] = None
