// Modale "Laisse un avis Google" — déclenchée après commande payée
// Logic :
// - Apparaît 4 sec après l'ouverture de OrderTracking (pour laisser le user
//   voir sa commande live, puis on demande l'avis discrètement)
// - Persiste en localStorage : ne re-prompte pas le même appareil avant 30 jours
// - Lien direct vers la page Google reviews (ouvre nouvel onglet)
import React, { useEffect, useState } from 'react';
import type { Palette } from './palette';

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
  const [rating, setRating] = useState<number>(0);

  useEffect(() => {
    if (!open) setRating(0);
  }, [open]);

  if (!open) return null;

  function handleStarClick(stars: number) {
    setRating(stars);
    // Si 4 ou 5 étoiles → on envoie sur Google review
    // Si 1-3 étoiles → on ouvre un mailto privé (feedback direct, pas public)
    window.setTimeout(() => {
      if (stars >= 4) {
        window.open(googleReviewUrl, '_blank', 'noopener');
      } else {
        const subject = encodeURIComponent(`Retour ${stars}/5 — La Base Shakes`);
        const body = encodeURIComponent(
          `Salut ${customerName || ''} !\n\nDis-moi ce qui n'a pas été, j'apprécie le retour pour m'améliorer.\n\nTom`,
        );
        window.location.href = `mailto:hello@labase360.fr?subject=${subject}&body=${body}`;
      }
      markReviewPromptShown();
      onClose();
    }, 400);
  }

  function handleSkip() {
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
          {customerName ? `Merci ${customerName} !` : 'Merci !'}
        </h2>
        <div style={{ fontSize: 14, color: palette.textDim, marginBottom: 22, lineHeight: 1.5 }}>
          Comment t'as trouvé ta commande ?<br />
          Ton avis nous aide énormément 🙏
        </div>

        {/* 5 étoiles cliquables */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 6,
            marginBottom: 18,
          }}
        >
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => handleStarClick(star)}
              onMouseEnter={() => setRating(star)}
              onMouseLeave={() => setRating(0)}
              aria-label={`${star} étoile${star > 1 ? 's' : ''}`}
              style={{
                background: 'transparent',
                border: 0,
                cursor: 'pointer',
                padding: 4,
                fontSize: 38,
                lineHeight: 1,
                filter: star <= rating ? 'none' : 'grayscale(1) opacity(.4)',
                transform: star <= rating ? 'scale(1.1)' : 'scale(1)',
                transition: 'transform .15s, filter .15s',
              }}
            >
              ⭐
            </button>
          ))}
        </div>

        <div
          style={{
            padding: 10,
            background: palette.bg,
            border: `1px solid ${palette.line}`,
            borderRadius: 10,
            fontSize: 11,
            color: palette.textDim,
            lineHeight: 1.4,
            marginBottom: 16,
          }}
        >
          {rating >= 4
            ? '✨ Top ! On t\'envoie sur Google pour partager ça'
            : rating > 0 && rating < 4
              ? "💬 On t'envoie un mail direct pour qu'on s'améliore"
              : 'Clique sur une étoile'}
        </div>

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
