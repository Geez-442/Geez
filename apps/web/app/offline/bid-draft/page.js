'use client';

import { useEffect, useMemo, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';
const STORAGE_KEY = 'zets-offline-bid-drafts';

const cardStyle = {
  background: 'rgba(8, 15, 32, 0.72)',
  border: '1px solid rgba(148, 163, 184, 0.16)',
  borderRadius: 20,
  boxShadow: '0 18px 44px rgba(0, 0, 0, 0.3)',
  backdropFilter: 'blur(14px)',
  padding: 20,
};

const inputStyle = {
  background: 'rgba(15, 23, 42, 0.9)',
  border: '1px solid rgba(148, 163, 184, 0.2)',
  borderRadius: 12,
  padding: '10px 14px',
  color: '#e5eefc',
  fontSize: 14,
  outline: 'none',
  width: '100%',
};

const buttonStyle = {
  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
  color: '#ffffff',
  border: 'none',
  borderRadius: 14,
  padding: '12px 16px',
  fontWeight: 600,
  cursor: 'pointer',
};

export default function OfflineBidDraftPage() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [session, setSession] = useState(null);
  const [drafts, setDrafts] = useState([]);
  const [form, setForm] = useState({
    tenderId: '',
    amount: '',
    company: '',
    conflicts: 'None known',
    affiliations: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('zets-session');
      if (saved) setSession(JSON.parse(saved));
      const savedDrafts = window.localStorage.getItem(STORAGE_KEY);
      if (savedDrafts) setDrafts(JSON.parse(savedDrafts));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
    } catch {
      // ignore
    }
  }, [drafts]);

  function parseAffiliations(value) {
    return value
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
  }

  function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');

    const amount = Number(form.amount);
    if (!form.tenderId.trim() || Number.isNaN(amount) || amount <= 0) {
      setError('Enter a valid tender ID and amount greater than zero.');
      return;
    }

    const draft = {
      id: crypto.randomUUID?.() || `draft-${Date.now()}`,
      tenderId: form.tenderId.trim(),
      amount,
      coiData: {
        company: form.company.trim(),
        conflicts: form.conflicts.trim() || 'None known',
        affiliations: parseAffiliations(form.affiliations),
      },
      savedAt: new Date().toISOString(),
    };

    setDrafts((current) => [draft, ...current]);
    setMessage(`Draft saved locally (${isOnline ? 'online' : 'offline'}). It will sync when you are signed in and online.`);
    setForm({ tenderId: '', amount: '', company: '', conflicts: 'None known', affiliations: '' });
  }

  async function syncDrafts() {
    setError('');
    setMessage('');
    if (!session?.token) {
      setError('Sign in on the main portal before syncing drafts.');
      return;
    }
    if (!isOnline) {
      setError('You are offline. Sync will resume automatically once connectivity returns.');
      return;
    }
    if (drafts.length === 0) {
      setMessage('No drafts to sync.');
      return;
    }

    setSyncing(true);
    const remaining = [];
    let syncedCount = 0;

    for (const draft of drafts) {
      try {
        const response = await fetch(`${API_BASE_URL}/bids`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.token}`,
          },
          body: JSON.stringify({
            tenderId: draft.tenderId,
            amount: draft.amount,
            coiData: draft.coiData,
          }),
        });
        if (response.ok) {
          syncedCount += 1;
        } else {
          const text = await response.text();
          remaining.push({ ...draft, lastError: text });
        }
      } catch (err) {
        remaining.push({ ...draft, lastError: err.message });
      }
    }

    setDrafts(remaining);
    setSyncing(false);
    setMessage(`Synced ${syncedCount} draft${syncedCount === 1 ? '' : 's'}. ${remaining.length > 0 ? `${remaining.length} remaining.` : ''}`);
  }

  function removeDraft(id) {
    setDrafts((current) => current.filter((d) => d.id !== id));
  }

  const sortedDrafts = useMemo(() => [...drafts].sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt)), [drafts]);

  return (
    <main style={{ minHeight: '100vh', padding: '40px 20px 64px' }}>
      <nav style={{ maxWidth: 800, margin: '0 auto 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: 1, color: '#7dd3fc' }}>ZETS</div>
        <a href="/" style={{ color: '#93c5fd', textDecoration: 'none', fontWeight: 600 }}>← Back to portal</a>
      </nav>

      <section style={{ maxWidth: 800, margin: '0 auto', display: 'grid', gap: 20 }}>
        <div style={{ ...cardStyle, borderRadius: 28, padding: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            <div>
              <p style={{ letterSpacing: 4, textTransform: 'uppercase', color: '#7dd3fc', fontSize: 12, marginTop: 0 }}>
                Offline workspace
              </p>
              <h1 style={{ fontSize: 'clamp(28px, 4vw, 44px)', lineHeight: 1.1, margin: '8px 0 0' }}>
                Bid draft editor
              </h1>
            </div>
            <span
              style={{
                borderRadius: 999,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 600,
                background: isOnline ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)',
                color: isOnline ? '#4ade80' : '#fbbf24',
              }}
            >
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>

          <p style={{ color: '#b7c6e3', lineHeight: 1.6, marginBottom: 24 }}>
            Compose bid drafts even without a connection. Drafts are stored on this device and can be synced to the
            ZETS API once you are signed in and online. No sealed data is transmitted until you choose to sync.
          </p>

          {message && (
            <div style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.24)', borderRadius: 14, padding: 14, color: '#bbf7d0', marginBottom: 16 }}>
              {message}
            </div>
          )}
          {error && (
            <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.24)', borderRadius: 14, padding: 14, color: '#fecaca', marginBottom: 16 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
            <div style={{ display: 'grid', gap: 6 }}>
              <label style={{ fontSize: 14, color: '#cbd5e1' }}>Tender ID</label>
              <input
                value={form.tenderId}
                onChange={(e) => setForm((c) => ({ ...c, tenderId: e.target.value }))}
                style={inputStyle}
                placeholder="e.g. tender-uuid-123"
                required
              />
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              <label style={{ fontSize: 14, color: '#cbd5e1' }}>Bid amount</label>
              <input
                type="number"
                min="1"
                value={form.amount}
                onChange={(e) => setForm((c) => ({ ...c, amount: e.target.value }))}
                style={inputStyle}
                placeholder="e.g. 95000"
                required
              />
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              <label style={{ fontSize: 14, color: '#cbd5e1' }}>Company name</label>
              <input
                value={form.company}
                onChange={(e) => setForm((c) => ({ ...c, company: e.target.value }))}
                style={inputStyle}
                required
              />
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              <label style={{ fontSize: 14, color: '#cbd5e1' }}>Known conflicts</label>
              <input
                value={form.conflicts}
                onChange={(e) => setForm((c) => ({ ...c, conflicts: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              <label style={{ fontSize: 14, color: '#cbd5e1' }}>Affiliations (comma-separated)</label>
              <input
                value={form.affiliations}
                onChange={(e) => setForm((c) => ({ ...c, affiliations: e.target.value }))}
                style={inputStyle}
                placeholder="Chamber of Commerce, Industry Association"
              />
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 4 }}>
              <button type="submit" style={buttonStyle}>
                Save draft locally
              </button>
              <button
                type="button"
                onClick={syncDrafts}
                disabled={syncing || drafts.length === 0}
                style={{
                  ...buttonStyle,
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(148, 163, 184, 0.24)',
                  color: '#e5eefc',
                  opacity: syncing || drafts.length === 0 ? 0.6 : 1,
                }}
              >
                {syncing ? 'Syncing…' : `Sync ${drafts.length} draft${drafts.length === 1 ? '' : 's'}`}
              </button>
            </div>
          </form>
        </div>

        <div style={cardStyle}>
          <h2 style={{ marginTop: 0, marginBottom: 16, fontSize: 20 }}>Saved drafts</h2>
          {sortedDrafts.length === 0 ? (
            <p style={{ color: '#94a3b8' }}>No local drafts yet.</p>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {sortedDrafts.map((draft) => (
                <div key={draft.id} style={{ background: 'rgba(15,23,42,0.6)', borderRadius: 14, padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
                    <strong style={{ color: '#e5eefc' }}>{draft.tenderId}</strong>
                    <span style={{ color: '#93c5fd', fontSize: 13 }}>{draft.amount.toLocaleString('en-GB')}</span>
                  </div>
                  <div style={{ color: '#b7c6e3', fontSize: 14, marginBottom: 4 }}>{draft.coiData?.company}</div>
                  <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 8 }}>
                    Saved {new Date(draft.savedAt).toLocaleString('en-GB')}
                    {draft.lastError && <span style={{ color: '#f87171', marginLeft: 8 }}>— sync failed</span>}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDraft(draft.id)}
                    style={{
                      background: 'transparent',
                      border: '1px solid rgba(239,68,68,0.24)',
                      color: '#fecaca',
                      borderRadius: 10,
                      padding: '6px 12px',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
