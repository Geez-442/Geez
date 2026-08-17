'use client';

import { useState, useRef, useEffect } from 'react';
import { apiRequest } from './api';
import { colors } from './styles';

/**
 * Non-intrusive floating ZETA assistant orb.
 * Lives in the bottom-right corner; expands into a compact chat drawer.
 * Does NOT cover the full screen.
 */
export default function ZetaFloatingBot({ session, contextHint = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Greetings! I am ZETA, your PRAZ-grounded procurement advisor. Ask me about tender rules, bidding thresholds, or navigation.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  async function sendMessage() {
    const prompt = input.trim();
    if (!prompt || loading) return;

    setMessages((prev) => [...prev, { role: 'user', content: prompt }]);
    setInput('');
    setLoading(true);

    try {
      // Signed-in users get role-tailored guidance; visitors get public-scope guidance.
      const headers = { 'Content-Type': 'application/json' };
      const endpoint = session?.token ? '/zeta/ask' : '/zeta/ask-public';
      if (session?.token) {
        headers.Authorization = `Bearer ${session.token}`;
      }
      const payload = await apiRequest(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query: prompt }),
      });
      const answer = payload.answer || payload.response || 'I am operating in grounded advisory mode.';
      setMessages((prev) => [...prev, { role: 'assistant', content: answer }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `I could not reach the advisory service: ${err.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999 }}>
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open ZETA AI Assistant"
          style={{
            background: `linear-gradient(135deg, ${colors.deepForest} 0%, #2d5a3f 100%)`,
            color: colors.ivory,
            border: `1px solid ${colors.donkeyBrown}`,
            padding: '14px 22px',
            borderRadius: 999,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <span
            className="zeta-pulse"
            style={{ width: 8, height: 8, borderRadius: '50%', background: '#86efac' }}
          />
          ZETA Assistant
        </button>
      ) : (
        <div
          style={{
            width: 380,
            height: 520,
            maxHeight: '70vh',
            background: `rgba(24, 24, 24, 0.95)`,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: `1px solid rgba(167, 146, 119, 0.3)`,
            borderRadius: 24,
            boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'fade-in-up 0.3s ease-out',
          }}
        >
          {/* Header */}
          <div
            style={{
              background: `linear-gradient(135deg, ${colors.deepForest} 0%, #2d5a3f 100%)`,
              padding: '14px 18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: `1px solid rgba(167, 146, 119, 0.3)`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: colors.champagne,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                }}
              >
                Z
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: colors.ivory }}>ZETA Regulatory AI</div>
                <div style={{ fontSize: 10, color: colors.champagne, opacity: 0.8 }}>PRAZ Grounded Companion</div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close ZETA"
              style={{
                background: 'transparent',
                border: 'none',
                color: colors.donkeyBrown,
                fontSize: 18,
                cursor: 'pointer',
                padding: 4,
              }}
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            style={{
              flex: 1,
              padding: 16,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className="fade-in-up"
                style={{
                  maxWidth: '85%',
                  padding: '10px 14px',
                  borderRadius: 14,
                  fontSize: 13,
                  lineHeight: 1.5,
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  background:
                    m.role === 'user'
                      ? 'rgba(167, 146, 119, 0.15)'
                      : 'rgba(15, 17, 21, 0.8)',
                  color: m.role === 'user' ? colors.ivory : colors.champagne,
                  border: `1px solid rgba(167, 146, 119, 0.15)`,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {m.content}
              </div>
            ))}
            {loading && (
              <div style={{ color: colors.donkeyBrown, fontStyle: 'italic', fontSize: 12, padding: '0 14px' }}>
                ZETA is consulting PRAZ regulations…
              </div>
            )}
          </div>

          {/* Input */}
          <div
            style={{
              padding: 12,
              background: `rgba(15, 17, 21, 0.9)`,
              borderTop: `1px solid rgba(167, 146, 119, 0.2)`,
              display: 'flex',
              gap: 8,
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask about tenders, PRAZ rules…"
              disabled={loading}
              style={{
                flex: 1,
                background: colors.sable,
                color: colors.ivory,
                fontSize: 13,
                padding: '10px 14px',
                borderRadius: 10,
                border: `1px solid rgba(167, 146, 119, 0.3)`,
                outline: 'none',
              }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              style={{
                background: colors.deepForest,
                color: colors.ivory,
                border: 'none',
                padding: '10px 16px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 700,
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                opacity: loading || !input.trim() ? 0.5 : 1,
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
