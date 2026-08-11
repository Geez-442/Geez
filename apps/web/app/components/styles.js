export const cardStyle = {
  background: 'rgba(8, 15, 32, 0.72)',
  border: '1px solid rgba(148, 163, 184, 0.16)',
  borderRadius: 20,
  boxShadow: '0 18px 44px rgba(0, 0, 0, 0.3)',
  backdropFilter: 'blur(14px)',
  padding: 20,
};

export const inputStyle = {
  background: 'rgba(15, 23, 42, 0.9)',
  border: '1px solid rgba(148, 163, 184, 0.2)',
  borderRadius: 12,
  padding: '10px 14px',
  color: '#e5eefc',
  fontSize: 14,
  outline: 'none',
  width: '100%',
};

export const labelStyle = {
  fontSize: 14,
  color: '#cbd5e1',
};

export const primaryButtonStyle = {
  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
  color: '#ffffff',
  border: 'none',
  borderRadius: 14,
  padding: '12px 16px',
  fontWeight: 600,
  cursor: 'pointer',
};

export const secondaryButtonStyle = {
  background: 'rgba(30, 41, 59, 0.8)',
  color: '#e5eefc',
  border: '1px solid rgba(148, 163, 184, 0.24)',
  borderRadius: 14,
  padding: '12px 16px',
  fontWeight: 600,
  cursor: 'pointer',
};

export const eyebrowStyle = {
  marginTop: 0,
  marginBottom: 8,
  color: '#93c5fd',
  letterSpacing: 2,
  textTransform: 'uppercase',
  fontSize: 12,
};

export const badgeStyle = {
  background: 'rgba(56, 189, 248, 0.12)',
  color: '#7dd3fc',
  borderRadius: 999,
  padding: '4px 10px',
  fontSize: 12,
  fontWeight: 600,
  display: 'inline-block',
};

export function formatDate(value) {
  if (!value) return 'No deadline';
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}
