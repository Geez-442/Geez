'use client';

import { useEffect, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

const cardStyle = {
  background: 'rgba(8, 15, 32, 0.72)',
  border: '1px solid rgba(148, 163, 184, 0.16)',
  borderRadius: 20,
  boxShadow: '0 18px 44px rgba(0, 0, 0, 0.3)',
  backdropFilter: 'blur(14px)',
  padding: 20,
};

const badgeStyle = {
  background: 'rgba(56, 189, 248, 0.12)',
  color: '#7dd3fc',
  borderRadius: 999,
  padding: '4px 10px',
  fontSize: 12,
  fontWeight: 600,
  display: 'inline-block',
};

function formatDate(value) {
  if (!value) return 'No deadline';
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

async function apiRequest(path) {
  const response = await fetch(`${API_BASE_URL}${path}`);
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();
  if (!response.ok) {
    throw new Error(typeof payload === 'string' ? payload : payload?.message || 'Request failed');
  }
  return payload;
}

export default function PublicDashboardPage() {
  const [published, setPublished] = useState([]);
  const [awarded, setAwarded] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [publishedData, awardedData, statsData] = await Promise.all([
          apiRequest('/public/tenders'),
          apiRequest('/public/awards'),
          apiRequest('/public/stats'),
        ]);
        setPublished(Array.isArray(publishedData) ? publishedData : []);
        setAwarded(Array.isArray(awardedData) ? awardedData : []);
        setStats(statsData || null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <main style={{ minHeight: '100vh', padding: '40px 20px 64px' }}>
      <nav style={{ maxWidth: 1240, margin: '0 auto 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: 1, color: '#7dd3fc' }}>ZETS</div>
        <a href="/" style={{ color: '#93c5fd', textDecoration: 'none', fontWeight: 600 }}>← Back to portal</a>
      </nav>

      <section style={{ maxWidth: 1240, margin: '0 auto' }}>
        <div style={{ ...cardStyle, marginBottom: 24, borderRadius: 28, padding: 28 }}>
          <p style={{ letterSpacing: 4, textTransform: 'uppercase', color: '#7dd3fc', fontSize: 12, marginTop: 0 }}>
            Transparency Dashboard
          </p>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', lineHeight: 1.05, margin: '14px 0 16px' }}>
            Open procurement, open oversight.
          </h1>
          <p style={{ maxWidth: 760, fontSize: 17, lineHeight: 1.7, color: '#b7c6e3', marginBottom: 0 }}>
            Browse published tenders, award notices, and anonymised oversight metrics.
            No sealed-bid contents are ever exposed here.
          </p>
        </div>

        {loading && <div style={{ color: '#93c5fd', padding: 12 }}>Loading dashboard…</div>}
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.24)', borderRadius: 14, padding: 16, color: '#fecaca', marginBottom: 24 }}>
            {error}
          </div>
        )}

        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
            <StatBox label="Open tenders" value={stats.tenders?.published ?? 0} />
            <StatBox label="Awarded tenders" value={stats.tenders?.awarded ?? 0} />
            <StatBox label="Oversight flags" value={stats.anomalies?.totalFlags ?? 0} />
            <StatBox label="Flags pending review" value={stats.anomalies?.unreviewed ?? 0} color="#f59e0b" />
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
          <section style={cardStyle}>
            <h2 style={{ marginTop: 0, marginBottom: 16, fontSize: 20 }}>Open tenders</h2>
            {published.length === 0 ? (
              <p style={{ color: '#94a3b8' }}>No published tenders at the moment.</p>
            ) : (
              <div style={{ display: 'grid', gap: 14 }}>
                {published.map((tender) => (
                  <div
                    key={tender.id}
                    style={{ background: 'rgba(15,23,42,0.6)', borderRadius: 14, padding: 16 }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
                      <strong style={{ color: '#e5eefc' }}>{tender.title}</strong>
                      <span style={badgeStyle}>{tender.tenderType}</span>
                    </div>
                    <div style={{ color: '#b7c6e3', fontSize: 14, marginBottom: 6 }}>{tender.procuringEntity}</div>
                    <div style={{ color: '#94a3b8', fontSize: 13 }}>Deadline: {formatDate(tender.deadline)}</div>
                    {tender.budget && (
                      <div style={{ color: '#94a3b8', fontSize: 13 }}>
                        Budget: {tender.budget.toLocaleString('en-GB')} {tender.currency}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section style={cardStyle}>
            <h2 style={{ marginTop: 0, marginBottom: 16, fontSize: 20 }}>Award notices</h2>
            {awarded.length === 0 ? (
              <p style={{ color: '#94a3b8' }}>No awards announced yet.</p>
            ) : (
              <div style={{ display: 'grid', gap: 14 }}>
                {awarded.map((tender) => (
                  <div
                    key={tender.id}
                    style={{ background: 'rgba(15,23,42,0.6)', borderRadius: 14, padding: 16 }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
                      <strong style={{ color: '#e5eefc' }}>{tender.title}</strong>
                      <span style={{ ...badgeStyle, background: 'rgba(34,197,94,0.12)', color: '#4ade80' }}>Awarded</span>
                    </div>
                    <div style={{ color: '#b7c6e3', fontSize: 14, marginBottom: 6 }}>{tender.procuringEntity}</div>
                    <div style={{ color: '#94a3b8', fontSize: 13 }}>Awarded: {formatDate(tender.awardedAt)}</div>
                    {tender.awardDecisionNote && (
                      <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 6 }}>{tender.awardDecisionNote}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

function StatBox({ label, value, color = '#7dd3fc' }) {
  return (
    <div style={{ ...cardStyle, textAlign: 'center' }}>
      <div style={{ fontSize: 34, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 13, color: '#b7c6e3', textTransform: 'uppercase', letterSpacing: 1, marginTop: 6 }}>{label}</div>
    </div>
  );
}
