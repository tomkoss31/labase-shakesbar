// Modale d'authentification — email + mot de passe (signin / signup / reset)
// Migration depuis OTP code à cause des bugs supabase-js sur iOS PWA.
// Marche partout : Safari, Chrome, PWA installée, in-app browser.
import React, { useState } from 'react';
import type { Palette } from '../palette';
import { Mascotte } from '../Mascotte';

interface AuthModalProps {
  palette: Palette;
  open: boolean;
  onClose: () => void;
  // Anciennes props (gardées pour compat, plus utilisées dans le nouveau flow)
  onSendMagicLink: (email: string) => Promise<{ ok: boolean; error?: string }>;
  onVerifyOtp: (email: string, token: string) => Promise<{ ok: boolean; error?: string }>;
  // Nouvelles props email/password
  onSignInWithPassword: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  onSignUpWithPassword: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  onResetPassword: (email: string) => Promise<{ ok: boolean; error?: string }>;
}

type Mode = 'signin' | 'signup' | 'reset';

export function AuthModal({
  palette,
  open,
  onClose,
  onSignInWithPassword,
  onSignUpWithPassword,
  onResetPassword,
}: AuthModalProps) {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);

    if (mode === 'reset') {
      const res = await onResetPassword(email);
      setBusy(false);
      if (res.ok) {
        setSuccess('Email envoyé ! Vérifie ta boîte pour réinitialiser ton mot de passe.');
      } else {
        setError(res.error ?? 'Erreur lors de l\'envoi');
      }
      return;
    }

    const fn = mode === 'signin' ? onSignInWithPassword : onSignUpWithPassword;
    const res = await fn(email, password);
    setBusy(false);

    if (res.ok) {
      handleClose();
    } else {
      setError(res.error ?? 'Erreur');
    }
  }

  function handleClose() {
    setEmail('');
    setPassword('');
    setMode('signin');
    setError(null);
    setSuccess(null);
    setBusy(false);
    setShowPassword(false);
    onClose();
  }

  const title =
    mode === 'signin'
      ? 'Salut !'
      : mode === 'signup'
        ? 'Créer un compte'
        : 'Mot de passe oublié';
  const subtitle =
    mode === 'signin'
      ? 'Connecte-toi pour cumuler des XP'
      : mode === 'signup'
        ? 'Quelques infos et c\'est parti'
        : 'On t\'envoie un lien de réinitialisation';
  const cta =
    mode === 'signin'
      ? busy
        ? 'Connexion…'
        : 'Se connecter'
      : mode === 'signup'
        ? busy
          ? 'Création…'
          : 'Créer mon compte'
        : busy
          ? 'Envoi…'
          : 'Envoyer le lien';

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
        <div
          style={{
            width: 40,
            height: 4,
            background: palette.line,
            borderRadius: 999,
            margin: '0 auto 16px',
          }}
        />

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
              {title}
            </div>
            <div style={{ fontSize: 13, color: palette.textDim, marginTop: 4 }}>{subtitle}</div>
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
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ton@email.com"
            disabled={busy}
            autoComplete="email"
            autoFocus
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
              marginBottom: 12,
              boxSizing: 'border-box',
            }}
          />

          {mode !== 'reset' && (
            <>
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
                Mot de passe {mode === 'signup' && <span style={{ opacity: 0.7 }}>(6 caractères min)</span>}
              </label>
              <div style={{ position: 'relative', marginBottom: 6 }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'Crée un mot de passe' : 'Ton mot de passe'}
                  disabled={busy}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  minLength={6}
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
            </>
          )}

          {error && (
            <div style={{ marginTop: 8, fontSize: 12, color: palette.emotion, fontWeight: 600 }}>
              ⚠️ {error}
            </div>
          )}
          {success && (
            <div
              style={{
                marginTop: 8,
                fontSize: 12,
                color: palette.primary,
                fontWeight: 600,
                lineHeight: 1.5,
              }}
            >
              ✅ {success}
            </div>
          )}

          <button
            type="submit"
            disabled={busy || !email || (mode !== 'reset' && password.length < 6)}
            style={{
              width: '100%',
              marginTop: 14,
              padding: '14px',
              background: busy ? palette.line : palette.cta,
              color: palette.ctaText,
              border: 0,
              borderRadius: 14,
              fontFamily: 'Outfit, sans-serif',
              fontWeight: 800,
              fontSize: 15,
              cursor: busy ? 'wait' : 'pointer',
              opacity: !email || (mode !== 'reset' && password.length < 6) ? 0.5 : 1,
              transition: 'opacity .15s',
            }}
          >
            {cta}
          </button>
        </form>

        {/* Switch entre signin / signup / reset */}
        <div
          style={{
            marginTop: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            alignItems: 'center',
            fontSize: 12,
          }}
        >
          {mode === 'signin' && (
            <>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError(null);
                  setSuccess(null);
                }}
                style={{
                  background: 'transparent',
                  border: 0,
                  color: palette.primary,
                  fontWeight: 700,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontFamily: 'inherit',
                  fontSize: 13,
                }}
              >
                Nouveau ? Créer un compte
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('reset');
                  setError(null);
                  setSuccess(null);
                }}
                style={{
                  background: 'transparent',
                  border: 0,
                  color: palette.textDim,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: 11,
                }}
              >
                Mot de passe oublié ?
              </button>
            </>
          )}
          {(mode === 'signup' || mode === 'reset') && (
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
                setSuccess(null);
              }}
              style={{
                background: 'transparent',
                border: 0,
                color: palette.primary,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 13,
                textDecoration: 'underline',
              }}
            >
              ← Retour à la connexion
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
