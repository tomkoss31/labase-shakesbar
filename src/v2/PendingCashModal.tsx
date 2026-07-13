// Modale affichée après "Payer sur place"
// Montre un code 4 chiffres + QR code à présenter au comptoir
// QR généré localement via lib qrcode (pas d'appel API externe)
import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import type { Palette } from './palette';
import { useModalA11y } from './useModalA11y';

interface PendingCashModalProps {
  palette: Palette;
  open: boolean;
  code: string | null;
  totalCents: number;
  customerName: string;
  onClose: () => void;
}

function fmtEuro(c: number) {
  return `${(c / 100).toFixed(2).replace('.', ',')}€`;
}

export function PendingCashModal({ palette, open, code, totalCents, customerName, onClose }: PendingCashModalProps) {
  const [now, setNow] = useState(Date.now());
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [open]);

  // Génération QR locale
  useEffect(() => {
    if (!open || !code || !canvasRef.current) return;
    const payload = `LABASE-CASH:${code}`;
    QRCode.toCanvas(
      canvasRef.current,
      payload,
      {
        width: 280,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: { dark: '#02100e', light: '#ffffff' },
      },
      (err) => {
        if (err) console.error('[PendingCashModal] QR generation failed', err);
      },
    );
  }, [open, code]);

  const dialogRef = useModalA11y<HTMLDivElement>(open && !!code, onClose);

  if (!open || !code) return null;

  return (
    <div
      onClick={onClose}
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
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Paiement en espèces"
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
            top: 12,
            right: 12,
            width: 44,
            height: 44,
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
            color: palette.accent,
            textTransform: 'uppercase',
          }}
        >
          💵 Paiement sur place
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
          Présente ce code au comptoir
        </h2>
        <div style={{ fontSize: 13, color: palette.textDim, marginBottom: 18 }}>
          {customerName || 'Toi'} · {fmtEuro(totalCents)}
        </div>

        {/* QR code généré localement */}
        <div
          style={{
            width: 280,
            height: 280,
            margin: '0 auto 16px',
            background: '#fff',
            borderRadius: 16,
            padding: 12,
            boxShadow: `0 12px 40px rgba(0,0,0,.6)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <canvas
            ref={canvasRef}
            style={{ display: 'block', width: 256, height: 256 }}
          />
        </div>

        {/* Code en grand */}
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: palette.textDim,
            letterSpacing: '.1em',
            textTransform: 'uppercase',
            marginBottom: 4,
          }}
        >
          Ou dis ce code
        </div>
        <div
          style={{
            fontFamily: 'Outfit, sans-serif',
            fontWeight: 900,
            fontSize: 48,
            letterSpacing: '.18em',
            color: palette.accent,
            lineHeight: 1,
            marginBottom: 18,
          }}
        >
          {code}
        </div>

        <div
          style={{
            padding: 12,
            background: palette.bg,
            border: `1px solid ${palette.line}`,
            borderRadius: 12,
            fontSize: 12,
            color: palette.textDim,
            lineHeight: 1.45,
            marginBottom: 16,
          }}
        >
          💡 Ta commande est <b style={{ color: palette.text }}>réservée</b>.
          <br />
          Présente le code au comptoir pour régler en espèces et récupérer ta commande.
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
          OK, c'est noté
        </button>
      </div>
    </div>
  );
}
