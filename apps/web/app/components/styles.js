// ZETS Design System — Ivory / Donkey Brown / Deep Forest / Champagne / Onyx / Sable

export const colors = {
  onyx: '#0F1115',
  sable: '#181818',
  ivory: '#FFF2E1',
  donkeyBrown: '#A79277',
  deepForest: '#1B3B2B',
  champagne: '#F7E7CE',
  borderMuted: 'rgba(167, 146, 119, 0.25)',
};

export const cardStyle = {
  background: 'rgba(24, 24, 24, 0.55)',
  border: '1px solid rgba(167, 146, 119, 0.18)',
  borderRadius: 20,
  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  padding: 20,
};

export const glassPanelStyle = {
  background: 'rgba(24, 24, 24, 0.65)',
  border: '1px solid rgba(167, 146, 119, 0.2)',
  borderRadius: 24,
  boxShadow: '0 8px 32px 0 rgba(15, 17, 21, 0.37)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
};

export const inputStyle = {
  background: 'rgba(15, 17, 21, 0.9)',
  border: '1px solid rgba(167, 146, 119, 0.3)',
  borderRadius: 12,
  padding: '12px 16px',
  color: '#FFF2E1',
  fontSize: 14,
  outline: 'none',
  width: '100%',
  transition: 'border-color 0.2s ease',
};

export const labelStyle = {
  fontSize: 12,
  fontWeight: 600,
  color: '#A79277',
  textTransform: 'uppercase',
  letterSpacing: 1.5,
};

export const primaryButtonStyle = {
  background: 'linear-gradient(135deg, #1B3B2B 0%, #2d5a3f 100%)',
  color: '#FFF2E1',
  border: '1px solid rgba(167, 146, 119, 0.3)',
  borderRadius: 14,
  padding: '12px 20px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

export const secondaryButtonStyle = {
  background: 'rgba(24, 24, 24, 0.8)',
  color: '#FFF2E1',
  border: '1px solid rgba(167, 146, 119, 0.24)',
  borderRadius: 14,
  padding: '12px 16px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

export const eyebrowStyle = {
  marginTop: 0,
  marginBottom: 8,
  color: '#F7E7CE',
  letterSpacing: 3,
  textTransform: 'uppercase',
  fontSize: 11,
  fontWeight: 600,
};

export const badgeStyle = {
  background: 'rgba(247, 231, 206, 0.12)',
  color: '#F7E7CE',
  borderRadius: 999,
  padding: '4px 12px',
  fontSize: 11,
  fontWeight: 600,
  display: 'inline-block',
  border: '1px solid rgba(167, 146, 119, 0.2)',
};

export const dangerBadgeStyle = {
  background: 'rgba(239, 68, 68, 0.12)',
  color: '#fca5a5',
  borderRadius: 999,
  padding: '4px 12px',
  fontSize: 11,
  fontWeight: 600,
  display: 'inline-block',
  border: '1px solid rgba(239, 68, 68, 0.2)',
};

export const successBadgeStyle = {
  background: 'rgba(34, 197, 94, 0.12)',
  color: '#86efac',
  borderRadius: 999,
  padding: '4px 12px',
  fontSize: 11,
  fontWeight: 600,
  display: 'inline-block',
  border: '1px solid rgba(34, 197, 94, 0.2)',
};

export const zetaBadgeStyle = {
  background: 'rgba(27, 59, 43, 0.6)',
  color: '#F7E7CE',
  borderRadius: 999,
  padding: '3px 10px',
  fontSize: 10,
  fontWeight: 600,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  border: '1px solid rgba(167, 146, 119, 0.3)',
};

export function formatDate(value) {
  if (!value) return 'No deadline';
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export function formatCurrency(value, currency = 'ZWL') {
  if (!value && value !== 0) return '—';
  return `${Number(value).toLocaleString('en-US', { minimumFractionDigits: 0 })} ${currency}`;
}
