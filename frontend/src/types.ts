export interface CaseSummary {
  id: string;
  entity_name: string;
  entity_type: string;
  jurisdiction: string;
  registration_number: string;
  document_name: string;
  page_count: number;
  ocr_info: string;
  status: 'ready' | 'signed' | 'exception' | string;
  assigned_analyst: string;
  risk_rating?: string | null;
  sla_time: string;
  primary_owner_summary?: string | null;
  is_flagged: boolean;
  flag_reason?: string | null;
  low_confidence_count: number;
  total_fields: number;
  reviewed_fields: number;
}

export interface FieldItem {
  id: string;
  case_id: string;
  name: string;
  ai_value: string;
  confidence: number;
  page: number;
  line: number;
  quoted_span: string;
  decision?: 'accepted' | 'edited' | 'rejected' | null;
  override_value?: string | null;
  status: 'pending' | 'accepted' | 'edited' | 'rejected' | string;
  is_exception: boolean;
  exception_reason?: string | null;
  category?: string | null;
}

export interface SourceLine {
  page_number: number;
  line_number: number;
  text: string;
}

export interface SourceData {
  case_id: string;
  document_name: string;
  lines: SourceLine[];
}

export interface UboHolding {
  id?: number;
  case_id: string;
  holder_name: string;
  holder_type: 'natural_person' | 'corporate' | 'nominee' | string;
  target_name: string;
  direct_percentage: number;
  effective_percentage?: number | null;
  layer: number;
  citation: string;
  notes?: string | null;
}

export interface CaseDetail extends CaseSummary {
  fields: FieldItem[];
  ubo_holdings: UboHolding[];
  guardrail_status: 'PASS' | 'FAIL' | string;
  guardrail_reason?: string | null;
}

export interface AuditEventItem {
  id: number;
  timestamp: string;
  case_id: string;
  actor: 'ai' | 'analyst' | 'mlro' | string;
  action: string;
  payload: any;
}

export interface MetricsData {
  minutes_per_file: number;
  baseline_minutes: number;
  field_correction_rate: number;
  citation_click_through: number;
  total_cases: number;
  signed_cases: number;
  total_fields: number;
  corrected_fields: number;
  citations_opened: number;
}
