// Pop-up d'activation des notifications — s'affiche à chaque session tant que
// l'utilisateur n'a pas activé les push (règle : activation « obligatoire »).
// S'adapte à l'état : activable, refusé (blocage navigateur), ou non supporté
// (iPhone en onglet Safari → il faut installer l'app sur l'écran d'accueil).
import React, { useState } from 'react';
import type { Palette } from './palette';
import type { PushPermission } from './notifications/usePushNotifications';

interface PushActivationModalProps {
  palette: Palette;
  open: boolean;
  onClose: () => void;
  permission: PushPermission;
  supported: boolean;
  loading: boolean;
  onEnable: () => Promise<{ ok: boolean; error?: string }>;
  canInstall?: boolean;
  onInstall?: () => void;
}

export function PushActivationModal({
  palette,
  open,
  onClose,
  permission,
  supported,
  loading,
  onEnable,
  canInstall,
  onInstall,
}: PushActivationModalProps) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  if (!open) return null;

  const denied = permission === 'denied';
  const unsupported = !supported || permission === 'unsupported';

  const handleEnable = async () => {
    setBusy(true);
    setErr(null);
    const res = await onEnable();
    setBusy(false);
    if (res.ok) {
      onClose();
    } else {
      setErr(res.error ?? 'Impossible d’activer pour le moment');
    }
  };

  const benefits = [
    ['🎁', 'Tes cadeaux & offres exclusives'],
    ['🆕', 'Les nouveautés en avant-première'],
    ['🥤', 'Ta commande prête à récupérer'],
    ['⚡', 'Tes journées XP x2 et la roue'],
  ] as const;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 90,
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
          maxWidth: 400,
          background: `linear-gradient(180deg, ${palette.cardHi}, ${palette.bg})`,
          border: `1px solid ${palette.line}`,
          borderRadius: 24,
          padding: '26px 22px',
          color: palette.text,
          fontFamily: 'Inter, sans-serif',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            margin: '0 auto 14px',
            borderRadius: 20,
            background: `linear-gradient(135deg, ${palette.glow1}, ${palette.glow3})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 38,
          }}
        >
          🔔
        </div>

        <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 22, lineHeight: 1.15 }}>
          Active tes notifications
        </div>
        <div style={{ fontSize: 13.5, color: palette.textDim, marginTop: 8, lineHeight: 1.5 }}>
          Ne rate rien de La Base — active les notifications, c’est là que tout se passe 👇
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, margin: '18px 0 20px', textAlign: 'left' }}>
          {benefits.map(([emo, txt]) => (
            <div key={txt} style={{ display: 'flex', alignItems: 'center', gap: 11, fontSize: 13.5 }}>
              <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>{emo}</span>
              <span>{txt}</span>
            </div>
          ))}
        </div>

        {/* Cas 1 — refusé au niveau navigateur : on ne peut plus reproposer */}
        {denied ? (
          <div
            style={{
              fontSize: 12.5,
              color: palette.textDim,
              background: 'rgba(0,0,0,.25)',
              border: `1px solid ${palette.line}`,
              borderRadius: 12,
              padding: '12px 14px',
              lineHeight: 1.5,
            }}
          >
            Tu as bloqué les notifications 😕 Pour les réactiver : ouvre les <b style={{ color: palette.text }}>réglages de ton navigateur</b> (ou de l’app) → Notifications → autorise <b style={{ color: palette.text }}>La Base</b>.
          </div>
        ) : unsupported ? (
          /* Cas 2 — iPhone en onglet Safari (ou navigateur sans push) : il faut installer l'app */
          <>
            <div
              style={{
                fontSize: 12.5,
                color: palette.textDim,
                background: 'rgba(0,0,0,.25)',
                border: `1px solid ${palette.line}`,
                borderRadius: 12,
                padding: '12px 14px',
                lineHeight: 1.5,
                marginBottom: canInstall ? 12 : 0,
              }}
            >
              Pour recevoir les notifications, <b style={{ color: palette.text }}>installe l’app sur ton écran d’accueil</b>. Sur iPhone : bouton <b style={{ color: palette.text }}>Partager</b> → <b style={{ color: palette.text }}>Sur l’écran d’accueil</b>.
            </div>
            {canInstall && onInstall && (
              <button
                onClick={onInstall}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: 14,
                  border: 'none',
                  background: `linear-gradient(100deg, ${palette.primary}, ${palette.glow1})`,
                  color: '#02100e',
                  fontFamily: 'Outfit, sans-serif',
                  fontWeight: 900,
                  fontSize: 15,
                  cursor: 'pointer',
                }}
              >
                📲 Installer l’app
              </button>
            )}
          </>
        ) : (
          /* Cas 3 — activable */
          <button
            onClick={handleEnable}
            disabled={busy || loading}
            style={{
              width: '100%',
              padding: '15px',
              borderRadius: 14,
              border: 'none',
              background: `linear-gradient(100deg, ${palette.primary}, ${palette.glow1})`,
              color: '#02100e',
              fontFamily: 'Outfit, sans-serif',
              fontWeight: 900,
              fontSize: 16,
              cursor: busy || loading ? 'default' : 'pointer',
              opacity: busy || loading ? 0.7 : 1,
            }}
          >
            {busy ? 'Activation…' : '🔔 Activer les notifications'}
          </button>
        )}

        {err && (
          <div style={{ fontSize: 12, color: '#ff9b9b', marginTop: 10 }}>{err}</div>
        )}

        <button
          onClick={onClose}
          style={{
            marginTop: 14,
            padding: '8px 14px',
            borderRadius: 999,
            border: 'none',
            background: 'transparent',
            color: palette.textDim,
            fontSize: 12.5,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Plus tard
        </button>
      </div>
    </div>
  );
}
