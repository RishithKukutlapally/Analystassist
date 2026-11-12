import React, { useState } from 'react';
import { CaseSummary } from '../types';

interface CaseQueueScreenProps {
  cases: CaseSummary[];
  loading: boolean;
  error: string | null;
  onSelectCase: (caseId: string, targetScreen?: string) => void;
  onRefresh: () => void;
}

export const CaseQueueScreen: React.FC<CaseQueueScreenProps> = ({
  cases,
  loading,
  error,
  onSelectCase,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ready' | 'exception' | 'signed'>('all');
  const [previewState, setPreviewState] = useState<'live' | 'empty' | 'loading' | 'error'>('live');

  // Filter cases
  const filteredCases = cases.filter((c) => {
    const matchesSearch =
      c.entity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.jurisdiction.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openCasesCount = cases.filter((c) => c.status !== 'signed').length;
  const readyCasesCount = cases.filter((c) => c.status === 'ready').length;
  const exceptionCasesCount = cases.filter((c) => c.status === 'exception').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* State Selector Tabs from Stitch Design */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--primary)', marginBottom: '4px' }}>
            Corporate eKYC Intake & Review Queue
          </h1>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: '13px' }}>
            Dual-engine citation verified entity cases awaiting human analyst determination.
          </p>
        </div>
        <div className="state-tabs-bar" style={{ marginBottom: 0 }}>
          <button
            className={`state-tab-btn ${previewState === 'live' ? 'active' : ''}`}
            onClick={() => setPreviewState('live')}
          >
            Live Feed
          </button>
          <button
            className={`state-tab-btn ${previewState === 'empty' ? 'active' : ''}`}
            onClick={() => setPreviewState('empty')}
          >
            Empty State
          </button>
          <button
            className={`state-tab-btn ${previewState === 'loading' ? 'active' : ''}`}
            onClick={() => setPreviewState('loading')}
          >
            Loading State
          </button>
          <button
            className={`state-tab-btn ${previewState === 'error' ? 'active' : ''}`}
            onClick={() => setPreviewState('error')}
          >
            Error State
          </button>
          <button
            className="btn-secondary"
            style={{ padding: '4px 10px', fontSize: '12px' }}
            onClick={onRefresh}
            title="Refresh from API"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>refresh</span>
            Refresh
          </button>
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <div className="card-panel" style={{ margin: 0, padding: '14px' }}>
          <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>
            Open Regulatory Cases
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--primary)', margin: '4px 0' }}>
            {previewState === 'empty' ? '0' : openCasesCount}
          </div>
          <div style={{ fontSize: '12px', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>trending_up</span>
            <span>+2 new today</span>
          </div>
        </div>

        <div className="card-panel" style={{ margin: 0, padding: '14px' }}>
          <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>
            Ready For Human Review
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--secondary)', margin: '4px 0' }}>
            {previewState === 'empty' ? '0' : readyCasesCount}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>
            All citations verbatim verified
          </div>
        </div>

        <div className="card-panel" style={{ margin: 0, padding: '14px' }}>
          <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>
            Exception Flagged
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--error)', margin: '4px 0' }}>
            {previewState === 'empty' ? '0' : exceptionCasesCount}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--error)', fontWeight: 600 }}>
            Confidence &lt; 70% or Nominee
          </div>
        </div>

        <div className="card-panel" style={{ margin: 0, padding: '14px' }}>
          <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>
            SLA Compliance Rate
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#16a34a', margin: '4px 0' }}>
            98.4%
          </div>
          <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>
            Avg turnaround: 14.5m
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card-panel" style={{ margin: 0, padding: '12px 16px', display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, maxWidth: '420px' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--outline)' }}>search</span>
          <input
            type="text"
            placeholder="Search entity name, case ID, or jurisdiction..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              border: 'none',
              outline: 'none',
              width: '100%',
              fontSize: '13px',
              fontFamily: 'inherit',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--on-surface-variant)', fontWeight: 500 }}>Filter:</span>
          {(['all', 'ready', 'exception', 'signed'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className="state-tab-btn"
              style={{
                textTransform: 'capitalize',
                background: statusFilter === s ? 'var(--primary-container)' : '#ffffff',
                color: statusFilter === s ? '#ffffff' : 'var(--on-surface-variant)',
                borderColor: statusFilter === s ? 'var(--primary-container)' : 'var(--outline-variant)',
              }}
            >
              {s === 'all' ? 'All Queues' : s}
            </button>
          ))}
        </div>
      </div>

      {/* Conditional Rendering based on state */}
      {previewState === 'loading' || (loading && previewState === 'live') ? (
        <div className="card-panel" style={{ padding: '60px', textAlign: 'center' }}>
          <div className="status-dot-pulse" style={{ margin: '0 auto 16px', width: '20px', height: '20px' }}></div>
          <div style={{ fontWeight: 600, fontSize: '16px', color: 'var(--primary)' }}>
            Querying Regulatory Enclave...
          </div>
          <div style={{ color: 'var(--on-surface-variant)', fontSize: '13px', marginTop: '6px' }}>
            Fetching OCR extracts and immutable audit verification status.
          </div>
        </div>
      ) : previewState === 'error' || (error && previewState === 'live') ? (
        <div className="card-panel" style={{ padding: '40px', borderLeft: '4px solid var(--error)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--error)', fontWeight: 700, fontSize: '16px' }}>
            <span className="material-symbols-outlined">error</span>
            ERR_GATEWAY_TIMEOUT: 504 Failure connecting to compliance backend
          </div>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: '13px', marginTop: '8px' }}>
            {error || 'The banking microservice failed to return case payloads within the SLA threshold.'}
          </p>
          <button className="btn-secondary" style={{ marginTop: '14px' }} onClick={onRefresh}>
            Retry Connection
          </button>
        </div>
      ) : previewState === 'empty' || filteredCases.length === 0 ? (
        <div className="card-panel" style={{ padding: '60px', textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--outline)' }}>
            folder_off
          </span>
          <div style={{ fontWeight: 600, fontSize: '16px', color: 'var(--primary)', marginTop: '12px' }}>
            No Cases Pending In This Queue
          </div>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: '13px', maxWidth: '420px', margin: '8px auto 0' }}>
            All corporate files have been reviewed, audited, and signed off into the regulatory staging store.
          </p>
        </div>
      ) : (
        /* Live Cases Table */
        <div className="data-table-container">
          <table className="compliance-table">
            <thead>
              <tr>
                <th>Corporate Entity</th>
                <th>Source Document</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'center' }}>Confidence</th>
                <th>Beneficial Owner & Control</th>
                <th>Assigned Officer</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.map((c) => {
                const isException = c.status === 'exception';
                const isSigned = c.status === 'signed';

                return (
                  <tr
                    key={c.id}
                    style={{
                      backgroundColor: isException ? 'rgba(255, 218, 214, 0.15)' : undefined,
                    }}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '6px',
                            background: isException ? 'var(--error-container)' : 'var(--surface-container)',
                            color: isException ? 'var(--error)' : 'var(--primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginTop: '2px',
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                            {isException ? 'warning' : 'domain'}
                          </span>
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: 700, color: isException ? 'var(--error)' : 'var(--primary)' }}>
                              {c.entity_name}
                            </span>
                            <span
                              style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: '10px',
                                padding: '1px 5px',
                                borderRadius: '3px',
                                background: isException ? 'var(--error-container)' : 'var(--surface-container-high)',
                                color: isException ? 'var(--error)' : 'var(--on-surface-variant)',
                                fontWeight: 700,
                              }}
                            >
                              {c.jurisdiction}
                            </span>
                          </div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--on-surface-variant)', marginTop: '2px' }}>
                            <span style={{ color: 'var(--secondary)', fontWeight: 600 }}>{c.id}</span>
                            {' • '}
                            <span>{c.entity_type}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 500 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '16px', color: isException ? 'var(--error)' : 'var(--on-surface-variant)' }}>
                            description
                          </span>
                          <span style={{ maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.document_name}>
                            {c.document_name}
                          </span>
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: isException ? 'var(--error)' : 'var(--on-surface-variant)', marginTop: '2px' }}>
                          <span>{c.page_count} pages parsed</span>
                          {' • '}
                          <span style={{ fontWeight: 600 }}>{c.ocr_info}</span>
                        </div>
                      </div>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      {isException ? (
                        <span className="badge-confidence-low" style={{ background: '#ffdad6', color: '#ba1a1a', borderColor: '#ba1a1a' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>report</span>
                          Exception Flagged
                        </span>
                      ) : isSigned ? (
                        <span className="chip-status-accepted">
                          <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>verified</span>
                          Signed ({c.risk_rating || 'Low'})
                        </span>
                      ) : (
                        <span className="chip-status-pending" style={{ background: 'rgba(0, 81, 213, 0.1)', color: 'var(--secondary)' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>pending</span>
                          Ready for review
                        </span>
                      )}
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      {c.low_confidence_count > 0 ? (
                        <span className="badge-confidence-low">
                          <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>warning</span>
                          {c.low_confidence_count} Low (&lt;70%)
                        </span>
                      ) : (
                        <span className="badge-confidence-high">
                          <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>check</span>
                          100% High Confidence
                        </span>
                      )}
                    </td>

                    <td>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: isException ? 'var(--error)' : 'var(--on-surface)' }}>
                        {c.primary_owner_summary || 'Analysis pending'}
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '50%',
                            background: isException ? 'var(--error)' : 'var(--primary-container)',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px',
                            fontWeight: 700,
                          }}
                        >
                          SJ
                        </div>
                        <div style={{ fontSize: '12px', lineHeight: 1.2 }}>
                          <div style={{ fontWeight: 600 }}>Sarah Jenkins</div>
                          <div style={{ color: 'var(--on-surface-variant)', fontSize: '10px' }}>CAMS</div>
                        </div>
                      </div>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                        {isException ? (
                          <button
                            className="btn-danger"
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                            onClick={() => onSelectCase(c.id, 'exception-review')}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>warning</span>
                            Resolve Flag
                          </button>
                        ) : isSigned ? (
                          <button
                            className="btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                            onClick={() => onSelectCase(c.id, 'active-review')}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>visibility</span>
                            Review Dossier
                          </button>
                        ) : (
                          <button
                            className="btn-primary"
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                            onClick={() => onSelectCase(c.id, 'active-review')}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>arrow_forward</span>
                            Open Workspace
                          </button>
                        )}
                        <button
                          className="btn-secondary"
                          style={{ padding: '6px 8px' }}
                          title="Audit Trail"
                          onClick={() => onSelectCase(c.id, 'audit-trail')}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>history</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
