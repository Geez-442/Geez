'use client';

import { useEffect, useState, useMemo } from 'react';
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
  successBadgeStyle,
  eyebrowStyle,
  formatDate,
  formatCurrency,
} from '../components/styles';
import AiFormAssist from '../components/AiFormAssist';
import ZetaFloatingBot from '../components/ZetaFloatingBot';
import ZimbabweTenderMap from '../components/ZimbabweTenderMap';

export default function SupplierPortalPage() {
  const [session, setSession] = useState(null);
  const [tenders, setTenders] = useState([]);
  const [myBids, setMyBids] = useState([]);
  const [bidForms, setBidForms] = useState({});
  const [sealForms, setSealForms] = useState({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);

    try {
      const saved = window.localStorage.getItem('zets-session');
      const parsed = saved ? JSON.parse(saved) : null;
      setSession(parsed);
      if (parsed?.token) {
        loadTenders();
        loadMyBids(parsed.token);
      }
    } catch {
      window.localStorage.removeItem('zets-session');
    }
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  async function loadTenders() {
    try {
      const data = await apiRequest('/tenders?status=Published');
      setTenders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadMyBids(token) {
    try {
      const data = await apiRequest('/bids/my-bids', { headers: { Authorization: `Bearer ${token}` } });
      setMyBids(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    }
  }

  // Filter tenders by selected province (simulated province mapping)
  const filteredTenders = useMemo(() => {
    if (!selectedProvince) return tenders;
    // Simulated: filter by index-based province assignment
    return tenders.filter((_, i) => {
      const provinceIndex = i % 10;
      const provinces = ['harare', 'bulawayo', 'manicaland', 'mash_central', 'mash_east', 'mash_west', 'masvingo', 'mat_north', 'mat_south', 'midlands'];
      return provinces[provinceIndex] === selectedProvince;
    });
  }, [tenders, selectedProvince]);

  function updateBidForm(tenderId, patch) {
    setBidForms((current) => ({
      ...current,
      [tenderId]: { amount: '', company: '', conflicts: 'None known', ...(current[tenderId] || {}), ...patch },
    }));
  }

  function updateSealForm(bidId, patch) {
    setSealForms((current) => ({
      ...current,
      [bidId]: { coiConfirmed: false, ...(current[bidId] || {}), ...patch },
    }));
  }

  async function createBid(tenderId) {
    const form = bidForms[tenderId] || {};
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const amount = Number(form.amount);
      if (!amount || amount <= 0) throw new Error('Enter a valid bid amount');
      const coiData = {
        company: form.company || '',
        conflicts: form.conflicts || 'None known',
        affiliations: [],
      };
      await apiRequest('/bids', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.token}` },
        body: JSON.stringify({ tenderId, amount, coiData }),
      });
      setMessage('Draft bid created. You can seal it from the My Bids panel.');
      await loadMyBids(session.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function sealBid(bidId) {
    const form = sealForms[bidId] || {};
    setLoading(true);
    setError('');
    setMessage('');
    try {
      if (!form.coiConfirmed) throw new Error('Confirm the COI declaration before sealing');
      const coiDeclaration = {
        company: form.company || '',
        conflicts: form.conflicts || 'None known',
        affiliations: [],
      };
      await apiRequest(`/bids/${bidId}/seal`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.token}` },
        body: JSON.stringify({ coiDeclaration }),
      });
      setMessage('Bid sealed successfully. It will be opened after the deadline.');
      await loadMyBids(session.token);
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
          <h1 style={{ color: colors.ivory }}>Supplier Portal</h1>
          <p style={{ color: colors.donkeyBrown }}>Please sign in to access supplier tools.</p>
          <Link href="/" style={{ ...primaryButtonStyle, textDecoration: 'none', display: 'inline-block', marginTop: 12 }}>
            Go to login
          </Link>
        </div>
      </main>
    );
  }

  if (session.user.role !== 'Supplier') {
    return (
      <main style={{ minHeight: '100vh', padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: colors.onyx }}>
        <div style={{ ...cardStyle, maxWidth: 420, textAlign: 'center' }}>
          <h1 style={{ color: colors.ivory }}>Access denied</h1>
          <p style={{ color: colors.donkeyBrown }}>This portal is for Supplier accounts only.</p>
          <Link href="/" style={{ ...secondaryButtonStyle, textDecoration: 'none', display: 'inline-block', marginTop: 12 }}>
            Back to home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', background: colors.onyx, padding: '0 0 80px' }}>
      {/* Nav */}
      <nav
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: colors.deepForest, border: `1px solid ${colors.donkeyBrown}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: colors.champagne }}>
            Z
          </div>
          <span style={{ fontWeight: 700, fontSize: 16, color: colors.ivory }}>Supplier Workspace</span>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <span
            style={{
              borderRadius: 999,
              padding: '4px 12px',
              fontSize: 11,
              fontWeight: 600,
              background: isOnline ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)',
              color: isOnline ? '#86efac' : '#fbbf24',
              border: `1px solid ${isOnline ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}`,
            }}
          >
            {isOnline ? '● Online' : '● Offline'}
          </span>
          <Link href="/offline/bid-draft" style={{ ...secondaryButtonStyle, textDecoration: 'none', fontSize: 13 }}>Offline Draft</Link>
          <Link href="/public" style={{ ...secondaryButtonStyle, textDecoration: 'none', fontSize: 13 }}>Transparency</Link>
          <button
            type="button"
            onClick={() => { window.localStorage.removeItem('zets-session'); window.location.href = '/'; }}
            style={{ ...secondaryButtonStyle, background: 'transparent', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', fontSize: 13 }}
          >
            Logout
          </button>
        </div>
      </nav>

      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'grid', gap: 24 }}>
        {/* Hero */}
        <div className="glass-panel" style={{ ...glassPanelStyle, borderRadius: 28, padding: 32 }}>
          <p style={{ ...eyebrowStyle, color: colors.champagne }}>Supplier Workspace</p>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 44px)', margin: '8px 0 0', color: colors.ivory, fontWeight: 800 }}>
            Find and bid on tenders
          </h1>
          <p style={{ color: colors.donkeyBrown, maxWidth: 600, marginTop: 12, lineHeight: 1.6 }}>
            Browse published opportunities across Zimbabwe, submit draft bids with AI-assisted formatting,
            and seal them before the deadline.
          </p>
        </div>

        {/* Messages */}
        {message && (
          <div className="fade-in-up" style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 14, padding: 14, color: '#86efac', fontSize: 13 }}>
            {message}
          </div>
        )}
        {error && (
          <div className="fade-in-up" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 14, padding: 14, color: '#fca5a5', fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* Map */}
        <ZimbabweTenderMap
          tenders={tenders}
          selectedProvince={selectedProvince}
          onProvinceSelect={setSelectedProvince}
        />

        {/* Two-column: tenders + my bids */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 24, alignItems: 'start' }}>
          {/* Open tenders */}
          <div style={{ ...cardStyle, borderRadius: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 18, color: colors.ivory }}>
                Open Tenders {selectedProvince && <span style={{ fontSize: 12, color: colors.donkeyBrown }}>(filtered)</span>}
              </h2>
              <button onClick={loadTenders} style={{ ...secondaryButtonStyle, fontSize: 12, padding: '6px 12px' }}>Refresh</button>
            </div>
            {filteredTenders.length === 0 ? (
              <p style={{ color: colors.donkeyBrown, fontSize: 14 }}>No published tenders available{selectedProvince ? ' in this province' : ''}.</p>
            ) : (
              <div style={{ display: 'grid', gap: 16 }}>
                {filteredTenders.map((tender) => (
                  <div
                    key={tender.id}
                    className="glass-card fade-in-up"
                    style={{ padding: 18, borderRadius: 16 }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
                      <strong style={{ color: colors.ivory, fontSize: 15 }}>{tender.title}</strong>
                      <span style={badgeStyle}>{tender.tenderType}</span>
                    </div>
                    <div style={{ color: colors.donkeyBrown, fontSize: 13, marginBottom: 4 }}>{tender.procuringEntity}</div>
                    <div style={{ color: colors.donkeyBrown, fontSize: 12, marginBottom: 12 }}>
                      Deadline: {formatDate(tender.deadline)}
                      {tender.budget && ` · Budget: ${formatCurrency(tender.budget, tender.currency)}`}
                    </div>

                    {/* AI-assisted bid form */}
                    <div style={{ borderTop: `1px solid ${colors.borderMuted}`, paddingTop: 14 }}>
                      <AiFormAssist
                        label="Bid Amount"
                        name="amount"
                        type="number"
                        value={bidForms[tender.id]?.amount || ''}
                        onChange={(e) => updateBidForm(tender.id, { amount: e.target.value })}
                        placeholder="Enter your bid amount"
                        aiMode="currency"
                      />
                      <AiFormAssist
                        label="Company Name"
                        name="company"
                        value={bidForms[tender.id]?.company || ''}
                        onChange={(e) => updateBidForm(tender.id, { company: e.target.value })}
                        placeholder="Your registered company name"
                        aiMode="title"
                      />
                      <AiFormAssist
                        label="Known Conflicts"
                        name="conflicts"
                        value={bidForms[tender.id]?.conflicts || 'None known'}
                        onChange={(e) => updateBidForm(tender.id, { conflicts: e.target.value })}
                        placeholder="Declare any conflicts of interest"
                        aiMode="default"
                        helpText="Honesty here is legally required under PRAZ regulations."
                      />
                      <button
                        onClick={() => createBid(tender.id)}
                        disabled={loading}
                        style={{ ...primaryButtonStyle, width: '100%', fontSize: 14 }}
                      >
                        {loading ? 'Creating…' : 'Create Draft Bid'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* My bids + awards */}
          <div style={{ display: 'grid', gap: 24 }}>
            <div style={{ ...cardStyle, borderRadius: 24 }}>
              <h2 style={{ margin: '0 0 16px', fontSize: 18, color: colors.ivory }}>My Bids</h2>
              {myBids.length === 0 ? (
                <p style={{ color: colors.donkeyBrown, fontSize: 14 }}>No bids yet. Create one from an open tender above.</p>
              ) : (
                <div style={{ display: 'grid', gap: 14 }}>
                  {myBids.map((bid) => (
                    <div key={bid.id} className="glass-card" style={{ padding: 16, borderRadius: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
                        <strong style={{ color: colors.ivory, fontSize: 14 }}>{bid.tenderId}</strong>
                        <span style={bid.status === 'Sealed' ? successBadgeStyle : badgeStyle}>{bid.status}</span>
                      </div>
                      <div style={{ color: colors.donkeyBrown, fontSize: 12, marginBottom: 8 }}>
                        Created: {formatDate(bid.createdAt)}
                        {bid.sealedAt && ` · Sealed: ${formatDate(bid.sealedAt)}`}
                      </div>
                      {bid.status === 'Draft' && (
                        <div style={{ borderTop: `1px solid ${colors.borderMuted}`, paddingTop: 12, display: 'grid', gap: 10 }}>
                          <AiFormAssist
                            label="Company Name"
                            name="company"
                            value={sealForms[bid.id]?.company || ''}
                            onChange={(e) => updateSealForm(bid.id, { company: e.target.value })}
                            placeholder="Your company name"
                            aiMode="title"
                          />
                          <AiFormAssist
                            label="Conflict Declaration"
                            name="conflicts"
                            value={sealForms[bid.id]?.conflicts || 'None known'}
                            onChange={(e) => updateSealForm(bid.id, { conflicts: e.target.value })}
                            placeholder="Declare any conflicts"
                            aiMode="default"
                          />
                          <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: colors.ivory, fontSize: 13, cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={sealForms[bid.id]?.coiConfirmed || false}
                              onChange={(e) => updateSealForm(bid.id, { coiConfirmed: e.target.checked })}
                            />
                            I confirm the COI declaration is accurate
                          </label>
                          <button
                            onClick={() => sealBid(bid.id)}
                            disabled={loading}
                            style={{ ...primaryButtonStyle, width: '100%', fontSize: 14 }}
                          >
                            {loading ? 'Sealing…' : 'Seal Bid'}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Link href="/offline/bid-draft" style={{ ...cardStyle, borderRadius: 24, textDecoration: 'none', display: 'block' }}>
              <h2 style={{ margin: '0 0 8px', fontSize: 16, color: colors.ivory }}>📡 Offline Bid Drafting</h2>
              <p style={{ margin: 0, fontSize: 13, color: colors.donkeyBrown, lineHeight: 1.5 }}>
                Compose bid drafts without internet and sync when you reconnect. Built for low-connectivity regions.
              </p>
            </Link>
          </div>
        </div>
      </section>

      <ZetaFloatingBot session={session} contextHint="supplier" />
    </main>
  );
}
