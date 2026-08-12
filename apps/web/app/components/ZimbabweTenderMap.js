'use client';

import { useState, useMemo } from 'react';
import { colors, glassPanelStyle } from './styles';

/**
 * Interactive SVG map of Zimbabwe's 10 provinces.
 * No external mapping library needed — uses stylized SVG polygons.
 * Provinces can be clicked to filter tenders by region.
 */

// Stylized province shapes (simplified polygons approximating Zimbabwe's provinces)
// Coordinates are in a 0-400 x 0-300 viewBox
const PROVINCES = [
  {
    id: 'harare',
    name: 'Harare',
    cx: 220,
    cy: 130,
    polygon: '200,110 250,110 255,135 230,150 200,145',
    color: '#1B3B2B',
  },
  {
    id: 'bulawayo',
    name: 'Bulawayo',
    cx: 130,
    cy: 190,
    polygon: '110,175 160,175 165,205 115,210',
    color: '#2d5a3f',
  },
  {
    id: 'manicaland',
    name: 'Manicaland',
    cx: 290,
    cy: 150,
    polygon: '255,115 320,110 340,160 300,180 255,165',
    color: '#1B3B2B',
  },
  {
    id: 'mash_central',
    name: 'Mashonaland Central',
    cx: 215,
    cy: 90,
    polygon: '180,60 260,55 270,100 220,110 190,95',
    color: '#2d5a3f',
  },
  {
    id: 'mash_east',
    name: 'Mashonaland East',
    cx: 260,
    cy: 130,
    polygon: '250,110 290,105 300,150 255,150 255,135',
    color: '#1B3B2B',
  },
  {
    id: 'mash_west',
    name: 'Mashonaland West',
    cx: 165,
    cy: 115,
    polygon: '120,80 200,75 200,145 130,150 110,120',
    color: '#2d5a3f',
  },
  {
    id: 'masvingo',
    name: 'Masvingo',
    cx: 235,
    cy: 210,
    polygon: '190,175 290,170 300,230 200,240 180,210',
    color: '#1B3B2B',
  },
  {
    id: 'mat_north',
    name: 'Matabeleland North',
    cx: 115,
    cy: 130,
    polygon: '80,80 130,75 140,170 90,175 70,130',
    color: '#2d5a3f',
  },
  {
    id: 'mat_south',
    name: 'Matabeleland South',
    cx: 140,
    cy: 220,
    polygon: '90,175 165,170 180,240 100,250 75,210',
    color: '#1B3B2B',
  },
  {
    id: 'midlands',
    name: 'Midlands',
    cx: 170,
    cy: 170,
    polygon: '140,150 210,145 210,180 165,205 140,180',
    color: '#2d5a3f',
  },
];

