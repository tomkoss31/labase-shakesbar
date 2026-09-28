// Message « Ajout confirmé » (style V2, animation CSS — sans framer-motion).
import React from 'react';
import type { Palette } from './palette';

const TOAST_CSS =
  '@keyframes lbToastIn{from{opacity:0;transform:translate(-50%,14px) scale(.98)}to{opacity:1;transform:translate(-50%,0) scale(1)}}' +
  '@media (prefers-reduced-motion: reduce){.lb-toast{animation:none!important}}';

export function Toast({ palette, message }: { palette: Palette; message: string | null }) {
  if (!message) return null;
  return (
    <>
      <style>{TOAST_CSS}</style>
      <div
        key={message}
        role="status"
        aria-live="polite"
        className="lb-toast"
        style={{
          position: 'fixed',
          left: '50%',
          bottom: 'calc(96px + env(safe-area-inset-bottom, 0px))',
          transform: 'translate(-50%, 0)',
          zIndex: 60,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          maxWidth: 'calc(100vw - 32px)',
          padding: '12px 16px',
          borderRadius: 20,
          border: '1px solid rgba(52,211,153,.25)',
          background: 'linear-gradient(135deg, rgba(16,185,129,.18), rgba(0,0,0,.88))',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          boxShadow: '0 20px 40px rgba(0,0,0,.35)',
          color: '#ecfdf5',
          animation: 'lbToastIn .22s ease-out',
        }}
      >
        <span
          aria-hidden
          style={{
            width: 36,
            height: 36,
            flexShrink: 0,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            background: 'rgba(52,211,153,.15)',
            color: '#6ee7b7',
            fontSize: 17,
            fontWeight: 900,
          }}
        >
          ✓
        </span>
        <span style={{ minWidth: 0 }}>
          <span
            style={{
              display: 'block',
              fontSize: 10.5,
              fontWeight: 800,
              letterSpacing: '.16em',
              textTransform: 'uppercase',
              color: '#6ee7b7',
            }}
          >
            Ajout confirmé
          </span>
          <span style={{ display: 'block', fontSize: 14, fontWeight: 800 }}>{message}</span>
        </span>
      </div>
    </>
  );
}
