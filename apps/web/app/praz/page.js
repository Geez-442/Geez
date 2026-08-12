'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '../components/api';
import {
  colors,
  cardStyle,
  glassPanelStyle,
  inputStyle,
  labelStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
  badgeStyle,
  dangerBadgeStyle,
  successBadgeStyle,
  eyebrowStyle,
  formatDate,
} from '../components/styles';
import ZetaFloatingBot from '../components/ZetaFloatingBot';
import ZimbabweTenderMap from '../components/ZimbabweTenderMap';

export default function PrazPortalPage() {
  const [session, setSession] = useState(null);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [flags, setFlags] = useState([]);
  const [stats, setStats] = useState(null);
  const [publishedTenders, setPublishedTenders] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('zets-session');
      const parsed = saved ? JSON.parse(saved) : null;
      setSession(parsed);
      if (parsed?.token) {
        loadPendingUsers(parsed.token);
        loadAuditLogs(parsed.token);
        loadFlags(parsed.token);
        loadStats();
        loadPublishedTenders();
      }
    } catch {
      window.localStorage.removeItem('zets-session');
    }
  }, []);

  async function loadPendingUsers(token) {
    try {
      const data = await apiRequest('/auth/pending', { headers: { Authorization: `Bearer ${token}` } });
      setPendingUsers(Array.isArray(data) ? data : []);
    } catch {
      setPendingUsers([]);
    }
  }

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

  async function loadPublishedTenders() {
    try {
      const data = await apiRequest('/tenders?status=Published');
      setPublishedTenders(Array.isArray(data) ? data : []);
    } catch {
      setPublishedTenders([]);
    }
  }

  async function approveUser(userId) {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await apiRequest(`/auth/approve/${userId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.token}` },
      });
      setMessage('User approved successfully. They can now log in.');
      await loadPendingUsers(session.token);
      await loadAuditLogs(session.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function rejectUser(userId) {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await apiRequest(`/auth/reject/${userId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.token}` },
      });
      setMessage('User registration rejected.');
      await loadPendingUsers(session.token);
      await loadAuditLogs(session.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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
      <main style={{ minHeight: '100vh', padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: colors.onyx }}>
        <div style={{ ...cardStyle, maxWidth: 420, textAlign: 'center' }}>
          <h1 style={{ color: colors.ivory }}>PRAZ Regulator Portal</h1>
          <p style={{ color: colors.donkeyBrown }}>Please sign in to access regulator tools.</p>
          <Link href="/" style={{ ...primaryButtonStyle, textDecoration: 'none', display: 'inline-block', marginTop: 12 }}>Go to login</Link>
        </div>
      </main>
    );
  }

  if (session.user.role !== 'PRAZ_Regulator') {
    return (
      <main style={{ minHeight: '100vh', padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: colors.onyx }}>
        <div style={{ ...cardStyle, maxWidth: 420, textAlign: 'center' }}>
          <h1 style={{ color: colors.ivory }}>Access denied</h1>
          <p style={{ color: colors.donkeyBrown }}>This portal is for PRAZ Regulator accounts only.</p>
          <Link href="/" style={{ ...secondaryButtonStyle, textDecoration: 'none', display: 'inline-block', marginTop: 12 }}>Back to home</Link>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', background: colors.onyx, padding: '0 0 80px' }}>
      {/* Nav */}
      <nav style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: colors.deepForest, border: `1px solid ${colors.donkeyBrown}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: colors.champagne }}>Z</div>
          <span style={{ fontWeight: 700, fontSize: 16, color: colors.ivory }}>PRAZ Oversight Dashboard</span>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link href="/public" style={{ ...secondaryButtonStyle, textDecoration: 'none', fontSize: 13 }}>Transparency</Link>
          <Link href="/" style={{ ...secondaryButtonStyle, textDecoration: 'none', fontSize: 13 }}>Home</Link>
          <button type="button" onClick={() => { window.localStorage.removeItem('zets-session'); window.location.href = '/'; }} style={{ ...secondaryButtonStyle, background: 'transparent', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', fontSize: 13 }}>Logout</button>
        </div>
      </nav>

      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'grid', gap: 24 }}>
        {/* Hero */}
        <div className="glass-panel" style={{ ...glassPanelStyle, borderRadius: 28, padding: 32 }}>
          <p style={{ ...eyebrowStyle, color: colors.champagne }}>PRAZ Regulator Workspace</p>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 44px)', margin: '8px 0 0', color: colors.ivory, fontWeight: 800 }}>Oversight & audit</h1>
          <p style={{ color: colors.donkeyBrown, maxWidth: 600, marginTop: 12, lineHeight: 1.6 }}>
            Review registration requests, monitor the cryptographic audit trail, run anomaly scans, and oversee public procurement transparency across all provinces.
          </p>
        </div>

        {/* Messages */}
        {message && <div className="fade-in-up" style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 14, padding: 14, color: '#86efac', fontSize: 13 }}>{message}</div>}
        {error && <div className="fade-in-up" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 14, padding: 14, color: '#fca5a5', fontSize: 13 }}>{error}</div>}

        {/* Stats row */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
            <StatBox label="Open Tenders" value={stats.tenders?.published ?? 0} color={colors.champagne} />
            <StatBox label="Awarded" value={stats.tenders?.awarded ?? 0} color="#86efac" />
            <StatBox label="Anomaly Flags" value={stats.anomalies?.totalFlags ?? 0} color="#fbbf24" />
            <StatBox label="Pending Review" value={stats.anomalies?.unreviewed ?? 0} color="#fca5a5" />
            <StatBox label="Pending Registrations" value={pendingUsers.length} color={colors.champagne} />
          </div>
        )}

        {/* Pending user approval queue */}
        <div className="glass-card fade-in-up" style={{ borderRadius: 24, padding: 28 }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 18, color: colors.ivory, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>🛡️</span> Pending Registration Requests
          </h2>
          {pendingUsers.length === 0 ? (
            <p style={{ color: colors.donkeyBrown, fontSize: 14 }}>No pending registrations. All accounts are reviewed.</p>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {pendingUsers.map((user) => (
                <div key={user.id} className="glass-card" style={{ padding: 16, borderRadius: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: colors.ivory }}>{user.displayName || user.email}</div>
                    <div style={{ fontSize: 12, color: colors.donkeyBrown, marginTop: 2 }}>
                      {user.email} · <span style={{ color: colors.champagne }}>{user.role}</span>
                    </div>
                    {user.prazVendorNumber && (
                      <div style={{ fontSize: 11, fontFamily: 'monospace', color: colors.donkeyBrown, marginTop: 4 }}>
                        PRAZ ID: {user.prazVendorNumber}
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: colors.donkeyBrown, marginTop: 2 }}>
                      Registered: {formatDate(user.createdAt)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => approveUser(user.id)} disabled={loading} style={{ ...primaryButtonStyle, fontSize: 12, padding: '8px 16px' }}>
                      Approve
                    </button>
                    <button onClick={() => rejectUser(user.id)} disabled={loading} style={{ ...secondaryButtonStyle, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', fontSize: 12, padding: '8px 14px' }}>
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Anomaly map */}
        <ZimbabweTenderMap tenders={publishedTenders} anomalyMode={true} />

        {/* Audit + flags */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 24, alignItems: 'start' }}>
          <div className="glass-card fade-in-up" style={{ borderRadius: 24, padding: 28 }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 18, color: colors.ivory }}>Audit Trail</h2>
            {auditLogs.length === 0 ? (
              <p style={{ color: colors.donkeyBrown }}>No audit events recorded.</p>
            ) : (
              <div style={{ display: 'grid', gap: 10, maxHeight: 400, overflowY: 'auto' }}>
                {auditLogs.map((log, i) => (
                  <div key={i} className="glass-card" style={{ padding: 12, borderRadius: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                      <strong style={{ color: colors.ivory, fontSize: 13 }}>{log.actionType}</strong>
                      <span style={badgeStyle}>{log.actorRole}</span>
                    </div>
                    <div style={{ color: colors.donkeyBrown, fontSize: 11, marginTop: 4 }}>
                      {formatDate(log.timestamp)} · {log.targetType}:{log.targetId?.slice(0, 8)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass-card fade-in-up" style={{ borderRadius: 24, padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 18, color: colors.ivory }}>Anomaly Flags</h2>
              <button onClick={scanAnomalies} disabled={loading} style={{ ...secondaryButtonStyle, fontSize: 12, padding: '6px 12px' }}>Scan Now</button>
            </div>
            {flags.length === 0 ? (
              <p style={{ color: colors.donkeyBrown }}>No anomaly flags detected.</p>
            ) : (
              <div style={{ display: 'grid', gap: 12, maxHeight: 400, overflowY: 'auto' }}>
                {flags.map((flag) => (
                  <div key={flag.id} className="glass-card" style={{ padding: 14, borderRadius: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                      <strong style={{ color: colors.ivory, fontSize: 13 }}>{flag.type}</strong>
                      <span style={flag.severity === 'High' ? dangerBadgeStyle : badgeStyle}>{flag.severity}</span>
                    </div>
                    <div style={{ color: colors.donkeyBrown, fontSize: 12, marginBottom: 8 }}>{flag.description}</div>
                    <div style={{ color: colors.donkeyBrown, fontSize: 11, marginBottom: 8 }}>{formatDate(flag.createdAt)}</div>
                    {!flag.reviewed && (
                      <button onClick={() => reviewFlag(flag.id)} disabled={loading} style={{ ...primaryButtonStyle, fontSize: 12, padding: '6px 14px' }}>
                        Mark Reviewed
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <ZetaFloatingBot session={session} contextHint="praz" />
    </main>
  );
}

function StatBox({ label, value, color }) {
  return (
    <div className="glass-card" style={{ padding: 20, borderRadius: 16, textAlign: 'center' }}>
      <div style={{ fontSize: 32, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 11, color: colors.donkeyBrown, textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 6 }}>{label}</div>
    </div>
  );
}
