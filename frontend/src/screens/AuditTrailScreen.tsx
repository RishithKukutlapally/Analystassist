import React, { useState, useEffect } from 'react';
import { AuditEventItem } from '../types';
import { api } from '../api';

interface AuditTrailScreenProps {
  caseId: string;
  entityName: string;
  onSelectCase: (caseId: string, screen: string) => void;
}

export const AuditTrailScreen: React.FC<AuditTrailScreenProps> = ({
  caseId,
  entityName,
  onSelectCase,
}) => {
  const [events, setEvents] = useState<AuditEventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchAudit = () => {
    setLoading(true);
    api
      .getCaseAudit(caseId)
      .then((data) => {
        setEvents(data);
        setError(null);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAudit();
  }, [caseId]);

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
              #{caseId}
            </span>
            <span style={{ fontSize: '13px', color: 'var(--on-surface-variant)' }}>
              Entity: <strong>{entityName}</strong>
            </span>
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--primary)' }}>
            Cryptographically Chained Append-Only Audit Trail
          </h1>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: '13px' }}>
            Strictly immutable event record. Updates and deletions are barred by engine level database triggers.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button className="btn-secondary" onClick={fetchAudit}>
            <span className="material-symbols-outlined">refresh</span>
            Refresh Log
          </button>
          <button
            className="btn-primary"
            onClick={() => onSelectCase(caseId, 'active-review')}
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Back to Case Review
          </button>
        </div>
      </div>

      {/* Security Certification Banner */}
      <div
        style={{
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '8px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px',
          color: '#1d4ed8',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="material-symbols-outlined">lock</span>
          <span>
            <strong>Zero Autonomous Output Guarantee:</strong> AI proposals are strictly non-authoritative until verified and signed by an accredited officer.
          </span>
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
          {events.length} Events Logged
        </span>
      </div>

      {/* Audit Log Table */}
      <div className="data-table-container">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
            Querying immutable audit log...
          </div>
        ) : error ? (
          <div style={{ padding: '30px', color: 'var(--error)' }}>
            Failed to load audit records: {error}
          </div>
        ) : events.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
            No audit events found for this case.
          </div>
        ) : (
          <table className="compliance-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>ID</th>
                <th style={{ width: '190px' }}>Timestamp (UTC)</th>
                <th style={{ width: '100px', textAlign: 'center' }}>Actor</th>
                <th style={{ width: '220px' }}>Action</th>
                <th>Payload Summary</th>
                <th style={{ width: '80px', textAlign: 'right' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => {
                const isExpanded = expandedId === ev.id;
                const formattedDate = new Date(ev.timestamp).toLocaleString();

                return (
                  <React.Fragment key={ev.id}>
                    <tr>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--on-surface-variant)' }}>
                        #{ev.id}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                        {formattedDate}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            textTransform: 'uppercase',
                            backgroundColor:
                              ev.actor === 'ai'
                                ? 'var(--surface-container-high)'
                                : ev.actor === 'mlro'
                                ? '#ffdcc3'
                                : 'var(--secondary-fixed)',
                            color:
                              ev.actor === 'ai'
                                ? 'var(--primary)'
                                : ev.actor === 'mlro'
                                ? '#6e3900'
                                : 'var(--on-secondary-fixed)',
                          }}
                        >
                          {ev.actor}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--primary)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                          {ev.action}
                        </span>
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--on-surface)' }}>
                        <div style={{ maxWidth: '480px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {typeof ev.payload === 'object'
                            ? JSON.stringify(ev.payload)
                            : String(ev.payload)}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn-secondary"
                          style={{ padding: '3px 8px', fontSize: '11px' }}
                          onClick={() => setExpandedId(isExpanded ? null : ev.id)}
                        >
                          {isExpanded ? 'Hide' : 'Inspect'}
                        </button>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr style={{ backgroundColor: 'var(--surface-container-low)' }}>
                        <td colSpan={6} style={{ padding: '12px 16px' }}>
                          <pre
                            style={{
                              backgroundColor: '#0f172a',
                              color: '#38bdf8',
                              padding: '12px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontFamily: 'var(--font-mono)',
                              overflowX: 'auto',
                              margin: 0,
                            }}
                          >
                            {JSON.stringify(ev.payload, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
