'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '../components/api';
import { cardStyle, inputStyle, primaryButtonStyle, secondaryButtonStyle, badgeStyle, formatDate } from '../components/styles';
import ZetaChat from '../components/ZetaChat';

export default function SupplierPortalPage() {
  const [session, setSession] = useState(null);
  const [tenders, setTenders] = useState([]);
  const [myBids, setMyBids] = useState([]);
  const [bidForms, setBidForms] = useState({});
  const [sealForms, setSealForms] = useState({});
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
        loadMyBids(parsed.token);
      }
    } catch {
      window.localStorage.removeItem('zets-session');
    }
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

  function updateBidForm(tenderId, patch) {
    setBidForms((current) => ({
      ...current,
      [tenderId]: { amount: '', coiData: '{"company":"","conflicts":"None known","affiliations":[]}', ...(current[tenderId] || {}), ...patch },
    }));
  }

  function updateSealForm(bidId, patch) {
    setSealForms((current) => ({
      ...current,
      [bidId]: { coiDeclaration: '{"company":"","conflicts":"None known","affiliations":[]}', coiConfirmed: false, ...(current[bidId] || {}), ...patch },
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
      const coiData = form.coiData ? JSON.parse(form.coiData) : undefined;
      await apiRequest('/bids', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.token}` },
        body: JSON.stringify({ tenderId, amount, coiData }),
      });
      setMessage('Draft bid created.');
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
      const coiDeclaration = form.coiDeclaration ? JSON.parse(form.coiDeclaration) : undefined;
      await apiRequest(`/bids/${bidId}/seal`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.token}` },
        body: JSON.stringify({ coiDeclaration }),
      });
      setMessage('Bid sealed successfully.');
      await loadMyBids(session.token);
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
          <h1>Supplier portal</h1>
          <p style={{ color: '#b7c6e3' }}>Please sign in on the home page to access supplier tools.</p>
          <Link href="/" style={{ ...primaryButtonStyle, textDecoration: 'none', display: 'inline-block', marginTop: 12 }}>
            Go to login
          </Link>
        </div>
      </main>
    );
  }

  if (session.user.role !== 'Supplier') {
    return (
      <main style={{ minHeight: '100vh', padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ ...cardStyle, maxWidth: 420, textAlign: 'center' }}>
          <h1>Access denied</h1>
          <p style={{ color: '#b7c6e3' }}>This portal is for Supplier accounts only.</p>
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
        <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: 1, color: '#7dd3fc' }}>ZETS Supplier Portal</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link href="/offline/bid-draft" style={{ ...secondaryButtonStyle, textDecoration: 'none' }}>Offline draft</Link>
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

      <section style={{ maxWidth: 1240, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
        <div style={{ display: 'grid', gap: 20 }}>
          <div style={{ ...cardStyle, borderRadius: 28, padding: 28 }}>
            <p style={{ letterSpacing: 4, textTransform: 'uppercase', color: '#7dd3fc', fontSize: 12, marginTop: 0 }}>
              Supplier workspace
            </p>
            <h1 style={{ fontSize: 'clamp(28px, 4vw, 44px)', margin: '8px 0 0' }}>Find and bid on tenders</h1>
            <p style={{ color: '#b7c6e3' }}>
              Browse published opportunities, create draft bids, and seal them before the deadline.
            </p>
          </div>

          {message && <div style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.24)', borderRadius: 14, padding: 14, color: '#bbf7d0' }}>{message}</div>}
          {error && <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.24)', borderRadius: 14, padding: 14, color: '#fecaca' }}>{error}</div>}

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0, fontSize: 20 }}>Open tenders</h2>
            {tenders.length === 0 ? (
              <p style={{ color: '#94a3b8' }}>No published tenders available.</p>
            ) : (
              <div style={{ display: 'grid', gap: 14 }}>
                {tenders.map((tender) => (
                  <div key={tender.id} style={{ background: 'rgba(15,23,42,0.6)', borderRadius: 14, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
                      <strong style={{ color: '#e5eefc' }}>{tender.title}</strong>
                      <span style={badgeStyle}>{tender.tenderType}</span>
                    </div>
                    <div style={{ color: '#b7c6e3', fontSize: 14, marginBottom: 8 }}>{tender.procuringEntity}</div>
                    <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 8 }}>Deadline: {formatDate(tender.deadline)}</div>
                    <div style={{ display: 'grid', gap: 8 }}>
                      <input
                        type="number"
                        placeholder="Bid amount"
                        value={bidForms[tender.id]?.amount || ''}
                        onChange={(e) => updateBidForm(tender.id, { amount: e.target.value })}
                        style={inputStyle}
                      />
                      <textarea
                        rows={3}
                        value={bidForms[tender.id]?.coiData || '{"company":"","conflicts":"None known","affiliations":[]}'}
                        onChange={(e) => updateBidForm(tender.id, { coiData: e.target.value })}
                        style={inputStyle}
                      />
                      <button onClick={() => createBid(tender.id)} disabled={loading} style={{ ...primaryButtonStyle, width: 'fit-content' }}>
                        Create draft bid
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gap: 20 }}>
          <div style={cardStyle}>
            <h2 style={{ marginTop: 0, fontSize: 20 }}>My bids</h2>
            {myBids.length === 0 ? (
              <p style={{ color: '#94a3b8' }}>No bids yet.</p>
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                {myBids.map((bid) => (
                  <div key={bid.id} style={{ background: 'rgba(15,23,42,0.6)', borderRadius: 14, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
                      <strong style={{ color: '#e5eefc' }}>{bid.tenderId}</strong>
                      <span style={{ ...badgeStyle, background: bid.status === 'Sealed' ? 'rgba(34,197,94,0.12)' : undefined, color: bid.status === 'Sealed' ? '#4ade80' : undefined }}>{bid.status}</span>
                    </div>
                    {bid.status === 'Draft' && (
                      <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
                        <textarea
                          rows={2}
                          value={sealForms[bid.id]?.coiDeclaration || '{"company":"","conflicts":"None known","affiliations":[]}'}
                          onChange={(e) => updateSealForm(bid.id, { coiDeclaration: e.target.value })}
                          style={inputStyle}
                        />
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#cbd5e1', fontSize: 14 }}>
                          <input
                            type="checkbox"
                            checked={sealForms[bid.id]?.coiConfirmed || false}
                            onChange={(e) => updateSealForm(bid.id, { coiConfirmed: e.target.checked })}
                          />
                          I confirm the COI declaration is accurate
                        </label>
                        <button onClick={() => sealBid(bid.id)} disabled={loading} style={{ ...primaryButtonStyle, width: 'fit-content' }}>
                          Seal bid
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <ZetaChat session={session} placeholder="Ask ZETA about bidding, COI, or deadlines…" />
        </div>
      </section>
    </main>
  );
}
