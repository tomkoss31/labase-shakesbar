// Modale "Choisir un nouveau mot de passe"
// S'affiche automatiquement quand auth.inPasswordRecovery === true,
// càd quand le user a cliqué sur le lien "Réinitialiser mon mot de passe"
// dans son mail. Le user est techniquement déjà authentifié à ce moment
// (Supabase crée une session de courte durée pour le recovery), il a juste
// besoin de poser un nouveau mdp.
import React, { useState } from 'react';
import type { Palette } from '../palette';
import { Mascotte } from '../Mascotte';

interface PasswordRecoveryModalProps {
  palette: Palette;
  open: boolean;
  email: string | null;
  onUpdatePassword: (newPassword: string) => Promise<{ ok: boolean; error?: string }>;
  onDismiss: () => void;
}

export function PasswordRecoveryModal({
  palette,
  open,
  email,
  onUpdatePassword,
  onDismiss,
}: PasswordRecoveryModalProps) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Mot de passe trop court (6 caractères min)');
      return;
    }
    if (password !== confirm) {
      setError('Les deux mots de passe ne correspondent pas');
      return;
    }

    setBusy(true);
    const res = await onUpdatePassword(password);
    setBusy(false);

    if (res.ok) {
      setSuccess(true);
      // Auto-close après 2s
      window.setTimeout(() => {
        setPassword('');
        setConfirm('');
        setSuccess(false);
        onDismiss();
      }, 2000);
    } else {
      setError(res.error ?? 'Erreur');
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, .9)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 75,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: `linear-gradient(180deg, ${palette.cardHi}, ${palette.card})`,
          border: `1px solid ${palette.line}`,
          borderRadius: 24,
          padding: 28,
          color: palette.text,
          fontFamily: 'Inter, sans-serif',
          boxShadow: '0 32px 80px rgba(0,0,0,.5)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
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
              {success ? 'C\'est fait ! ✨' : 'Nouveau mot de passe'}
            </div>
            <div style={{ fontSize: 13, color: palette.textDim, marginTop: 4 }}>
              {success
                ? 'Ton mot de passe a bien été mis à jour.'
                : email
                  ? `Choisis-en un pour ${email}`
                  : 'Choisis un nouveau mot de passe'}
            </div>
          </div>
        </div>

        {!success && (
          <form onSubmit={handleSubmit}>
            <label
              style={{
                display: 'block',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '.08em',
                color: palette.textDim,
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              Nouveau mot de passe <span style={{ opacity: 0.7 }}>(6 min)</span>
            </label>
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={busy}
                autoComplete="new-password"
                minLength={6}
                autoFocus
                style={{
                  width: '100%',
                  padding: '12px 44px 12px 14px',
                  background: palette.bg,
                  border: `1px solid ${palette.line}`,
                  borderRadius: 12,
                  color: palette.text,
                  fontSize: 15,
                  outline: 'none',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Masquer' : 'Afficher'}
                style={{
                  position: 'absolute',
                  right: 4,
                  top: 4,
                  bottom: 4,
                  width: 36,
                  background: 'transparent',
                  border: 0,
                  color: palette.textDim,
                  fontSize: 16,
                  cursor: 'pointer',
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>

            <label
              style={{
                display: 'block',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '.08em',
                color: palette.textDim,
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              Confirme
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={busy}
              autoComplete="new-password"
              minLength={6}
              style={{
                width: '100%',
                padding: '12px 14px',
                background: palette.bg,
                border: `1px solid ${palette.line}`,
                borderRadius: 12,
                color: palette.text,
                fontSize: 15,
                outline: 'none',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />

            {error && (
              <div style={{ marginTop: 10, fontSize: 12, color: palette.emotion, fontWeight: 600 }}>
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy || password.length < 6 || password !== confirm}
              style={{
                width: '100%',
                marginTop: 16,
                padding: '14px',
                background: busy ? palette.line : palette.cta,
                color: palette.ctaText,
                border: 0,
                borderRadius: 14,
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 800,
                fontSize: 15,
                cursor: busy ? 'wait' : 'pointer',
                opacity: password.length < 6 || password !== confirm ? 0.5 : 1,
              }}
            >
              {busy ? 'Mise à jour…' : 'Mettre à jour'}
            </button>

            <button
              type="button"
              onClick={onDismiss}
              disabled={busy}
              style={{
                width: '100%',
                marginTop: 8,
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
              Annuler
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
