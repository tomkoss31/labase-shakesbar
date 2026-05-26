// Modale d'authentification — code OTP 6 chiffres par email
// Marche sur iOS PWA car pas de redirect : user reste dans la PWA, tape le code
import React, { useRef, useState } from 'react';
import type { Palette } from '../palette';
import { Mascotte } from '../Mascotte';

interface AuthModalProps {
  palette: Palette;
  open: boolean;
  onClose: () => void;
  onSendMagicLink: (email: string) => Promise<{ ok: boolean; error?: string }>;
  onVerifyOtp: (email: string, token: string) => Promise<{ ok: boolean; error?: string }>;
}

type Step = 'email' | 'code' | 'verifying';

export function AuthModal({ palette, open, onClose, onSendMagicLink, onVerifyOtp }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState<string[]>(['', '', '', '', '', '']);
  const [step, setStep] = useState<Step>('email');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  if (!open) return null;

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    const res = await onSendMagicLink(email);
    setSending(false);
    if (res.ok) {
      setStep('code');
      // Focus sur la première case
      window.setTimeout(() => inputsRef.current[0]?.focus(), 100);
    } else {
      setError(res.error ?? 'Erreur lors de l\'envoi');
    }
  }

  async function handleVerifyCode(fullCode?: string) {
    const finalCode = fullCode ?? code.join('');
    if (finalCode.length !== 6) return;
    setStep('verifying');
    setError(null);
    const res = await onVerifyOtp(email, finalCode);
    if (res.ok) {
      // Le onAuthStateChange va trigger la mise à jour, on ferme
      handleClose();
    } else {
      setStep('code');
      setError(res.error ?? 'Code incorrect');
      setCode(['', '', '', '', '', '']);
      window.setTimeout(() => inputsRef.current[0]?.focus(), 50);
    }
  }

  function handleCodeChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(0, 1);
    const next = [...code];
    next[index] = digit;
    setCode(next);
    if (digit && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
    // Auto-submit si toutes les cases pleines
    if (digit && index === 5 && next.every((d) => d !== '')) {
      handleVerifyCode(next.join(''));
    }
  }

  function handleCodeKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  function handleCodePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const next = pasted.split('');
      setCode(next);
      handleVerifyCode(pasted);
    }
  }

  function handleClose() {
    setEmail('');
    setCode(['', '', '', '', '', '']);
    setStep('email');
    setError(null);
    setSending(false);
    onClose();
  }

  function handleBackToEmail() {
    setStep('email');
    setCode(['', '', '', '', '', '']);
    setError(null);
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
        <div
          style={{
            width: 40,
            height: 4,
            background: palette.line,
            borderRadius: 999,
            margin: '0 auto 16px',
          }}
        />

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
              {step === 'email' ? 'Salut !' : 'Code reçu ?'}
            </div>
            <div style={{ fontSize: 13, color: palette.textDim, marginTop: 4 }}>
              {step === 'email'
                ? 'Connecte-toi pour cumuler des XP'
                : `Tape les 6 chiffres reçus par mail`}
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

        {step === 'email' && (
          <form onSubmit={handleSendCode}>
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
              disabled={sending}
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
              <div style={{ marginTop: 10, fontSize: 12, color: palette.emotion, fontWeight: 600 }}>
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={sending || !email}
              style={{
                width: '100%',
                marginTop: 16,
                padding: '14px',
                background: sending ? palette.line : palette.cta,
                color: palette.ctaText,
                border: 0,
                borderRadius: 14,
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 800,
                fontSize: 15,
                cursor: sending ? 'wait' : 'pointer',
                opacity: !email ? 0.5 : 1,
              }}
            >
              {sending ? 'Envoi…' : 'Recevoir le code ✨'}
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
              Un code à 6 chiffres arrive dans ton mail.
            </div>
          </form>
        )}

        {(step === 'code' || step === 'verifying') && (
          <div>
            <div
              style={{
                padding: 12,
                borderRadius: 12,
                background: palette.primary + '15',
                border: `1px solid ${palette.primary}33`,
                fontSize: 13,
                color: palette.text,
                lineHeight: 1.45,
                marginBottom: 16,
                textAlign: 'center',
              }}
            >
              Code envoyé à <b>{email}</b>
            </div>

            {/* 6 cases */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(6, 1fr)',
                gap: 8,
                marginBottom: 12,
              }}
            >
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    inputsRef.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(i, e.target.value)}
                  onKeyDown={(e) => handleCodeKeyDown(i, e)}
                  onPaste={handleCodePaste}
                  disabled={step === 'verifying'}
                  style={{
                    width: '100%',
                    aspectRatio: '1 / 1.2',
                    padding: 0,
                    background: palette.bg,
                    border: `1.5px solid ${digit ? palette.primary : palette.line}`,
                    borderRadius: 12,
                    color: palette.text,
                    fontSize: 24,
                    fontWeight: 800,
                    fontFamily: 'Outfit, sans-serif',
                    textAlign: 'center',
                    outline: 'none',
                    transition: 'border-color .15s',
                  }}
                />
              ))}
            </div>

            {error && (
              <div
                style={{
                  marginTop: 4,
                  marginBottom: 12,
                  fontSize: 12,
                  color: palette.emotion,
                  fontWeight: 600,
                  textAlign: 'center',
                }}
              >
                ⚠️ {error}
              </div>
            )}

            {step === 'verifying' && (
              <div
                style={{
                  textAlign: 'center',
                  fontSize: 13,
                  color: palette.textDim,
                  marginBottom: 12,
                }}
              >
                Vérification…
              </div>
            )}

            <button
              onClick={handleBackToEmail}
              disabled={step === 'verifying'}
              style={{
                width: '100%',
                padding: '12px',
                background: 'transparent',
                color: palette.textDim,
                border: `1px solid ${palette.line}`,
                borderRadius: 12,
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              ← Changer d'email / renvoyer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
