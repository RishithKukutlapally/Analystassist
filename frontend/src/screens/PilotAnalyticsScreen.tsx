import React, { useState, useEffect } from 'react';
import { MetricsData } from '../types';
import { api } from '../api';

export const PilotAnalyticsScreen: React.FC = () => {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = () => {
    setLoading(true);
    api
      .getMetrics()
      .then((data) => {
        setMetrics(data);
        setError(null);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div
        className="card-panel"
        style={{
          margin: 0,
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: 'var(--surface-container-high)',
                color: 'var(--primary)',
                fontWeight: 700,
              }}
            >
              PILOT METRICS DASHBOARD
            </span>
            <span style={{ fontSize: '13px', color: 'var(--on-surface-variant)' }}>
              Executive Committee & Lead MLRO Oversight
            </span>
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--primary)' }}>
            eKYC Efficiency & Supervisory Accountability Metrics
          </h1>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: '13px' }}>
            Directly computed from immutable audit logs. Measures verification velocity and human oversight rigor.
          </p>
        </div>

        <button className="btn-secondary" onClick={fetchMetrics}>
          <span className="material-symbols-outlined">refresh</span>
          Refresh Metrics
        </button>
      </div>

      {loading ? (
        <div className="card-panel" style={{ padding: '60px', textAlign: 'center' }}>
          Querying pilot audit events...
        </div>
      ) : error ? (
        <div className="card-panel" style={{ padding: '30px', color: 'var(--error)' }}>
          Failed to load pilot metrics: {error}
        </div>
      ) : metrics ? (
        <>
          {/* Three Primary Measures against Targets (Job 7) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            {/* Metric 1: Minutes per File */}
            <div className="card-panel" style={{ margin: 0, padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', color: 'var(--on-surface-variant)', fontWeight: 600 }}>
                  Turnaround Velocity
                </span>
                <span className="badge-confidence-high">TARGET: &lt; 25.0m</span>
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--primary)', margin: '10px 0 4px' }}>
                {metrics.minutes_per_file} mins
              </div>
              <div style={{ fontSize: '13px', color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>bolt</span>
                <span>
                  {Math.round(((metrics.baseline_minutes - metrics.minutes_per_file) / metrics.baseline_minutes) * 100)}% time reduction
                </span>
              </div>
              <div
                style={{
                  marginTop: '14px',
                  paddingTop: '10px',
                  borderTop: '1px solid var(--outline-variant)',
                  fontSize: '11px',
                  color: 'var(--on-surface-variant)',
                }}
              >
                <em>*Manual Baseline Assumption: 180.0 minutes per complex corporate file (50 pages).</em>
              </div>
            </div>

            {/* Metric 2: Field Correction Rate */}
            <div className="card-panel" style={{ margin: 0, padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', color: 'var(--on-surface-variant)', fontWeight: 600 }}>
                  Analyst Correction Rate
                </span>
                <span className="badge-confidence-high">TARGET: &lt; 8.0%</span>
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--secondary)', margin: '10px 0 4px' }}>
                {(metrics.field_correction_rate * 100).toFixed(1)}%
              </div>
              <div style={{ fontSize: '13px', color: 'var(--on-surface-variant)' }}>
                {metrics.corrected_fields} corrections across {metrics.total_fields} evaluated fields
              </div>
              <div
                style={{
                  marginTop: '14px',
                  paddingTop: '10px',
                  borderTop: '1px solid var(--outline-variant)',
                  fontSize: '11px',
                  color: 'var(--on-surface-variant)',
                }}
              >
                Sum of human edits and rejections divided by total verified decisions.
              </div>
            </div>

            {/* Metric 3: Citation Click-Through */}
            <div className="card-panel" style={{ margin: 0, padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', color: 'var(--on-surface-variant)', fontWeight: 600 }}>
                  Citation Click-Through Rate
                </span>
                <span className="badge-confidence-high">TARGET: &gt; 85.0%</span>
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#16a34a', margin: '10px 0 4px' }}>
                {(metrics.citation_click_through * 100).toFixed(1)}%
              </div>
              <div style={{ fontSize: '13px', color: '#16a34a', fontWeight: 600 }}>
                {metrics.citations_opened} citations opened before override
              </div>
              <div
                style={{
                  marginTop: '14px',
                  paddingTop: '10px',
                  borderTop: '1px solid var(--outline-variant)',
                  fontSize: '11px',
                  color: 'var(--on-surface-variant)',
                }}
              >
                Proves analysts diligently inspect source text before accepting or overriding candidates.
              </div>
            </div>
          </div>

          {/* Pilot Summary Table */}
          <div className="card-panel" style={{ margin: 0, padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--primary)', marginBottom: '14px' }}>
              Verification Enclave Operational Status
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
              <div style={{ padding: '12px', background: 'var(--surface-container-low)', borderRadius: '6px' }}>
                <div style={{ fontSize: '11px', color: 'var(--on-surface-variant)' }}>Total Ingested Cases</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--primary)', marginTop: '4px' }}>
                  {metrics.total_cases}
                </div>
              </div>
              <div style={{ padding: '12px', background: 'var(--surface-container-low)', borderRadius: '6px' }}>
                <div style={{ fontSize: '11px', color: 'var(--on-surface-variant)' }}>Signed & Staged Cases</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#16a34a', marginTop: '4px' }}>
                  {metrics.signed_cases}
                </div>
              </div>
              <div style={{ padding: '12px', background: 'var(--surface-container-low)', borderRadius: '6px' }}>
                <div style={{ fontSize: '11px', color: 'var(--on-surface-variant)' }}>Total Extracted Fields</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--primary)', marginTop: '4px' }}>
                  {metrics.total_fields}
                </div>
              </div>
              <div style={{ padding: '12px', background: 'var(--surface-container-low)', borderRadius: '6px' }}>
                <div style={{ fontSize: '11px', color: 'var(--on-surface-variant)' }}>Core Banking Isolation</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--secondary)', marginTop: '6px' }}>
                  Zero Autonomous Output
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
