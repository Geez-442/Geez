'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

const sections = [
  {
    title: 'Open tenders',
    text: 'Browse published opportunities and submit draft bids against active deadlines.',
  },
  {
    title: 'Role-aware access',
    text: 'Login uses the same JWT auth contract as the API so supplier actions stay protected.',
  },
  {
    title: 'Sealed bid flow',
    text: 'Draft bids can be sealed with a COI declaration before the tender deadline.',
  },
];

const cardStyle = {
  background: 'rgba(8, 15, 32, 0.72)',
  border: '1px solid rgba(148, 163, 184, 0.16)',
  boxShadow: '0 18px 44px rgba(0, 0, 0, 0.3)',
  backdropFilter: 'blur(14px)',
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

const labelStyle = {
  fontSize: 14,
  color: '#cbd5e1',
};

const eyebrowStyle = {
  marginTop: 0,
  marginBottom: 8,
  color: '#93c5fd',
  letterSpacing: 2,
  textTransform: 'uppercase',
  fontSize: 12,
};

const primaryButtonStyle = {
  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
  color: '#ffffff',
  border: 'none',
  borderRadius: 14,
  padding: '12px 16px',
  fontWeight: 600,
  cursor: 'pointer',
};

const secondaryButtonStyle = {
  background: 'rgba(30, 41, 59, 0.8)',
  color: '#e5eefc',
  border: '1px solid rgba(148, 163, 184, 0.24)',
  borderRadius: 14,
  padding: '12px 16px',
  fontWeight: 600,
  cursor: 'pointer',
};

const statusPanelStyle = {
  background: 'rgba(15, 23, 42, 0.6)',
  border: '1px solid rgba(148, 163, 184, 0.12)',
  padding: 16,
};

function formatDate(value) {
  if (!value) return 'No deadline set';
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof payload === 'string' ? payload : payload?.message || 'Request failed';
    throw new Error(message);
  }

  return payload;
}

