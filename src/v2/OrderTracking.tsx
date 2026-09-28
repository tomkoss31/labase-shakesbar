// Confirmation après un paiement en ligne réussi (retour de Square).
// Remplace l'ancienne simulation (compte à rebours de 60 s, faux numéro
// « LB-2xxx », faux « Prêt ! ») : on affiche UNIQUEMENT des informations
// vraies — paiement confirmé, prénom, heure de retrait choisie, état du bar.
import React from 'react';
import type { Palette } from './palette';
import { Mascotte } from './Mascotte';
import { useOpenStatus, formatHHMM } from './openingHours';
import { useModalA11y } from './useModalA11y';

interface OrderTrackingProps {
  palette: Palette;
  open: boolean;
  customerName?: string;
  // "HH:MM" choisi dans le panier (peut être vide)
  pickupTime?: string;
  onClose: () => void;
}

export function OrderTracking({ palette, open, customerName = '', pickupTime = '', onClose }: OrderTrackingProps) {
  const status = useOpenStatus();
  const dialogRef = useModalA11y<HTMLDivElement>(open, onClose);

  if (!open) return null;

  const name = customerName.trim();
  const hasPickup = /^\d{2}:\d{2}$/.test(pickupTime);

  const row = (icon: string, title: string, sub?: string) => (
    <div
      style={{
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
        padding: '14px 16px',
        background: palette.card,
        border: `1px solid ${palette.line}`,
        borderRadius: 16,
        textAlign: 'left',
      }}
    >
      <span style={{ fontSize: 22, lineHeight: 1 }} aria-hidden>
        {icon}
      </span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', fontWeight: 800, fontSize: 15, color: palette.text }}>{title}</span>
        {sub && (
          <span style={{ display: 'block', fontSize: 13, color: palette.textDim, marginTop: 2, lineHeight: 1.4 }}>
            {sub}
          </span>
        )}
      </span>
    </div>
  );

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Commande confirmée"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 70,
        background: palette.bg,
        color: palette.text,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          flexShrink: 0,
          padding: '40px 24px 28px',
          background: `linear-gradient(180deg, ${palette.cardHi}, ${palette.bg})`,
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
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'rgba(0,0,0,.35)',
            border: '1px solid rgba(255,255,255,.10)',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 18,
          }}
        >
          ✕
        </button>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Mascotte palette={palette} mood="happy" size={88} />
        </div>
        <div
          style={{
            marginTop: 14,
            display: 'inline-block',
            padding: '5px 12px',
            borderRadius: 999,
            background: 'rgba(34,197,94,.15)',
            border: '1px solid rgba(34,197,94,.4)',
            color: '#4ade80',
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '.08em',
            textTransform: 'uppercase',
          }}
        >
          ✓ Paiement confirmé
        </div>
        <div
          style={{
            fontFamily: 'Outfit, sans-serif',
            fontWeight: 900,
            fontSize: 30,
            lineHeight: 1.1,
            marginTop: 12,
            letterSpacing: '-.02em',
          }}
        >
          Merci{name ? ` ${name}` : ''} !
        </div>
        <div style={{ fontSize: 15, color: palette.textDim, marginTop: 8, lineHeight: 1.45 }}>
          Ta commande est bien arrivée au comptoir.
        </div>
      </div>

      <div style={{ padding: '4px 20px 24px', display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 480, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        {hasPickup
          ? row('⏰', `Retrait prévu à ${formatHHMM(pickupTime)}`, 'On la prépare pour cette heure-là.')
          : row('🥤', 'On la prépare à ton arrivée', 'Passe au comptoir quand tu veux pendant les horaires d’ouverture.')}
        {!status.isOpen &&
          row('🌙', 'Le bar est fermé pour le moment', status.nextOpenLabel ? `${status.nextOpenLabel} — ton retrait se fera à la réouverture.` : undefined)}
        {row('👋', 'Au comptoir', 'Donne simplement ton prénom : ta commande est déjà payée.')}
        {row('⭐', 'Tes XP', 'Si tu as un compte, ils sont crédités automatiquement après le paiement.')}

        <button
          onClick={onClose}
          style={{
            marginTop: 8,
            width: '100%',
            padding: '16px',
            borderRadius: 16,
            border: 'none',
            background: palette.cta,
            color: palette.ctaText,
            fontWeight: 900,
            fontSize: 16,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Super, merci !
        </button>
      </div>
    </div>
  );
}
