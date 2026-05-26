// Modale "Mon code à scanner au comptoir"
// Affiche un QR encodant LABASE-USER:<user_id> + prénom + niveau XP
// Génération QR locale via lib qrcode (pas de dépendance API externe)
import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import type { Palette } from '../palette';
import { Mascotte } from '../Mascotte';
import type { Profile } from './types';
import { computeMascotteLevel, VIP_TIERS } from './types';

interface MyCodeModalProps {
  palette: Palette;
  open: boolean;
  onClose: () => void;
  userId: string;
  profile: Profile | null;
}

export function MyCodeModal({ palette, open, onClose, userId, profile }: MyCodeModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const xp = profile?.xp ?? 0;
  const level = computeMascotteLevel(xp);
  const vipTier = VIP_TIERS.find((t) => t.id === (profile?.vip_tier ?? 'starter')) ?? VIP_TIERS[0];

  // Génération QR locale (plus fiable que api.qrserver.com)
  useEffect(() => {
    if (!open || !canvasRef.current) return;
    const payload = `LABASE-USER:${userId}`;
    QRCode.toCanvas(
      canvasRef.current,
      payload,
      {
        width: 320,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#02100e',
          light: '#ffffff',
        },
      },
      (err) => {
        if (err) console.error('[MyCodeModal] QR generation failed', err);
      },
    );
  }, [open, userId]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, .9)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        zIndex: 70,
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
          maxWidth: 420,
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
        <button
          onClick={onClose}
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
          }}
        >
          ✕
        </button>

        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '.15em',
            color: palette.primary,
            textTransform: 'uppercase',
          }}
        >
          📱 Mon code La Base
        </div>
        <h2
          style={{
            fontFamily: 'Outfit, sans-serif',
            fontWeight: 900,
            fontSize: 26,
            margin: '8px 0 4px',
            letterSpacing: '-0.02em',
          }}
        >
          {profile?.first_name ? `Salut ${profile.first_name}` : 'Mon code'}
        </h2>
        <div style={{ fontSize: 13, color: palette.textDim, marginBottom: 18 }}>
          Présente-le au comptoir pour cumuler tes XP
        </div>

        {/* Mascotte + récap */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 16,
            marginBottom: 16,
          }}
        >
          <Mascotte palette={palette} mood="wave" size={48} level={level} />
          <div style={{ textAlign: 'left' }}>
            <div
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 900,
                fontSize: 18,
                color: palette.primary,
                lineHeight: 1.1,
              }}
            >
              {xp} XP
            </div>
            <div style={{ fontSize: 11, color: palette.textDim, marginTop: 2 }}>
              Tier <b style={{ color: palette.text }}>{vipTier.label}</b>
            </div>
          </div>
        </div>

        {/* QR code généré localement via lib qrcode */}
        <div
          style={{
            width: 320,
            height: 320,
            margin: '0 auto 16px',
            background: '#fff',
            borderRadius: 18,
            padding: 14,
            boxShadow: `0 12px 40px rgba(0,0,0,.6)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <canvas
            ref={canvasRef}
            style={{ display: 'block', width: 292, height: 292 }}
          />
        </div>

        <div
          style={{
            padding: 12,
            background: palette.bg,
            border: `1px solid ${palette.line}`,
            borderRadius: 12,
            fontSize: 11,
            color: palette.textDim,
            lineHeight: 1.45,
            marginBottom: 16,
          }}
        >
          💡 Quand tu commandes au comptoir,{' '}
          <b style={{ color: palette.text }}>présente ce code</b> pour gagner tes XP
          et bénéficier de tes réductions VIP.
        </div>

        <button
          onClick={onClose}
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
      </div>
    </div>
  );
}
