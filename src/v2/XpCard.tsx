// Carte XP avec mascotte + barre de progression
import React from 'react';
import type { Palette } from './palette';
import { Mascotte } from './Mascotte';

interface XpCardProps {
  palette: Palette;
  level?: string;
  xp?: number;
  xpNext?: number;
  firstName?: string;
  connected?: boolean;
  onConnect?: () => void;
}

export function XpCard({
  palette,
  level = 'Apprenti',
  xp = 0,
  xpNext = 500,
  firstName,
  connected = false,
  onConnect,
}: XpCardProps) {
  const pct = Math.min(100, (xp / xpNext) * 100);
  const mascotteLevel = pct > 80 ? 'pro' : pct > 40 ? 'regulier' : 'apprenti';

  return (
    <div style={{ padding: '4px 16px 16px' }}>
      <div
        style={{
          background: `linear-gradient(135deg, ${palette.card}, ${palette.cardHi})`,
          border: `1px solid ${palette.line}`,
          borderRadius: 18,
          padding: 14,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            right: -20,
            top: -30,
            width: 140,
            height: 140,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${palette.primary}33, transparent 70%)`,
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
          <div style={{ flexShrink: 0 }}>
            <Mascotte palette={palette} mood="wave" size={54} level={mascotteLevel} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: palette.textDim, fontWeight: 500 }}>
              Salut {firstName ?? ''} 👋
            </div>
            <div
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 900,
                fontSize: 22,
                color: palette.text,
                lineHeight: 1.1,
                marginTop: 2,
              }}
            >
              {connected ? (
                <>
                  Niveau <span style={{ color: palette.primary }}>{level}</span>
                </>
              ) : (
                <>
                  Ton shake t'<span style={{ color: palette.primary }}>attend</span>
                </>
              )}
            </div>
          </div>
          {connected ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 10px',
                background: 'rgba(0,0,0,.3)',
                borderRadius: 999,
                border: `1px solid ${palette.line}`,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: palette.primary,
                  boxShadow: `0 0 8px ${palette.primary}`,
                }}
              />
              <span style={{ fontSize: 11, color: palette.text, fontWeight: 700, letterSpacing: '.04em' }}>
                {xp} XP
              </span>
            </div>
          ) : (
            <button
              onClick={onConnect}
              style={{
                padding: '8px 12px',
                background: palette.cta,
                color: palette.ctaText,
                border: 0,
                borderRadius: 999,
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 800,
                fontSize: 12,
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              Connecter
            </button>
          )}
        </div>

        {connected && (
          <div style={{ marginTop: 12 }}>
            <div
              style={{
                height: 8,
                background: 'rgba(0,0,0,.4)',
                borderRadius: 999,
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${pct}%`,
                  background: `linear-gradient(90deg, ${palette.glow1}, ${palette.glow2}, ${palette.accent})`,
                  borderRadius: 999,
                  boxShadow: `0 0 12px ${palette.primary}99`,
                  transition: 'width .5s ease',
                }}
              />
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: 8,
                fontSize: 11,
                color: palette.textDim,
              }}
            >
              <span>
                {xpNext - xp} XP avant{' '}
                <b style={{ color: palette.text, fontWeight: 700 }}>Régulier</b>
              </span>
              <span style={{ color: palette.primary, fontWeight: 700 }}>−10% bientôt</span>
            </div>
          </div>
        )}

        {!connected && (
          <div
            style={{
              marginTop: 10,
              fontSize: 12,
              color: palette.textDim,
              lineHeight: 1.4,
            }}
          >
            Connecte-toi pour cumuler des XP, débloquer des paliers VIP et tenter la roue cadeau hebdomadaire 🎁
          </div>
        )}
      </div>
    </div>
  );
}
