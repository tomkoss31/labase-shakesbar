// Écran « Merci pour ta visite ! +X XP » — s'affiche au retour dans l'app
// après un passage au comptoir (le nombre de commandes a augmenté depuis la
// dernière ouverture). Renforce la boucle de fidélité : XP gagnés, jauge vers
// le prochain cadeau, roue dispo, parrainage.
import React from 'react';
import type { Palette } from './palette';
import { Mascotte } from './Mascotte';
import { nextGoal, goalText } from './rewards/catalog';
import { useModalA11y } from './useModalA11y';

interface VisitThanksModalProps {
  palette: Palette;
  open: boolean;
  onClose: () => void;
  firstName?: string | null;
  xp: number;
  xpGained: number; // > 0 : XP crédités depuis la dernière ouverture
  orders?: number; // achats réels au bar
  canSpin: boolean;
  onSpin: () => void;
  referralCode?: string | null;
  onShareReferral: () => void;
}

export function VisitThanksModal({
  palette,
  open,
  onClose,
  firstName,
  xp,
  xpGained,
  orders = 0,
  canSpin,
  onSpin,
  referralCode,
  onShareReferral,
}: VisitThanksModalProps) {
  const dialogRef = useModalA11y<HTMLDivElement>(open, onClose);
  if (!open) return null;

  const goal = nextGoal(xp, orders);
  const pct = goal ? Math.min(100, (xp / goal.tier.cost) * 100) : 100;

  const secondaryBtn: React.CSSProperties = {
    width: '100%',
    padding: '13px',
    borderRadius: 14,
    border: `1px solid ${palette.line}`,
    background: 'transparent',
    color: palette.text,
    fontWeight: 800,
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: 'inherit',
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 75,
        background: 'rgba(0,0,0,.82)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Merci pour ta visite"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 400,
          maxHeight: '92dvh',
          overflowY: 'auto',
          boxSizing: 'border-box',
          background: `linear-gradient(180deg, ${palette.cardHi}, ${palette.card})`,
          border: `1px solid ${palette.line}`,
          borderRadius: 28,
          padding: 24,
          color: palette.text,
          textAlign: 'center',
          position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          aria-label="Fermer"
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: palette.chip,
            border: `1px solid ${palette.line}`,
            color: palette.text,
            cursor: 'pointer',
            fontSize: 18,
          }}
        >
          ✕
        </button>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Mascotte palette={palette} mood="happy" size={72} />
        </div>
        <div
          style={{
            fontFamily: 'Outfit, sans-serif',
            fontWeight: 900,
            fontSize: 26,
            lineHeight: 1.1,
            marginTop: 10,
            letterSpacing: '-.02em',
          }}
        >
          Merci pour ta visite{firstName ? ` ${firstName}` : ''} !
        </div>

        {xpGained > 0 && (
          <div
            style={{
              margin: '14px auto 0',
              display: 'inline-block',
              padding: '8px 18px',
              borderRadius: 999,
              background: `linear-gradient(90deg, ${palette.accent}, ${palette.primary})`,
              color: '#04100f',
              fontFamily: 'Outfit, sans-serif',
              fontWeight: 900,
              fontSize: 24,
            }}
          >
            +{xpGained} XP
          </div>
        )}
        <div style={{ fontSize: 13, color: palette.textDim, marginTop: 8 }}>
          Ton solde : <b style={{ color: palette.text }}>{xp} XP</b>
        </div>

        {/* Jauge vers le prochain cadeau */}
        <div style={{ marginTop: 16, textAlign: 'left' }}>
          <div style={{ height: 10, background: palette.track, borderRadius: 999, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${pct}%`,
                background: `linear-gradient(90deg, ${palette.glow1}, ${palette.glow2}, ${palette.accent})`,
                borderRadius: 999,
              }}
            />
          </div>
          <div style={{ fontSize: 13, marginTop: 8, color: palette.textDim, lineHeight: 1.4 }}>
            {goal ? (
              <>
                {goal.xpMissing > 0 ? 'Plus que' : 'Encore'}{' '}
                <b style={{ color: palette.text }}>{goalText(goal).replace(/ (pour|pour débloquer)$/, '')}</b>{' '}
                {goal.xpMissing > 0 ? 'pour' : 'pour débloquer'} {goal.tier.emoji}{' '}
                <b style={{ color: palette.text }}>{goal.tier.short.toLowerCase()}</b>
              </>
            ) : (
              <>🎁 Tous les cadeaux sont débloqués — fais-toi plaisir au comptoir !</>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 18 }}>
          {canSpin && (
            <button
              onClick={onSpin}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 14,
                border: 'none',
                background: palette.cta,
                color: palette.ctaText,
                fontWeight: 900,
                fontSize: 15,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              🎰 Ta roue de la semaine t’attend
            </button>
          )}
          {referralCode && (
            <button onClick={onShareReferral} style={secondaryBtn}>
              🤝 Invite un ami · <span style={{ color: palette.primary }}>+500 XP</span> pour toi
            </button>
          )}
          <button onClick={onClose} style={{ ...secondaryBtn, border: 'none', color: palette.textDim, fontWeight: 700 }}>
            À bientôt !
          </button>
        </div>
      </div>
    </div>
  );
}
