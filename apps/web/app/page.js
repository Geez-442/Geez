'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from './components/api';
import {
  colors,
  cardStyle,
  glassPanelStyle,
  inputStyle,
  labelStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
  eyebrowStyle,
  zetaBadgeStyle,
} from './components/styles';
import AiFormAssist from './components/AiFormAssist';
import ZetaFloatingBot from './components/ZetaFloatingBot';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

const features = [
  { icon: '🛡️', title: 'PRAZ Compliance', text: 'Every registration is verified against PRAZ vendor records before approval.' },
  { icon: '🔒', title: 'Sealed Bid Security', text: 'AES-256 time-lock encryption ensures bids stay sealed until the deadline.' },
  { icon: '✨', title: 'ZETA AI Advisor', text: 'Embedded regulatory AI guides you through bidding, compliance, and navigation.' },
  { icon: '🗺️', title: 'Regional Mapping', text: 'Interactive map of Zimbabwe\u2019s 10 provinces for tender distribution tracking.' },
  { icon: '📊', title: 'Transparency Dashboard', text: 'Public oversight of awards, audit trails, and anomaly detection.' },
  { icon: '📡', title: 'Offline Bidding', text: 'Draft bids offline and sync when connectivity returns — built for low-bandwidth.' },
];

export default function HomePage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [pendingApproval, setPendingApproval] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    email: '',
    password: '',
    displayName: '',
    role: 'Supplier',
    prazVendorNumber: '',
  });

  useEffect(() => {
    const saved = window.localStorage.getItem('zets-session');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSession(parsed);
        // Auto-redirect if already logged in
        const role = parsed.user?.role;
        if (role === 'Supplier') router.push('/supplier');
        else if (role === 'PMU_Officer') router.push('/pmu');
        else if (role === 'PRAZ_Regulator') router.push('/praz');
      } catch {
        window.localStorage.removeItem('zets-session');
      }
    }
  }, [router]);

  async function login(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    setPendingApproval(false);

    try {
      const payload = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: loginForm.email, password: loginForm.password }),
      });
      const nextSession = { token: payload.token, user: payload.user };
      setSession(nextSession);
      window.localStorage.setItem('zets-session', JSON.stringify(nextSession));
      try {
        document.cookie = `zets_token=${payload.token}; Path=/; Max-Age=7200; SameSite=Lax`;
      } catch {}

      const role = payload.user?.role;
      if (role === 'Supplier') router.push('/supplier');
      else if (role === 'PMU_Officer') router.push('/pmu');
      else if (role === 'PRAZ_Regulator') router.push('/praz');
      else router.push('/public');
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('ACCOUNT_PENDING_APPROVAL')) {
        setPendingApproval(true);
        setError('');
      } else if (msg.includes('ACCOUNT_REJECTED')) {
        setError('Your registration was declined by PRAZ. Please contact the administrator.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  async function register(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const body = {
        email: registerForm.email,
        password: registerForm.password,
        displayName: registerForm.displayName || undefined,
        role: registerForm.role,
        prazVendorNumber: registerForm.role === 'Public_Observer' ? undefined : registerForm.prazVendorNumber,
      };
      Object.keys(body).forEach((k) => body[k] === undefined && delete body[k]);

      await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setMessage(
        'Registration submitted successfully. Your account is now pending PRAZ Administrator approval. You will be able to log in once approved.',
      );
      setRegisterForm({ email: '', password: '', displayName: '', role: 'Supplier', prazVendorNumber: '' });
      setAuthMode('login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    window.localStorage.removeItem('zets-session');
    setSession(null);
    try {
      document.cookie = 'zets_token=; Path=/; Max-Age=0';
    } catch {}
  }

  return (
    <main style={{ minHeight: '100vh', background: colors.onyx }}>
      {/* Top nav */}
      <nav
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: `linear-gradient(135deg, ${colors.deepForest} 0%, #2d5a3f 100%)`,
              border: `1px solid ${colors.donkeyBrown}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 18,
              color: colors.champagne,
            }}
          >
            Z
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: colors.ivory, letterSpacing: 1 }}>ZETS</div>
            <div style={{ fontSize: 10, color: colors.donkeyBrown, letterSpacing: 2, textTransform: 'uppercase' }}>
              Zimbabwe Electronic Tender Issuing System
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <a
            href="/public"
            style={{
              color: colors.champagne,
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 600,
              padding: '8px 16px',
              borderRadius: 10,
              border: `1px solid ${colors.borderMuted}`,
            }}
          >
            Transparency Portal
          </a>
          {session && (
            <button
              onClick={logout}
              style={{
                ...secondaryButtonStyle,
                background: 'transparent',
                border: `1px solid rgba(239, 68, 68, 0.3)`,
                color: '#fca5a5',
                fontSize: 13,
              }}
            >
              Sign out
            </button>
          )}
        </div>
      </nav>

      {/* Split-screen hero + auth */}
      <section
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '20px 24px 60px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
          gap: 32,
          alignItems: 'center',
          minHeight: 'calc(100vh - 80px)',
        }}
      >
        {/* Left: Hero showcase */}
        <div>
          <p style={{ ...eyebrowStyle, color: colors.champagne }}>PRAZ-Aligned E-Procurement Platform</p>
          <h1
            style={{
              fontSize: 'clamp(36px, 5vw, 64px)',
              lineHeight: 1.05,
              margin: '12px 0 20px',
              color: colors.ivory,
              fontWeight: 800,
            }}
          >
            Secure, transparent procurement for Zimbabwe.
          </h1>
          <p style={{ maxWidth: 520, fontSize: 17, lineHeight: 1.7, color: colors.donkeyBrown, marginBottom: 32 }}>
            ZETS connects procuring entities, suppliers, and regulators with an AI-guided workflow that enforces
            compliance, seals bids cryptographically, and opens oversight to the public.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
            {features.map((f) => (
              <div
                key={f.title}
                className="glass-card fade-in-up"
                style={{ padding: 18, borderRadius: 16 }}
              >
                <div style={{ fontSize: 24, marginBottom: 8 }}>{f.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: colors.ivory, marginBottom: 4 }}>{f.title}</div>
                <div style={{ fontSize: 12, lineHeight: 1.5, color: colors.donkeyBrown }}>{f.text}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Auth panel */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div
            className="glass-panel"
            style={{
              ...glassPanelStyle,
              padding: 32,
              maxWidth: 440,
              width: '100%',
              borderRadius: 28,
            }}
          >
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'rgba(15,17,21,0.6)', borderRadius: 12, padding: 4 }}>
              <button
                onClick={() => { setAuthMode('login'); setError(''); setMessage(''); setPendingApproval(false); }}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: 10,
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 14,
                  background: authMode === 'login' ? colors.deepForest : 'transparent',
                  color: authMode === 'login' ? colors.ivory : colors.donkeyBrown,
                  transition: 'all 0.2s ease',
                }}
              >
                Sign In
              </button>
              <button
                onClick={() => { setAuthMode('register'); setError(''); setMessage(''); setPendingApproval(false); }}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: 10,
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 14,
                  background: authMode === 'register' ? colors.deepForest : 'transparent',
                  color: authMode === 'register' ? colors.ivory : colors.donkeyBrown,
                  transition: 'all 0.2s ease',
                }}
              >
                Register
              </button>
            </div>

            {/* Pending approval status card */}
            {pendingApproval && (
              <div
                className="fade-in-up"
                style={{
                  background: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: 16,
                  padding: 20,
                  marginBottom: 16,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
                <h3 style={{ margin: '0 0 8px', color: '#fbbf24', fontSize: 16 }}>Awaiting Administrator Approval</h3>
                <p style={{ margin: 0, fontSize: 13, color: colors.donkeyBrown, lineHeight: 1.6 }}>
                  Your account is currently under review by a PRAZ Administrator. You will be able to sign in once
                  your registration is approved.
                </p>
                <button
                  onClick={() => setPendingApproval(false)}
                  style={{
                    marginTop: 14,
                    ...secondaryButtonStyle,
                    fontSize: 13,
                    padding: '8px 18px',
                  }}
                >
                  Back to sign in
                </button>
              </div>
            )}

            {/* Error / message */}
            {error && (
              <div
                className="fade-in-up"
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 14,
                  padding: 14,
                  color: '#fca5a5',
                  fontSize: 13,
                  marginBottom: 16,
                  lineHeight: 1.5,
                }}
              >
                {error}
              </div>
            )}
            {message && (
              <div
                className="fade-in-up"
                style={{
                  background: 'rgba(34, 197, 94, 0.12)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  borderRadius: 14,
                  padding: 14,
                  color: '#86efac',
                  fontSize: 13,
                  marginBottom: 16,
                  lineHeight: 1.5,
                }}
              >
                {message}
              </div>
            )}

            {/* Login form */}
            {authMode === 'login' && !pendingApproval && (
              <form onSubmit={login} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ marginBottom: 4 }}>
                  <label style={labelStyle}>Email</label>
                  <input
                    type="email"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    style={inputStyle}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Password</label>
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    style={inputStyle}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                </div>
                <button type="submit" disabled={loading} style={{ ...primaryButtonStyle, width: '100%' }}>
                  {loading ? 'Signing in…' : 'Sign In'}
                </button>
                <p style={{ textAlign: 'center', fontSize: 12, color: colors.donkeyBrown, marginTop: 16, lineHeight: 1.5 }}>
                  Your role is determined automatically after authentication.<br />
                  No role selection needed.
                </p>
              </form>
            )}

            {/* Register form */}
            {authMode === 'register' && !pendingApproval && (
              <form onSubmit={register} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <AiFormAssist
                  label="Email"
                  name="email"
                  type="email"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                  placeholder="you@example.com"
                  required
                  aiMode="default"
                />
                <AiFormAssist
                  label="Password"
                  name="password"
                  type="password"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                  placeholder="Minimum 8 characters"
                  required
                  aiMode="default"
                  helpText="Use at least 8 characters with a mix of letters, numbers, and symbols."
                />
                <AiFormAssist
                  label="Display Name"
                  name="displayName"
                  value={registerForm.displayName}
                  onChange={(e) => setRegisterForm({ ...registerForm, displayName: e.target.value })}
                  placeholder="Your name or company"
                  aiMode="title"
                />
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Account Type</label>
                  <select
                    value={registerForm.role}
                    onChange={(e) => setRegisterForm({ ...registerForm, role: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="Supplier">Supplier</option>
                    <option value="PMU_Officer">PMU Officer</option>
                    <option value="PRAZ_Regulator">PRAZ Regulator</option>
                    <option value="Public_Observer">Public Observer</option>
                  </select>
                </div>
                {registerForm.role !== 'Public_Observer' && (
                  <AiFormAssist
                    label="PRAZ Vendor / Entity Number"
                    name="prazVendorNumber"
                    value={registerForm.prazVendorNumber}
                    onChange={(e) => setRegisterForm({ ...registerForm, prazVendorNumber: e.target.value })}
                    placeholder="PRAZ-12345"
                    required
                    aiMode="praz-number"
                    helpText="Must match your PRAZ e-registration record."
                  />
                )}
                <button type="submit" disabled={loading} style={{ ...primaryButtonStyle, width: '100%' }}>
                  {loading ? 'Submitting…' : 'Submit Registration'}
                </button>
                <p style={{ textAlign: 'center', fontSize: 12, color: colors.donkeyBrown, marginTop: 14, lineHeight: 1.5 }}>
                  Registrations require PRAZ Administrator approval before login is enabled.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      <ZetaFloatingBot session={session} contextHint="home" />
    </main>
  );
}
