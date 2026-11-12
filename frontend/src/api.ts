import {
  CaseSummary,
  CaseDetail,
  SourceData,
  FieldItem,
  AuditEventItem,
  MetricsData,
} from './types';

const BASE_URL = (
  import.meta.env.VITE_API_URL !== undefined
    ? import.meta.env.VITE_API_URL
    : import.meta.env.DEV
      ? 'http://localhost:8000'
      : ''
).replace(/\/$/, '');

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorDetail = `HTTP ${response.status} ${response.statusText}`;
    try {
      const errData = await response.json();
      if (errData && errData.detail) {
        errorDetail = errData.detail;
      }
    } catch {
      // Ignore JSON parse errors for non-JSON error payloads
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  async getCases(): Promise<CaseSummary[]> {
    return request<CaseSummary[]>('/cases');
  },

  async getCase(id: string): Promise<CaseDetail> {
    return request<CaseDetail>(`/cases/${encodeURIComponent(id)}`);
  },

  async getCaseSource(id: string): Promise<SourceData> {
    return request<SourceData>(`/cases/${encodeURIComponent(id)}/source`);
  },

  async setFieldDecision(
    caseId: string,
    fieldId: string,
    decision: 'accepted' | 'edited' | 'rejected',
    overrideValue?: string,
    actor: string = 'analyst'
  ): Promise<FieldItem> {
    return request<FieldItem>(
      `/cases/${encodeURIComponent(caseId)}/fields/${encodeURIComponent(fieldId)}/decision`,
      {
        method: 'POST',
        body: JSON.stringify({
          decision,
          override_value: overrideValue,
          actor,
        }),
      }
    );
  },

  async openCitation(caseId: string, ref: string): Promise<{ status: string }> {
    return request<{ status: string }>(
      `/cases/${encodeURIComponent(caseId)}/citations/${encodeURIComponent(ref)}/open`,
      {
        method: 'POST',
      }
    );
  },

  async setRiskRating(
    caseId: string,
    riskRating: string,
    actor: string = 'mlro'
  ): Promise<{ status: string; risk_rating: string }> {
    return request<{ status: string; risk_rating: string }>(
      `/cases/${encodeURIComponent(caseId)}/risk-rating`,
      {
        method: 'PUT',
        body: JSON.stringify({
          risk_rating: riskRating,
          actor,
        }),
      }
    );
  },

  async signCase(
    caseId: string,
    signedBy: string = 'Sarah Jenkins, CAMS'
  ): Promise<{ status: string; case_id: string; risk_rating: string; staging_id: number }> {
    return request<{ status: string; case_id: string; risk_rating: string; staging_id: number }>(
      `/cases/${encodeURIComponent(caseId)}/sign`,
      {
        method: 'POST',
        body: JSON.stringify({
          signed_by: signedBy,
        }),
      }
    );
  },

  async getCaseAudit(caseId: string): Promise<AuditEventItem[]> {
    return request<AuditEventItem[]>(`/cases/${encodeURIComponent(caseId)}/audit`);
  },

  async getMetrics(): Promise<MetricsData> {
    return request<MetricsData>('/metrics');
  },

  async resetSeed(): Promise<{ status: string; cases_count: number }> {
    return request<{ status: string; cases_count: number }>('/dev/reset-seed', {
      method: 'POST',
    });
  },

  async uploadCase(formData: FormData): Promise<CaseDetail> {
    const url = `${BASE_URL}/cases`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData, // browser automatically sets multipart/form-data boundary
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || `Upload failed with status ${response.status}`);
    }
    return response.json();
  },
};
