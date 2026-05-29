// Modale roue cadeau hebdomadaire
// Animation rotation SVG + confetti à l'arrivée + code promo généré
import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Palette } from '../palette';
import {
  WHEEL_SEGMENTS,
  pickWheelSegment,
  generateRewardCode,
  getWheelCooldown,
  markWheelSpun,
  WHEEL_COOLDOWN_DAYS,
  type WheelSegment,
} from './segments';
import { getSupabase, getStoredSession } from '../../lib/supabase';
import { track } from '../../lib/analytics';

interface WheelModalProps {
  palette: Palette;
  open: boolean;
  onClose: () => void;
}

interface SpinResult {
  segment: WheelSegment;
  code: string;
}

const WHEEL_SIZE = 320;
const WHEEL_RADIUS = WHEEL_SIZE / 2;
const SEGMENT_COUNT = WHEEL_SEGMENTS.length;
const SEGMENT_ANGLE = 360 / SEGMENT_COUNT;

export function WheelModal({ palette, open, onClose }: WheelModalProps) {
  const [phase, setPhase] = useState<'idle' | 'loading' | 'spinning' | 'result'>('idle');
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<SpinResult | null>(null);
  const cooldown = useMemo(() => getWheelCooldown(), [open]);
  const audioRef = useRef<number | null>(null);

  // Reset quand on (re)ouvre
  useEffect(() => {
    if (!open) return;
    setPhase('idle');
    setRotation(0);
    setResult(null);
  }, [open]);

  if (!open) return null;

  async function handleSpin() {
    if (phase !== 'idle' || !cooldown.canSpin) return;

    // Feedback IMMÉDIAT : on passe en 'loading' dès le clic (le bouton devient
    // "La roue tourne…") pour qu'il n'y ait pas 2s de flottement pendant l'appel.
    setPhase('loading');

    // Tentative API serveur si user authentifié — sinon fallback simulation locale
    let winIdx = pickWheelSegment(); // valeur par défaut (fallback)
    let winSegment: WheelSegment = WHEEL_SEGMENTS[winIdx];
    let code: string | null = generateRewardCode();
    let usedServerSide = false;

    const supabase = getSupabase();
    if (supabase) {
      try {
        // Bypass getSession() qui hang iOS PWA
        const stored = getStoredSession();
        const token = stored?.access_token;
        if (token) {
          const resp = await fetch('/api/wheel?action=spin', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          });
          if (resp.ok) {
            const data = await resp.json();
            const idx = WHEEL_SEGMENTS.findIndex((s) => s.id === data.segment?.id);
            if (idx >= 0) {
              winIdx = idx;
              winSegment = WHEEL_SEGMENTS[idx];
              code = data.code;
              usedServerSide = true;
              track('wheel_spun', { segment_id: winSegment.id });
            }
          } else if (resp.status === 429) {
            // Cooldown serveur — on resync localStorage et on stop
            const data = await resp.json();
            if (data.nextSpinAt) {
              const nextTs = new Date(data.nextSpinAt).getTime();
              const lastTs = nextTs - 7 * 24 * 60 * 60 * 1000;
              window.localStorage.setItem('labase-wheel-last-spin', String(lastTs));
            }
            setPhase('idle'); // on ré-affiche l'état initial
            return; // pas de spin
          }
          // Si erreur autre, fallback simulation locale ci-dessous
        }
      } catch (err) {
        console.warn('[wheel] API failed, fallback to local:', err);
      }
    }

    // Animation rotation
    const segmentCenter = winIdx * SEGMENT_ANGLE;
    const fullTurns = 6;
    const wobble = (Math.random() - 0.5) * (SEGMENT_ANGLE * 0.6);
    const target = fullTurns * 360 + (360 - segmentCenter) + wobble;
    setRotation(target);
    setPhase('spinning');

    const duration = 4200;
    audioRef.current = window.setTimeout(() => {
      setResult({ segment: winSegment, code: code ?? '' });
      setPhase('result');
      // Si on a utilisé le serveur, la persistence est faite ; sinon on note local
      if (!usedServerSide) markWheelSpun();
      else markWheelSpun(); // par sécurité, on marque aussi local
    }, duration);
  }

  function handleClose() {
    if (audioRef.current) window.clearTimeout(audioRef.current);
    onClose();
  }

  const segmentColors = WHEEL_SEGMENTS.map((s) => s.color(palette));

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, .88)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 65,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 480,
          maxHeight: '95vh',
          overflowY: 'auto',
          background: `linear-gradient(180deg, ${palette.cardHi}, ${palette.card})`,
          border: `1px solid ${palette.line}`,
          borderRadius: 28,
          padding: 24,
          color: palette.text,
          fontFamily: 'Inter, sans-serif',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          aria-label="Fermer"
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'rgba(0,0,0,.3)',
            border: `1px solid ${palette.line}`,
            color: palette.text,
            cursor: 'pointer',
            fontSize: 18,
            zIndex: 2,
          }}
        >
          ✕
        </button>

        {/* Header */}
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '.15em',
            color: palette.accent,
            textTransform: 'uppercase',
          }}
        >
          🎁 Roue hebdomadaire
        </div>
        <h2
          style={{
            fontFamily: 'Outfit, sans-serif',
            fontWeight: 900,
            fontSize: 28,
            margin: '8px 0 4px',
            letterSpacing: '-0.02em',
          }}
        >
          {phase === 'result' ? 'Bravo !' : phase === 'spinning' ? 'Tirage…' : 'Tente ta chance'}
        </h2>
        <div style={{ fontSize: 13, color: palette.textDim, marginBottom: 24 }}>
          {phase === 'idle' && cooldown.canSpin && '1 spin gratuit par semaine'}
          {phase === 'idle' && !cooldown.canSpin && `Reviens dans ${cooldown.daysRemaining} jour${cooldown.daysRemaining > 1 ? 's' : ''}`}
          {phase === 'spinning' && 'Bonne chance !'}
          {phase === 'result' && 'Note ou screenshot le code à présenter au comptoir'}
        </div>

        {/* Wheel container */}
        <div
          style={{
            position: 'relative',
            width: WHEEL_SIZE,
            height: WHEEL_SIZE + 28,
            margin: '0 auto 24px',
          }}
        >
          {/* Pointer en haut */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '14px solid transparent',
              borderRight: '14px solid transparent',
              borderTop: `22px solid ${palette.accent}`,
              filter: `drop-shadow(0 4px 8px ${palette.accent}99)`,
              zIndex: 3,
            }}
          />
          {/* Roue SVG */}
          <svg
            width={WHEEL_SIZE}
            height={WHEEL_SIZE}
            viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`}
            style={{
              position: 'absolute',
              top: 28,
              left: 0,
              transform: `rotate(${rotation}deg)`,
              transition:
                phase === 'spinning'
                  ? `transform 4200ms cubic-bezier(.17,.67,.18,1)`
                  : 'none',
              filter: `drop-shadow(0 12px 40px rgba(0,0,0,.6))`,
            }}
          >
            <defs>
              {segmentColors.map((c, i) => (
                <linearGradient key={i} id={`wheel-grad-${i}`} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={c} />
                  <stop offset="100%" stopColor={shade(c, -25)} />
                </linearGradient>
              ))}
            </defs>
            {WHEEL_SEGMENTS.map((seg, i) => {
              const startAngle = i * SEGMENT_ANGLE - SEGMENT_ANGLE / 2 - 90;
              const endAngle = startAngle + SEGMENT_ANGLE;
              const path = describeSegment(WHEEL_RADIUS, WHEEL_RADIUS, WHEEL_RADIUS - 4, startAngle, endAngle);
              const midAngle = (startAngle + endAngle) / 2;
              const labelR = WHEEL_RADIUS - 56;
              const lx = WHEEL_RADIUS + labelR * Math.cos((midAngle * Math.PI) / 180);
              const ly = WHEEL_RADIUS + labelR * Math.sin((midAngle * Math.PI) / 180);

              return (
                <g key={seg.id}>
                  <path d={path} fill={`url(#wheel-grad-${i})`} stroke="rgba(0,0,0,.3)" strokeWidth="2" />
                  <g transform={`translate(${lx},${ly}) rotate(${midAngle + 90})`}>
                    <text
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#fff"
                      fontFamily="Outfit, sans-serif"
                      fontWeight={900}
                      fontSize={16}
                      style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.55))' }}
                    >
                      {seg.emoji}
                    </text>
                    <text
                      y={20}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#fff"
                      fontFamily="Outfit, sans-serif"
                      fontWeight={800}
                      fontSize={11}
                      style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.7))' }}
                    >
                      {seg.short}
                    </text>
                  </g>
                </g>
              );
            })}
            {/* Centre */}
            <circle
              cx={WHEEL_RADIUS}
              cy={WHEEL_RADIUS}
              r={28}
              fill={palette.bg}
              stroke={palette.accent}
              strokeWidth={3}
            />
            <text
              x={WHEEL_RADIUS}
              y={WHEEL_RADIUS}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={palette.accent}
              fontFamily="Outfit, sans-serif"
              fontWeight={900}
              fontSize={24}
            >
              B
            </text>
          </svg>

          {phase === 'result' && <ResultConfetti palette={palette} />}
        </div>

        {/* Result panel */}
        {phase === 'result' && result && (
          <div
            style={{
              padding: 18,
              background: palette.bg,
              border: `2px solid ${palette.accent}`,
              borderRadius: 18,
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 40 }}>{result.segment.emoji}</div>
            <div
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 900,
                fontSize: 20,
                color: palette.accent,
                marginTop: 4,
                lineHeight: 1.15,
              }}
            >
              {result.segment.label}
            </div>
            {result.segment.rewardType !== 'retry' && result.code && (
              <>
                <div
                  style={{
                    fontSize: 11,
                    color: palette.textDim,
                    marginTop: 10,
                    letterSpacing: '.1em',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                  }}
                >
                  Ton code
                </div>
                <div
                  style={{
                    fontFamily: 'ui-monospace, monospace',
                    fontWeight: 700,
                    fontSize: 18,
                    color: palette.text,
                    background: `${palette.accent}15`,
                    border: `1px dashed ${palette.accent}55`,
                    borderRadius: 10,
                    padding: '8px 14px',
                    marginTop: 6,
                    display: 'inline-block',
                  }}
                >
                  {result.code}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: palette.textDim,
                    marginTop: 8,
                  }}
                >
                  Présente-le au comptoir au prochain passage.
                </div>
              </>
            )}
          </div>
        )}

        {/* CTA */}
        {phase === 'idle' && cooldown.canSpin && (
          <button
            onClick={handleSpin}
            style={{
              width: '100%',
              padding: '16px',
              background: palette.cta,
              color: palette.ctaText,
              border: 0,
              borderRadius: 16,
              fontFamily: 'Outfit, sans-serif',
              fontWeight: 900,
              fontSize: 16,
              cursor: 'pointer',
              boxShadow: `0 12px 32px ${palette.cta}66`,
            }}
          >
            🎰 Faire tourner la roue !
          </button>
        )}
        {(phase === 'loading' || phase === 'spinning') && (
          <button
            disabled
            style={{
              width: '100%',
              padding: '16px',
              background: palette.line,
              color: palette.text,
              border: 0,
              borderRadius: 16,
              fontFamily: 'Outfit, sans-serif',
              fontWeight: 900,
              fontSize: 16,
              cursor: 'wait',
              opacity: 0.85,
            }}
          >
            🎰 La roue tourne…
          </button>
        )}
        {phase === 'idle' && !cooldown.canSpin && cooldown.nextSpinDate && (
          <div
            style={{
              padding: '14px 16px',
              background: palette.bg,
              border: `1px solid ${palette.line}`,
              borderRadius: 14,
              fontSize: 13,
              color: palette.textDim,
            }}
          >
            Tu as déjà tenté ta chance cette semaine.
            <br />
            Prochain spin le{' '}
            <b style={{ color: palette.text }}>
              {cooldown.nextSpinDate.toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
              })}
            </b>
          </div>
        )}
        {phase === 'result' && (
          <button
            onClick={handleClose}
            style={{
              width: '100%',
              padding: '14px',
              background: 'transparent',
              color: palette.text,
              border: `1px solid ${palette.line}`,
              borderRadius: 14,
              fontFamily: 'Outfit, sans-serif',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Fermer
          </button>
        )}
      </div>
    </div>
  );
}

