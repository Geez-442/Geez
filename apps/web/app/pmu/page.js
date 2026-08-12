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
  formatCurrency,
} from '../components/styles';
import AiFormAssist from '../components/AiFormAssist';
import ZetaFloatingBot from '../components/ZetaFloatingBot';

const TABS = [
  { id: 'create', label: 'Draft Tender', icon: '📝' },
  { id: 'tenders', label: 'Active Tenders', icon: '📋' },
  { id: 'evaluate', label: 'Evaluate Bids', icon: '⚖️' },
  { id: 'oversight', label: 'Oversight', icon: '🛡️' },
];

export default function PmuPortalPage() {
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState('create');
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
  const [aiPreCheck, setAiPreCheck] = useState('');

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

  // ZETA AI pre-check: analyze tender form before submission
  function runAiPreCheck() {
    const checks = [];
    if (!tenderForm.title.trim()) checks.push('⚠️ Title is required');
    if (!tenderForm.procuringEntity.trim()) checks.push('⚠️ Procuring entity is required');
    if (tenderForm.budget) {
      const budget = Number(tenderForm.budget);
      if (budget >= 50000) checks.push('ℹ️ Budget exceeds competitive bidding threshold — open tender required');
      if (budget >= 500000) checks.push('🚨 Major procurement — PRAZ oversight recommended');
    }
    if (tenderForm.deadline) {
      const deadline = new Date(tenderForm.deadline);
      const now = new Date();
      const days = (deadline - now) / (1000 * 60 * 60 * 24);
      if (days < 14) checks.push('⚠️ Deadline is less than 14 days away — PRAZ recommends minimum 14-day window');
      if (days < 0) checks.push('🚨 Deadline is in the past');
    }
    if (checks.length === 0) {
      setAiPreCheck('✅ ZETA Pre-Check Passed: All compliance checks satisfied. Ready to create tender.');
    } else {
      setAiPreCheck(checks.join('\n'));
    }
  }

  async function createTender(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const body = {
        title: tenderForm.title,
        description: tenderForm.description || undefined,
        tenderType: tenderForm.tenderType,
        procuringEntity: tenderForm.procuringEntity,
        budget: tenderForm.budget ? Number(tenderForm.budget) : undefined,
        currency: tenderForm.currency || 'ZWL',
        deadline: tenderForm.deadline ? new Date(tenderForm.deadline).toISOString() : undefined,
      };
      Object.keys(body).forEach((k) => body[k] === undefined && delete body[k]);
      await apiRequest('/tenders', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.token}` },
        body: JSON.stringify(body),
      });
      setMessage('Tender created successfully. You can publish it from the Active Tenders tab.');
      setTenderForm({ title: '', description: '', tenderType: 'Goods', procuringEntity: '', budget: '', currency: 'ZWL', deadline: '' });
      setAiPreCheck('');
      await loadTenders();
      setActiveTab('tenders');
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
      setMessage('Tender published — suppliers can now bid.');
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
      setMessage('Award decision saved and recorded in the audit trail.');
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
      <main style={{ minHeight: '100vh', padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: colors.onyx }}>
        <div style={{ ...cardStyle, maxWidth: 420, textAlign: 'center' }}>
          <h1 style={{ color: colors.ivory }}>PMU Officer Portal</h1>
          <p style={{ color: colors.donkeyBrown }}>Please sign in to access PMU tools.</p>
          <Link href="/" style={{ ...primaryButtonStyle, textDecoration: 'none', display: 'inline-block', marginTop: 12 }}>Go to login</Link>
        </div>
      </main>
    );
  }

  if (session.user.role !== 'PMU_Officer') {
    return (
      <main style={{ minHeight: '100vh', padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: colors.onyx }}>
        <div style={{ ...cardStyle, maxWidth: 420, textAlign: 'center' }}>
          <h1 style={{ color: colors.ivory }}>Access denied</h1>
          <p style={{ color: colors.donkeyBrown }}>This portal is for PMU Officer accounts only.</p>
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
          <span style={{ fontWeight: 700, fontSize: 16, color: colors.ivory }}>PMU Command Center</span>
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
          <p style={{ ...eyebrowStyle, color: colors.champagne }}>PMU Officer Workspace</p>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 44px)', margin: '8px 0 0', color: colors.ivory, fontWeight: 800 }}>Publish and award tenders</h1>
          <p style={{ color: colors.donkeyBrown, maxWidth: 600, marginTop: 12, lineHeight: 1.6 }}>
            Create tender notices with AI-assisted compliance checks, publish opportunities, review sealed bids after deadlines, and record award decisions.
          </p>
        </div>

        {/* Messages */}
        {message && <div className="fade-in-up" style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 14, padding: 14, color: '#86efac', fontSize: 13 }}>{message}</div>}
        {error && <div className="fade-in-up" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 14, padding: 14, color: '#fca5a5', fontSize: 13 }}>{error}</div>}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, background: 'rgba(15,17,21,0.6)', borderRadius: 14, padding: 4, flexWrap: 'wrap' }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: '1 1 auto',
                padding: '10px 16px',
                borderRadius: 10,
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 13,
                background: activeTab === tab.id ? colors.deepForest : 'transparent',
                color: activeTab === tab.id ? colors.ivory : colors.donkeyBrown,
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                minWidth: 120,
              }}
            >
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'create' && (
          <div className="glass-card fade-in-up" style={{ borderRadius: 24, padding: 28 }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 20, color: colors.ivory }}>Create New Tender</h2>
            <form onSubmit={createTender} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <AiFormAssist label="Tender Title" name="title" value={tenderForm.title} onChange={(e) => setTenderForm({ ...tenderForm, title: e.target.value })} placeholder="e.g. Supply of Medical Equipment" required aiMode="title" />
              <AiFormAssist label="Description" name="description" value={tenderForm.description} onChange={(e) => setTenderForm({ ...tenderForm, description: e.target.value })} placeholder="Detailed scope of work..." aiMode="default" rows={3} />
              <AiFormAssist label="Procuring Entity" name="procuringEntity" value={tenderForm.procuringEntity} onChange={(e) => setTenderForm({ ...tenderForm, procuringEntity: e.target.value })} placeholder="e.g. Ministry of Health" required aiMode="title" />
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Tender Type</label>
                <select value={tenderForm.tenderType} onChange={(e) => setTenderForm({ ...tenderForm, tenderType: e.target.value })} style={inputStyle}>
                  <option>Goods</option><option>Services</option><option>Works</option><option>Consultancy</option><option>IT</option>
                </select>
              </div>
              <AiFormAssist label="Estimated Budget" name="budget" type="number" value={tenderForm.budget} onChange={(e) => setTenderForm({ ...tenderForm, budget: e.target.value })} placeholder="e.g. 50000" aiMode="currency" />
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Currency</label>
                <select value={tenderForm.currency} onChange={(e) => setTenderForm({ ...tenderForm, currency: e.target.value })} style={inputStyle}>
                  <option>ZWL</option><option>USD</option><option>ZAR</option>
                </select>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Submission Deadline</label>
                <input type="datetime-local" value={tenderForm.deadline} onChange={(e) => setTenderForm({ ...tenderForm, deadline: e.target.value })} style={inputStyle} />
              </div>

              {/* ZETA AI Pre-Check */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <button type="button" onClick={runAiPreCheck} style={{ ...secondaryButtonStyle, fontSize: 13 }}>
                  ✨ Run ZETA Pre-Check
                </button>
                <button type="submit" disabled={loading} style={{ ...primaryButtonStyle, flex: 1 }}>
                  {loading ? 'Creating…' : 'Create Tender'}
                </button>
              </div>
              {aiPreCheck && (
                <div className="fade-in-up" style={{ background: 'rgba(27, 59, 43, 0.4)', border: `1px solid ${colors.borderMuted}`, borderRadius: 14, padding: 14, fontSize: 13, color: colors.champagne, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                  <strong style={{ color: colors.ivory }}>ZETA Compliance Analysis:</strong>{'\n'}{aiPreCheck}
                </div>
              )}
            </form>
          </div>
        )}

        {activeTab === 'tenders' && (
          <div className="glass-card fade-in-up" style={{ borderRadius: 24, padding: 28 }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 20, color: colors.ivory }}>All Tenders</h2>
            {tenders.length === 0 ? (
              <p style={{ color: colors.donkeyBrown }}>No tenders yet. Create one from the Draft Tender tab.</p>
            ) : (
              <div style={{ display: 'grid', gap: 14 }}>
                {tenders.map((tender) => (
                  <div key={tender.id} className="glass-card" style={{ padding: 18, borderRadius: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
                      <strong style={{ color: colors.ivory, fontSize: 15 }}>{tender.title}</strong>
                      <span style={tender.status === 'Published' ? successBadgeStyle : tender.status === 'Awarded' ? badgeStyle : badgeStyle}>{tender.status}</span>
                    </div>
                    <div style={{ color: colors.donkeyBrown, fontSize: 13, marginBottom: 4 }}>{tender.procuringEntity} · {tender.tenderType}</div>
                    <div style={{ color: colors.donkeyBrown, fontSize: 12, marginBottom: 12 }}>
                      Deadline: {formatDate(tender.deadline)}
                      {tender.budget && ` · Budget: ${formatCurrency(tender.budget, tender.currency)}`}
                    </div>
                    {tender.status === 'Draft' && (
                      <button onClick={() => publishTender(tender.id)} disabled={loading} style={{ ...primaryButtonStyle, fontSize: 13, padding: '8px 18px' }}>
                        Publish Tender
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'evaluate' && (
          <div className="glass-card fade-in-up" style={{ borderRadius: 24, padding: 28 }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 20, color: colors.ivory }}>Evaluate & Award Tenders</h2>
            <form onSubmit={reviewTender} style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              <AiFormAssist label="Tender ID" name="tenderId" value={reviewForm.tenderId} onChange={(e) => setReviewForm({ ...reviewForm, tenderId: e.target.value })} placeholder="Paste tender UUID" required aiMode="tender-id" />
              <button type="submit" disabled={loading} style={{ ...primaryButtonStyle, marginTop: 22, whiteSpace: 'nowrap' }}>Load Review</button>
            </form>
            {reviewedTender && (
              <div className="glass-card" style={{ padding: 20, borderRadius: 16 }}>
                <div style={{ marginBottom: 12, color: colors.ivory, fontSize: 16, fontWeight: 700 }}>{reviewedTender.title}</div>
                <div style={{ color: colors.donkeyBrown, fontSize: 13, marginBottom: 16 }}>
                  {reviewedTender.bids?.length || 0} sealed bid(s) available for evaluation
                </div>
                {reviewedTender.bids?.length > 0 && (
                  <form onSubmit={awardTender} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <label style={labelStyle}>Select Winning Bid</label>
                      <select value={awardForm.awardedBidId} onChange={(e) => setAwardForm({ ...awardForm, awardedBidId: e.target.value })} style={inputStyle} required>
                        <option value="">Select bid…</option>
                        {reviewedTender.bids.map((bid) => (
                          <option key={bid.id} value={bid.id}>{bid.id} — {bid.supplierId}</option>
                        ))}
                      </select>
                    </div>
                    <AiFormAssist label="Award Decision Note" name="awardDecisionNote" value={awardForm.awardDecisionNote} onChange={(e) => setAwardForm({ ...awardForm, awardDecisionNote: e.target.value })} placeholder="Justification for award decision..." required aiMode="default" rows={3} />
                    <button type="submit" disabled={loading} style={{ ...primaryButtonStyle }}>Record Award Decision</button>
                  </form>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'oversight' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 24 }}>
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
                      <div style={{ color: colors.donkeyBrown, fontSize: 12 }}>{flag.description}</div>
                      <div style={{ color: colors.donkeyBrown, fontSize: 11, marginTop: 6 }}>{formatDate(flag.createdAt)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="glass-card fade-in-up" style={{ borderRadius: 24, padding: 28 }}>
              <h2 style={{ margin: '0 0 16px', fontSize: 18, color: colors.ivory }}>Recent Audit Events</h2>
              {auditLogs.length === 0 ? (
                <p style={{ color: colors.donkeyBrown }}>No audit events recorded.</p>
              ) : (
                <div style={{ display: 'grid', gap: 10, maxHeight: 400, overflowY: 'auto' }}>
                  {auditLogs.slice(0, 15).map((log, i) => (
                    <div key={i} className="glass-card" style={{ padding: 12, borderRadius: 10, fontSize: 12 }}>
                      <strong style={{ color: colors.ivory }}>{log.actionType}</strong>
                      <div style={{ color: colors.donkeyBrown, marginTop: 4 }}>by {log.actorRole} · {formatDate(log.timestamp)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      <ZetaFloatingBot session={session} contextHint="pmu" />
    </main>
  );
}
