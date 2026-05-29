// Écran "Mes récompenses" — catalogue de cadeaux à débloquer avec ses XP.
// Ouvert au clic sur la carte XP de la home. 3 blocs façon Starbucks/McDo :
//   1. Jauge de progression vers le prochain cadeau
//   2. Catalogue boutique (débloqué en couleur / grisé sinon)
//   3. "Comment gagner des XP"
import React from 'react';
import type { Palette } from '../palette';
import { Mascotte } from '../Mascotte';
import { REWARDS_CATALOG, XP_RULES, nextReward } from './catalog';

interface RewardsModalProps {
  palette: Palette;
  open: boolean;
  onClose: () => void;
  xp: number;
  firstName?: string;
  onShowMyCode?: () => void; // pour aller montrer son QR au comptoir
}

export function RewardsModal({ palette, open, onClose, xp, firstName, onShowMyCode }: RewardsModalProps) {
  if (!open) return null;

  const next = nextReward(xp);
  const mascotteLevel = xp >= 1500 ? 'pro' : xp >= 800 ? 'regulier' : 'apprenti';

  // Progression vers le prochain palier (depuis le palier précédent)
  const prevCost = (() => {
    const reached = REWARDS_CATALOG.filter((r) => xp >= r.cost);
    return reached.length ? reached[reached.length - 1].cost : 0;
  })();
  const segTotal = next ? next.cost - prevCost : 1;
  const segDone = next ? xp - prevCost : 1;
  const pct = Math.min(100, Math.max(0, (segDone / segTotal) * 100));

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 70,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: '0',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 480,
          maxHeight: '92vh',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          background: `linear-gradient(180deg, ${palette.cardHi}, ${palette.bg})`,
          border: `1px solid ${palette.line}`,
          borderRadius: '28px 28px 0 0',
          padding: '20px 18px calc(28px + env(safe-area-inset-bottom, 0px))',
          color: palette.text,
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {/* Drag handle */}
        <div style={{ width: 40, height: 4, background: palette.line, borderRadius: 999, margin: '0 auto 16px' }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <Mascotte palette={palette} mood="happy" size={48} level={mascotteLevel} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 22, lineHeight: 1.1 }}>
              Mes récompenses
            </div>
            <div style={{ fontSize: 13, color: palette.textDim, marginTop: 3 }}>
              {firstName ? `${firstName}, ` : ''}cumule des XP, débloque des cadeaux 🎁
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            style={{
              width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
              background: 'rgba(0,0,0,.3)', border: `1px solid ${palette.line}`,
              color: palette.text, cursor: 'pointer', fontSize: 18,
            }}
          >
            ✕
          </button>
        </div>

        {/* ─── BLOC 1 : Jauge ─── */}
        <div
          style={{
            background: `linear-gradient(135deg, ${palette.card}, ${palette.cardHi})`,
            border: `1px solid ${palette.line}`,
            borderRadius: 18,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 30, color: palette.primary, lineHeight: 1 }}>
              {xp} <span style={{ fontSize: 15, color: palette.textDim }}>XP</span>
            </div>
            {next && (
              <div style={{ fontSize: 12, color: palette.textDim, textAlign: 'right' }}>
                plus que <b style={{ color: palette.accent }}>{next.cost - xp} XP</b>
                <br />pour {next.emoji} {next.title.toLowerCase()}
              </div>
            )}
            {!next && (
              <div style={{ fontSize: 12, color: palette.accent, fontWeight: 700, textAlign: 'right' }}>
                🏆 Tout débloqué !
              </div>
            )}
          </div>
          <div style={{ height: 10, background: 'rgba(0,0,0,.4)', borderRadius: 999, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${pct}%`,
                background: `linear-gradient(90deg, ${palette.glow1}, ${palette.glow2}, ${palette.accent})`,
                borderRadius: 999,
                boxShadow: `0 0 12px ${palette.primary}99`,
                transition: 'width .6s ease',
              }}
            />
          </div>
        </div>

        {/* ─── BLOC 2 : Catalogue ─── */}
        <div
          style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase',
            color: palette.textDim, margin: '4px 4px 10px',
          }}
        >
          🎁 Catalogue de cadeaux
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
          {REWARDS_CATALOG.map((r) => {
            const unlocked = xp >= r.cost;
            return (
              <div
                key={r.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 13,
                  padding: 14,
                  borderRadius: 16,
                  background: unlocked ? `linear-gradient(135deg, ${palette.primary}22, ${palette.card})` : palette.card,
                  border: `1px solid ${unlocked ? palette.primary : palette.line}`,
                  opacity: unlocked ? 1 : 0.6,
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    fontSize: 30, width: 48, height: 48, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: unlocked ? `${palette.primary}22` : 'rgba(0,0,0,.25)',
                    borderRadius: 12,
                    filter: unlocked ? 'none' : 'grayscale(0.5)',
                  }}
                >
                  {r.emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 15 }}>{r.title}</span>
                    <span style={{ fontSize: 10, color: palette.textDim }}>· {r.perceivedValue}</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: palette.textDim, marginTop: 2, lineHeight: 1.35 }}>{r.desc}</div>
                  <div style={{ marginTop: 6 }}>
                    {unlocked ? (
                      <span
                        style={{
                          fontSize: 11, fontWeight: 800, color: palette.ctaText,
                          background: palette.cta, padding: '4px 10px', borderRadius: 999,
                        }}
                      >
                        ✅ Disponible
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, fontWeight: 700, color: palette.textDim }}>
                        🔒 {r.cost} XP · encore {r.cost - xp} XP
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Comment récupérer */}
        <div
          style={{
            background: palette.bg,
            border: `1px dashed ${palette.line}`,
            borderRadius: 14,
            padding: 14,
            marginBottom: 16,
            fontSize: 12.5,
            color: palette.textDim,
            lineHeight: 1.5,
            textAlign: 'center',
          }}
        >
          📲 Pour récupérer un cadeau débloqué, <b style={{ color: palette.text }}>montre ton QR au comptoir</b>. On déduit les XP et tu repars avec ✨
          {onShowMyCode && (
            <button
              onClick={onShowMyCode}
              style={{
                display: 'block', width: '100%', marginTop: 12, padding: '12px',
                background: `linear-gradient(135deg, ${palette.primary}, ${palette.glow3})`,
                color: '#02100e', border: 0, borderRadius: 12,
                fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 13, cursor: 'pointer',
              }}
            >
              📱 Afficher mon QR
            </button>
          )}
        </div>

        {/* ─── BLOC 3 : Comment gagner ─── */}
        <div
          style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase',
            color: palette.textDim, margin: '4px 4px 10px',
          }}
        >
          ⚡ Comment gagner des XP
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {XP_RULES.map((rule, i) => (
            <div
              key={i}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 14px', background: palette.card,
                border: `1px solid ${palette.line}`, borderRadius: 12,
              }}
            >
              <span style={{ fontSize: 20 }}>{rule.emoji}</span>
              <span style={{ flex: 1, fontSize: 13.5 }}>{rule.label}</span>
              <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 13, color: palette.accent }}>
                {rule.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
