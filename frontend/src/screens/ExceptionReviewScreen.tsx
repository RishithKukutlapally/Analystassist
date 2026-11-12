import React, { useState } from 'react';
import { CaseDetail } from '../types';
import { api } from '../api';

interface ExceptionReviewScreenProps {
  caseData: CaseDetail;
  onRefreshCase: () => void;
  onSelectCase: (caseId: string, screen: string) => void;
}

export const ExceptionReviewScreen: React.FC<ExceptionReviewScreenProps> = ({
  caseData,
  onRefreshCase,
  onSelectCase,
}) => {
  const [overrideText, setOverrideText] = useState('');
  const [showOverrideInput, setShowOverrideInput] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [resolutionSuccess, setResolutionSuccess] = useState<string | null>(null);

  // Find exception fields
  const exceptionFields = caseData.fields.filter((f) => f.is_exception || f.confidence < 0.70);
  const nomineeField = exceptionFields.find((f) => f.confidence <= 0.60) || exceptionFields[0];
  const bearerField = exceptionFields.find((f) => f.confidence > 0.60 && f.confidence < 0.70) || exceptionFields[1];

  const handleResolve = async (action: 'sourceA' | 'sourceB' | 'rejectBoth' | 'override') => {
    setResolving(true);
    try {
      if (action === 'sourceA' && nomineeField) {
        await api.setFieldDecision(caseData.id, nomineeField.id, 'accepted');
        if (bearerField) {
          await api.setFieldDecision(caseData.id, bearerField.id, 'rejected');
        }
        setResolutionSuccess('Source A accepted: Michael Sterling recorded as Nominee Director. Bearer clause rejected.');
      } else if (action === 'sourceB' && bearerField) {
        await api.setFieldDecision(caseData.id, bearerField.id, 'accepted');
        if (nomineeField) {
          await api.setFieldDecision(caseData.id, nomineeField.id, 'rejected');
        }
        setResolutionSuccess('Source B accepted: Physical Bearer Share warrants recorded. Nominee agreement rejected.');
      } else if (action === 'rejectBoth') {
        for (const f of exceptionFields) {
          await api.setFieldDecision(caseData.id, f.id, 'rejected');
        }
        setResolutionSuccess('Both conflicting sources rejected by Analyst. Escalated to Enhanced Due Diligence (EDD).');
      } else if (action === 'override' && overrideText.trim()) {
        if (nomineeField) {
          await api.setFieldDecision(caseData.id, nomineeField.id, 'edited', overrideText.trim());
        }
        setResolutionSuccess(`Analyst manual override recorded: "${overrideText.trim()}"`);
        setShowOverrideInput(false);
      }
      onRefreshCase();
    } catch (err: any) {
      alert(`Resolution error: ${err.message}`);
    } finally {
      setResolving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Persistent Sanctions & Triage Status Bar */}
      <div
        style={{
          backgroundColor: 'var(--primary)',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div
            style={{
              backgroundColor: 'var(--error)',
              color: '#ffffff',
              padding: '4px 10px',
              borderRadius: '4px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>warning</span>
            2 Critical Exceptions Flagged
          </div>
          <span style={{ color: 'var(--on-primary-container)' }}>|</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px', fontWeight: 700 }}>{caseData.entity_name}</span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                backgroundColor: 'var(--primary-container)',
                color: 'var(--primary-fixed)',
                padding: '2px 6px',
                borderRadius: '3px',
              }}
            >
              {caseData.registration_number}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--on-primary-container)' }}>
              Case: #{caseData.id}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              backgroundColor: 'rgba(15, 43, 72, 0.8)',
              padding: '4px 12px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
            }}
          >
            <span style={{ color: 'var(--on-primary-container)' }}>Resolution Progress:</span>
            <span style={{ color: 'var(--primary-fixed)', fontWeight: 600 }}>Step 1 of 2</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--primary-fixed)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>gavel</span>
            MLRO Escalation Protocol Active
          </div>
        </div>
      </div>

      {resolutionSuccess && (
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
            <span className="material-symbols-outlined">check_circle</span>
            <span>{resolutionSuccess}</span>
          </div>
          <button
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#166534', fontWeight: 700 }}
            onClick={() => setResolutionSuccess(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* Exception Overview Banner */}
      <div
        className="card-panel"
        style={{
          margin: 0,
          backgroundColor: 'rgba(255, 218, 214, 0.35)',
          borderLeft: '5px solid var(--error)',
          padding: '18px 20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
              <span
                style={{
                  backgroundColor: 'var(--error)',
                  color: '#ffffff',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '4px',
                }}
              >
                EXCEPTION #EX-8820-01
              </span>
              <span
                style={{
                  backgroundColor: '#ffffff',
                  color: 'var(--error)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  border: '1px solid var(--error)',
                }}
              >
                Confidence Under 70% (Scored 54% Low)
              </span>
              <span
                style={{
                  backgroundColor: 'var(--surface-container-highest)',
                  color: 'var(--on-surface-variant)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '4px',
                }}
              >
                Category: Beneficial Ownership Conflict
              </span>
            </div>

            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--on-surface)', marginBottom: '6px' }}>
              Conflicting Beneficial Ownership & Nominee Disclosure Trap
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--on-surface-variant)', maxWidth: '900px', lineHeight: 1.5 }}>
              The ingestion scanner parsed two conflicting legal clauses regarding the identity and power of attorney for the controlling party. Document A indicates a direct registered nominee director (Michael Sterling, 54% confidence), while Document B asserts an undisclosed bearer trust with physical certificates (62% confidence).
            </p>
          </div>

          <div
            style={{
              backgroundColor: '#ffffff',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid var(--outline-variant)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexShrink: 0,
            }}
          >
            <div>
              <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>
                SLA Risk Impact
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--error)' }}>
                High (Level 3 Triage)
              </div>
            </div>
            <span className="material-symbols-outlined" style={{ fontSize: '24px', color: 'var(--error)' }}>
              shield
            </span>
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison Workspace */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Source A Card */}
        <div className="card-panel" style={{ margin: 0, padding: 0, overflow: 'hidden' }}>
          <div
            style={{
              backgroundColor: 'var(--surface-container-low)',
              padding: '12px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid var(--outline-variant)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '4px',
                  background: 'rgba(0, 81, 213, 0.15)',
                  color: 'var(--secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '12px',
                }}
              >
                A
              </span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--primary)' }}>
                  Certificate of Incumbency
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--on-surface-variant)' }}>
                  Doc Ref: DOI-2023-BVI-901 • Filed 14/01/2018
                </div>
              </div>
            </div>
            <span className="badge-confidence-low">
              <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>warning</span>
              54.1% LOW: CHECK SOURCE
            </span>
          </div>

          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>
                Extracted OCR Anchor
              </span>
              <span className="citation-chip">
                <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>zoom_in</span>
                [Page 14, Line 9] Inspector View
              </span>
            </div>

            {/* Dark Canvas Line Preview */}
            <div
              style={{
                backgroundColor: '#0f172a',
                color: '#e2e8f0',
                padding: '12px 14px',
                borderRadius: '6px',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                lineHeight: 1.8,
              }}
            >
              <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '4px' }}>
                PAGE 14 — REGISTRATION DEED PARTICULARS
              </div>
              <div style={{ color: '#94a3b8' }}>Line 07: ...in accordance with International Business Companies Act 1984...</div>
              <div style={{ color: '#94a3b8' }}>Line 08: ...the capital shall be divided into 50,000 registered voting units...</div>
              <div
                style={{
                  backgroundColor: 'rgba(254, 240, 138, 0.18)',
                  borderLeft: '3px solid #f59e0b',
                  color: '#fef08a',
                  fontWeight: 600,
                  padding: '2px 6px',
                  borderRadius: '2px',
                  margin: '2px 0',
                }}
              >
                Line 09: "...registered nominee director Michael Sterling holds powers of appointment under Nominee Agreement dated 14/01/2018..."
              </div>
              <div style={{ color: '#94a3b8' }}>Line 10: ...executed under corporate seal in Road Town, Tortola, British Virgin Islands.</div>
            </div>

            {/* Parsed Key-Value Grid */}
            <div style={{ backgroundColor: 'var(--surface-container-low)', padding: '12px', borderRadius: '6px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--on-surface-variant)', textTransform: 'uppercase', display: 'block' }}>
                  Identified Controlling Party
                </span>
                <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--primary)' }}>Michael Sterling</span>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--on-surface-variant)', textTransform: 'uppercase', display: 'block' }}>
                  Appointed Legal Capacity
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: 'var(--secondary)' }}>
                  Nominee Director
                </span>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--on-surface-variant)', textTransform: 'uppercase', display: 'block' }}>
                  Supporting Instrument
                </span>
                <span style={{ fontSize: '12px' }}>Nominee Agreement (2018)</span>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--on-surface-variant)', textTransform: 'uppercase', display: 'block' }}>
                  Disclosed UBO Percentage
                </span>
                <span style={{ fontSize: '12px', fontWeight: 600 }}>0.00% Direct (Nominee Proxy)</span>
              </div>
            </div>

            <button
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: '6px' }}
              disabled={resolving}
              onClick={() => handleResolve('sourceA')}
            >
              <span className="material-symbols-outlined">check</span>
              Accept Source A Extraction
            </button>
          </div>
        </div>

        {/* Source B Card */}
        <div className="card-panel" style={{ margin: 0, padding: 0, overflow: 'hidden' }}>
          <div
            style={{
              backgroundColor: 'var(--surface-container-low)',
              padding: '12px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid var(--outline-variant)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '4px',
                  background: 'var(--error-container)',
                  color: 'var(--error)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '12px',
                }}
              >
                B
              </span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--primary)' }}>
                  Register of Members & Bearer Clause
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--on-surface-variant)' }}>
                  Doc Ref: ROM-2023-BVI-102 • Modified 22/09/2021
                </div>
              </div>
            </div>
            <span className="badge-confidence-low">
              <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>warning</span>
              62.4% LOW: CHECK SOURCE
            </span>
          </div>

          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>
                Extracted OCR Anchor
              </span>
              <span className="citation-chip">
                <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>zoom_in</span>
                [Page 22, Line 18] Inspector View
              </span>
            </div>

            {/* Dark Canvas Line Preview */}
            <div
              style={{
                backgroundColor: '#0f172a',
                color: '#e2e8f0',
                padding: '12px 14px',
                borderRadius: '6px',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                lineHeight: 1.8,
              }}
            >
              <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '4px' }}>
                PAGE 22 — SHARE REGISTER & CUSTODY PROVISIONS
              </div>
              <div style={{ color: '#94a3b8' }}>Line 16: ...special resolution passed by extraordinary general session...</div>
              <div style={{ color: '#94a3b8' }}>Line 17: ...authorizing issuance of bearer equity without public record...</div>
              <div
                style={{
                  backgroundColor: 'rgba(254, 240, 138, 0.18)',
                  borderLeft: '3px solid #f59e0b',
                  color: '#fef08a',
                  fontWeight: 600,
                  padding: '2px 6px',
                  borderRadius: '2px',
                  margin: '2px 0',
                }}
              >
                Line 18: "...voting capital is represented by 50,000 Bearer Share Certificates issued to bearer and deposited with unregistered offshore custodian..."
              </div>
              <div style={{ color: '#94a3b8' }}>Line 19: ...and physical title shall determine ultimate beneficial entitlement.</div>
            </div>

            {/* Parsed Key-Value Grid */}
            <div style={{ backgroundColor: 'var(--surface-container-low)', padding: '12px', borderRadius: '6px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--on-surface-variant)', textTransform: 'uppercase', display: 'block' }}>
                  Identified Controlling Party
                </span>
                <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--error)' }}>Undisclosed Bearer</span>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--on-surface-variant)', textTransform: 'uppercase', display: 'block' }}>
                  Equity Instrument Class
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: 'var(--error)' }}>
                  Physical Bearer Warrants
                </span>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--on-surface-variant)', textTransform: 'uppercase', display: 'block' }}>
                  Supporting Instrument
                </span>
                <span style={{ fontSize: '12px' }}>Unregistered Offshore Custody</span>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--on-surface-variant)', textTransform: 'uppercase', display: 'block' }}>
                  Disclosed UBO Percentage
                </span>
                <span style={{ fontSize: '12px', fontWeight: 600 }}>Undetermined (Physical Title)</span>
              </div>
            </div>

            <button
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: '6px', backgroundColor: 'var(--primary-container)' }}
              disabled={resolving}
              onClick={() => handleResolve('sourceB')}
            >
              <span className="material-symbols-outlined">check</span>
              Accept Source B Extraction
            </button>
          </div>
        </div>
      </div>

      {/* Alternative Escalation Actions */}
      <div className="card-panel" style={{ margin: 0, padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary)' }}>
            Compliance Officer Escalation Actions
          </h4>
          <p style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>
            If neither machine extraction satisfies institutional AML standards, reject both or enter verified registry override.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {showOverrideInput ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="text"
                placeholder="Enter verified nominee / UBO..."
                value={overrideText}
                onChange={(e) => setOverrideText(e.target.value)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '4px',
                  border: '1px solid var(--outline-variant)',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)',
                  width: '240px',
                }}
              />
              <button
                className="btn-primary"
                style={{ padding: '6px 12px', fontSize: '12px' }}
                disabled={resolving || !overrideText.trim()}
                onClick={() => handleResolve('override')}
              >
                Save
              </button>
              <button
                className="btn-secondary"
                style={{ padding: '6px 10px', fontSize: '12px' }}
                onClick={() => setShowOverrideInput(false)}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              className="btn-secondary"
              onClick={() => setShowOverrideInput(true)}
            >
              <span className="material-symbols-outlined">edit_note</span>
              Manual Analyst Override
            </button>
          )}

          <button
            className="btn-danger"
            disabled={resolving}
            onClick={() => handleResolve('rejectBoth')}
          >
            <span className="material-symbols-outlined">block</span>
            Reject Both Sources & Escalate EDD
          </button>

          <button
            className="btn-secondary"
            onClick={() => onSelectCase(caseData.id, 'active-review')}
          >
            Review In Workspace
          </button>
        </div>
      </div>
    </div>
  );
};
