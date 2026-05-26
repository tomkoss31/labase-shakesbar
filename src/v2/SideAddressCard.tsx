// Side address card — compact, à mettre sous la XP card en colonne droite du hero
import React from 'react';
import type { Palette } from './palette';

interface SideAddressCardProps {
  palette: Palette;
}

export function SideAddressCard({ palette }: SideAddressCardProps) {
  return (
    <div
      style={{
        background: palette.card,
        border: `1px solid ${palette.line}`,
        borderRadius: 18,
        padding: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            flexShrink: 0,
            background: `linear-gradient(135deg, ${palette.primaryDeep}, ${palette.bg})`,
            border: `1px solid ${palette.line}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
          }}
        >
          📍
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: 'Outfit, sans-serif',
              fontWeight: 800,
              fontSize: 15,
              color: palette.text,
              lineHeight: 1.15,
            }}
          >
            11 rue Saint Pierre
          </div>
          <div style={{ fontSize: 11, color: palette.textDim, marginTop: 2 }}>
            55100 Verdun
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginTop: 8,
            }}
          >
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: '#22c55e',
                boxShadow: '0 0 8px #22c55e',
              }}
            />
            <div style={{ fontSize: 11, color: palette.text, fontWeight: 600 }}>
              Ouvert · prêt en 5-10 min
            </div>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <a
          href="https://www.google.com/maps/search/?api=1&query=11+rue+Saint+Pierre+Verdun"
          target="_blank"
          rel="noreferrer"
          style={{
            flex: 1,
            padding: '9px 10px',
            borderRadius: 10,
            background: palette.cta,
            color: palette.ctaText,
            border: 0,
            fontSize: 12,
            fontWeight: 800,
            cursor: 'pointer',
            textDecoration: 'none',
            textAlign: 'center',
            fontFamily: 'Outfit, sans-serif',
          }}
        >
          Itinéraire
        </a>
        <a
          href="https://g.page/r/CeJabN1yW1toEAE/review"
          target="_blank"
          rel="noreferrer"
          style={{
            flex: 1,
            padding: '9px 10px',
            borderRadius: 10,
            background: 'transparent',
            color: palette.text,
            border: `1px solid ${palette.line}`,
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            textDecoration: 'none',
            textAlign: 'center',
          }}
        >
          4,9 ★
        </a>
      </div>
    </div>
  );
}
