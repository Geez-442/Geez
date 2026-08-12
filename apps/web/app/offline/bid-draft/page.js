'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  colors,
  cardStyle,
  glassPanelStyle,
  inputStyle,
  labelStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
  eyebrowStyle,
  badgeStyle,
  successBadgeStyle,
} from '../../components/styles';
import AiFormAssist from '../../components/AiFormAssist';
import ZetaFloatingBot from '../../components/ZetaFloatingBot';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';
const STORAGE_KEY = 'zets-offline-bid-drafts';

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
    } catch {}
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
    } catch {}
  }, [drafts]);

  function parseAffiliations(value) {
    return value.split(',').map((v) => v.trim()).filter(Boolean);
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
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
          body: JSON.stringify({ tenderId: draft.tenderId, amount: draft.amount, coiData: draft.coiData }),
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
    <main style={{ minHeight: '100vh', background: colors.onyx, padding: '0 0 80px' }}>
      {/* Nav */}
      <nav style={{ maxWidth: 900, margin: '0 auto', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: colors.deepForest, border: `1px solid ${colors.donkeyBrown}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: colors.champagne }}>Z</div>
          <span style={{ fontWeight: 700, fontSize: 16, color: colors.ivory }}>Offline Bid Draft</span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
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
          <Link href="/" style={{ ...badgeStyle, textDecoration: 'none', fontSize: 13, padding: '8px 16px' }}>← Back to portal</Link>
        </div>
      </nav>

      <section style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px', display: 'grid', gap: 24 }}>
        {/* Hero */}
        <div className="glass-panel" style={{ ...glassPanelStyle, borderRadius: 28, padding: 32 }}>
          <p style={{ ...eyebrowStyle, color: colors.champagne }}>Offline Workspace</p>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 44px)', lineHeight: 1.1, margin: '8px 0 0', color: colors.ivory, fontWeight: 800 }}>
            Bid draft editor
          </h1>
          <p style={{ color: colors.donkeyBrown, lineHeight: 1.6, marginTop: 12, maxWidth: 600 }}>
            Compose bid drafts even without a connection. Drafts are stored on this device and can be synced to the
            ZETS API once you are signed in and online. No sealed data is transmitted until you choose to sync.
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

        {/* Form */}
        <div className="glass-card fade-in-up" style={{ borderRadius: 24, padding: 28 }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 18, color: colors.ivory }}>New Bid Draft</h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <AiFormAssist
              label="Tender ID"
              name="tenderId"
              value={form.tenderId}
              onChange={(e) => setForm((c) => ({ ...c, tenderId: e.target.value }))}
              placeholder="e.g. PRAZ-2026-XXXX"
              required
              aiMode="tender-id"
              helpText="Paste the tender UUID from the supplier portal."
            />
            <AiFormAssist
              label="Bid Amount"
              name="amount"
              type="number"
              value={form.amount}
              onChange={(e) => setForm((c) => ({ ...c, amount: e.target.value }))}
              placeholder="e.g. 95000"
              required
              aiMode="currency"
            />
            <AiFormAssist
              label="Company Name"
              name="company"
              value={form.company}
              onChange={(e) => setForm((c) => ({ ...c, company: e.target.value }))}
              placeholder="Your registered company name"
              required
              aiMode="title"
            />
            <AiFormAssist
              label="Known Conflicts"
              name="conflicts"
              value={form.conflicts}
              onChange={(e) => setForm((c) => ({ ...c, conflicts: e.target.value }))}
              placeholder="Declare any conflicts of interest"
              aiMode="default"
            />
            <AiFormAssist
              label="Affiliations (comma-separated)"
              name="affiliations"
              value={form.affiliations}
              onChange={(e) => setForm((c) => ({ ...c, affiliations: e.target.value }))}
              placeholder="Chamber of Commerce, Industry Association"
              aiMode="default"
            />
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16 }}>
              <button type="submit" style={{ ...primaryButtonStyle, flex: 1, minWidth: 180 }}>
                Save Draft Locally
              </button>
              <button
                type="button"
                onClick={syncDrafts}
                disabled={syncing || drafts.length === 0}
                style={{
                  ...secondaryButtonStyle,
                  opacity: syncing || drafts.length === 0 ? 0.5 : 1,
                  minWidth: 180,
                }}
              >
                {syncing ? 'Syncing…' : `Sync ${drafts.length} Draft${drafts.length === 1 ? '' : 's'}`}
              </button>
            </div>
          </form>
        </div>

        {/* Saved drafts */}
        <div className="glass-card fade-in-up" style={{ borderRadius: 24, padding: 28 }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 18, color: colors.ivory }}>
            Saved Drafts {drafts.length > 0 && <span style={badgeStyle}>{drafts.length} local</span>}
          </h2>
          {sortedDrafts.length === 0 ? (
            <p style={{ color: colors.donkeyBrown }}>No local drafts yet. Create one above.</p>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {sortedDrafts.map((draft) => (
                <div key={draft.id} className="glass-card" style={{ padding: 16, borderRadius: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
                    <strong style={{ color: colors.ivory, fontFamily: 'monospace', fontSize: 13 }}>{draft.tenderId}</strong>
                    <span style={{ color: colors.champagne, fontSize: 13, fontWeight: 600 }}>
                      {draft.amount.toLocaleString('en-US')}
                    </span>
                  </div>
                  <div style={{ color: colors.donkeyBrown, fontSize: 13, marginBottom: 4 }}>{draft.coiData?.company}</div>
                  <div style={{ color: colors.donkeyBrown, fontSize: 11, marginBottom: 8 }}>
                    Saved {new Date(draft.savedAt).toLocaleString('en-GB')}
                    {draft.lastError && <span style={{ color: '#fca5a5', marginLeft: 8 }}>— sync failed</span>}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDraft(draft.id)}
                    style={{
                      background: 'transparent',
                      border: '1px solid rgba(239,68,68,0.3)',
                      color: '#fca5a5',
                      borderRadius: 10,
                      padding: '6px 14px',
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

      <ZetaFloatingBot session={session} contextHint="offline" />
    </main>
  );
}
