// Bottom sheet du profil — édition prénom/anniv + statut + déconnexion
import React, { useState, useEffect, useRef } from 'react';
import type { Palette } from '../palette';
import { Mascotte } from '../Mascotte';
import type { Profile } from './types';
import { VIP_TIERS, computeMascotteLevel, nextLevelThreshold } from './types';
import { usePushNotifications } from '../notifications/usePushNotifications';
import { WheelModal } from '../wheel/WheelModal';
import { getWheelCooldown } from '../wheel/segments';
import { useUserOrders } from '../orders/useUserOrders';
import { MyCodeModal } from './MyCodeModal';

// État push partagé (instance unique tenue par HomeV2) — voir usePushNotifications.
type PushState = ReturnType<typeof usePushNotifications>;

// Liste des emails admin (séparés par virgule dans VITE_ADMIN_EMAIL).
// Ex : "tomkoss31@gmail.com,milmel55@gmail.com"
function isAdminEmail(email: string | null): boolean {
  if (!email) return false;
  const raw = String(import.meta.env.VITE_ADMIN_EMAIL || '');
  const admins = raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.toLowerCase());
}

interface ProfileSheetProps {
  palette: Palette;
  open: boolean;
  onClose: () => void;
  profile: Profile | null;
  email: string | null;
  userId: string | null;
  onUpdateProfile: (patch: { first_name?: string; birthday?: string }) => Promise<{ ok: boolean; error?: string }>;
  onSignOut: () => Promise<void>;
  onShowOnboarding?: () => void;
  // Instance push partagée (depuis HomeV2) — évite un 2e état désynchronisé.
  push: PushState;
  // Quand true à l'ouverture : on défile jusqu'au bouton notifs + surbrillance.
  highlightNotifications?: boolean;
}

function fmtEuro(cents: number): string {
  return `${(cents / 100).toFixed(2).replace('.', ',')}€`;
}

