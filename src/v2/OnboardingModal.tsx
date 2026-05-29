// Onboarding — tutoriel d'accueil en plusieurs slides.
// S'affiche automatiquement au 1er lancement (flag localStorage) et reste
// rejouable via le profil. Dernière slide = installation PWA avec toggle
// iPhone / Android (détection auto de l'appareil + si déjà installée).
import React, { useState } from 'react';
import type { Palette } from './palette';
import { Mascotte } from './Mascotte';

const ONBOARDING_KEY = 'labase_onboarding_seen';

export function hasSeenOnboarding(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_KEY) === '1';
  } catch {
    return true; // en cas d'erreur, on ne spamme pas
  }
}
export function markOnboardingSeen() {
  try {
    localStorage.setItem(ONBOARDING_KEY, '1');
  } catch {}
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}
function detectOS(): 'ios' | 'android' | 'other' {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
  if (/android/i.test(ua)) return 'android';
  return 'other';
}

interface OnboardingModalProps {
  palette: Palette;
  open: boolean;
  onClose: () => void;
}

export function OnboardingModal({ palette, open, onClose }: OnboardingModalProps) {
  const [step, setStep] = useState(0);
  const [osTab, setOsTab] = useState<'ios' | 'android'>(detectOS() === 'android' ? 'android' : 'ios');
  const alreadyInstalled = isStandalone();

  if (!open) return null;

  // Slides (la slide install est masquée si l'app est déjà installée)
  const slides: Array<{ render: () => React.ReactNode }> = [
    {
      render: () => (
        <>
          <Mascotte palette={palette} mood="wave" size={84} level="apprenti" />
          <h2 style={titleStyle}>Bienvenue à La Base 👋</h2>
          <p style={textStyle}>
            Ton shake bar préféré de Verdun, version appli. Commande, cumule des XP, et
            débloque de vrais cadeaux à récupérer au club.
          </p>
        </>
      ),
    },
    {
      render: () => (
        <>
          <div style={{ fontSize: 64, lineHeight: 1 }}>⚡</div>
          <h2 style={titleStyle}>Cumule des XP, gagne des cadeaux</h2>
          <div style={{ textAlign: 'left', width: '100%', marginTop: 8 }}>
            <Row palette={palette} emoji="💸" text="1€ dépensé = 10 XP" />
            <Row palette={palette} emoji="🥤" text="800 XP = une boisson offerte" />
            <Row palette={palette} emoji="🎂" text="Ton anniversaire = +500 XP" />
            <Row palette={palette} emoji="🎰" text="Une roue cadeau chaque semaine" />
          </div>
        </>
      ),
    },
    {
      render: () => (
        <>
          <div style={{ fontSize: 64, lineHeight: 1 }}>📱</div>
          <h2 style={titleStyle}>Montre ton QR au comptoir</h2>
          <p style={textStyle}>
            À <b style={{ color: palette.text }}>chaque achat au club</b>, ouvre l'appli et
            montre ton QR code (depuis ton compte). On scanne, et tes XP tombent automatiquement.
            <br />
            <br />
            C'est aussi comme ça que tu récupères tes cadeaux 🎁
          </p>
        </>
      ),
    },
  ];

  if (!alreadyInstalled) {
    slides.push({
      render: () => (
        <>
          <div style={{ fontSize: 64, lineHeight: 1 }}>⭐</div>
          <h2 style={titleStyle}>Installe l'appli</h2>
          <p style={{ ...textStyle, marginBottom: 14 }}>
            Ajoute La Base à ton écran d'accueil pour y accéder en 1 tap, comme une vraie appli.
          </p>

          {/* Toggle iOS / Android */}
          <div
            style={{
              display: 'flex',
              gap: 6,
              background: palette.bg,
              border: `1px solid ${palette.line}`,
              borderRadius: 12,
              padding: 4,
              marginBottom: 14,
            }}
          >
            {(['ios', 'android'] as const).map((os) => (
              <button
                key={os}
                onClick={() => setOsTab(os)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 9,
                  border: 0,
                  cursor: 'pointer',
                  fontFamily: 'Outfit, sans-serif',
                  fontWeight: 800,
                  fontSize: 13,
                  background: osTab === os ? palette.cta : 'transparent',
                  color: osTab === os ? palette.ctaText : palette.textDim,
                  transition: 'all .15s',
                }}
              >
                {os === 'ios' ? '🍎 iPhone' : '🤖 Android'}
              </button>
            ))}
          </div>

          {/* Étapes selon l'OS */}
          <div style={{ textAlign: 'left', width: '100%' }}>
            {osTab === 'ios' ? (
              <>
                <Row palette={palette} emoji="1️⃣" text="Appuie sur le bouton Partager ⬆️ (en bas de Safari)" />
                <Row palette={palette} emoji="2️⃣" text='Choisis « Sur l’écran d’accueil »' />
                <Row palette={palette} emoji="3️⃣" text="Appuie sur « Ajouter » — c'est fait ✅" />
              </>
            ) : (
              <>
                <Row palette={palette} emoji="1️⃣" text="Ouvre le menu ⋮ (en haut à droite de Chrome)" />
                <Row palette={palette} emoji="2️⃣" text='Choisis « Installer l’application »' />
                <Row palette={palette} emoji="3️⃣" text="Confirme — l'appli apparaît sur ton écran ✅" />
              </>
            )}
          </div>
        </>
      ),
    });
  }

  const isLast = step >= slides.length - 1;

  function finish() {
    markOnboardingSeen();
    setStep(0);
    onClose();
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: `linear-gradient(180deg, ${palette.bg}, #02100e)`,
        zIndex: 90,
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 20px calc(24px + env(safe-area-inset-bottom, 0px))',
        fontFamily: 'Inter, sans-serif',
        color: palette.text,
      }}
    >
      {/* Skip */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={finish}
          style={{
            background: 'transparent',
            border: 0,
            color: palette.textDim,
            fontSize: 13,
            cursor: 'pointer',
            fontFamily: 'inherit',
            padding: 8,
          }}
        >
          Passer
        </button>
      </div>

      {/* Contenu centré */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: 6,
          maxWidth: 420,
          margin: '0 auto',
          width: '100%',
        }}
      >
        {slides[step].render()}
      </div>

      {/* Dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 7, marginBottom: 18 }}>
        {slides.map((_, i) => (
          <div
            key={i}
            style={{
              width: i === step ? 22 : 7,
              height: 7,
              borderRadius: 999,
              background: i === step ? palette.primary : palette.line,
              transition: 'all .2s',
            }}
          />
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={() => (isLast ? finish() : setStep((s) => s + 1))}
        style={{
          width: '100%',
          maxWidth: 420,
          margin: '0 auto',
          padding: '16px',
          background: palette.cta,
          color: palette.ctaText,
          border: 0,
          borderRadius: 16,
          fontFamily: 'Outfit, sans-serif',
          fontWeight: 900,
          fontSize: 16,
          cursor: 'pointer',
          boxShadow: `0 12px 32px ${palette.cta}55`,
        }}
      >
        {isLast ? "C'est parti 🥤" : 'Suivant'}
      </button>
    </div>
  );
}

const titleStyle: React.CSSProperties = {
  fontFamily: 'Outfit, sans-serif',
  fontWeight: 900,
  fontSize: 26,
  letterSpacing: '-0.02em',
  margin: '14px 0 8px',
  lineHeight: 1.1,
};
const textStyle: React.CSSProperties = {
  fontSize: 15,
  lineHeight: 1.55,
  color: '#b9d4ce',
  margin: 0,
};

function Row({ palette, emoji, text }: { palette: Palette; emoji: string; text: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '11px 14px',
        background: palette.card,
        border: `1px solid ${palette.line}`,
        borderRadius: 12,
        marginBottom: 8,
      }}
    >
      <span style={{ fontSize: 20, flexShrink: 0 }}>{emoji}</span>
      <span style={{ fontSize: 13.5, lineHeight: 1.4 }}>{text}</span>
    </div>
  );
}
