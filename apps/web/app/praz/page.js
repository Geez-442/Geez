'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '../components/api';
import { cardStyle, inputStyle, primaryButtonStyle, secondaryButtonStyle, badgeStyle, formatDate } from '../components/styles';
import ZetaChat from '../components/ZetaChat';

export default function PrazPortalPage() {
  const [session, setSession] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [flags, setFlags] = useState([]);
  const [stats, setStats] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('zets-session');
      const parsed = saved ? JSON.parse(saved) : null;
      setSession(parsed);
      if (parsed?.token) {
        loadAuditLogs(parsed.token);
        loadFlags(parsed.token);
        loadStats();
      }
    } catch {
      window.localStorage.removeItem('zets-session');
    }
  }, []);

  async function loadAuditLogs(token) {
    try {
      const data = await apiRequest('/audit/logs?limit=100', { headers: { Authorization: `Bearer ${token}` } });
      setAuditLogs(Array.isArray(data.entries) ? data.entries : []);
    } catch {
      setAuditLogs([]);
    }
  }

  async function loadFlags(token) {
    try {
      const data = await apiRequest('/anomaly/flags?limit=50', { headers: { Authorization: `Bearer ${token}` } });
      setFlags(Array.isArray(data) ? data : []);
    } catch {
      setFlags([]);
    }
  }

  async function loadStats() {
    try {
      const data = await apiRequest('/public/stats');
      setStats(data || null);
    } catch {
      setStats(null);
    }
  }

  async function scanAnomalies() {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await apiRequest('/anomaly/scan?hours=24', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.token}` },
      });
      setMessage('Anomaly scan complete.');
      await loadFlags(session.token);
      await loadAuditLogs(session.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function reviewFlag(id) {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await apiRequest(`/anomaly/flags/${id}/review`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.token}` },
      });
      setMessage('Flag marked as reviewed.');
      await loadFlags(session.token);
      await loadAuditLogs(session.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!session) {
    return (
      <main style={{ minHeight: '100vh', padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ ...cardStyle, maxWidth: 420, textAlign: 'center' }}>
          <h1>PRAZ Regulator portal</h1>
          <p style={{ color: '#b7c6e3' }}>Please sign in on the home page to access regulator tools.</p>
          <Link href="/" style={{ ...primaryButtonStyle, textDecoration: 'none', display: 'inline-block', marginTop: 12 }}>
            Go to login
          </Link>
        </div>
      </main>
    );
  }

  if (session.user.role !== 'PRAZ_Regulator') {
    return (
      <main style={{ minHeight: '100vh', padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ ...cardStyle, maxWidth: 420, textAlign: 'center' }}>
          <h1>Access denied</h1>
          <p style={{ color: '#b7c6e3' }}>This portal is for PRAZ Regulator accounts only.</p>
          <Link href="/" style={{ ...secondaryButtonStyle, textDecoration: 'none', display: 'inline-block', marginTop: 12 }}>
            Back to home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', padding: '40px 20px 64px' }}>
      <nav style={{ maxWidth: 1240, margin: '0 auto 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: 1, color: '#7dd3fc' }}>ZETS PRAZ Portal</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/public" style={{ ...secondaryButtonStyle, textDecoration: 'none' }}>Transparency</Link>
          <Link href="/" style={{ ...secondaryButtonStyle, textDecoration: 'none' }}>Home</Link>
        </div>
      </nav>

      <section style={{ maxWidth: 1240, margin: '0 auto' }}>
        <div style={{ ...cardStyle, borderRadius: 28, padding: 28, marginBottom: 24 }}>
          <p style={{ letterSpacing: 4, textTransform: 'uppercase', color: '#7dd3fc', fontSize: 12, marginTop: 0 }}>
            PRAZ regulator workspace
          </p>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 44px)', margin: '8px 0 0' }}>Oversight & audit</h1>
          <p style={{ color: '#b7c6e3' }}>
            Review the cryptographic audit trail, run anomaly scans, and monitor public procurement transparency metrics.
          </p>
        </div>

        {message && <div style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.24)', borderRadius: 14, padding: 14, color: '#bbf7d0', marginBottom: 16 }}>{message}</div>}
        {error && <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.24)', borderRadius: 14, padding: 14, color: '#fecaca', marginBottom: 16 }}>{error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
          <div style={{ display: 'grid', gap: 20 }}>
            <div style={cardStyle}>
              <h2 style={{ marginTop: 0, fontSize: 20 }}>Audit log</h2>
              {auditLogs.length === 0 ? <p style={{ color: '#94a3b8' }}>No audit events.</p> : (
                <div style={{ display: 'grid', gap: 8, maxHeight: 400, overflowY: 'auto' }}>
                  {auditLogs.map((log, i) => (
                    <div key={i} style={{ background: 'rgba(15,23,42,0.6)', borderRadius: 12, padding: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                        <strong style={{ color: '#e5eefc', fontSize: 13 }}>{log.actionType}</strong>
                        <span style={{ ...badgeStyle, padding: '2px 8px' }}>{log.actorRole}</span>
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>{formatDate(log.timestamp)} · {log.targetType}:{log.targetId}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={cardStyle}>
              <h2 style={{ marginTop: 0, fontSize: 20 }}>Transparency stats</h2>
              {stats && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ background: 'rgba(15,23,42,0.6)', borderRadius: 12, padding: 12, textAlign: 'center' }}>
                    <div style={{ fontSize: 26, fontWeight: 700, color: '#7dd3fc' }}>{stats.tenders?.published ?? 0}</div>
                    <div style={{ color: '#94a3b8', fontSize: 12 }}>Open tenders</div>
                  </div>
                  <div style={{ background: 'rgba(15,23,42,0.6)', borderRadius: 12, padding: 12, textAlign: 'center' }}>
                    <div style={{ fontSize: 26, fontWeight: 700, color: '#4ade80' }}>{stats.tenders?.awarded ?? 0}</div>
                    <div style={{ color: '#94a3b8', fontSize: 12 }}>Awards</div>
                  </div>
                  <div style={{ background: 'rgba(15,23,42,0.6)', borderRadius: 12, padding: 12, textAlign: 'center' }}>
                    <div style={{ fontSize: 26, fontWeight: 700, color: '#f59e0b' }}>{stats.anomalies?.totalFlags ?? 0}</div>
                    <div style={{ color: '#94a3b8', fontSize: 12 }}>Flags</div>
                  </div>
                  <div style={{ background: 'rgba(15,23,42,0.6)', borderRadius: 12, padding: 12, textAlign: 'center' }}>
                    <div style={{ fontSize: 26, fontWeight: 700, color: '#f87171' }}>{stats.anomalies?.unreviewed ?? 0}</div>
                    <div style={{ color: '#94a3b8', fontSize: 12 }}>Pending review</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gap: 20 }}>
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h2 style={{ margin: 0, fontSize: 20 }}>Anomaly flags</h2>
                <button onClick={scanAnomalies} disabled={loading} style={{ ...secondaryButtonStyle, padding: '8px 12px' }}>Scan now</button>
              </div>
              {flags.length === 0 ? <p style={{ color: '#94a3b8' }}>No flags.</p> : (
                <div style={{ display: 'grid', gap: 10, maxHeight: 400, overflowY: 'auto' }}>
                  {flags.map((flag) => (
                    <div key={flag.id} style={{ background: 'rgba(15,23,42,0.6)', borderRadius: 12, padding: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                        <strong style={{ color: '#e5eefc', fontSize: 13 }}>{flag.type}</strong>
                        <span style={{ ...badgeStyle, background: flag.severity === 'High' ? 'rgba(239,68,68,0.12)' : undefined, color: flag.severity === 'High' ? '#fca5a5' : undefined }}>{flag.severity}</span>
                      </div>
                      <div style={{ color: '#b7c6e3', fontSize: 13, marginBottom: 8 }}>{flag.description}</div>
                      <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 8 }}>{formatDate(flag.createdAt)}</div>
                      {!flag.reviewed && (
                        <button onClick={() => reviewFlag(flag.id)} disabled={loading} style={{ ...primaryButtonStyle, padding: '6px 12px', fontSize: 12 }}>Mark reviewed</button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <ZetaChat session={session} placeholder="Ask ZETA about oversight, anomalies, or compliance…" />
          </div>
        </div>
      </section>
    </main>
  );
}