export function ProfileSheet({
  palette,
  open,
  onClose,
  profile,
  email,
  userId,
  onUpdateProfile,
  onSignOut,
  onShowOnboarding,
  push,
  highlightNotifications = false,
}: ProfileSheetProps) {
  const [firstName, setFirstName] = useState(profile?.first_name ?? '');
  const [birthday, setBirthday] = useState(profile?.birthday ?? '');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [wheelOpen, setWheelOpen] = useState(false);
  const [myCodeOpen, setMyCodeOpen] = useState(false);
  // Surbrillance du bouton notifs quand on arrive depuis le message « Active
  // les notifications » de la boîte de réception.
  const notifBtnRef = useRef<HTMLButtonElement | null>(null);
  const [notifGlow, setNotifGlow] = useState(false);
  useEffect(() => {
    if (!open || !highlightNotifications || !push.supported || push.subscribed) return;
    setNotifGlow(true);
    const scrollTimer = setTimeout(() => {
      notifBtnRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 250);
    const offTimer = setTimeout(() => setNotifGlow(false), 4200);
    return () => {
      clearTimeout(scrollTimer);
      clearTimeout(offTimer);
    };
  }, [open, highlightNotifications, push.supported, push.subscribed]);
  const wheelCooldown = React.useMemo(() => getWheelCooldown(), [wheelOpen]);
  // Admin : roue dispo en permanence (test illimité des cadeaux)
  const isAdmin = isAdminEmail(email);
  const wheelCanSpin = isAdmin || wheelCooldown.canSpin;
  const [adminOpen, setAdminOpen] = useState(false);
  const { orders } = useUserOrders();

  // Sync local state quand le profil change
  React.useEffect(() => {
    setFirstName(profile?.first_name ?? '');
    setBirthday(profile?.birthday ?? '');
  }, [profile?.first_name, profile?.birthday]);

  if (!open) return null;

  const xp = profile?.xp ?? 0;
  const mascotteLevel = computeMascotteLevel(xp);
  const next = nextLevelThreshold(xp);
  const xpPct = Math.min(100, (xp / next.xp) * 100);
  const vipTier = VIP_TIERS.find((t) => t.id === (profile?.vip_tier ?? 'starter')) ?? VIP_TIERS[0];
  const nextVip = VIP_TIERS.find((t) => t.minSpentCents > (profile?.total_spent_cents ?? 0));

  async function handleSave() {
    setSaving(true);
    setSavedMsg(null);
    const res = await onUpdateProfile({
      first_name: firstName.trim() || undefined,
      birthday: birthday || undefined,
    });
    setSaving(false);
    if (res.ok) {
      setSavedMsg('Sauvegardé ✓');
      setEditing(false);
      window.setTimeout(() => setSavedMsg(null), 2400);
    } else {
      setSavedMsg(res.error ?? 'Erreur sauvegarde');
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    await onSignOut();
    setSigningOut(false);
    onClose();
  }

  return (
    <div
      onClick={onClose}
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
        padding: '0 12px 16px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 480,
          maxHeight: '92vh',
          overflowY: 'auto',
          background: `linear-gradient(180deg, ${palette.cardHi}, ${palette.card})`,
          border: `1px solid ${palette.line}`,
          borderRadius: 24,
          padding: 22,
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

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <Mascotte palette={palette} mood="wave" size={56} level={mascotteLevel} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 22, lineHeight: 1.1 }}>
              {firstName ? `Salut ${firstName} 👋` : 'Mon compte'}
            </div>
            <div style={{ fontSize: 12, color: palette.textDim, marginTop: 4 }}>{email ?? 'Anonyme'}</div>
          </div>
          <button
            onClick={onClose}
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

        {/* Stats principales */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
            marginBottom: 18,
          }}
        >
          <div style={{ background: palette.bg, padding: 14, borderRadius: 14, border: `1px solid ${palette.line}` }}>
            <div style={{ fontSize: 11, color: palette.textDim, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>
              XP cumulés
            </div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 24, color: palette.primary, marginTop: 2 }}>
              {xp}
            </div>
            <div style={{ marginTop: 8, height: 6, background: 'rgba(0,0,0,.4)', borderRadius: 999, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${xpPct}%`,
                  background: `linear-gradient(90deg, ${palette.glow1}, ${palette.glow2}, ${palette.accent})`,
                  borderRadius: 999,
                  transition: 'width .5s ease',
                }}
              />
            </div>
            <div style={{ fontSize: 10, color: palette.textDim, marginTop: 6 }}>
              {next.xp - xp} XP avant <b style={{ color: palette.text }}>{next.name}</b>
            </div>
          </div>

          <div style={{ background: palette.bg, padding: 14, borderRadius: 14, border: `1px solid ${palette.line}` }}>
            <div style={{ fontSize: 11, color: palette.textDim, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>
              Statut VIP
            </div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 24, color: palette.accent, marginTop: 2 }}>
              {vipTier.label}
            </div>
            <div style={{ fontSize: 11, color: palette.textDim, marginTop: 6 }}>
              {vipTier.discount > 0 ? `−${vipTier.discount}% permanent` : 'Pas d\'avantage actif'}
            </div>
            {nextVip && (
              <div style={{ fontSize: 10, color: palette.textDim, marginTop: 4 }}>
                {fmtEuro(nextVip.minSpentCents - (profile?.total_spent_cents ?? 0))} avant {nextVip.label}
              </div>
            )}
          </div>
        </div>

        {/* Stats secondaires */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 18, fontSize: 12, color: palette.textDim }}>
          <div>
            <b style={{ color: palette.text }}>{profile?.total_orders ?? 0}</b> commandes
          </div>
          <div>
            <b style={{ color: palette.text }}>{fmtEuro(profile?.total_spent_cents ?? 0)}</b> dépensés
          </div>
        </div>

        {/* Édition profil */}
        <div
          style={{
            background: palette.bg,
            border: `1px solid ${palette.line}`,
            borderRadius: 14,
            padding: 14,
            marginBottom: 14,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Mes infos</div>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                style={{
                  background: 'transparent',
                  border: `1px solid ${palette.line}`,
                  color: palette.primary,
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '5px 10px',
                  borderRadius: 999,
                  cursor: 'pointer',
                }}
              >
                Modifier
              </button>
            )}
          </div>

          {!editing ? (
            // Mode replié : résumé compact (gain de place)
            <div style={{ fontSize: 13.5, color: palette.text, lineHeight: 1.5 }}>
              👤 <b>{firstName || 'Prénom non renseigné'}</b>
              {birthday ? (
                <span style={{ color: palette.textDim }}>
                  {' · 🎂 '}
                  {(() => {
                    try {
                      return new Date(birthday).toLocaleDateString('fr-FR', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      });
                    } catch {
                      return birthday;
                    }
                  })()}
                </span>
              ) : (
                <span style={{ color: palette.primary, fontSize: 12 }}>
                  {' · 🎂 ajoute ta date (+500 XP ✨)'}
                </span>
              )}
            </div>
          ) : (
            <>
              <label style={{ display: 'block', fontSize: 11, color: palette.textDim, marginBottom: 4 }}>Prénom</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={saving}
                placeholder="Comment t'appeler ?"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: palette.card,
                  border: `1px solid ${palette.line}`,
                  borderRadius: 10,
                  color: palette.text,
                  fontSize: 16,
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
              <label style={{ display: 'block', fontSize: 11, color: palette.textDim, marginTop: 10, marginBottom: 4 }}>
                Anniversaire <span style={{ color: palette.primary }}>(+500 XP offerts ✨)</span>
              </label>
              <input
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                disabled={saving}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: palette.card,
                  border: `1px solid ${palette.line}`,
                  borderRadius: 10,
                  color: palette.text,
                  fontSize: 16,
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
            </>
          )}

          {editing && (
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button
                onClick={() => {
                  setFirstName(profile?.first_name ?? '');
                  setBirthday(profile?.birthday ?? '');
                  setEditing(false);
                }}
                disabled={saving}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: 'transparent',
                  border: `1px solid ${palette.line}`,
                  borderRadius: 10,
                  color: palette.text,
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: palette.cta,
                  color: palette.ctaText,
                  border: 0,
                  borderRadius: 10,
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: saving ? 'wait' : 'pointer',
                  fontFamily: 'Outfit, sans-serif',
                }}
              >
                {saving ? 'Enregistrement…' : 'Sauvegarder'}
              </button>
            </div>
          )}

          {savedMsg && (
            <div
              style={{
                marginTop: 10,
                fontSize: 12,
                color: palette.primary,
                fontWeight: 600,
              }}
            >
              {savedMsg}
            </div>
          )}
        </div>

        {/* Mon code QR à scanner au comptoir — visible dès que connecté */}
        {userId && (
          <button
            onClick={() => setMyCodeOpen(true)}
            style={{
              width: '100%',
              marginBottom: 10,
              padding: '14px 16px',
              background: `linear-gradient(135deg, ${palette.primary}, ${palette.glow3})`,
              border: `1px solid ${palette.primary}`,
              borderRadius: 14,
              color: '#02100e',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              fontFamily: 'inherit',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              boxShadow: `0 8px 24px ${palette.primary}44`,
            }}
          >
            <div style={{ fontSize: 22, lineHeight: 1 }}>📱</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 15 }}>
                Mon code à scanner
              </div>
              <div style={{ fontSize: 11, fontWeight: 500, marginTop: 2, opacity: 0.85 }}>
                Au comptoir pour cumuler tes XP
              </div>
            </div>
            <div style={{ fontSize: 18 }}>→</div>
          </button>
        )}

        {/* Section Admin repliable — visible uniquement pour les comptes admin */}
        {isAdmin && (
          <button
            onClick={() => setAdminOpen((v) => !v)}
            style={{
              width: '100%',
              marginBottom: adminOpen ? 10 : 10,
              padding: '12px 16px',
              background: 'transparent',
              border: `1px solid ${palette.line}`,
              borderRadius: 14,
              color: palette.textDim,
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <div style={{ fontSize: 18 }}>⚙️</div>
            <div style={{ flex: 1, textAlign: 'left' }}>Admin (gérant)</div>
            <div style={{ fontSize: 14 }}>{adminOpen ? '▾' : '▸'}</div>
          </button>
        )}

        {isAdmin && adminOpen && (
          <button
            onClick={() => {
              window.location.href = '/console.html#scanner';
            }}
            style={{
              width: '100%',
              marginBottom: 10,
              padding: '14px 16px',
              background: `linear-gradient(135deg, ${palette.primary}, ${palette.accent})`,
              border: 'none',
              borderRadius: 14,
              color: palette.ctaText,
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              fontFamily: 'inherit',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              boxShadow: `0 8px 24px ${palette.primary}44`,
            }}
          >
            <div style={{ fontSize: 22, lineHeight: 1 }}>📷</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 15 }}>
                Scanner un client
              </div>
              <div style={{ fontSize: 11, fontWeight: 500, marginTop: 2, opacity: 0.85 }}>
                Flash le QR, crédite les XP au comptoir
              </div>
            </div>
            <div style={{ fontSize: 18 }}>→</div>
          </button>
        )}

        {/* Bouton Console admin — dans la section Admin repliable */}
        {isAdmin && adminOpen && (
          <button
            onClick={() => {
              window.location.href = '/console.html';
            }}
            style={{
              width: '100%',
              marginBottom: 10,
              padding: '14px 16px',
              background: '#1a1f2e',
              border: `1px solid ${palette.accent}`,
              borderRadius: 14,
              color: palette.text,
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              fontFamily: 'inherit',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div style={{ fontSize: 22, lineHeight: 1 }}>⚙️</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 15, color: palette.accent }}>
                Console admin
              </div>
              <div style={{ fontSize: 11, fontWeight: 500, marginTop: 2, color: palette.textDim }}>
                Comptoir · Scanner · Push · Diagnostic
              </div>
            </div>
            <div style={{ fontSize: 18, color: palette.accent }}>→</div>
          </button>
        )}

        {/* Roue cadeau hebdomadaire */}
        <button
          onClick={() => setWheelOpen(true)}
          style={{
            width: '100%',
            marginBottom: 10,
            padding: '14px 16px',
            background: wheelCanSpin
              ? `linear-gradient(135deg, ${palette.accent}, ${palette.primary})`
              : palette.bg,
            border: `1px solid ${wheelCanSpin ? palette.accent : palette.line}`,
            borderRadius: 14,
            color: wheelCanSpin ? palette.ctaText : palette.text,
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer',
            fontFamily: 'inherit',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            boxShadow: wheelCanSpin ? `0 8px 24px ${palette.accent}44` : 'none',
          }}
        >
          <div style={{ fontSize: 28, lineHeight: 1 }}>🎁</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 15 }}>
              {wheelCanSpin ? 'Roue cadeau dispo !' : 'Roue cadeau'}
            </div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 500,
                marginTop: 2,
                opacity: wheelCanSpin ? 0.95 : 0.7,
              }}
            >
              {wheelCanSpin
                ? '1 tentative gratuite cette semaine'
                : `Reviens dans ${wheelCooldown.daysRemaining}j`}
            </div>
          </div>
          <div style={{ fontSize: 18 }}>→</div>
        </button>


        {/* Push notifications */}
        {push.supported && (
          <>
          {notifGlow && (
            <style>{`@keyframes notifGlowPulse {
              0%,100% { box-shadow: 0 0 0 0 ${palette.accent}00; }
              50% { box-shadow: 0 0 0 5px ${palette.accent}66; }
            }`}</style>
          )}
          <button
            ref={notifBtnRef}
            onClick={async () => {
              if (push.subscribed) {
                const res = await push.disable();
                if (!res.ok) window.alert('Impossible de désactiver les notifications.');
              } else {
                setNotifGlow(false);
                const res = await push.enable();
                if (!res.ok) {
                  window.alert(
                    'Notifications non activées : ' + (res.error ?? 'erreur inconnue') +
                    '\n\nVérifie que tu as accepté la permission, et que VITE_VAPID_PUBLIC_KEY est bien configuré côté Vercel.',
                  );
                }
              }
            }}
            disabled={push.loading}
            style={{
              width: '100%',
              marginBottom: 12,
              padding: '14px 16px',
              background: push.subscribed ? palette.primary + '20' : notifGlow ? palette.accent + '1f' : palette.bg,
              border: `${notifGlow ? 2 : 1}px solid ${push.subscribed ? palette.primary : notifGlow ? palette.accent : palette.line}`,
              borderRadius: 14,
              color: palette.text,
              fontSize: 13,
              fontWeight: 700,
              cursor: push.loading ? 'wait' : 'pointer',
              fontFamily: 'inherit',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              animation: notifGlow ? 'notifGlowPulse 1.1s ease-in-out infinite' : undefined,
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}>{push.subscribed ? '🔔' : '🔕'}</span>
              <span>
                {push.subscribed ? 'Notifications actives' : 'Activer les notifications'}
                <div style={{ fontSize: 11, color: palette.textDim, fontWeight: 500, marginTop: 2 }}>
                  {push.subscribed
                    ? 'Reçois les nouveautés et offres'
                    : 'Sois averti des nouveautés et offres spéciales'}
                </div>
              </span>
            </span>
            <span
              style={{
                width: 36,
                height: 22,
                borderRadius: 999,
                background: push.subscribed ? palette.primary : palette.line,
                position: 'relative',
                transition: 'background .2s',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: 2,
                  left: push.subscribed ? 16 : 2,
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: '#fff',
                  transition: 'left .2s',
                }}
              />
            </span>
          </button>
          </>
        )}

        {push.error && (
          <div style={{ fontSize: 11, color: palette.emotion, marginBottom: 12 }}>
            ⚠️ {push.error}
          </div>
        )}

        {/* Historique commandes */}
        {orders.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: palette.primary,
                letterSpacing: '.1em',
                textTransform: 'uppercase',
                marginBottom: 10,
              }}
            >
              📋 Mes dernières commandes
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {orders.slice(0, 5).map((order) => {
                const dt = new Date(order.created_at);
                const isPaid = order.status === 'paid';
                return (
                  <div
                    key={order.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 12px',
                      background: palette.bg,
                      border: `1px solid ${palette.line}`,
                      borderRadius: 10,
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: isPaid ? palette.primary + '22' : palette.line,
                        color: isPaid ? palette.primary : palette.textDim,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 16,
                        flexShrink: 0,
                      }}
                    >
                      {isPaid ? '✓' : '⌛'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontFamily: 'Outfit, sans-serif',
                          fontWeight: 700,
                          fontSize: 13,
                        }}
                      >
                        {dt.toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                      <div style={{ fontSize: 10, color: palette.textDim }}>
                        {isPaid ? 'Payée' : order.status === 'pending' ? 'En attente' : order.status}
                      </div>
                    </div>
                    <div
                      style={{
                        fontFamily: 'Outfit, sans-serif',
                        fontWeight: 800,
                        fontSize: 14,
                        color: palette.text,
                        flexShrink: 0,
                      }}
                    >
                      {fmtEuro(order.total_cents)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Contact — une question, un retard, une suggestion */}
        <div
          style={{
            marginBottom: 10,
            padding: 14,
            background: palette.card,
            border: `1px solid ${palette.line}`,
            borderRadius: 14,
          }}
        >
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 14, marginBottom: 2 }}>
            💬 Une question ?
          </div>
          <div style={{ fontSize: 11, color: palette.textDim, marginBottom: 10 }}>
            Retard, suggestion, demande spéciale — on te répond vite.
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a
              href="tel:+33679448759"
              style={{
                flex: 1, textAlign: 'center', textDecoration: 'none',
                padding: '11px', borderRadius: 12,
                background: palette.bg, border: `1px solid ${palette.line}`,
                color: palette.text, fontWeight: 700, fontSize: 13,
                fontFamily: 'Outfit, sans-serif',
              }}
            >
              📞 Appeler
            </a>
            <a
              href="https://wa.me/33679448759"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1, textAlign: 'center', textDecoration: 'none',
                padding: '11px', borderRadius: 12,
                background: '#25D366', color: '#fff',
                fontWeight: 700, fontSize: 13, fontFamily: 'Outfit, sans-serif',
              }}
            >
              💬 WhatsApp
            </a>
          </div>
        </div>

        {/* Revoir le tutoriel */}
        {onShowOnboarding && (
          <button
            onClick={onShowOnboarding}
            style={{
              width: '100%',
              marginBottom: 10,
              padding: '13px 16px',
              background: 'transparent',
              border: `1px solid ${palette.line}`,
              borderRadius: 12,
              color: palette.text,
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span style={{ fontSize: 18 }}>💡</span>
            <span style={{ flex: 1, textAlign: 'left' }}>Comment ça marche ?</span>
            <span style={{ color: palette.textDim }}>→</span>
          </button>
        )}

        {/* Footer actions */}
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          style={{
            width: '100%',
            padding: '12px',
            background: 'transparent',
            border: `1px solid ${palette.emotion}66`,
            borderRadius: 12,
            color: palette.emotion,
            fontWeight: 700,
            fontSize: 13,
            cursor: signingOut ? 'wait' : 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {signingOut ? 'Déconnexion…' : 'Se déconnecter'}
        </button>

        <div
          style={{
            marginTop: 12,
            fontSize: 10,
            color: palette.textDim,
            textAlign: 'center',
            lineHeight: 1.6,
          }}
        >
          Tes données restent privées et ne sont jamais partagées.
          <br />
          <a href="/confidentialite" style={{ color: palette.textDim, textDecoration: 'underline' }}>Confidentialité</a>
          {' · '}
          <a href="/mentions-legales" style={{ color: palette.textDim, textDecoration: 'underline' }}>Mentions légales</a>
        </div>
      </div>

      {/* Modale roue cadeau */}
      <WheelModal palette={palette} open={wheelOpen} onClose={() => setWheelOpen(false)} isAdmin={isAdmin} />

      {/* Modale Mon Code QR — userId suffit (profile peut être null en attendant
          le chargement asynchrone) */}
      {userId && (
        <MyCodeModal
          palette={palette}
          open={myCodeOpen}
          onClose={() => setMyCodeOpen(false)}
          userId={userId}
          profile={profile}
        />
      )}
    </div>
  );
}
