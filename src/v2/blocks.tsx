// Blocs UI v2 secondaires : SearchBar, CategoryChips, SectionHead, Carousel,
// InfoBlock, InstaCard
import React from 'react';
import type { Palette } from './palette';
import { IconSearch } from './icons';
import { V2_CHIP_CATEGORIES } from './products-adapter';
import { useOpenStatus, OPENING_HOURS_TEXT } from './openingHours';

// ── SearchBar ───────────────────────────────────────────────────
export function SearchBar({
  palette,
  value,
  onChange,
  placeholder = 'Rechercher un shake, un combo…',
}: {
  palette: Palette;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div style={{ padding: '0 16px 14px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 14px',
          background: palette.card,
          border: `1px solid ${palette.line}`,
          borderRadius: 14,
        }}
      >
        <IconSearch color={palette.textDim} />
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            flex: 1,
            background: 'transparent',
            border: 0,
            outline: 'none',
            color: palette.text,
            fontSize: 14,
            fontFamily: 'inherit',
          }}
        />
      </div>
    </div>
  );
}

// ── Chips ───────────────────────────────────────────────────────
export function CategoryChips({
  palette,
  active,
  onChange,
}: {
  palette: Palette;
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div
      style={{
        position: 'sticky',
        top: 64,
        zIndex: 20,
        padding: '8px 0 12px',
        background: `linear-gradient(180deg, ${palette.bg} 75%, ${palette.bg}00)`,
      }}
    >
      <div
        className="no-scrollbar"
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          padding: '0 16px',
          scrollbarWidth: 'none',
        }}
      >
        {V2_CHIP_CATEGORIES.map((c) => {
          const on = c.id === active;
          return (
            <button
              key={c.id}
              onClick={() => onChange(c.id)}
              style={{
                padding: '8px 14px',
                borderRadius: 999,
                background: on ? palette.text : palette.card,
                color: on ? palette.bg : palette.text,
                border: `1px solid ${on ? palette.text : palette.line}`,
                fontSize: 13,
                fontWeight: on ? 800 : 600,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                flexShrink: 0,
                fontFamily: 'inherit',
              }}
            >
              {c.icon && <span>{c.icon}</span>}
              {c.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Section Head ────────────────────────────────────────────────
export function SectionHead({
  palette,
  icon,
  title,
  sub,
  onSeeAll,
}: {
  palette: Palette;
  icon: string;
  title: string;
  sub?: string;
  onSeeAll?: () => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '4px 16px 10px',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0, flex: 1 }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontFamily: 'Outfit, sans-serif',
              fontWeight: 900,
              fontSize: 19,
              color: palette.text,
              letterSpacing: '-.01em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {title}
          </div>
          {sub && <div style={{ fontSize: 11, color: palette.textDim, marginTop: 2 }}>{sub}</div>}
        </div>
      </div>
      {onSeeAll && (
        <button
          onClick={onSeeAll}
          style={{
            background: 'transparent',
            border: `1px solid ${palette.line}`,
            color: palette.primary,
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            padding: '5px 10px',
            borderRadius: 999,
            flexShrink: 0,
            fontFamily: 'inherit',
          }}
        >
          Voir tout →
        </button>
      )}
    </div>
  );
}

// ── Carousel wrapper ────────────────────────────────────────────
export function Carousel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="no-scrollbar"
      style={{
        display: 'flex',
        gap: 12,
        overflowX: 'auto',
        padding: '0 16px 4px',
        scrollbarWidth: 'none',
        overscrollBehaviorX: 'contain',
      }}
    >
      {children}
      <div style={{ width: 4, flexShrink: 0 }} />
    </div>
  );
}

// ── Info pratique ───────────────────────────────────────────────
export function InfoBlock({ palette }: { palette: Palette }) {
  const status = useOpenStatus();
  const dotColor = status.isOpen ? '#22c55e' : '#ef4444';
  return (
    <div style={{ padding: '12px 16px 20px' }}>
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
              width: 64,
              height: 64,
              borderRadius: 12,
              flexShrink: 0,
              background: `linear-gradient(135deg, ${palette.primaryDeep}, ${palette.bg})`,
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `1px solid ${palette.line}`,
            }}
          >
            <span style={{ fontSize: 22 }}>📍</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 15, color: palette.text }}>
              La Base · Verdun
            </div>
            <div style={{ fontSize: 12, color: palette.textDim, marginTop: 2 }}>11 rue Saint Pierre, 55100 Verdun</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
              <div
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: dotColor,
                  boxShadow: `0 0 8px ${dotColor}`,
                }}
              />
              <div style={{ fontSize: 12, color: palette.text, fontWeight: 600 }}>
                {status.isOpen ? `${status.label} · prêt en 5-10 min` : status.label}
                {!status.isOpen && status.nextOpenLabel && (
                  <span style={{ color: palette.textDim, fontWeight: 500 }}> · {status.nextOpenLabel}</span>
                )}
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
              padding: '10px 12px',
              borderRadius: 10,
              background: palette.cta,
              color: palette.ctaText,
              border: 0,
              fontSize: 13,
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
              padding: '10px 12px',
              borderRadius: 10,
              background: 'transparent',
              color: palette.text,
              border: `1px solid ${palette.line}`,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              textDecoration: 'none',
              textAlign: 'center',
            }}
          >
            Avis · 4,9 ★
          </a>
        </div>

        {/* Horaires d'ouverture */}
        <div
          style={{
            marginTop: 14,
            paddingTop: 12,
            borderTop: `1px solid ${palette.line}`,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '.1em',
              textTransform: 'uppercase',
              color: palette.textDim,
              marginBottom: 8,
            }}
          >
            🕐 Horaires
          </div>
          {OPENING_HOURS_TEXT.map((row) => (
            <div
              key={row.day}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 12.5,
                padding: '3px 0',
                color: row.hours === 'Fermé' ? palette.textDim : palette.text,
              }}
            >
              <span>{row.day}</span>
              <span style={{ fontWeight: 600 }}>{row.hours}</span>
            </div>
          ))}
          <div style={{ fontSize: 10.5, color: palette.textDim, marginTop: 8, fontStyle: 'italic' }}>
            Horaires variables selon les événements
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Instagram card ──────────────────────────────────────────────
export function InstaCard({ palette }: { palette: Palette }) {
  return (
    <div style={{ padding: '0 16px 20px' }}>
      <a
        href="https://www.instagram.com/labase_verdun/"
        target="_blank"
        rel="noreferrer"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: `linear-gradient(135deg, #d946ef, #f97316, #facc15)`,
          borderRadius: 18,
          padding: 16,
          textDecoration: 'none',
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'rgba(0,0,0,.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
          }}
        >
          📷
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 15, color: '#fff' }}>
            @labase_verdun
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.85)', marginTop: 1 }}>Les nouveautés, en stories</div>
        </div>
        <span
          style={{
            padding: '8px 12px',
            borderRadius: 999,
            background: 'rgba(0,0,0,.4)',
            color: '#fff',
            border: 0,
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          Suivre
        </span>
      </a>
    </div>
  );
}
