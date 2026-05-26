// Modale d'authentification magic link
import React, { useState } from 'react';
import type { Palette } from '../palette';
import { Mascotte } from '../Mascotte';

interface AuthModalProps {
  palette: Palette;
  open: boolean;
  onClose: () => void;
  onSendMagicLink: (email: string) => Promise<{ ok: boolean; error?: string }>;
}

export function AuthModal({ palette, open, onClose, onSendMagicLink }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    setError(null);
    const res = await onSendMagicLink(email);
    if (res.ok) {
      setStatus('sent');
    } else {
      setStatus('error');
      setError(res.error ?? 'Une erreur est survenue');
    }
  }

  function handleClose() {
    setEmail('');
    setStatus('idle');
    setError(null);
    onClose();
  }

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, .82)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 60,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: '0 16px 24px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 440,
          background: `linear-gradient(180deg, ${palette.cardHi}, ${palette.card})`,
          border: `1px solid ${palette.line}`,
          borderRadius: 24,
          padding: 24,
          boxShadow: '0 32px 80px rgba(0,0,0,.5)',
          color: palette.text,
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {/* Drag handle */}
        <div
          style={{
            width: 40,
            height: 4,
            background: palette.line,
            borderRadius: 999,
            margin: '0 auto 16px',
          }}
        />

        {/* Header avec mascotte */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <Mascotte palette={palette} mood="wave" size={48} level="apprenti" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 900,
                fontSize: 22,
                lineHeight: 1.1,
              }}
            >
              {status === 'sent' ? 'Vérifie ta boîte mail 💌' : 'Salut !'}
            </div>
            <div style={{ fontSize: 13, color: palette.textDim, marginTop: 4 }}>
              {status === 'sent'
                ? 'Un lien magique est en route'
                : 'Connecte-toi pour cumuler des XP'}
            </div>
          </div>
          <button
            onClick={handleClose}
            aria-label="Fermer"
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'transparent',
              border: `1px solid ${palette.line}`,
              color: palette.textDim,
              cursor: 'pointer',
              fontSize: 18,
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>

        {status === 'sent' ? (
          <div>
            <div
              style={{
                padding: 16,
                borderRadius: 14,
                background: palette.primary + '15',
                border: `1px solid ${palette.primary}33`,
                fontSize: 14,
                color: palette.text,
                lineHeight: 1.5,
              }}
            >
              On vient d'envoyer un lien à <b>{email}</b>.
              <br />
              <br />
              Clique dessus pour finaliser ta connexion. Tu peux fermer cette fenêtre, le lien marche aussi sur un autre appareil.
            </div>
            <button
              onClick={handleClose}
              style={{
                width: '100%',
                marginTop: 16,
                padding: '14px',
                background: palette.cta,
                color: palette.ctaText,
                border: 0,
                borderRadius: 14,
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 800,
                fontSize: 15,
                cursor: 'pointer',
              }}
            >
              Compris
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '.08em',
                color: palette.textDim,
                textTransform: 'uppercase',
                marginBottom: 8,
              }}
            >
              Ton email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ton@email.com"
              disabled={status === 'sending'}
              autoComplete="email"
              autoFocus
              style={{
                width: '100%',
                padding: '14px 16px',
                background: palette.bg,
                border: `1px solid ${palette.line}`,
                borderRadius: 14,
                color: palette.text,
                fontSize: 15,
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />

            {error && (
              <div
                style={{
                  marginTop: 10,
                  fontSize: 12,
                  color: palette.emotion,
                  fontWeight: 600,
                }}
              >
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'sending' || !email}
              style={{
                width: '100%',
                marginTop: 16,
                padding: '14px',
                background: status === 'sending' ? palette.line : palette.cta,
                color: palette.ctaText,
                border: 0,
                borderRadius: 14,
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 800,
                fontSize: 15,
                cursor: status === 'sending' ? 'wait' : 'pointer',
                transition: 'opacity .15s',
                opacity: !email ? 0.5 : 1,
              }}
            >
              {status === 'sending' ? 'Envoi…' : 'Recevoir le lien magique ✨'}
            </button>

            <div
              style={{
                marginTop: 14,
                fontSize: 11,
                color: palette.textDim,
                lineHeight: 1.5,
                textAlign: 'center',
              }}
            >
              Pas de mot de passe à retenir.
              <br />
              Tes données sont privées et jamais partagées.
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