export default function ZimbabweTenderMap({ tenders = [], onProvinceSelect, selectedProvince, anomalyMode = false }) {
  const [hovered, setHovered] = useState(null);
  const [internalSelected, setInternalSelected] = useState(selectedProvince || null);

  // Map tenders to provinces (simulated — in production, tenders would have a province field)
  const provinceCounts = useMemo(() => {
    const counts = {};
    PROVINCES.forEach((p) => (counts[p.id] = 0));
    tenders.forEach((t, i) => {
      const province = PROVINCES[i % PROVINCES.length];
      counts[province.id] = (counts[province.id] || 0) + 1;
    });
    return counts;
  }, [tenders]);

  // For anomaly mode: highlight provinces with high concentration
  const maxCount = Math.max(1, ...Object.values(provinceCounts));
  const anomalyThreshold = maxCount * 0.6;

  function handleProvinceClick(province) {
    const next = internalSelected === province.id ? null : province.id;
    setInternalSelected(next);
    if (onProvinceSelect) onProvinceSelect(next);
  }

  function getProvinceFill(province) {
    const count = provinceCounts[province.id] || 0;
    if (anomalyMode && count >= anomalyThreshold && count > 0) {
      return 'rgba(239, 68, 68, 0.4)'; // red highlight for anomalies
    }
    const intensity = count / maxCount;
    if (intensity > 0.6) return province.color;
    if (intensity > 0.3) return '#1B3B2B';
    return 'rgba(27, 59, 43, 0.4)';
  }

  const selectedProvinceData = PROVINCES.find((p) => p.id === internalSelected);

  return (
    <div
      style={{
        ...glassPanelStyle,
        borderRadius: 24,
        padding: 24,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 18, color: colors.ivory, fontWeight: 700 }}>
            Regional Tender Distribution
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: colors.donkeyBrown }}>
            Interactive map of Zimbabwe — click a province to filter tenders
          </p>
        </div>
        {anomalyMode && (
          <span
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#fca5a5',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 999,
              padding: '4px 12px',
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            Anomaly Overlay
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {/* SVG Map */}
        <div style={{ flex: '1 1 320px', minWidth: 280 }}>
          <svg viewBox="0 0 400 300" style={{ width: '100%', height: 'auto' }}>
            {/* Background */}
            <rect width="400" height="300" fill="rgba(15, 17, 21, 0.6)" rx="12" />

            {/* Province shapes */}
            {PROVINCES.map((province) => {
              const isSelected = internalSelected === province.id;
              const isHovered = hovered === province.id;
              const fill = getProvinceFill(province);
              const count = provinceCounts[province.id] || 0;

              return (
                <g key={province.id}>
                  <polygon
                    points={province.polygon}
                    fill={fill}
                    stroke={isSelected ? colors.champagne : isHovered ? colors.donkeyBrown : 'rgba(167, 146, 119, 0.3)'}
                    strokeWidth={isSelected ? 2.5 : 1}
                    style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                    onMouseEnter={() => setHovered(province.id)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => handleProvinceClick(province)}
                  />
                  {/* Province label */}
                  <text
                    x={province.cx}
                    y={province.cy}
                    textAnchor="middle"
                    fill={count > 0 ? colors.ivory : colors.donkeyBrown}
                    fontSize="9"
                    fontWeight={count > 0 ? 700 : 400}
                    style={{ pointerEvents: 'none', textTransform: 'uppercase' }}
                  >
                    {province.name.split(' ').map((w, i) => (
                      <tspan key={i} x={province.cx} dy={i === 0 ? 0 : 11}>
                        {w}
                      </tspan>
                    ))}
                  </text>
                  {/* Count badge */}
                  {count > 0 && (
                    <circle
                      cx={province.cx + 25}
                      cy={province.cy - 15}
                      r="10"
                      fill={colors.champagne}
                      style={{ pointerEvents: 'none' }}
                    />
                  )}
                  {count > 0 && (
                    <text
                      x={province.cx + 25}
                      y={province.cy - 11}
                      textAnchor="middle"
                      fill={colors.deepForest}
                      fontSize="10"
                      fontWeight="700"
                      style={{ pointerEvents: 'none' }}
                    >
                      {count}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Province detail / legend */}
        <div style={{ flex: '0 1 200px', minWidth: 160 }}>
          {selectedProvinceData ? (
            <div className="fade-in-up">
              <div
                style={{
                  fontSize: 11,
                  color: colors.donkeyBrown,
                  textTransform: 'uppercase',
                  letterSpacing: 1.5,
                  marginBottom: 6,
                }}
              >
                Selected Province
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: colors.ivory, marginBottom: 8 }}>
                {selectedProvinceData.name}
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: colors.champagne }}>
                {provinceCounts[selectedProvinceData.id] || 0}
              </div>
              <div style={{ fontSize: 12, color: colors.donkeyBrown }}>Active tenders</div>
              <button
                onClick={() => handleProvinceClick(selectedProvinceData)}
                style={{
                  marginTop: 12,
                  background: 'transparent',
                  border: `1px solid ${colors.donkeyBrown}`,
                  color: colors.ivory,
                  borderRadius: 8,
                  padding: '6px 14px',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Clear filter
              </button>
            </div>
          ) : (
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: colors.donkeyBrown,
                  textTransform: 'uppercase',
                  letterSpacing: 1.5,
                  marginBottom: 10,
                }}
              >
                Legend
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: colors.ivory }}>
                  <span style={{ width: 14, height: 14, background: colors.deepForest, borderRadius: 3 }} />
                  High activity
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: colors.ivory }}>
                  <span style={{ width: 14, height: 14, background: 'rgba(27, 59, 43, 0.4)', borderRadius: 3 }} />
                  Low activity
                </div>
                {anomalyMode && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#fca5a5' }}>
                    <span style={{ width: 14, height: 14, background: 'rgba(239, 68, 68, 0.4)', borderRadius: 3 }} />
                    Anomaly flagged
                  </div>
                )}
              </div>
              <div style={{ marginTop: 16, fontSize: 11, color: colors.donkeyBrown, lineHeight: 1.5 }}>
                Total tenders mapped: <strong style={{ color: colors.champagne }}>{tenders.length}</strong>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