// SVG arc helper
function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function describeSegment(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
}

// Couleur assombrie pour le dégradé
function shade(hex: string, amount: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const num = parseInt(m[1], 16);
  let r = (num >> 16) + amount;
  let g = ((num >> 8) & 0xff) + amount;
  let b = (num & 0xff) + amount;
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

// Confetti à l'arrivée
function ResultConfetti({ palette }: { palette: Palette }) {
  const colors = [palette.accent, palette.primary, palette.glow1, '#fde047', '#fb7185'];
  const pieces = useMemo(
    () =>
      Array.from({ length: 32 }).map((_, i) => ({
        id: i,
        left: 50 + (Math.random() - 0.5) * 90,
        delay: Math.random() * 0.4,
        duration: 1.5 + Math.random() * 1.4,
        color: colors[i % colors.length],
        rotate: Math.random() * 360,
        size: 6 + Math.floor(Math.random() * 8),
      })),
    [],
  );

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 4,
      }}
    >
      {pieces.map((p) => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            top: 28,
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 1.5,
            background: p.color,
            opacity: 0.9,
            transform: `rotate(${p.rotate}deg)`,
            animation: `wheelConfettiFall ${p.duration}s linear ${p.delay}s 1`,
          }}
        />
      ))}
      <style>{`
        @keyframes wheelConfettiFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(${WHEEL_SIZE}px) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
