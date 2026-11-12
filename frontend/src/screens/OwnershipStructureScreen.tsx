import React from 'react';
import { CaseDetail } from '../types';

interface OwnershipStructureScreenProps {
  caseData: CaseDetail;
  onSelectCase: (caseId: string, screen: string) => void;
}

export const OwnershipStructureScreen: React.FC<OwnershipStructureScreenProps> = ({
  caseData,
  onSelectCase,
}) => {

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Bar */}
      <div
        className="card-panel"
        style={{
          margin: 0,
          padding: '14px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>
              KYC Case: {caseData.id}
            </span>
            <span style={{ color: 'var(--outline)' }}>•</span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                padding: '1px 6px',
                borderRadius: '3px',
                background: 'var(--surface-container-high)',
                color: 'var(--primary)',
                fontWeight: 600,
              }}
            >
              {caseData.entity_name}
            </span>
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--primary)' }}>
            Multi-Layer Beneficial Ownership (UBO) Calculation Architecture
          </h1>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: '13px' }}>
            Deterministic Decimal arithmetic across corporate intermediary tiers with immutable citations.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className="btn-secondary"
            onClick={() => onSelectCase(caseData.id, 'active-review')}
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Back to Review
          </button>
        </div>
      </div>

      {/* Two-Branch Side by Side Diagram (Verified vs Nominee Risk) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Branch 1: Verified Holding Chain (Primary KYC Branch) */}
        <div className="card-panel" style={{ margin: 0, padding: '20px', background: '#ffffff' }}>
          <div
            style={{
              textAlign: 'center',
              borderBottom: '2px solid rgba(0, 81, 213, 0.2)',
              paddingBottom: '10px',
              marginBottom: '20px',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>verified_user</span>
            Branch 1: Verified Holding Chain (Veloce FinTech AG)
          </div>

          {/* Node 1: Natural Person */}
          <div className="ubo-node" style={{ borderColor: 'var(--secondary)' }}>
            <div
              style={{
                position: 'absolute',
                top: '-12px',
                left: '16px',
                background: 'var(--secondary)',
                color: '#ffffff',
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '9999px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '11px' }}>person</span>
              Natural Person • UBO Qualified
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', paddingTop: '4px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '8px',
                  background: 'var(--surface-container)',
                  color: 'var(--secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>person</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--primary)' }}>
                    Henrik Lindqvist
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px',
                      background: 'var(--surface-container-high)',
                      padding: '1px 5px',
                      borderRadius: '3px',
                      fontWeight: 700,
                    }}
                  >
                    SE NAT
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)', marginTop: '2px' }}>
                  Tax Res: Stockholm, Sweden
                </div>
                <div style={{ fontSize: '11px', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>check</span>
                  Swedish Passport (#SE-9912048) Verified
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: '12px',
                paddingTop: '8px',
                borderTop: '1px solid var(--outline-variant)',
                display: 'flex',
                justifyContent: 'space-between',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
              }}
            >
              <span style={{ color: 'var(--on-surface-variant)' }}>Direct Equity in Parent:</span>
              <span style={{ fontWeight: 700, color: 'var(--secondary)' }}>100.0% Ordinary</span>
            </div>
          </div>

          {/* Connector 1 */}
          <div className="ubo-connector">
            <div className="ubo-connector-line" />
            <div className="ubo-connector-badge">
              100.0% Direct Equity & Voting Control
            </div>
            <div className="ubo-connector-line" />
            <span className="material-symbols-outlined" style={{ color: 'var(--secondary)', marginTop: '-8px' }}>
              keyboard_arrow_down
            </span>
          </div>

          {/* Node 2: Intermediary Holding Entity */}
          <div className="ubo-node" style={{ borderColor: 'var(--outline-variant)' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '8px',
                  background: 'var(--surface-container)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>corporate_fare</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--primary)' }}>
                    Lindqvist Holding SE
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--on-surface-variant)' }}>
                    SE-ORG
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)', marginTop: '2px' }}>
                  Stockholm, Sweden • Org #556912-3841
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--on-surface-variant)' }}>
                    Tier-1 Intermediary Corporate
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px',
                      background: 'var(--surface-container)',
                      color: 'var(--secondary)',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      fontWeight: 600,
                    }}
                  >
                    [Bolagsverket Ext. p.12]
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Connector 2 with Multiplication Chain Floating Card */}
          <div className="ubo-connector">
            <div className="ubo-connector-line" style={{ height: '48px' }} />
            <div className="ubo-connector-badge" style={{ backgroundColor: 'var(--secondary)', color: '#ffffff' }}>
              70.0% Direct Equity in Target Entity
            </div>
            <div className="ubo-connector-line" style={{ height: '48px' }} />
            <span className="material-symbols-outlined" style={{ color: 'var(--secondary)', marginTop: '-8px' }}>
              keyboard_arrow_down
            </span>

            {/* Arithmetic Calculation Card */}
            <div className="ubo-math-bubble" style={{ textAlign: 'center', maxWidth: '300px' }}>
              <div style={{ fontSize: '11px', color: 'var(--secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>calculate</span>
                {' '}Multiplication Chain (Decimal Arithmetic)
              </div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--primary)', margin: '4px 0' }}>
                100% × 70.0% = 70.0%
              </div>
              <div style={{ fontSize: '11px', color: 'var(--on-surface-variant)', lineHeight: 1.3 }}>
                Calculated Effective UBO. Exceeds 25% statutory regulatory threshold.
              </div>
            </div>
          </div>

          {/* Node 3: Target Operating Entity */}
          <div
            className="ubo-node"
            style={{
              backgroundColor: 'var(--primary-container)',
              color: '#ffffff',
              borderColor: 'var(--secondary-container)',
              borderWidth: '2px',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '-12px',
                right: '16px',
                background: 'var(--secondary-container)',
                color: '#ffffff',
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '9999px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '11px' }}>flag</span>
              KYC In-Scope Target
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', paddingTop: '4px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '8px',
                  background: 'var(--primary)',
                  color: 'var(--primary-fixed)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>account_balance</span>
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>
                  Veloce FinTech AG
                </span>
                <div style={{ fontSize: '12px', color: 'var(--on-primary-container)', marginTop: '2px' }}>
                  Zurich, Switzerland • CHE-109.281.942
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', fontSize: '11px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary-fixed)' }}>
                    Status: Active Regulated SRO
                  </span>
                  <span style={{ background: 'var(--primary)', padding: '1px 6px', borderRadius: '3px', fontWeight: 700 }}>
                    CH-FINMA
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Branch 2: High Risk Parallel Comparison Branch (Nautilus Offshore BVI) */}
        <div className="card-panel" style={{ margin: 0, padding: '20px', background: 'rgba(255, 218, 214, 0.2)' }}>
          <div
            style={{
              textAlign: 'center',
              borderBottom: '2px solid rgba(186, 26, 26, 0.2)',
              paddingBottom: '10px',
              marginBottom: '20px',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--error)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>warning</span>
            Branch 2: Comparison (30% Unresolved Minority / Nominee Branch)
          </div>

          {/* Node A: Nominee Director */}
          <div className="ubo-node ubo-node-error">
            <div
              style={{
                position: 'absolute',
                top: '-12px',
                left: '16px',
                background: 'var(--error-container)',
                color: 'var(--on-error-container)',
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '9999px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '11px' }}>security_update_warning</span>
              Nominee Director Flagged
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', paddingTop: '4px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '8px',
                  background: 'var(--surface-container)',
                  color: 'var(--error)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>group_off</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--primary)' }}>
                    Trident Nominees Corp
                  </span>
                  <span className="badge-confidence-low">
                    54% CONF
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)', marginTop: '2px' }}>
                  Road Town, BVI • IBC Reg #192083
                </div>
                <div style={{ fontSize: '11px', color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 600 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>warning</span>
                  Mass Corporate Secretary Hit (840 Entities)
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: '12px',
                paddingTop: '8px',
                borderTop: '1px solid var(--outline-variant)',
                display: 'flex',
                justifyContent: 'space-between',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
              }}
            >
              <span style={{ color: 'var(--on-surface-variant)' }}>Direct Holding in Nautilus:</span>
              <span style={{ fontWeight: 700, color: 'var(--error)' }}>100.0% Nominee Proxy</span>
            </div>
          </div>

          {/* Connector Warning */}
          <div className="ubo-connector">
            <div className="ubo-connector-line error" />
            <div className="ubo-connector-badge" style={{ borderColor: 'var(--error)', color: 'var(--error)' }}>
              Bearer Shares Disclosed in By-Laws
            </div>
            <div className="ubo-connector-line error" />
            <span className="material-symbols-outlined" style={{ color: 'var(--error)', marginTop: '-8px' }}>
              keyboard_arrow_down
            </span>
          </div>

          {/* Node B: Nautilus Offshore Ltd */}
          <div className="ubo-node ubo-node-error">
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '8px',
                  background: 'var(--surface-container)',
                  color: 'var(--error)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>domain_disabled</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--primary)' }}>
                    Nautilus Offshore Ltd
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--error)', fontWeight: 700 }}>
                    BVI
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)', marginTop: '2px' }}>
                  Tortola, BVI • Holds 30.0% Equity
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--error)', fontWeight: 600 }}>
                    Jurisdiction Non-Cooperative
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px',
                      background: 'var(--error-container)',
                      color: 'var(--error)',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      fontWeight: 600,
                    }}
                  >
                    [BVI Search p.4]
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Impact Banner */}
          <div
            style={{
              marginTop: '24px',
              padding: '14px',
              borderRadius: '8px',
              backgroundColor: 'var(--error-container)',
              color: 'var(--on-error-container)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              alignItems: 'center',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="material-symbols-outlined">block</span>
              Regulatory Impact: Case Cannot Auto-Approve
            </div>
            <p style={{ fontSize: '12px', margin: 0 }}>
              Physical bearer warrants conceal ultimate economic beneficiary. Enhanced Due Diligence (EDD) mandated.
            </p>
          </div>
        </div>
      </div>

      {/* Tabular Ownership Records */}
      <div className="card-panel" style={{ margin: 0, padding: '16px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--primary)', marginBottom: '12px' }}>
          Registered Shareholder & Control Register
        </h3>
        <table className="compliance-table">
          <thead>
            <tr>
              <th>Legal Holder</th>
              <th>Type</th>
              <th>Target Entity</th>
              <th style={{ textAlign: 'center' }}>Direct Equity</th>
              <th style={{ textAlign: 'center' }}>Effective UBO</th>
              <th>Citation</th>
              <th>Verification Notes</th>
            </tr>
          </thead>
          <tbody>
            {caseData.ubo_holdings.map((u, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{u.holder_name}</td>
                <td>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      background:
                        u.holder_type === 'natural_person'
                          ? '#dcfce7'
                          : u.holder_type === 'nominee'
                          ? '#fee2e2'
                          : 'var(--surface-container)',
                      color:
                        u.holder_type === 'natural_person'
                          ? '#166534'
                          : u.holder_type === 'nominee'
                          ? '#991b1b'
                          : 'var(--primary)',
                      fontWeight: 600,
                    }}
                  >
                    {u.holder_type.toUpperCase()}
                  </span>
                </td>
                <td>{u.target_name}</td>
                <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                  {u.direct_percentage.toFixed(1)}%
                </td>
                <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--secondary)' }}>
                  {u.effective_percentage !== null && u.effective_percentage !== undefined
                    ? `${u.effective_percentage.toFixed(1)}%`
                    : 'N/A'}
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{u.citation}</td>
                <td style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>{u.notes || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
