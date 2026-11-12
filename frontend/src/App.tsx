import React, { useState, useEffect } from 'react';
import { api } from './api';
import { CaseSummary, CaseDetail } from './types';
import { CaseQueueScreen } from './screens/CaseQueueScreen';
import { CaseReviewWorkspaceScreen } from './screens/CaseReviewWorkspaceScreen';
import { OwnershipStructureScreen } from './screens/OwnershipStructureScreen';
import { ExceptionReviewScreen } from './screens/ExceptionReviewScreen';
import { AuditTrailScreen } from './screens/AuditTrailScreen';
import { PilotAnalyticsScreen } from './screens/PilotAnalyticsScreen';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('case-queue');
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [casesLoading, setCasesLoading] = useState(true);
  const [casesError, setCasesError] = useState<string | null>(null);

  // Active case detail
  const [activeCaseId, setActiveCaseId] = useState<string>('CASE-2024-8841');
  const [activeCaseData, setActiveCaseData] = useState<CaseDetail | null>(null);
  const [caseDetailLoading, setCaseDetailLoading] = useState(false);

  // Fetch all cases
  const loadCases = () => {
    setCasesLoading(true);
    api
      .getCases()
      .then((data) => {
        setCases(data);
        setCasesError(null);
        setCasesLoading(false);
        if (data.length > 0 && !data.some((c) => c.id === activeCaseId)) {
          setActiveCaseId(data[0].id);
        }
      })
      .catch((err) => {
        setCasesError(err.message);
        setCasesLoading(false);
      });
  };

  // Fetch active case details
  const loadActiveCase = (id: string) => {
    setCaseDetailLoading(true);
    api
      .getCase(id)
      .then((detail) => {
        setActiveCaseData(detail);
        setCaseDetailLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load active case:', err);
        setCaseDetailLoading(false);
      });
  };

  useEffect(() => {
    loadCases();
  }, []);

  useEffect(() => {
    if (activeCaseId) {
      loadActiveCase(activeCaseId);
    }
  }, [activeCaseId]);

  const handleSelectCase = (caseId: string, targetScreen: string = 'active-review') => {
    setActiveCaseId(caseId);
    setActiveTab(targetScreen);
  };

  const handleResetSeed = async () => {
    try {
      await api.resetSeed();
      loadCases();
      if (activeCaseId) {
        loadActiveCase(activeCaseId);
      }
      alert('Database successfully reset and re-seeded with 4 synthetic KYC test cases.');
    } catch (err: any) {
      alert(`Reset error: ${err.message}`);
    }
  };

  const activeCaseSummary = cases.find((c) => c.id === activeCaseId) || cases[0];
  const exceptionCount = cases.filter((c) => c.status === 'exception').length;

  return (
    <div className="app-container">
      {/* Top Header */}
      <header className="top-header">
        <div className="brand-section">
          <div className="brand-logo-badge">NORTHGATE</div>
          <span style={{ width: '1px', height: '22px', backgroundColor: 'rgba(255,255,255,0.2)' }} />
          <span className="brand-title">KYC Analyst Assist</span>
          <span className="brand-tag">PROD-REGULATORY-V4.2</span>
        </div>

        <div className="header-status-strip">
          <div className="status-badge">
            <span className="status-dot-pulse" />
            <span style={{ color: 'var(--primary-fixed)' }}>AI Engine v2.4: Online</span>
          </div>

          <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ffffff' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--primary-fixed)' }}>
              verified_user
            </span>
            <span>Guardrails Active</span>
          </div>

          <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: 'var(--secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '11px',
              }}
            >
              SJ
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
              <span style={{ fontWeight: 600, fontSize: '12px' }}>Sarah Jenkins, CAMS</span>
              <span style={{ fontSize: '10px', color: 'var(--on-primary-container)' }}>Senior Compliance Analyst</span>
            </div>
          </div>
        </div>
      </header>

      {/* Sub Navigation Bar */}
      <nav className="sub-nav-bar">
        <div className="nav-links">
          <button
            className={`nav-tab-btn ${activeTab === 'case-queue' ? 'active' : ''}`}
            onClick={() => setActiveTab('case-queue')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>view_list</span>
            Case Queue
          </button>

          <button
            className={`nav-tab-btn ${activeTab === 'active-review' ? 'active' : ''}`}
            onClick={() => setActiveTab('active-review')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>fact_check</span>
            Active Review ({activeCaseSummary ? activeCaseSummary.entity_name : 'No Case'})
          </button>

          <button
            className={`nav-tab-btn ${activeTab === 'ownership-structure' ? 'active' : ''}`}
            onClick={() => setActiveTab('ownership-structure')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>account_tree</span>
            Ownership Structure
          </button>

          <button
            className={`nav-tab-btn ${activeTab === 'exception-review' ? 'active' : ''}`}
            onClick={() => setActiveTab('exception-review')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>warning</span>
            Exception Review {exceptionCount > 0 && `(${exceptionCount} Flag)`}
          </button>

          <button
            className={`nav-tab-btn ${activeTab === 'audit-trail' ? 'active' : ''}`}
            onClick={() => setActiveTab('audit-trail')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>history</span>
            Audit Trail
          </button>

          <button
            className={`nav-tab-btn ${activeTab === 'pilot-analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('pilot-analytics')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>analytics</span>
            Pilot Analytics
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={handleResetSeed}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              padding: '3px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
            }}
            title="Reset database to the 4 synthetic cases"
          >
            Reset Seed Data
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--on-primary-container)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>lock</span>
            <span>Bank Grade AML/KYC Enclave</span>
          </div>
        </div>
      </nav>

      {/* Main Layout Body */}
      <div className="app-body">
        {/* Persistent Left Sidebar */}
        <aside className="left-sidebar">
          <div>
            <div className="sidebar-section-title">Active Case Entity</div>
            <div className="active-case-card">
              <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {activeCaseSummary?.entity_name || 'No case selected'}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--on-surface-variant)', marginTop: '2px' }}>
                {activeCaseSummary?.id || ''}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '11px', fontWeight: 600, color: 'var(--secondary)' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--secondary)' }} />
                <span>In Progress: Phase 2</span>
              </div>
            </div>

            <div className="sidebar-section-title">Verification Checklist</div>
            <div className="checklist-item">
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--secondary)' }}>
                  check_circle
                </span>
                Certificate of Inc.
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--on-surface-variant)' }}>
                99.1%
              </span>
            </div>

            <div className="checklist-item">
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--secondary)' }}>
                  check_circle
                </span>
                Articles of Assoc.
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--on-surface-variant)' }}>
                94.6%
              </span>
            </div>

            <div className="checklist-item">
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: '16px', color: activeCaseSummary?.is_flagged ? 'var(--error)' : 'var(--secondary)' }}
                >
                  {activeCaseSummary?.is_flagged ? 'error' : 'check_circle'}
                </span>
                UBO Disclosure
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: activeCaseSummary?.is_flagged ? 'var(--error)' : 'var(--on-surface-variant)',
                }}
              >
                {activeCaseSummary?.is_flagged ? 'FLAGGED' : '95.8%'}
              </span>
            </div>

            <div className="checklist-item">
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--on-surface-variant)' }}>
                  pending
                </span>
                OFAC & PEP List
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--on-surface-variant)' }}>
                QUEUED
              </span>
            </div>
          </div>

          <div style={{ paddingTop: '14px', borderTop: '1px solid var(--outline-variant)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--on-surface-variant)', marginBottom: '4px' }}>
              <span>Review SLA</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--on-surface)' }}>
                {activeCaseSummary?.sla_time || '01:45:12'}
              </span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'var(--surface-container-high)', borderRadius: '9999px', overflow: 'hidden' }}>
              <div style={{ width: '66%', height: '100%', background: 'var(--secondary)' }} />
            </div>
          </div>
        </aside>

        {/* Main Content Viewport */}
        <main className="main-content">
          {activeTab === 'case-queue' && (
            <CaseQueueScreen
              cases={cases}
              loading={casesLoading}
              error={casesError}
              onSelectCase={handleSelectCase}
              onRefresh={loadCases}
            />
          )}

          {activeTab === 'active-review' && (
            activeCaseData ? (
              <CaseReviewWorkspaceScreen
                caseData={activeCaseData}
                onRefreshCase={() => loadActiveCase(activeCaseId)}
                onSelectCase={handleSelectCase}
              />
            ) : (
              <div className="card-panel" style={{ padding: '60px', textAlign: 'center' }}>
                {caseDetailLoading ? 'Loading case workspace...' : 'Please select a case from the queue.'}
              </div>
            )
          )}

          {activeTab === 'ownership-structure' && (
            activeCaseData ? (
              <OwnershipStructureScreen
                caseData={activeCaseData}
                onSelectCase={handleSelectCase}
              />
            ) : (
              <div className="card-panel" style={{ padding: '60px', textAlign: 'center' }}>
                No case selected.
              </div>
            )
          )}

          {activeTab === 'exception-review' && (
            activeCaseData ? (
              <ExceptionReviewScreen
                caseData={activeCaseData}
                onRefreshCase={() => {
                  loadCases();
                  loadActiveCase(activeCaseId);
                }}
                onSelectCase={handleSelectCase}
              />
            ) : (
              <div className="card-panel" style={{ padding: '60px', textAlign: 'center' }}>
                No exception case selected.
              </div>
            )
          )}

          {activeTab === 'audit-trail' && (
            <AuditTrailScreen
              caseId={activeCaseId}
              entityName={activeCaseSummary?.entity_name || ''}
              onSelectCase={handleSelectCase}
            />
          )}

          {activeTab === 'pilot-analytics' && (
            <PilotAnalyticsScreen />
          )}
        </main>
      </div>
    </div>
  );
};
