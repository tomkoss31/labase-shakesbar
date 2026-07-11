// Modale "Laisse un avis Google" — déclenchée après commande payée
// Logic :
// - Apparaît 4 sec après l'ouverture de OrderTracking (pour laisser le user
//   voir sa commande live, puis on demande l'avis discrètement)
// - Persiste en localStorage : ne re-prompte pas le même appareil avant 30 jours
// - Lien direct vers la page Google reviews (ouvre nouvel onglet)
import React from 'react';
import type { Palette } from './palette';
import { track } from '../lib/analytics';

const REVIEW_PROMPT_KEY = 'labase_review_prompt_last';
const REVIEW_PROMPT_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000; // 30 jours

export function shouldShowReviewPrompt(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const last = window.localStorage.getItem(REVIEW_PROMPT_KEY);
    if (!last) return true;
    const lastMs = parseInt(last, 10);
    if (Number.isNaN(lastMs)) return true;
    return Date.now() - lastMs > REVIEW_PROMPT_COOLDOWN_MS;
  } catch {
    return true;
  }
}

export function markReviewPromptShown() {
  try {
    window.localStorage.setItem(REVIEW_PROMPT_KEY, String(Date.now()));
  } catch {}
}

interface ReviewPromptModalProps {
  palette: Palette;
  open: boolean;
  onClose: () => void;
  googleReviewUrl: string;
  customerName?: string;
}

export function ReviewPromptModal({
  palette,
  open,
  onClose,
  googleReviewUrl,
  customerName,
}: ReviewPromptModalProps) {
  if (!open) return null;

  // Conforme Google : on invite TOUT LE MONDE à laisser un avis (pas de filtre
  // par note = fini le "review-gating" interdit). Le canal privé reste dispo
  // pour ceux qui préfèrent, mais ne conditionne PAS l'accès à Google.
  function handleReview() {
    track('review_google_click');
    markReviewPromptShown();
    onClose();
  }

  function handleFeedback() {
    track('review_feedback');
    const subject = encodeURIComponent('Un retour sur ma visite — La Base');
    const body = encodeURIComponent(
      `Salut ${customerName || ''} !\n\nDis-moi ce que je peux améliorer, ton retour compte beaucoup.\n\nTom`,
    );
    window.location.href = `mailto:hello@labase360.fr?subject=${subject}&body=${body}`;
    markReviewPromptShown();
    onClose();
  }

  function handleSkip() {
    track('review_skipped');
    markReviewPromptShown();
    onClose();
  }

  return (
    <div
      onClick={handleSkip}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, .88)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 80,
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
          padding: 28,
          color: palette.text,
          fontFamily: 'Inter, sans-serif',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        <button
          onClick={handleSkip}
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

        <div style={{ fontSize: 48, marginBottom: 8, lineHeight: 1 }}>🥤</div>

        <h2
          style={{
            fontFamily: 'Outfit, sans-serif',
            fontWeight: 900,
            fontSize: 24,
            margin: '8px 0 6px',
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
          }}
        >
          {customerName ? `Merci ${customerName} !` : 'Merci pour ta visite !'}
        </h2>
        <div style={{ fontSize: 14, color: palette.textDim, marginBottom: 20, lineHeight: 1.5 }}>
          Ton avis nous aide énormément à faire connaître le club 🙏<br />
          Ça te prend 20 secondes.
        </div>

        <a
          href={googleReviewUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleReview}
          style={{
            display: 'block',
            width: '100%',
            boxSizing: 'border-box',
            padding: '15px',
            background: palette.cta,
            color: palette.ctaText,
            borderRadius: 14,
            fontFamily: 'Outfit, sans-serif',
            fontWeight: 900,
            fontSize: 16,
            textDecoration: 'none',
            marginBottom: 12,
          }}
        >
          ⭐ Laisser un avis Google
        </a>

        <button
          onClick={handleFeedback}
          style={{
            width: '100%',
            padding: '8px',
            background: 'transparent',
            color: palette.textDim,
            border: 'none',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 600,
            fontSize: 12.5,
            cursor: 'pointer',
            marginBottom: 6,
            textDecoration: 'underline',
          }}
        >
          Un souci ? Dis-le-nous en privé
        </button>

        <button
          onClick={handleSkip}
          style={{
            width: '100%',
            padding: '12px',
            background: 'transparent',
            color: palette.textDim,
            border: `1px solid ${palette.line}`,
            borderRadius: 12,
            fontFamily: 'Outfit, sans-serif',
            fontWeight: 700,
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          Plus tard
        </button>
      </div>
    </div>
  );
}
