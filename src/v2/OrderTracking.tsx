// Live tracking post-paiement — 4 phases (Reçue → Préparation → Finitions → Prêt)
// Simulation pure côté front pour la démo (~60s total).
// Persisté en sessionStorage pour survivre un refresh.
// Plus tard : à brancher sur orders.status via Supabase realtime.
import React, { useEffect, useMemo, useState } from 'react';
import type { Palette } from './palette';
import { Mascotte } from './Mascotte';

const STORAGE_KEY = 'labase-order-tracking';
const TOTAL_SECONDS = 60; // 60s pour la démo
const PHASE_BOUNDS = [5, 25, 45, TOTAL_SECONDS] as const; // seconds at end of each phase

interface OrderTrackingProps {
  palette: Palette;
  open: boolean;
  customerName?: string;
  onClose: () => void;
}

interface PersistedState {
  startedAt: number;
  orderId: string;
  customerName: string;
}

function loadState(): PersistedState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedState;
    if (!parsed.startedAt || !parsed.orderId) return null;
    // Si plus de 30 min se sont écoulées, on considère que c'est expiré
    if (Date.now() - parsed.startedAt > 30 * 60 * 1000) {
      window.sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveState(state: PersistedState) {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function clearState() {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(STORAGE_KEY);
}

const PHASES = [
  { id: 0, label: 'Reçue', icon: '✓', sub: 'Paiement confirmé' },
  { id: 1, label: 'En préparation', icon: '🥤', sub: 'Le shaker est en route' },
  { id: 2, label: 'Finitions', icon: '✨', sub: 'Toppings & emballage' },
  { id: 3, label: 'Prêt à retirer', icon: '🎉', sub: 'À toi de jouer' },
] as const;

export function OrderTracking({ palette, open, customerName = '', onClose }: OrderTrackingProps) {
  const [elapsed, setElapsed] = useState(0);
  const [notifyMe, setNotifyMe] = useState(false);

  // État persisté (orderId + startedAt + name)
  const [state, setState] = useState<PersistedState | null>(null);

  useEffect(() => {
    if (!open) return;
    const existing = loadState();
    if (existing) {
      setState(existing);
      setElapsed(Math.floor((Date.now() - existing.startedAt) / 1000));
      return;
    }
    // Nouveau tracking
    const newState: PersistedState = {
      startedAt: Date.now(),
      orderId: 'LB-' + Math.floor(2300 + Math.random() * 700),
      customerName: customerName || 'toi',
    };
    saveState(newState);
    setState(newState);
    setElapsed(0);
  }, [open, customerName]);

  // Tick chaque seconde
  useEffect(() => {
    if (!open || !state) return;
    const tick = () => setElapsed(Math.floor((Date.now() - state.startedAt) / 1000));
    tick();
    const t = window.setInterval(tick, 1000);
    return () => window.clearInterval(t);
  }, [open, state]);

  // Détermine la phase courante
  const phase = useMemo(() => {
    if (elapsed >= PHASE_BOUNDS[2]) return 3;
    if (elapsed >= PHASE_BOUNDS[1]) return 2;
    if (elapsed >= PHASE_BOUNDS[0]) return 1;
    return 0;
  }, [elapsed]);

  const pct = Math.min(100, (elapsed / TOTAL_SECONDS) * 100);
  const remaining = Math.max(0, TOTAL_SECONDS - elapsed);
  const isReady = phase === 3;

  function handleClose() {
    clearState();
    setState(null);
    setElapsed(0);
    onClose();
  }

  if (!open || !state) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 70,
        background: palette.bg,
        color: palette.text,
        fontFamily: 'Inter, sans-serif',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Hero top */}
      <div
        style={{
          position: 'relative',
          flexShrink: 0,
          padding: '24px 24px 32px',
          background: isReady
            ? `linear-gradient(180deg, ${palette.glow1}, ${palette.glow2} 60%, ${palette.bg})`
            : `linear-gradient(180deg, ${palette.cardHi}, ${palette.bg})`,
          textAlign: 'center',
          transition: 'background .6s ease',
          overflow: 'hidden',
        }}
      >
        {/* Confetti quand prêt */}
        {isReady && <ConfettiBurst palette={palette} />}

        <button
          onClick={handleClose}
          aria-label="Fermer"
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            zIndex: 5,
            width: 38,
            height: 38,
            borderRadius: 12,
            background: 'rgba(0,0,0,.4)',
            backdropFilter: 'blur(8px)',
            border: `1px solid rgba(255,255,255,.10)`,
            color: '#fff',
            cursor: 'pointer',
            fontSize: 18,
          }}
        >
          ✕
        </button>

        <div style={{ position: 'relative', zIndex: 2, paddingTop: 30 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '.15em',
              textTransform: 'uppercase',
              color: isReady ? '#fff' : palette.primary,
              opacity: 0.9,
            }}
          >
            Commande {state.orderId}
          </div>

          <div
            style={{
              fontFamily: 'Outfit, sans-serif',
              fontWeight: 900,
              fontSize: isReady ? 38 : 30,
              color: isReady ? '#fff' : palette.text,
              letterSpacing: '-.02em',
              lineHeight: 1.05,
              marginTop: 10,
              transition: 'font-size .4s, color .4s',
            }}
          >
            {isReady ? `Prêt, ${state.customerName} !` : `Salut ${state.customerName},`}
          </div>

          <div
            style={{
              fontSize: 14,
              marginTop: 8,
              color: isReady ? 'rgba(255,255,255,.92)' : palette.textDim,
              fontWeight: 500,
            }}
          >
            {isReady ? 'Ton retrait t\'attend au comptoir' : 'On prépare ta commande au club'}
          </div>

          {!isReady && (
            <div
              style={{
                marginTop: 16,
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 900,
                fontSize: 52,
                color: palette.primary,
                lineHeight: 1,
                letterSpacing: '-.04em',
              }}
            >
              {Math.floor(remaining / 60)}<span style={{ fontSize: 28, opacity: .7 }}>min</span>{' '}
              {(remaining % 60).toString().padStart(2, '0')}<span style={{ fontSize: 22, opacity: .7 }}>s</span>
            </div>
          )}

          {isReady && (
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
              <Mascotte palette={palette} mood="happy" size={80} level="pro" />
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ padding: '0 20px', marginTop: -16, zIndex: 3 }}>
        <div
          style={{
            background: palette.card,
            border: `1px solid ${palette.line}`,
            borderRadius: 16,
            padding: 14,
          }}
        >
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
                transition: 'width .8s ease',
              }}
            />
          </div>
        </div>
      </div>

      {/* Phases */}
      <div style={{ padding: '20px 20px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {PHASES.map((p) => {
          const done = phase > p.id;
          const current = phase === p.id;
          const upcoming = phase < p.id;
          return (
            <div
              key={p.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: 14,
                background: current ? palette.primary + '15' : palette.card,
                border: `1px solid ${current ? palette.primary + '55' : palette.line}`,
                borderRadius: 14,
                opacity: upcoming ? 0.5 : 1,
                transition: 'all .4s ease',
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: done ? palette.primary : current ? palette.accent : palette.bg,
                  color: done || current ? palette.bg : palette.textDim,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  flexShrink: 0,
                  transition: 'all .4s ease',
                  boxShadow: current ? `0 0 16px ${palette.accent}66` : 'none',
                }}
              >
                {done ? '✓' : p.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: 'Outfit, sans-serif',
                    fontWeight: 800,
                    fontSize: 15,
                    color: current ? palette.primary : palette.text,
                  }}
                >
                  {p.label}
                </div>
                <div style={{ fontSize: 12, color: palette.textDim, marginTop: 2 }}>{p.sub}</div>
              </div>
              {current && (
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: palette.primary,
                    boxShadow: `0 0 12px ${palette.primary}`,
                    animation: 'pulse 1.4s ease-in-out infinite',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Notify toggle (sauf si déjà prêt) */}
      {!isReady && (
        <div style={{ padding: '0 20px 20px' }}>
          <button
            onClick={() => setNotifyMe(!notifyMe)}
            style={{
              width: '100%',
              padding: '14px 16px',
              background: notifyMe ? palette.primary + '20' : palette.card,
              border: `1px solid ${notifyMe ? palette.primary : palette.line}`,
              borderRadius: 14,
              color: palette.text,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              transition: 'all .2s',
            }}
          >
            <span>🔔 Préviens-moi 1 min avant</span>
            <span
              style={{
                width: 36,
                height: 22,
                borderRadius: 999,
                background: notifyMe ? palette.primary : palette.bg,
                position: 'relative',
                transition: 'background .2s',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: 2,
                  left: notifyMe ? 16 : 2,
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: '#fff',
                  transition: 'left .2s',
                }}
              />
            </span>
          </button>
        </div>
      )}

      {/* CTA bottom */}
      <div
        style={{
          marginTop: 'auto',
          padding: '20px 20px calc(20px + env(safe-area-inset-bottom, 0px))',
          background: `linear-gradient(180deg, transparent, ${palette.bg} 30%)`,
        }}
      >
        <button
          onClick={handleClose}
          style={{
            width: '100%',
            padding: '16px',
            background: isReady ? palette.cta : 'transparent',
            color: isReady ? palette.ctaText : palette.text,
            border: isReady ? 0 : `1px solid ${palette.line}`,
            borderRadius: 16,
            fontFamily: 'Outfit, sans-serif',
            fontWeight: 900,
            fontSize: 15,
            cursor: 'pointer',
            boxShadow: isReady ? `0 12px 32px ${palette.cta}55` : 'none',
            transition: 'all .3s',
          }}
        >
          {isReady ? 'J\'arrive au comptoir →' : 'Revenir au menu'}
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: .55; transform: scale(1.35); }
        }
      `}</style>
    </div>
  );
}

// ─── Confetti CSS pur (pas de lib) ─────────────────────────────────
function ConfettiBurst({ palette }: { palette: Palette }) {
  const colors = [palette.accent, palette.primary, palette.glow1, '#fde047', '#fb7185'];
  const pieces = useMemo(
    () =>
      Array.from({ length: 28 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 1.6 + Math.random() * 1.6,
        color: colors[i % colors.length],
        rotate: Math.random() * 360,
        size: 6 + Math.floor(Math.random() * 8),
      })),
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 1,
      }}
    >
      {pieces.map((p) => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            top: -10,
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 1.5,
            background: p.color,
            opacity: 0.9,
            transform: `rotate(${p.rotate}deg)`,
            animation: `confettiFall ${p.duration}s linear ${p.delay}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(320px) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
