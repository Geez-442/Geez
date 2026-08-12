'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '../components/api';
import {
  colors,
  cardStyle,
  glassPanelStyle,
  badgeStyle,
  successBadgeStyle,
  eyebrowStyle,
  formatDate,
  formatCurrency,
} from '../components/styles';
import ZimbabweTenderMap from '../components/ZimbabweTenderMap';
import ZetaFloatingBot from '../components/ZetaFloatingBot';

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
    <main style={{ minHeight: '100vh', background: colors.onyx, padding: '0 0 80px' }}>
      {/* Nav */}
      <nav style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: colors.deepForest, border: `1px solid ${colors.donkeyBrown}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: colors.champagne }}>Z</div>
          <span style={{ fontWeight: 700, fontSize: 16, color: colors.ivory }}>ZETS Transparency Portal</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/" style={{ ...badgeStyle, textDecoration: 'none', fontSize: 13, padding: '8px 16px' }}>← Back to portal</Link>
        </div>
      </nav>

      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'grid', gap: 24 }}>
        {/* Hero */}
        <div className="glass-panel" style={{ ...glassPanelStyle, borderRadius: 28, padding: 32 }}>
          <p style={{ ...eyebrowStyle, color: colors.champagne }}>Transparency Dashboard</p>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', lineHeight: 1.05, margin: '12px 0 16px', color: colors.ivory, fontWeight: 800 }}>
            Open procurement, open oversight.
          </h1>
          <p style={{ maxWidth: 760, fontSize: 17, lineHeight: 1.7, color: colors.donkeyBrown, marginBottom: 0 }}>
            Browse published tenders, award notices, and anonymised oversight metrics.
            No sealed-bid contents are ever exposed here.
          </p>
        </div>

        {loading && <div style={{ color: colors.champagne, padding: 12 }}>Loading dashboard…</div>}
        {error && (
          <div className="fade-in-up" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 14, padding: 16, color: '#fca5a5', fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
            <StatBox label="Open Tenders" value={stats.tenders?.published ?? 0} color={colors.champagne} />
            <StatBox label="Awarded Tenders" value={stats.tenders?.awarded ?? 0} color="#86efac" />
            <StatBox label="Oversight Flags" value={stats.anomalies?.totalFlags ?? 0} color="#fbbf24" />
            <StatBox label="Pending Review" value={stats.anomalies?.unreviewed ?? 0} color="#fca5a5" />
          </div>
        )}

        {/* Map */}
        <ZimbabweTenderMap tenders={published} />

        {/* Tenders + awards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 24, alignItems: 'start' }}>
          <div className="glass-card fade-in-up" style={{ borderRadius: 24, padding: 28 }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 18, color: colors.ivory }}>Open Tenders</h2>
            {published.length === 0 ? (
              <p style={{ color: colors.donkeyBrown }}>No published tenders at the moment.</p>
            ) : (
              <div style={{ display: 'grid', gap: 14 }}>
                {published.map((tender) => (
                  <div key={tender.id} className="glass-card" style={{ padding: 16, borderRadius: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
                      <strong style={{ color: colors.ivory }}>{tender.title}</strong>
                      <span style={badgeStyle}>{tender.tenderType}</span>
                    </div>
                    <div style={{ color: colors.donkeyBrown, fontSize: 13, marginBottom: 6 }}>{tender.procuringEntity}</div>
                    <div style={{ color: colors.donkeyBrown, fontSize: 12 }}>Deadline: {formatDate(tender.deadline)}</div>
                    {tender.budget && (
                      <div style={{ color: colors.donkeyBrown, fontSize: 12 }}>Budget: {formatCurrency(tender.budget, tender.currency)}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass-card fade-in-up" style={{ borderRadius: 24, padding: 28 }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 18, color: colors.ivory }}>Award Notices</h2>
            {awarded.length === 0 ? (
              <p style={{ color: colors.donkeyBrown }}>No awards announced yet.</p>
            ) : (
              <div style={{ display: 'grid', gap: 14 }}>
                {awarded.map((tender) => (
                  <div key={tender.id} className="glass-card" style={{ padding: 16, borderRadius: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
                      <strong style={{ color: colors.ivory }}>{tender.title}</strong>
                      <span style={successBadgeStyle}>Awarded</span>
                    </div>
                    <div style={{ color: colors.donkeyBrown, fontSize: 13, marginBottom: 6 }}>{tender.procuringEntity}</div>
                    <div style={{ color: colors.donkeyBrown, fontSize: 12 }}>Awarded: {formatDate(tender.awardedAt)}</div>
                    {tender.awardDecisionNote && (
                      <div style={{ color: colors.donkeyBrown, fontSize: 12, marginTop: 6 }}>{tender.awardDecisionNote}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <ZetaFloatingBot session={null} contextHint="public" />
    </main>
  );
}

function StatBox({ label, value, color }) {
  return (
    <div className="glass-card" style={{ padding: 20, borderRadius: 16, textAlign: 'center' }}>
      <div style={{ fontSize: 34, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 11, color: colors.donkeyBrown, textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 6 }}>{label}</div>
    </div>
  );
}