export default function HomePage() {
  const [session, setSession] = useState(null);
  const [tenders, setTenders] = useState([]);
  const [awardedTenders, setAwardedTenders] = useState([]);
  const [myBids, setMyBids] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const [loginForm, setLoginForm] = useState({ 
    email: 'supplier@example.com', 
    password: 'Password123!', 
    role: 'Supplier' 
  });

  const [registerForm, setRegisterForm] = useState({
    email: '',
    password: '',
    displayName: '',
    role: 'Supplier',
    prazVendorNumber: '',
  });

  const [bidForms, setBidForms] = useState({});
  const [sealForms, setSealForms] = useState({});
  const [reviewForm, setReviewForm] = useState({ bidId: '' });
  const [reviewedBid, setReviewedBid] = useState(null);
  const [tenderReviewForm, setTenderReviewForm] = useState({ tenderId: '' });
  const [reviewedTender, setReviewedTender] = useState(null);
  const [awardForm, setAwardForm] = useState({ awardedBidId: '', awardDecisionNote: '' });
  const [zetaChatMessages, setZetaChatMessages] = useState([
    {
      role: 'assistant',
      content: 'ZETA is online. Ask about tenders, bids, awards, or audit logs and I will respond in advisory mode only.',
    },
  ]);
  const router = useRouter();
  const [zetaChatInput, setZetaChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const hasSession = Boolean(session?.token);

  const tenderLookup = useMemo(() => new Map(tenders.map((tender) => [tender.id, tender])), [tenders]);

  useEffect(() => {
    const saved = window.localStorage.getItem('zets-session');
    if (saved) {
      try {
        setSession(JSON.parse(saved));
      } catch {
        window.localStorage.removeItem('zets-session');
      }
    }
    loadTenders();
  }, []);

    useEffect(() => {
    loadAwardedTenders();
  }, []);

  useEffect(() => {
    if (!session?.token) {
      setMyBids([]);
      setAuditLogs([]);
      return;
    }
    loadMyBids(session.token);
    if (['PMU_Officer', 'PRAZ_Regulator'].includes(session.user.role)) {
      loadAuditLogs(session.token);
    }
  }, [session]);

  async function loadTenders() {
    setError('');
    try {
      const data = await apiRequest('/tenders?status=Published');
      setTenders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadMyBids(token) {
    try {
      const data = await apiRequest('/bids/my-bids', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMyBids(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadAwardedTenders() {
    try {
      const data = await apiRequest('/tenders?status=Awarded');
      setAwardedTenders(Array.isArray(data) ? data : []);
    } catch {
      setAwardedTenders([]);
    }
  }

  async function loadAuditLogs(token) {
    try {
      const data = await apiRequest('/audit/logs?limit=20', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAuditLogs(Array.isArray(data.entries) ? data.entries : []);
    } catch {
      setAuditLogs([]);
    }
  }

  async function login(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const payload = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginForm),
      });
      const nextSession = { token: payload.token, user: payload.user };
      setSession(nextSession);
      window.localStorage.setItem('zets-session', JSON.stringify(nextSession));
      // set cookie for middleware-based routing (Edge middleware reads cookies)
      try {
        document.cookie = `zets_token=${payload.token}; Path=/; Max-Age=7200; SameSite=Lax`;
      } catch (e) {
        // ignore
      }
      setMessage(`Signed in as ${payload.user.email} (${payload.user.role}).`);
      await loadMyBids(payload.token);

      // Redirect based on role using next/navigation router
      const role = payload.user?.role;
      if (role === 'Supplier') {
        router.push('/supplier');
        return;
      }
      if (role === 'PMU_Officer' || role === 'PMU Officer') {
        router.push('/pmu');
        return;
      }
      if (role === 'PRAZ_Regulator' || role === 'PRAZ Regulator') {
        router.push('/praz');
        return;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function register(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    const formData = new FormData(event.currentTarget);
    const email = (formData.get('email') || registerForm.email || '').toString().trim();
    const password = (formData.get('password') || registerForm.password || '').toString().trim();
    const displayName = (formData.get('displayName') || registerForm.displayName || '').toString().trim();
    const role = (formData.get('role') || registerForm.role || 'Supplier').toString().trim();
    const prazVendorNumber = (formData.get('prazVendorNumber') || registerForm.prazVendorNumber || '').toString().trim();

    try {
      if (!email || !password || !role) {
        throw new Error('email, password and role are required');
      }

      const body = {
        email,
        password,
        displayName,
        role,
        prazVendorNumber: role === 'PRAZ_Regulator' ? prazVendorNumber : undefined,
      };

      await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setMessage('Registration completed. Use the login form to sign in.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function updateBidForm(tenderId, patch) {
    setBidForms((current) => ({
      ...current,
      [tenderId]: {
        amount: '',
        coiData: '{"company":"","conflicts":"None known","affiliations":[]}',
        ...(current[tenderId] || {}),
        ...patch,
      },
    }));
  }

  function updateSealForm(bidId, patch) {
    setSealForms((current) => ({
      ...current,
      [bidId]: {
        coiDeclaration: '{"company":"","conflicts":"None known","affiliations":[]}',
        ...(current[bidId] || {}),
        ...patch,
      },
    }));
  }

  async function createBid(tenderId) {
    const form = bidForms[tenderId] || {};
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (!session?.token) throw new Error('Sign in first');
      if (form.amount === '' || Number.isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
        throw new Error('Enter a bid amount greater than zero');
      }

      const parsedCoi = form.coiData ? JSON.parse(form.coiData) : undefined;
      await apiRequest('/bids', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.token}` },
        body: JSON.stringify({
          tenderId,
          amount: Number(form.amount),
          coiData: parsedCoi,
        }),
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
      if (!session?.token) throw new Error('Sign in first');

      const coiDeclaration = form.coiDeclaration ? JSON.parse(form.coiDeclaration) : undefined;
      // Enforce COI checkbox presence (frontend enforcement)
      if (!form.coiConfirmed) throw new Error('You must confirm the Conflict of Interest declaration before sealing a bid');
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

  async function reviewBid(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    setReviewedBid(null);

    try {
      if (!session?.token) throw new Error('Sign in first');
      if (!reviewForm.bidId.trim()) throw new Error('Enter a bid ID to review');

      const payload = await apiRequest(`/evaluation/bids/${reviewForm.bidId.trim()}/review`, {
        headers: { Authorization: `Bearer ${session.token}` },
      });
      setReviewedBid(payload);
      setMessage('Bid loaded for review.');
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
      if (!session?.token) throw new Error('Sign in first');
      if (!tenderReviewForm.tenderId.trim()) throw new Error('Enter a tender ID to review');

      const payload = await apiRequest(`/evaluation/tenders/${tenderReviewForm.tenderId.trim()}/review`, {
        headers: { Authorization: `Bearer ${session.token}` },
      });
      setReviewedTender(payload);
      setAwardForm((current) => ({
        ...current,
        awardedBidId: payload.bids?.[0]?.id || '',
      }));
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
      if (!session?.token) throw new Error('Sign in first');
      if (session.user.role !== 'PMU_Officer') throw new Error('Only PMU officers can award tenders');
      if (!tenderReviewForm.tenderId.trim()) throw new Error('Load a tender first');
      if (!awardForm.awardedBidId.trim()) throw new Error('Select a bid to award');
      if (!awardForm.awardDecisionNote.trim()) throw new Error('Enter an award decision note');

      await apiRequest(`/evaluation/tenders/${tenderReviewForm.tenderId.trim()}/award`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.token}` },
        body: JSON.stringify({
          awardedBidId: awardForm.awardedBidId,
          awardDecisionNote: awardForm.awardDecisionNote,
        }),
      });

      setMessage('Award decision saved.');
      await reviewTender({ preventDefault() {} });
      await loadAwardedTenders();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function announceAward() {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (!session?.token) throw new Error('Sign in first');
      if (session.user.role !== 'PMU_Officer') throw new Error('Only PMU officers can announce awards');
      if (!tenderReviewForm.tenderId.trim()) throw new Error('Load an awarded tender first');

      const payload = await apiRequest(`/evaluation/tenders/${tenderReviewForm.tenderId.trim()}/announce-award`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.token}` },
      });
      setMessage(`Announcement queued: ${payload.channels.email.subject}`);
      await loadAuditLogs(session.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function sendZetaChat(event) {
    event.preventDefault();
    setChatLoading(true);
    setError('');
    setMessage('');

    try {
      if (!session?.token) throw new Error('Sign in first');

      const prompt = zetaChatInput.trim();
      if (!prompt) throw new Error('Enter a chat message');

      const payload = await apiRequest('/ai/chat', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.token}` },
        body: JSON.stringify({
          message: prompt,
          history: zetaChatMessages.slice(-6),
        }),
      });

      setZetaChatMessages((current) => [
        ...current,
        { role: 'user', content: prompt },
        { role: 'assistant', content: `${payload.reply} ${payload.safetyNote}` },
      ]);
      setZetaChatInput('');
      setMessage(`ZETA replied in ${payload.roleContext}.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setChatLoading(false);
    }
  }

  function logout() {
    setSession(null);
    setMyBids([]);
    window.localStorage.removeItem('zets-session');
    try {
      document.cookie = 'zets_token=; Path=/; Max-Age=0; SameSite=Lax';
    } catch (e) {}
    setMessage('Signed out.');
  }

  return (
    <main style={{ minHeight: '100vh', padding: '40px 20px 64px' }}>
      <nav style={{ maxWidth: 1240, margin: '0 auto 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: 1, color: '#7dd3fc' }}>ZETS</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <a
            href="/public"
            style={{
              background: 'rgba(30, 41, 59, 0.8)',
              color: '#e5eefc',
              border: '1px solid rgba(148, 163, 184, 0.24)',
              borderRadius: 14,
              padding: '10px 16px',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            Public transparency
          </a>
          <a
            href="/offline/bid-draft"
            style={{
              background: 'rgba(30, 41, 59, 0.8)',
              color: '#e5eefc',
              border: '1px solid rgba(148, 163, 184, 0.24)',
              borderRadius: 14,
              padding: '10px 16px',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            Offline draft
          </a>
        </div>
      </nav>
      <section style={{ maxWidth: 1240, margin: '0 auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.4fr 1fr',
            gap: 20,
            alignItems: 'stretch',
            marginBottom: 24,
          }}
        >
          <article
            style={{
              ...cardStyle,
              borderRadius: 28,
              padding: 28,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'radial-gradient(circle at top right, rgba(56,189,248,0.18), transparent 28%), radial-gradient(circle at bottom left, rgba(34,197,94,0.16), transparent 26%)',
                pointerEvents: 'none',
              }}
            />
            <div style={{ position: 'relative' }}>
              <p style={{ letterSpacing: 4, textTransform: 'uppercase', color: '#7dd3fc', fontSize: 12, marginTop: 0 }}>
                ZETS / Vendor Portal
              </p>
              <h1 style={{ fontSize: 'clamp(38px, 6vw, 72px)', lineHeight: 0.98, margin: '14px 0 16px', maxWidth: 900 }}>
                Publish, bid, and seal tenders with a role-aware workflow.
              </h1>
              <p style={{ maxWidth: 760, fontSize: 18, lineHeight: 1.7, color: '#b7c6e3', marginBottom: 0 }}>
                This portal connects directly to the Nest API. Suppliers can log in, browse published tenders,
                create draft bids, and seal them with a COI declaration before the deadline.
              </p>
            </div>
          </article>

          <aside style={{ ...cardStyle, borderRadius: 28, padding: 24 }}>
            <p style={{ marginTop: 0, marginBottom: 8, color: '#93c5fd', letterSpacing: 2, textTransform: 'uppercase', fontSize: 12 }}>
              Session
            </p>
            {hasSession ? (
              <div style={{ display: 'grid', gap: 12 }}>
                <div>
                  <strong>{session.user.email}</strong>
                  <div style={{ color: '#b7c6e3', marginTop: 6 }}>{session.user.role}</div>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  style={{
                    border: '1px solid rgba(148,163,184,0.24)',
                    background: 'rgba(15,23,42,0.8)',
                    color: '#e5eefc',
                    borderRadius: 14,
                    padding: '12px 14px',
                    cursor: 'pointer',
                  }}
                >
                  Sign out
                </button>
                <div style={{ color: '#b7c6e3', fontSize: 14 }}>
                  Token stored locally for bid submission requests.
                </div>
              </div>
            ) : (
              <form onSubmit={login} style={{ display: 'grid', gap: 12 }}>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontSize: 14, color: '#cbd5e1' }}>Email</span>
                  <input
                    value={loginForm.email}
                    onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))}
                    style={inputStyle}
                    type="email"
                    autoComplete="email"
                  />
                </label>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontSize: 14, color: '#cbd5e1' }}>Password</span>
                  <input
                    value={loginForm.password}
                    onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
                    style={inputStyle}
                    type="password"
                    autoComplete="current-password"
                  />
                </label>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontSize: 14, color: '#cbd5e1' }}>Role</span>
                  <select
                    value={loginForm.role}
                    onChange={(event) => setLoginForm((current) => ({ ...current, role: event.target.value }))}
                    style={inputStyle}
                  >
                    <option value="Supplier">Supplier</option>
                    <option value="PMU_Officer">PMU Officer</option>
                    <option value="Evaluator">Evaluator</option>
                    <option value="PRAZ_Regulator">PRAZ Regulator</option>
                    <option value="Public_Observer">Public Observer</option>
                  </select>
                </label>
                <button type="submit" disabled={loading} style={primaryButtonStyle}>
                  {loading ? 'Working...' : 'Sign in'}
                </button>
              </form>
            )}
          </aside>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: 14, padding: 14, color: '#fca5a5', marginBottom: 20 }}>
            {error}
          </div>
        )}
        {message && (
          <div style={{ background: 'rgba(34, 197, 94, 0.2)', border: '1px solid rgba(34, 197, 94, 0.4)', borderRadius: 14, padding: 14, color: '#86efac', marginBottom: 20 }}>
            {message}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16, marginBottom: 24 }}>
          {sections.map((section) => (
            <article key={section.title} style={{ ...cardStyle, borderRadius: 22, padding: 20 }}>
              <h2 style={{ fontSize: 20, marginTop: 0 }}>{section.title}</h2>
              <p style={{ marginBottom: 0, lineHeight: 1.6, color: '#c7d2fe' }}>{section.text}</p>
            </article>
          ))}
        </div>

        <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          <article style={{ ...cardStyle, borderRadius: 24, padding: 24 }}>
            <p style={eyebrowStyle}>Register account</p>
            <form onSubmit={register} style={{ display: 'grid', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={labelStyle}>Email</span>
                  <input
                    name="email"
                    value={registerForm.email}
                    onChange={(event) => setRegisterForm((current) => ({ ...current, email: event.target.value }))}
                    style={inputStyle}
                    type="email"
                    autoComplete="email"
                  />
                </label>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={labelStyle}>Password</span>
                  <input
                    name="password"
                    value={registerForm.password}
                    onChange={(event) => setRegisterForm((current) => ({ ...current, password: event.target.value }))}
                    style={inputStyle}
                    type="password"
                    autoComplete="new-password"
                  />
                </label>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={labelStyle}>Display name</span>
                  <input
                    name="displayName"
                    value={registerForm.displayName}
                    onChange={(event) => setRegisterForm((current) => ({ ...current, displayName: event.target.value }))}
                    style={inputStyle}
                    type="text"
                  />
                </label>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={labelStyle}>Role</span>
                  <select
                    name="role"
                    value={registerForm.role}
                    onChange={(event) => setRegisterForm((current) => ({ ...current, role: event.target.value }))}
                    style={inputStyle}
                  >
                    <option value="Supplier">Supplier</option>
                    <option value="PMU_Officer">PMU Officer</option>
                    <option value="Evaluator">Evaluator</option>
                    <option value="PRAZ_Regulator">PRAZ Regulator</option>
                    <option value="Public_Observer">Public Observer</option>
                  </select>
                </label>
              </div>
              {registerForm.role === 'PRAZ_Regulator' ? (
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={labelStyle}>PRAZ vendor number</span>
                  <input
                    name="prazVendorNumber"
                    value={registerForm.prazVendorNumber}
                    onChange={(event) => setRegisterForm((current) => ({ ...current, prazVendorNumber: event.target.value }))}
                    style={inputStyle}
                    type="text"
                  />
                </label>
              ) : null}
              <button type="submit" disabled={loading} style={secondaryButtonStyle}>
                {loading ? 'Working...' : 'Register'}
              </button>
            </form>
          </article>

          <article style={{ ...cardStyle, borderRadius: 24, padding: 24 }}>
            <p style={eyebrowStyle}>Status</p>
            <div style={{ display: 'grid', gap: 14 }}>
              <div style={statusPanelStyle}>
                <div style={{ color: '#93c5fd', fontSize: 12, textTransform: 'uppercase', letterSpacing: 2 }}>API base</div>
                <div style={{ marginTop: 6 }}>{API_BASE_URL}</div>
              </div>
              <div style={statusPanelStyle}>
                <div style={{ color: '#93c5fd', fontSize: 12, textTransform: 'uppercase', letterSpacing: 2 }}>Published tenders</div>
                <div style={{ marginTop: 6 }}>{tenders.length}</div>
              </div>
              <div style={statusPanelStyle}>
                <div style={{ color: '#93c5fd', fontSize: 12, textTransform: 'uppercase', letterSpacing: 2 }}>My bids</div>
                <div style={{ marginTop: 6 }}>{myBids.length}</div>
              </div>
            </div>
          </article>
        </section>

        <section style={{ ...cardStyle, borderRadius: 28, padding: 24, marginBottom: 24 }}>
          <p style={eyebrowStyle}>ZETA assistant</p>
          <h2 style={{ marginTop: 0 }}>Read-only chat guidance</h2>
          <div style={{ display: 'grid', gap: 10, maxHeight: 260, overflowY: 'auto', marginBottom: 16 }}>
            {zetaChatMessages.map((entry, index) => (
              <div
                key={`${entry.role}-${index}`}
                style={{
                  ...statusPanelStyle,
                  borderRadius: 18,
                  alignSelf: entry.role === 'user' ? 'end' : 'start',
                  background: entry.role === 'user' ? 'rgba(37, 99, 235, 0.18)' : 'rgba(8, 15, 32, 0.92)',
                }}
              >
                <div style={{ color: '#93c5fd', fontSize: 12, textTransform: 'uppercase', letterSpacing: 2 }}>
                  {entry.role === 'user' ? 'You' : 'ZETA'}
                </div>
                <div style={{ marginTop: 6, lineHeight: 1.65, whiteSpace: 'pre-wrap', color: '#e5eefc' }}>
                  {entry.content}
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={sendZetaChat} style={{ display: 'grid', gap: 12 }}>
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={labelStyle}>Ask ZETA</span>
              <textarea
                style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }}
                value={zetaChatInput}
                onChange={(event) => setZetaChatInput(event.target.value)}
                placeholder="Ask for tender guidance, compliance checks, or audit pointers."
              />
            </label>
            <button type="submit" disabled={chatLoading} style={primaryButtonStyle}>
              {chatLoading ? 'Thinking...' : 'Send to ZETA'}
            </button>
          </form>
          <div style={{ marginTop: 10, color: '#b7c6e3', fontSize: 13 }}>
            ZETA stays advisory. It does not approve, award, or announce tenders.
          </div>
        </section>

        <section style={{ ...cardStyle, borderRadius: 28, padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <p style={eyebrowStyle}>Published tenders</p>
              <h2 style={{ marginTop: 0 }}>Submit a draft bid</h2>
            </div>
            <button type="button" onClick={loadTenders} style={secondaryButtonStyle}>
              Refresh tenders
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginTop: 16 }}>
            {tenders.map((tender) => {
              const form = bidForms[tender.id] || {
                amount: '',
                coiData: '{"company":"","conflicts":"None known","affiliations":[]}',
              };

              return (
                <article key={tender.id} style={{ ...statusPanelStyle, borderRadius: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <h3 style={{ marginTop: 0, marginBottom: 6 }}>{tender.title}</h3>
                      <div style={{ color: '#b7c6e3', lineHeight: 1.6 }}>{tender.procuringEntity}</div>
                    </div>
                    <div style={{ textAlign: 'right', color: '#93c5fd', fontSize: 13 }}>{tender.tenderType}</div>
                  </div>
                  <div style={{ marginTop: 12, color: '#cbd5e1', fontSize: 14, lineHeight: 1.6 }}>
                    Deadline: {formatDate(tender.deadline)}
                  </div>
                  <label style={{ display: 'grid', gap: 6, marginTop: 14 }}>
                    <span style={labelStyle}>Bid amount</span>
                    <input
                      style={inputStyle}
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.amount}
                      onChange={(event) => updateBidForm(tender.id, { amount: event.target.value })}
                    />
                  </label>
                  <label style={{ display: 'grid', gap: 6, marginTop: 12 }}>
                    <span style={labelStyle}>COI data JSON</span>
                    <textarea
                      style={{ ...inputStyle, minHeight: 96, resize: 'vertical' }}
                      value={form.coiData}
                      onChange={(event) => updateBidForm(tender.id, { coiData: event.target.value })}
                    />
                  </label>
                  <button type="button" onClick={() => createBid(tender.id)} disabled={loading} style={{ ...primaryButtonStyle, marginTop: 14 }}>
                    Create draft bid
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        <section style={{ ...cardStyle, borderRadius: 28, padding: 24, marginBottom: 24 }}>
          <p style={eyebrowStyle}>My bids</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginTop: 16 }}>
            {myBids.length === 0 ? (
              <div style={{ color: '#b7c6e3' }}>Sign in to load your bids.</div>
            ) : (
              myBids.map((bid) => {
                const tender = tenderLookup.get(bid.tenderId);
                const form = sealForms[bid.id] || {
                  coiDeclaration: '{"company":"","conflicts":"None known","affiliations":[]}',
                };

                return (
                  <article key={bid.id} style={{ ...statusPanelStyle, borderRadius: 20 }}>
                    <div style={{ display: 'grid', gap: 6 }}>
                      <strong>{tender ? tender.title : bid.tenderId}</strong>
                      <div style={{ color: '#b7c6e3' }}>Status: {bid.status}</div>
                      <div style={{ color: '#b7c6e3' }}>Created: {formatDate(bid.createdAt)}</div>
                      {bid.sealedAt ? <div style={{ color: '#b7c6e3' }}>Sealed: {formatDate(bid.sealedAt)}</div> : null}
                    </div>

                    {bid.status === 'Draft' ? (
                      <>
                        <label style={{ display: 'grid', gap: 6, marginTop: 12 }}>
                          <span style={labelStyle}>Seal COI declaration JSON</span>
                          <textarea
                            style={{ ...inputStyle, minHeight: 96, resize: 'vertical' }}
                            value={form.coiDeclaration}
                            onChange={(event) => updateSealForm(bid.id, { coiDeclaration: event.target.value })}
                          />
                        </label>
                        <button type="button" onClick={() => sealBid(bid.id)} disabled={loading} style={{ ...secondaryButtonStyle, marginTop: 14 }}>
                          Seal bid
                        </button>
                      </>
                    ) : null}
                  </article>
                );
              })
            )}
          </div>
        </section>

        <section style={{ ...cardStyle, borderRadius: 28, padding: 24, marginBottom: 24 }}>
          <p style={eyebrowStyle}>Awarded tenders</p>
          <h2 style={{ marginTop: 0 }}>Vendor notifications and award status</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginTop: 16 }}>
            {awardedTenders.length === 0 ? (
              <div style={{ color: '#b7c6e3' }}>No awarded tenders yet.</div>
            ) : (
              awardedTenders.map((tender) => (
                <article key={tender.id} style={{ ...statusPanelStyle, borderRadius: 20 }}>
                  <div style={{ display: 'grid', gap: 8 }}>
                    <strong>{tender.title}</strong>
                    <div><strong>Procurement entity:</strong> {tender.procuringEntity}</div>
                    <div><strong>Awarded bid:</strong> {tender.awardedBidId || 'Unknown'}</div>
                    <div><strong>Award note:</strong> {tender.awardDecisionNote || 'Pending announcement'}</div>
                    <div><strong>Awarded at:</strong> {formatDate(tender.awardedAt)}</div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        {hasSession && ['PMU_Officer', 'Evaluator', 'PRAZ_Regulator'].includes(session.user.role) ? (
          <section style={{ ...cardStyle, borderRadius: 28, padding: 24, marginTop: 24, marginBottom: 24 }}>
            <p style={eyebrowStyle}>PMU / evaluator review</p>
            <h2 style={{ marginTop: 0 }}>Inspect sealed bids with AI advisory output</h2>
            <form onSubmit={reviewBid} style={{ display: 'grid', gap: 12, maxWidth: 560, marginBottom: 20 }}>
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={labelStyle}>Bid ID</span>
                <input
                  style={inputStyle}
                  value={reviewForm.bidId}
                  onChange={(event) => setReviewForm({ bidId: event.target.value })}
                  placeholder="Enter sealed bid ID"
                />
              </label>
              <button type="submit" disabled={loading} style={primaryButtonStyle}>
                Review Bid
              </button>
            </form>

            {reviewedBid && (
              <div style={{ ...statusPanelStyle, borderRadius: 18, marginTop: 16 }}>
                <h3 style={{ marginTop: 0 }}>Bid Review Result</h3>
                <pre style={{ whiteSpace: 'pre-wrap', color: '#cbd5e1', fontSize: 13 }}>
                  {JSON.stringify(reviewedBid, null, 2)}
                </pre>
              </div>
            )}
          </section>
        ) : null}

        {hasSession && ['PMU_Officer', 'PRAZ_Regulator'].includes(session.user.role) ? (
          <section style={{ ...cardStyle, borderRadius: 28, padding: 24, marginTop: 24 }}>
            <p style={eyebrowStyle}>Audit logs</p>
            <h2 style={{ marginTop: 0 }}>System audit activity</h2>
            <div style={{ display: 'grid', gap: 10, maxHeight: 300, overflowY: 'auto' }}>
              {auditLogs.length === 0 ? (
                <div style={{ color: '#b7c6e3' }}>No audit logs found.</div>
              ) : (
                auditLogs.map((log, index) => (
                  <div key={index} style={{ ...statusPanelStyle, borderRadius: 14, fontSize: 13 }}>
                    <div style={{ color: '#93c5fd', fontWeight: 600 }}>{log.actionType || 'Action'}</div>
                    <div style={{ color: '#cbd5e1', marginTop: 4 }}>{JSON.stringify(log)}</div>
                  </div>
                ))
              )}
            </div>
          </section>
        ) : null}
      </section>
    </main>
  );
}
