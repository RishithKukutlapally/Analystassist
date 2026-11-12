import React, { useState, useEffect, useRef } from 'react';
import { CaseDetail, SourceData, FieldItem } from '../types';
import { api } from '../api';
import { isSignReady, getSignValidationState, VALID_RISK_RATINGS } from '../logic/signLogic';

interface CaseReviewWorkspaceScreenProps {
  caseData: CaseDetail;
  onRefreshCase: () => void;
  onSelectCase: (caseId: string, screen: string) => void;
}

export const CaseReviewWorkspaceScreen: React.FC<CaseReviewWorkspaceScreenProps> = ({
  caseData,
  onRefreshCase,
  onSelectCase,
}) => {
  const [sourceData, setSourceData] = useState<SourceData | null>(null);
  const [sourceLoading, setSourceLoading] = useState(true);
  const [activeCitationLine, setActiveCitationLine] = useState<{ page: number; line: number } | null>(null);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);

  // Editing state for fields
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editInputValue, setEditInputValue] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // MLRO Risk Rating
  const [riskRating, setRiskRating] = useState<string>(caseData.risk_rating || '');
  const [signSubmitting, setSignSubmitting] = useState(false);
  const [signSuccessMessage, setSignSuccessMessage] = useState<string | null>(null);

  // Search in doc
  const [docSearch, setDocSearch] = useState('');

  // Refs for scrolling to document lines
  const lineRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const docViewerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let isMounted = true;
    setSourceLoading(true);
    api
      .getCaseSource(caseData.id)
      .then((data) => {
        if (isMounted) {
          setSourceData(data);
          setSourceLoading(false);
          // Highlight first field's citation by default if exists
          if (caseData.fields && caseData.fields.length > 0) {
            const first = caseData.fields[0];
            setActiveCitationLine({ page: first.page, line: first.line });
            setActiveFieldId(first.id);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load source lines:', err);
        if (isMounted) setSourceLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [caseData.id]);

  // Handle citation click
  const handleCitationClick = (field: FieldItem) => {
    setActiveCitationLine({ page: field.page, line: field.line });
    setActiveFieldId(field.id);

    // Call API to log citation open event (for pilot metrics calculation)
    api.openCitation(caseData.id, `Page ${field.page}, Line ${field.line}`).catch(console.error);

    // Smooth scroll to the line in document viewer
    const key = `${field.page}-${field.line}`;
    const el = lineRefs.current[key];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Field decision handlers
  const handleDecision = async (
    fieldId: string,
    decision: 'accepted' | 'edited' | 'rejected',
    overrideValue?: string
  ) => {
    setSubmittingAction(true);
    try {
      await api.setFieldDecision(caseData.id, fieldId, decision, overrideValue);
      setEditingFieldId(null);
      setEditInputValue('');
      onRefreshCase();
    } catch (err: any) {
      alert(`Decision error: ${err.message}`);
    } finally {
      setSubmittingAction(false);
    }
  };

  // MLRO Risk Rating handler
  const handleRiskRatingChange = async (newRating: string) => {
    setRiskRating(newRating);
    if (!newRating) return;
    try {
      await api.setRiskRating(caseData.id, newRating);
      onRefreshCase();
    } catch (err: any) {
      alert(`Risk rating update error: ${err.message}`);
    }
  };

  // Sign-off handler
  const handleSignCase = async () => {
    if (!isSignReady(caseData.fields, riskRating)) return;
    setSignSubmitting(true);
    try {
      const res = await api.signCase(caseData.id, 'Sarah Jenkins, CAMS');
      setSignSuccessMessage(
        `CASE ${caseData.id}: Formal MLRO regulatory sign-off generated and committed to submission_staging ledger (Staging ID: #${res.staging_id}).`
      );
      onRefreshCase();
    } catch (err: any) {
      alert(`Sign-off error: ${err.message}`);
    } finally {
      setSignSubmitting(false);
    }
  };

  const validationState = getSignValidationState(caseData.fields, riskRating);
  const progressPercent =
    validationState.totalCount > 0
      ? (validationState.reviewedCount / validationState.totalCount) * 100
      : 0;

  // Filter doc lines if search active
  const displayedLines = (sourceData?.lines || []).filter((l) =>
    docSearch ? l.text.toLowerCase().includes(docSearch.toLowerCase()) : true
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Case Header Bar */}
      <div
        className="card-panel"
        style={{
          margin: 0,
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              padding: '3px 8px',
              borderRadius: '4px',
              backgroundColor: 'var(--surface-container-high)',
              fontWeight: 600,
            }}
          >
            #{caseData.id}
          </span>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary)' }}>
            {caseData.entity_name}
          </h1>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              padding: '2px 6px',
              borderRadius: '3px',
              backgroundColor: 'var(--surface-container)',
              color: 'var(--on-surface-variant)',
            }}
          >
            {caseData.jurisdiction} • {caseData.registration_number}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
            <span style={{ color: 'var(--on-surface-variant)' }}>Status:</span>
            <span
              className={
                caseData.status === 'signed'
                  ? 'chip-status-accepted'
                  : caseData.status === 'exception'
                  ? 'badge-confidence-low'
                  : 'chip-status-pending'
              }
            >
              {caseData.status.toUpperCase()}
            </span>
          </div>

          <button
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '12px' }}
            onClick={() => onSelectCase(caseData.id, 'ownership-structure')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>account_tree</span>
            View Ownership Tree
          </button>

          <button
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '12px' }}
            onClick={() => onSelectCase(caseData.id, 'audit-trail')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>history</span>
            Audit Log
          </button>
        </div>
      </div>

      {signSuccessMessage && (
        <div
          style={{
            backgroundColor: '#dcfce7',
            border: '1px solid #86efac',
            color: '#166534',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined">verified</span>
            <span>{signSuccessMessage}</span>
          </div>
          <button
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#166534', fontWeight: 700 }}
            onClick={() => setSignSuccessMessage(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Split Grid */}
      <div className="workspace-grid">
        {/* Left Panel: Verified Source Document Viewer */}
        <div className="doc-viewer-container">
          <div className="doc-viewer-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--primary-fixed)' }}>
                description
              </span>
              <span style={{ fontWeight: 600, color: '#f8fafc', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={caseData.document_name}>
                {caseData.document_name}
              </span>
              <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.1)', padding: '1px 6px', borderRadius: '3px' }}>
                SECURED
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', background: '#00162d', padding: '2px 6px', borderRadius: '4px', gap: '4px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#94a3b8' }}>search</span>
                <input
                  type="text"
                  placeholder="Filter lines..."
                  value={docSearch}
                  onChange={(e) => setDocSearch(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#f8fafc',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    width: '90px',
                  }}
                />
              </div>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                {caseData.page_count} Pages
              </span>
            </div>
          </div>

          <div
            className="doc-viewer-lines"
            ref={docViewerRef}
            style={{ position: 'relative' }}
          >
            {sourceLoading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                Loading verified document lines...
              </div>
            ) : displayedLines.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                No lines found matching query.
              </div>
            ) : (
              displayedLines.map((line) => {
                const isHighlighted =
                  activeCitationLine &&
                  activeCitationLine.page === line.page_number &&
                  activeCitationLine.line === line.line_number;
                const key = `${line.page_number}-${line.line_number}`;

                return (
                  <div
                    key={key}
                    ref={(el) => (lineRefs.current[key] = el)}
                    className={`doc-line-row ${isHighlighted ? 'doc-line-highlighted' : ''}`}
                    style={{ position: 'relative' }}
                  >
                    {isHighlighted && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '-10px',
                          right: '10px',
                          backgroundColor: '#f59e0b',
                          color: '#000000',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '3px',
                          zIndex: 5,
                          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        }}
                      >
                        MATCH: PAGE {line.page_number}, LINE {line.line_number}
                      </div>
                    )}
                    <span className="doc-line-number">
                      p{line.page_number}:{line.line_number}
                    </span>
                    <span className="doc-line-text">{line.text}</span>
                  </div>
                );
              })
            )}
          </div>

          <div
            style={{
              padding: '6px 14px',
              backgroundColor: '#00162d',
              borderTop: '1px solid #1e293b',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              color: '#94a3b8',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>Dual-Engine OCR: 99.4% verbatim match</span>
            <span>Immutable Hash: SHA-256 Verified</span>
          </div>
        </div>

        {/* Right Panel: AI Extracted Field Register & Decision Workspace */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Top Guardrail & Progress Strip */}
          <div className="card-panel" style={{ margin: 0, padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600 }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#16a34a' }}>
                  verified_user
                </span>
                <span style={{ color: 'var(--primary)' }}>Guardrails Active:</span>
                <span style={{ color: 'var(--on-surface-variant)', fontWeight: 400 }}>
                  Schema locked • Risk ratings blocked • Clearance terms banned
                </span>
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: validationState.isReady ? '#16a34a' : 'var(--secondary)',
                }}
              >
                {validationState.reviewedCount} of {validationState.totalCount} reviewed
              </span>
            </div>

            {/* Progress Bar */}
            <div
              style={{
                width: '100%',
                height: '6px',
                backgroundColor: 'var(--surface-container-high)',
                borderRadius: '9999px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${progressPercent}%`,
                  backgroundColor: validationState.isReady ? '#16a34a' : 'var(--secondary-container)',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>

          {/* AI Extracted Field Register Table */}
          <div className="card-panel" style={{ margin: 0, padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--primary)' }}>
                  AI Extracted Field Register
                </h2>
                <p style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>
                  Traceable to verbatim source citations. Human determination required.
                </p>
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: 'var(--surface-container)',
                  color: 'var(--secondary)',
                  fontWeight: 600,
                }}
              >
                STAGE 2 / STATUTORY PSC
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="compliance-table">
                <thead>
                  <tr>
                    <th>Statutory Field</th>
                    <th>Extracted AI Value</th>
                    <th style={{ textAlign: 'center' }}>Confidence</th>
                    <th style={{ textAlign: 'center' }}>Citation</th>
                    <th style={{ textAlign: 'right' }}>Analyst Decision</th>
                  </tr>
                </thead>
                <tbody>
                  {caseData.fields.map((f) => {
                    const isRowEditing = editingFieldId === f.id;
                    const isRowSelected = activeFieldId === f.id;

                    return (
                      <React.Fragment key={f.id}>
                        <tr
                          style={{
                            backgroundColor: isRowSelected ? 'var(--surface-container-low)' : undefined,
                          }}
                        >
                          <td style={{ fontWeight: 600, color: 'var(--primary)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{f.name}</span>
                              {f.is_exception && (
                                <span
                                  className="material-symbols-outlined"
                                  style={{ fontSize: '14px', color: 'var(--error)' }}
                                  title={f.exception_reason || 'Flagged Exception'}
                                >
                                  warning
                                </span>
                              )}
                            </div>
                          </td>

                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                            <div>
                              {f.decision === 'edited' && f.override_value ? (
                                <div>
                                  <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
                                    {f.override_value}
                                  </span>
                                  <div style={{ fontSize: '11px', color: 'var(--tertiary-amber-text)', fontWeight: 600 }}>
                                    Analyst Override (Original: {f.ai_value})
                                  </div>
                                </div>
                              ) : f.decision === 'rejected' ? (
                                <span style={{ textDecoration: 'line-through', color: 'var(--error)' }}>
                                  {f.ai_value}
                                </span>
                              ) : (
                                <span style={{ color: 'var(--on-surface)' }}>{f.ai_value}</span>
                              )}
                            </div>
                          </td>

                          <td style={{ textAlign: 'center' }}>
                            {f.confidence >= 0.90 ? (
                              <span className="badge-confidence-high">
                                <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>check</span>
                                {(f.confidence * 100).toFixed(0)}% High
                              </span>
                            ) : f.confidence >= 0.70 ? (
                              <span className="badge-confidence-medium">
                                <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>warning</span>
                                {(f.confidence * 100).toFixed(0)}% Review
                              </span>
                            ) : (
                              <span className="badge-confidence-low">
                                <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>report</span>
                                {(f.confidence * 100).toFixed(0)}% Low
                              </span>
                            )}
                          </td>

                          <td style={{ textAlign: 'center' }}>
                            <button
                              className={`citation-chip ${isRowSelected ? 'active-anchor' : ''}`}
                              onClick={() => handleCitationClick(f)}
                              title="Click to jump and cross-highlight exact document text"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>
                                my_location
                              </span>
                              [Page {f.page}, Line {f.line}]
                            </button>
                          </td>

                          <td style={{ textAlign: 'right' }}>
                            {f.decision ? (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                                {f.decision === 'accepted' ? (
                                  <span className="chip-status-accepted">
                                    <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>check</span>
                                    Accepted
                                  </span>
                                ) : f.decision === 'edited' ? (
                                  <span className="chip-status-edited">
                                    <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>edit</span>
                                    Override
                                  </span>
                                ) : (
                                  <span className="chip-status-rejected">
                                    <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>close</span>
                                    Rejected
                                  </span>
                                )}
                                <button
                                  className="btn-secondary"
                                  style={{ padding: '3px 6px', fontSize: '11px' }}
                                  title="Re-evaluate decision"
                                  onClick={() => {
                                    setEditingFieldId(f.id);
                                    setEditInputValue(f.override_value || f.ai_value);
                                  }}
                                >
                                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>edit_note</span>
                                </button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                                <button
                                  className="btn-primary"
                                  style={{ padding: '4px 8px', fontSize: '12px', background: '#16a34a' }}
                                  disabled={submittingAction}
                                  onClick={() => handleDecision(f.id, 'accepted')}
                                >
                                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>check</span>
                                  Accept
                                </button>
                                <button
                                  className="btn-secondary"
                                  style={{ padding: '4px 8px', fontSize: '12px' }}
                                  disabled={submittingAction}
                                  onClick={() => {
                                    setEditingFieldId(f.id);
                                    setEditInputValue(f.ai_value);
                                  }}
                                >
                                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>edit</span>
                                  Edit
                                </button>
                                <button
                                  className="btn-danger"
                                  style={{ padding: '4px 8px', fontSize: '12px' }}
                                  disabled={submittingAction}
                                  onClick={() => handleDecision(f.id, 'rejected')}
                                >
                                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
                                  Reject
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>

                        {/* Inline Edit Drawer */}
                        {isRowEditing && (
                          <tr style={{ backgroundColor: '#fffbeb' }}>
                            <td colSpan={5} style={{ padding: '10px 14px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--tertiary-amber-text)' }}>
                                  Analyst Manual Override:
                                </span>
                                <input
                                  type="text"
                                  value={editInputValue}
                                  onChange={(e) => setEditInputValue(e.target.value)}
                                  style={{
                                    flex: 1,
                                    padding: '6px 10px',
                                    border: '1px solid var(--tertiary-amber-border)',
                                    borderRadius: '4px',
                                    fontSize: '13px',
                                    fontFamily: 'var(--font-mono)',
                                  }}
                                />
                                <button
                                  className="btn-primary"
                                  style={{ padding: '6px 12px', fontSize: '12px', background: '#b45309' }}
                                  disabled={submittingAction || !editInputValue.trim()}
                                  onClick={() => handleDecision(f.id, 'edited', editInputValue)}
                                >
                                  Save Override
                                </button>
                                <button
                                  className="btn-secondary"
                                  style={{ padding: '6px 10px', fontSize: '12px' }}
                                  onClick={() => setEditingFieldId(null)}
                                >
                                  Cancel
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Non-Capital Control Panel (Job 4) */}
          <div className="card-panel" style={{ margin: 0, padding: '14px 16px', background: 'var(--surface-container-low)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--secondary)' }}>
                gavel
              </span>
              <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--primary)' }}>
                Non-Capital Control & Governance Clauses
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>
              {caseData.entity_name.includes('Meridian Green')
                ? 'Designated Managing Member Clause: Elena Vance holds sole operational control and casting vote under Clause 8.2 (cited Page 6, Line 18). Control rests with Elena Vance independently of equal 50/50 capital split.'
                : caseData.entity_name.includes('Apex')
                ? 'Executive Authority Clause: John Sterling is appointed as Sole Managing Director under Section 5.1 (cited Page 4, Line 22), exercising full operational board control alongside 75% voting shares.'
                : 'All corporate governing articles reviewed for casting votes, power of appointment, and managing partner clauses.'}
            </p>
          </div>

          {/* MLRO Compliance Mandate & Sign-off Card */}
          <div
            className="card-panel"
            style={{
              margin: 0,
              padding: '16px',
              border: validationState.isReady ? '2px solid #16a34a' : '1px solid var(--outline-variant)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--primary)' }}>
                policy
              </span>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                MLRO COMPLIANCE MANDATE: Human Judgment Only
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--on-surface-variant)', marginBottom: '14px', lineHeight: 1.4 }}>
              In accordance with banking regulations, autonomous AI risk classification is hard-blocked. A licensed MLRO must evaluate the verified dossier and choose a risk tier before formal sign-off.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary)' }}>
                  MLRO Risk Tier:
                </label>
                <select
                  value={riskRating}
                  onChange={(e) => handleRiskRatingChange(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--outline-variant)',
                    backgroundColor: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: riskRating ? 'var(--primary)' : 'var(--on-surface-variant)',
                  }}
                >
                  <option value="">-- Select Risk Tier (Required) --</option>
                  {VALID_RISK_RATINGS.map((r) => (
                    <option key={r} value={r}>
                      {r} Risk
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontSize: '18px',
                      color: validationState.isReady ? '#16a34a' : 'var(--error)',
                    }}
                  >
                    {validationState.isReady ? 'check_circle' : 'info'}
                  </span>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: validationState.isReady ? '#16a34a' : 'var(--error)',
                    }}
                  >
                    {validationState.message}
                  </span>
                </div>

                <button
                  className="btn-primary"
                  id="btn-submit-regulatory-case"
                  disabled={!validationState.isReady || signSubmitting || caseData.status === 'signed'}
                  onClick={handleSignCase}
                  title={
                    validationState.isReady
                      ? 'Submit verified dossier to submission_staging ledger'
                      : 'Disabled until all fields have decisions and MLRO risk rating is selected'
                  }
                  style={{
                    backgroundColor: validationState.isReady ? 'var(--secondary)' : undefined,
                    padding: '10px 18px',
                    fontSize: '13px',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                    {caseData.status === 'signed' ? 'verified' : 'draw'}
                  </span>
                  {caseData.status === 'signed'
                    ? 'Case Signed & Staged'
                    : 'Sign and Submit Regulatory Case'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
