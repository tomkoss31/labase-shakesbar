// Bandeaux d'accueil liés aux horaires (déclencheurs de visite) :
//   - « Mardi Double XP » le mardi (heure de Paris) ;
//   - « Ouvert encore X min » quand le bar ferme dans moins d'1 h (créneaux
//     courts du mercredi/jeudi 11h-13h : aide à décider de passer maintenant).
import React, { useEffect, useState } from 'react';
import type { Palette } from './palette';
import { useOpenStatus, isParisTuesday } from './openingHours';

export function HomeBanners({ palette }: { palette: Palette }) {
  // Re-rendu toutes les 30 s pour que le compte à rebours reste juste
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setTick((n) => n + 1), 30000);
    return () => window.clearInterval(t);
  }, []);

  const status = useOpenStatus();
  const tuesday = isParisTuesday();
  const minutes = status.isOpen ? status.minutesToClose ?? null : null;
  const closingSoon = minutes !== null && minutes > 0 && minutes <= 60;

  if (!tuesday && !closingSoon) return null;

  const banner = (key: string, bg: string, border: string, icon: string, content: React.ReactNode) => (
    <div
      key={key}
      role="status"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 14px',
        borderRadius: 14,
        background: bg,
        border: `1px solid ${border}`,
        fontSize: 13,
        lineHeight: 1.35,
        color: palette.text,
      }}
    >
      <span style={{ fontSize: 20, flexShrink: 0 }} aria-hidden>
        {icon}
      </span>
      <span style={{ minWidth: 0 }}>{content}</span>
    </div>
  );

  return (
    <div style={{ padding: '0 16px 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {closingSoon &&
        banner(
          'closing',
          'rgba(251,113,133,.12)',
          'rgba(251,113,133,.45)',
          '⏳',
          <>
            <b>
              {minutes! <= 5 ? `Ferme dans ${minutes} min` : `Ouvert encore ${minutes} min`}
            </b>{' '}
            (jusqu’à {status.closeLabel}) — passe vite prendre ton shake !
          </>,
        )}
      {tuesday &&
        banner(
          'tuesday',
          `linear-gradient(90deg, ${palette.accent}2e, ${palette.primary}1f)`,
          `${palette.accent}66`,
          '🔥',
          <>
            <b style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900 }}>Mardi Double XP</b> — aujourd’hui,
            chaque euro dépensé rapporte <b>20 XP</b> au lieu de 10 !
          </>,
        )}
    </div>
  );
}
