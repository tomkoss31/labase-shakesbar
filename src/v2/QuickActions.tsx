// Barre d'actions rapides sous la carte XP — la "pierre angulaire" fidélité :
// Récompenses · Roue · Parrainer · Bilan offert. Toujours accessible en haut.
import React from 'react';
import type { Palette } from './palette';

interface QuickAction {
  key: string;
  icon: string;
  label: string;
  sub: string;
  onClick: () => void;
}

interface QuickActionsProps {
  palette: Palette;
  onRewards: () => void;
  onWheel: () => void;
  onRefer: () => void;
  onClub: () => void;
}

export function QuickActions({ palette, onRewards, onWheel, onRefer, onClub }: QuickActionsProps) {
  const actions: QuickAction[] = [
    { key: 'rewards', icon: '🎁', label: 'Récompenses', sub: 'Mes cadeaux', onClick: onRewards },
    { key: 'wheel', icon: '🎰', label: 'Roue', sub: '1×/semaine', onClick: onWheel },
    { key: 'refer', icon: '🤝', label: 'Parrainer', sub: '+500 XP', onClick: onRefer },
    { key: 'club', icon: '💪', label: 'Le Club', sub: 'Bilan offert', onClick: onClub },
  ];

  return (
    <div style={{ padding: '0 16px 14px' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 8,
        }}
      >
        {actions.map((a) => (
          <button
            key={a.key}
            onClick={a.onClick}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              padding: '12px 4px',
              background: `linear-gradient(135deg, ${palette.card}, ${palette.cardHi})`,
              border: `1px solid ${palette.line}`,
              borderRadius: 14,
              cursor: 'pointer',
              fontFamily: 'inherit',
              minHeight: 78,
            }}
          >
            <div style={{ fontSize: 24, lineHeight: 1 }}>{a.icon}</div>
            <div
              style={{
                fontSize: 11.5,
                fontWeight: 800,
                color: palette.text,
                fontFamily: 'Outfit, sans-serif',
                textAlign: 'center',
                lineHeight: 1.1,
              }}
            >
              {a.label}
            </div>
            <div style={{ fontSize: 9.5, fontWeight: 600, color: palette.primary, letterSpacing: '.02em' }}>
              {a.sub}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
