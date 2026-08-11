'use client';

import { useState } from 'react';
import { apiRequest } from './api';
import { cardStyle, inputStyle, primaryButtonStyle } from './styles';

export default function ZetaChat({ session, placeholder = 'Ask ZETA…' }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'ZETA is online. Ask about tenders, bids, awards, or audit logs and I will respond in advisory mode only.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!session?.token) {
    return (
      <div style={cardStyle}>
        <p style={{ margin: 0, color: '#94a3b8' }}>Sign in to use the ZETA assistant.</p>
      </div>
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    const prompt = input.trim();
    if (!prompt) return;

    setLoading(true);
    setMessages((current) => [...current, { role: 'user', content: prompt }]);
    setInput('');

    try {
      const payload = await apiRequest('/zeta/ask', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.token}` },
        body: JSON.stringify({ query: prompt }),
      });
      const answer = payload.answer || payload.response || 'No response from ZETA.';
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: answer },
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={cardStyle}>
      <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 18 }}>ZETA Assistant</h3>
      <div
        style={{
          background: 'rgba(15,23,42,0.6)',
          borderRadius: 14,
          padding: 12,
          maxHeight: 300,
          overflowY: 'auto',
          marginBottom: 12,
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              marginBottom: 10,
              color: m.role === 'user' ? '#e5eefc' : '#b7c6e3',
              fontWeight: m.role === 'user' ? 600 : 400,
              whiteSpace: 'pre-wrap',
            }}
          >
            <span style={{ color: '#93c5fd' }}>{m.role === 'user' ? 'You: ' : 'ZETA: '}</span>
            {m.content}
          </div>
        ))}
        {loading && <div style={{ color: '#93c5fd' }}>ZETA is thinking…</div>}
      </div>
      {error && <div style={{ color: '#fecaca', marginBottom: 10, fontSize: 13 }}>{error}</div>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ ...inputStyle, flex: 1 }}
          placeholder={placeholder}
          disabled={loading}
        />
        <button type="submit" disabled={loading} style={primaryButtonStyle}>
          Send
        </button>
      </form>
    </div>
  );
}
