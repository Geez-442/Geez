'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '../components/api';
import { cardStyle, inputStyle, primaryButtonStyle, secondaryButtonStyle, badgeStyle, formatDate } from '../components/styles';
import ZetaChat from '../components/ZetaChat';

export default function PmuPortalPage() {
  const [session, setSession] = useState(null);
  const [tenders, setTenders] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [flags, setFlags] = useState([]);
  const [reviewedTender, setReviewedTender] = useState(null);
  const [tenderForm, setTenderForm] = useState({
    title: '',
    description: '',
    tenderType: 'Goods',
    procuringEntity: '',
    budget: '',
    currency: 'ZWL',
    deadline: '',
  });
  const [reviewForm, setReviewForm] = useState({ tenderId: '' });
  const [awardForm, setAwardForm] = useState({ awardedBidId: '', awardDecisionNote: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('zets-session');
      const parsed = saved ? JSON.parse(saved) : null;
      setSession(parsed);
      if (parsed?.token) {
        loadTenders();
        loadAuditLogs(parsed.token);
        loadFlags(parsed.token);
      }
    } catch {
      window.localStorage.removeItem('zets-session');
    }
  }, []);

  async function loadTenders() {
    try {
      const data = await apiRequest('/tenders');
      setTenders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadAuditLogs(token) {
    try {
      const data = await apiRequest('/audit/logs?limit=50', { headers: { Authorization: `Bearer ${token}` } });
      setAuditLogs(Array.isArray(data.entries) ? data.entries : []);
    } catch {
      setAuditLogs([]);
    }
  }

  async function loadFlags(token) {
    try {
      const data = await apiRequest('/anomaly/flags?limit=20', { headers: { Authorization: `Bearer ${token}` } });
      setFlags(Array.isArray(data) ? data : []);
    } catch {
      setFlags([]);
    }
  }

  async function createTender(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const body = {
        ...tenderForm,
        budget: tenderForm.budget ? Number(tenderForm.budget) : undefined,
        deadline: tenderForm.deadline ? new Date(tenderForm.deadline).toISOString() : undefined,
      };
      await apiRequest('/tenders', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.token}` },
        body: JSON.stringify(body),
      });
      setMessage('Tender created.');
      setTenderForm({ title: '', description: '', tenderType: 'Goods', procuringEntity: '', budget: '', currency: 'ZWL', deadline: '' });
      await loadTenders();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function publishTender(id) {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await apiRequest(`/tenders/${id}/publish`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.token}` },
      });
      setMessage('Tender published.');
      await loadTenders();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function reviewTender(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    setReviewedTender(null);
    try {
      const data = await apiRequest(`/evaluation/tenders/${reviewForm.tenderId.trim()}/review`, {
        headers: { Authorization: `Bearer ${session.token}` },
      });
      setReviewedTender(data);
      setAwardForm({ awardedBidId: data.bids?.[0]?.id || '', awardDecisionNote: '' });
      setMessage('Tender review loaded.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function awardTender(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await apiRequest(`/evaluation/tenders/${reviewForm.tenderId.trim()}/award`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.token}` },
        body: JSON.stringify(awardForm),
      });
      setMessage('Award decision saved.');
      await reviewTender({ preventDefault() {} });
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

  if (!session) {
    return (
      <main style={{ minHeight: '100vh', padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ ...cardStyle, maxWidth: 420, textAlign: 'center' }}>
          <h1>PMU Officer portal</h1>
          <p style={{ color: '#b7c6e3' }}>Please sign in on the home page to access PMU tools.</p>
          <Link href="/" style={{ ...primaryButtonStyle, textDecoration: 'none', display: 'inline-block', marginTop: 12 }}>
            Go to login
          </Link>
        </div>
      </main>
    );
  }

  if (session.user.role !== 'PMU_Officer') {
    return (
      <main style={{ minHeight: '100vh', padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ ...cardStyle, maxWidth: 420, textAlign: 'center' }}>
          <h1>Access denied</h1>
          <p style={{ color: '#b7c6e3' }}>This portal is for PMU Officer accounts only.</p>
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
        <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: 1, color: '#7dd3fc' }}>ZETS PMU Portal</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link href="/public" style={{ ...secondaryButtonStyle, textDecoration: 'none' }}>Transparency</Link>
          <Link href="/" style={{ ...secondaryButtonStyle, textDecoration: 'none' }}>Home</Link>
          <button
            type="button"
            onClick={() => { window.localStorage.removeItem('zets-session'); window.location.href = '/'; }}
            style={{ ...secondaryButtonStyle, background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', color: '#fecaca' }}
          >
            Logout
          </button>
        </div>
      </nav>

      <section style={{ maxWidth: 1240, margin: '0 auto' }}>
        <div style={{ ...cardStyle, borderRadius: 28, padding: 28, marginBottom: 24 }}>
          <p style={{ letterSpacing: 4, textTransform: 'uppercase', color: '#7dd3fc', fontSize: 12, marginTop: 0 }}>
            PMU Officer workspace
          </p>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 44px)', margin: '8px 0 0' }}>Publish and award tenders</h1>
          <p style={{ color: '#b7c6e3' }}>
            Create tender notices, publish opportunities, review sealed bids after deadlines, and record award decisions.
          </p>
        </div>

        {message && <div style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.24)', borderRadius: 14, padding: 14, color: '#bbf7d0', marginBottom: 16 }}>{message}</div>}
        {error && <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.24)', borderRadius: 14, padding: 14, color: '#fecaca', marginBottom: 16 }}>{error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20, alignItems: 'start' }}>
          <div style={{ display: 'grid', gap: 20 }}>
            <div style={cardStyle}>
              <h2 style={{ marginTop: 0, fontSize: 20 }}>Create tender</h2>
              <form onSubmit={createTender} style={{ display: 'grid', gap: 12 }}>
                <input value={tenderForm.title} onChange={(e) => setTenderForm({ ...tenderForm, title: e.target.value })} style={inputStyle} placeholder="Title" required />
                <textarea value={tenderForm.description} onChange={(e) => setTenderForm({ ...tenderForm, description: e.target.value })} style={inputStyle} rows={2} placeholder="Description" />
                <input value={tenderForm.procuringEntity} onChange={(e) => setTenderForm({ ...tenderForm, procuringEntity: e.target.value })} style={inputStyle} placeholder="Procuring entity" required />
                <select value={tenderForm.tenderType} onChange={(e) => setTenderForm({ ...tenderForm, tenderType: e.target.value })} style={inputStyle}>
                  <option>Goods</option>
                  <option>Services</option>
                  <option>Works</option>
                  <option>Consultancy</option>
                  <option>IT</option>
                </select>
                <input type="number" value={tenderForm.budget} onChange={(e) => setTenderForm({ ...tenderForm, budget: e.target.value })} style={inputStyle} placeholder="Budget" />
                <input type="datetime-local" value={tenderForm.deadline} onChange={(e) => setTenderForm({ ...tenderForm, deadline: e.target.value })} style={inputStyle} />
                <button type="submit" disabled={loading} style={{ ...primaryButtonStyle, width: 'fit-content' }}>Create tender</button>
              </form>
            </div>

            <div style={cardStyle}>
              <h2 style={{ marginTop: 0, fontSize: 20 }}>Tenders</h2>
              {tenders.length === 0 ? <p style={{ color: '#94a3b8' }}>No tenders.</p> : (
                <div style={{ display: 'grid', gap: 12 }}>
                  {tenders.map((tender) => (
                    <div key={tender.id} style={{ background: 'rgba(15,23,42,0.6)', borderRadius: 14, padding: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
                        <strong style={{ color: '#e5eefc' }}>{tender.title}</strong>
                        <span style={badgeStyle}>{tender.status}</span>
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 8 }}>Deadline: {formatDate(tender.deadline)}</div>
                      {tender.status === 'Draft' && (
                        <button onClick={() => publishTender(tender.id)} disabled={loading} style={primaryButtonStyle}>Publish</button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gap: 20 }}>
            <div style={cardStyle}>
              <h2 style={{ marginTop: 0, fontSize: 20 }}>Award a tender</h2>
              <form onSubmit={reviewTender} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <input value={reviewForm.tenderId} onChange={(e) => setReviewForm({ ...reviewForm, tenderId: e.target.value })} style={inputStyle} placeholder="Tender ID" required />
                <button type="submit" disabled={loading} style={primaryButtonStyle}>Load</button>
              </form>
              {reviewedTender && (
                <div style={{ background: 'rgba(15,23,42,0.6)', borderRadius: 14, padding: 16 }}>
                  <div style={{ marginBottom: 8, color: '#e5eefc' }}><strong>{reviewedTender.title}</strong></div>
                  <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 10 }}>{reviewedTender.bids?.length || 0} sealed bid(s)</div>
                  <form onSubmit={awardTender} style={{ display: 'grid', gap: 10 }}>
                    <select value={awardForm.awardedBidId} onChange={(e) => setAwardForm({ ...awardForm, awardedBidId: e.target.value })} style={inputStyle} required>
                      <option value="">Select bid</option>
                      {reviewedTender.bids?.map((bid) => <option key={bid.id} value={bid.id}>{bid.id} — {bid.supplierId}</option>)}
                    </select>
                    <textarea value={awardForm.awardDecisionNote} onChange={(e) => setAwardForm({ ...awardForm, awardDecisionNote: e.target.value })} style={inputStyle} placeholder="Award decision note" required />
                    <button type="submit" disabled={loading} style={primaryButtonStyle}>Award tender</button>
                  </form>
                </div>
              )}
            </div>

            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h2 style={{ margin: 0, fontSize: 20 }}>Oversight</h2>
                <button onClick={scanAnomalies} disabled={loading} style={{ ...secondaryButtonStyle, padding: '8px 12px' }}>Scan anomalies</button>
              </div>
              <h3 style={{ fontSize: 14, color: '#93c5fd', marginBottom: 8 }}>Recent anomaly flags</h3>
              {flags.length === 0 ? <p style={{ color: '#94a3b8' }}>No flags.</p> : (
                <div style={{ display: 'grid', gap: 10, maxHeight: 240, overflowY: 'auto' }}>
                  {flags.map((flag) => (
                    <div key={flag.id} style={{ background: 'rgba(15,23,42,0.6)', borderRadius: 12, padding: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                        <strong style={{ color: '#e5eefc', fontSize: 13 }}>{flag.type}</strong>
                        <span style={{ ...badgeStyle, background: flag.severity === 'High' ? 'rgba(239,68,68,0.12)' : undefined, color: flag.severity === 'High' ? '#fca5a5' : undefined }}>{flag.severity}</span>
                      </div>
                      <div style={{ color: '#b7c6e3', fontSize: 13, marginTop: 4 }}>{flag.description}</div>
                    </div>
                  ))}
                </div>
              )}
              <h3 style={{ fontSize: 14, color: '#93c5fd', marginBottom: 8, marginTop: 16 }}>Recent audit events</h3>
              {auditLogs.length === 0 ? <p style={{ color: '#94a3b8' }}>No audit events.</p> : (
                <div style={{ display: 'grid', gap: 8, maxHeight: 200, overflowY: 'auto' }}>
                  {auditLogs.slice(0, 10).map((log, i) => (
                    <div key={i} style={{ color: '#b7c6e3', fontSize: 12, background: 'rgba(15,23,42,0.6)', borderRadius: 10, padding: 10 }}>
                      <strong>{log.actionType}</strong> by {log.actorRole} on {formatDate(log.timestamp)}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <ZetaChat session={session} placeholder="Ask ZETA about evaluation, awards, or compliance…" />
          </div>
        </div>
      </section>
    </main>
  );
}
