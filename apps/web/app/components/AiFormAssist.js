'use client';

import { useState, useMemo } from 'react';
import { colors, inputStyle, labelStyle, zetaBadgeStyle } from './styles';

/**
 * ZETA AI-powered smart input field.
 * Modes:
 *   - 'praz-number': auto-formats to PRAZ-XXXX pattern
 *   - 'uppercase': enforces uppercase
 *   - 'currency': formats numbers with thousand separators + threshold hints
 *   - 'title': auto-capitalizes each word
 *   - 'tender-id': enforces alphanumeric + dashes
 *   - 'default': standard text with ZETA badge
 */
export default function AiFormAssist({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = 'text',
  aiMode = 'default',
  helpText,
  required = false,
  min,
  rows,
  style,
}) {
  const [suggestion, setSuggestion] = useState('');

  const thresholds = useMemo(
    () => [
      { limit: 0, label: 'Micro procurement (direct purchase allowed)' },
      { limit: 5000, label: 'Small procurement (quotations required)' },
      { limit: 50000, label: 'Competitive bidding threshold — open tender required' },
      { limit: 500000, label: 'Major procurement — PRAZ oversight recommended' },
      { limit: 5000000, label: 'Strategic procurement — Cabinet approval may apply' },
    ],
    [],
  );

  function handleInputChange(e) {
    let val = e.target.value;
    let newSuggestion = '';

    if (aiMode === 'praz-number') {
      val = val.toUpperCase().replace(/[^A-Z0-9-]/g, '');
      if (val.length > 0 && !val.startsWith('PRAZ')) {
        // Auto-prefix PRAZ- if user starts typing digits
        if (/^\d/.test(val)) {
          val = `PRAZ-${val}`;
        }
      }
      if (val.length >= 5) {
        newSuggestion = 'Format looks valid. PRAZ vendor numbers must match your e-registration record.';
      }
    } else if (aiMode === 'uppercase') {
      val = val.toUpperCase();
    } else if (aiMode === 'title') {
      val = val.replace(/\b\w/g, (c) => c.toUpperCase());
    } else if (aiMode === 'tender-id') {
      val = val.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    } else if (aiMode === 'currency') {
      const numeric = val.replace(/[^0-9.]/g, '');
      if (numeric) {
        const num = Number(numeric);
        const formatted = num.toLocaleString('en-US', { minimumFractionDigits: 0 });
        newSuggestion = `Formatted: ${formatted}`;
        // Find applicable threshold
        const threshold = thresholds.find((t, i) => {
          const next = thresholds[i + 1];
          return num >= t.limit && (!next || num < next.limit);
        });
        if (threshold) {
          newSuggestion += ` — ${threshold.label}`;
        }
      }
    }

    setSuggestion(newSuggestion);
    onChange({ target: { name, value: val } });
  }

  const baseInput = {
    ...inputStyle,
    fontFamily: aiMode === 'currency' || aiMode === 'praz-number' || aiMode === 'tender-id' ? 'monospace' : 'inherit',
    ...style,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16, position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={labelStyle}>
          {label} {required && <span style={{ color: '#fca5a5' }}>*</span>}
        </label>
        <span style={zetaBadgeStyle}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#86efac', display: 'inline-block' }} />
          ZETA AI
        </span>
      </div>
      {rows ? (
        <textarea
          name={name}
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          rows={rows}
          style={{ ...baseInput, minHeight: rows * 24, resize: 'vertical' }}
          required={required}
        />
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          style={baseInput}
          required={required}
          min={min}
        />
      )}
      {suggestion && (
        <span
          className="fade-in-up"
          style={{
            fontSize: 12,
            color: colors.champagne,
            fontStyle: 'italic',
            marginTop: 2,
            opacity: 0.85,
          }}
        >
          ✨ {suggestion}
        </span>
      )}
      {helpText && !suggestion && (
        <span style={{ fontSize: 11, color: colors.donkeyBrown, opacity: 0.8 }}>{helpText}</span>
      )}
    </div>
  );
}
