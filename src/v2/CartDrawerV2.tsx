// Drawer panier V2 — palette Teal × Ambre, bouton sticky checkout
// + quick-adds intelligents basés sur le contenu du panier
// + sélection code promo roue cadeau
import React, { useMemo } from 'react';
import type { Palette } from './palette';
import { ProductImage } from './ProductImage';
import { findV2ProductByName, type V2Product } from './products-adapter';
import type { UserReward } from './rewards/useUserRewards';
import { maxSpendableXp, xpToCents, XP_SPEND_STEP, XP_PER_EURO } from './xp/xp-spend';
import { useOpenStatus } from './openingHours';
import { getWheelCooldown } from './wheel/segments';

interface CartItem {
  key: string;
  name: string;
  categoryName: string;
  quantity: number;
  option: string;
  unitPriceCents: number;
  extras?: string[];
}

interface QuickAddSuggestion {
  product: V2Product;
  reason: string;
}

interface CartDrawerV2Props {
  palette: Palette;
  open: boolean;
  onClose: () => void;
  cart: CartItem[];
  totalCents: number;
  customerName: string;
  setCustomerName: (v: string) => void;
  pickupTime: string;
  setPickupTime: (v: string) => void;
  onUpdateQty: (key: string, delta: number) => void;
  onEditItem?: (item: CartItem) => void;
  editableKeys?: Set<string>;
  onSquareCheckout: () => void;
  onWhatsAppOrder: () => void;
  onPayOnSite?: () => void;
  isCreatingPayment: boolean;
  hasRequiredPickupInfo: boolean;
  onAddSuggestion?: (product: V2Product) => void;
  rewards?: UserReward[];
  selectedRewardCode?: string | null;
  setSelectedRewardCode?: (code: string | null) => void;
  userXp?: number;
  userOrders?: number; // nb de commandes payées (gate BOGO « dès la 2e commande »)
  xpToSpend?: number;
  setXpToSpend?: (xp: number) => void;
  isAuthed?: boolean;
  claimedGift?: { id: string; title: string; emoji: string; cost: number } | null;
  onClaimGift?: (reward: { id: string; title: string; emoji: string; cost: number }) => void;
  onConnect?: () => void; // ouvre l'auth (nudge "crée un compte")
  onSpinWheel?: () => void; // ouvre la roue (nudge "tente ta chance")
}

// Catégories éligibles aux cadeaux BOGO (1 acheté = 1 offert)
const BOGO_SMOOTHIE_CAT = 'Smoothies nutritionnels';
const BOGO_DRINK_CAT = 'Boissons énergisantes';

// État d'un cadeau BOGO (2e smoothie / 2e drink XL offert) pour le panier courant.
// Règle STRICTE : ≥2 produits du même type → le moins cher offert.
// ⚠️ Doit rester en miroir de api/create-payment-link.ts.
function bogoInfo(reward: UserReward | null | undefined, cart: CartItem[]) {
  const none = {
    isBogo: false,
    kind: null as null | 'smoothie' | 'drink',
    eligibleCount: 0,
    discountCents: 0,
  };
  if (!reward || reward.reward_type !== 'free_product') return none;
  const rv = (reward.reward_value ?? '').toLowerCase();
  const kind: 'smoothie' | 'drink' | null = rv.includes('smoothie')
    ? 'smoothie'
    : rv.includes('drink')
      ? 'drink'
      : null;
  if (!kind) return none;
  const prices: number[] = [];
  for (const item of cart) {
    const isSmoothie = item.categoryName === BOGO_SMOOTHIE_CAT;
    const isDrinkXL = item.categoryName === BOGO_DRINK_CAT && /950/.test(item.option || '');
    const matches = kind === 'smoothie' ? isSmoothie : isDrinkXL;
    if (!matches) continue;
    for (let i = 0; i < Math.max(1, item.quantity); i++) prices.push(item.unitPriceCents);
  }
  prices.sort((a, b) => a - b);
  return {
    isBogo: true,
    kind,
    eligibleCount: prices.length,
    discountCents: prices.length >= 2 ? prices[0] : 0,
  };
}

// Calcule les suggestions intelligentes d'après le panier
function computeSuggestions(cart: CartItem[]): QuickAddSuggestion[] {
  if (cart.length === 0) return [];

  const categories = new Set(cart.map((i) => i.categoryName));
  const hasSmoothie = categories.has('Smoothies nutritionnels');
  const hasDrink = categories.has('Boissons énergisantes');
  const hasHot = categories.has('Cafés / Chocolats / Thés');
  const hasGaufre = categories.has('Gaufre');
  const hasHealth = categories.has('Boissons santé');

  const suggestions: QuickAddSuggestion[] = [];

  // 1. Pas de gaufre + a quelque chose → propose gaufre healthy
  if (!hasGaufre && (hasSmoothie || hasHot || hasDrink)) {
    const p = findV2ProductByName('Gaufre healthy');
    if (p) {
      suggestions.push({
        product: p,
        reason: 'Une pause gourmande à 6,90€ pour compléter ta commande',
      });
    }
  }

  // 2. Smoothie seul → propose un drink
  if (hasSmoothie && !hasDrink && !hasHealth) {
    const p = findV2ProductByName('Electric Blue');
    if (p) {
      suggestions.push({
        product: p,
        reason: 'Ajoute un drink énergisant pour un combo parfait',
      });
    }
  }

  // 3. Drink seul → propose un smoothie
  if (hasDrink && !hasSmoothie && !hasHot) {
    const p = findV2ProductByName('Snickers');
    if (p) {
      suggestions.push({
        product: p,
        reason: 'Un smoothie nutritionnel pour la satiété + 24g protéines',
      });
    }
  }

  // 4. Pas de santé → propose une Limonade Rose ou Hydrat'Max
  if (!hasHealth && cart.length === 1) {
    const p = findV2ProductByName('Limonade Rose');
    if (p) {
      suggestions.push({
        product: p,
        reason: 'Beauté de la peau, collagène + aloé vera',
      });
    }
  }

  return suggestions.slice(0, 2); // Max 2 suggestions
}

function fmtEuro(cents: number) {
  return `${(cents / 100).toFixed(2).replace('.', ',')}€`;
}

export function CartDrawerV2({
  palette,
  open,
  onClose,
  cart,
  totalCents,
  customerName,
  setCustomerName,
  pickupTime,
  setPickupTime,
  onUpdateQty,
  onEditItem,
  editableKeys,
  onSquareCheckout,
  onWhatsAppOrder,
  onPayOnSite,
  isCreatingPayment,
  hasRequiredPickupInfo,
  onAddSuggestion,
  rewards,
  selectedRewardCode,
  setSelectedRewardCode,
  userXp = 0,
  userOrders = 0,
  xpToSpend = 0,
  setXpToSpend,
  isAuthed = false,
  claimedGift = null,
  onClaimGift,
  onConnect,
  onSpinWheel,
}: CartDrawerV2Props) {
  const suggestions = useMemo(() => computeSuggestions(cart), [cart]);

  // Calcule la réduction selon le reward sélectionné
  const selectedReward = useMemo(() => {
    if (!selectedRewardCode || !rewards) return null;
    return rewards.find((r) => r.reward_code === selectedRewardCode) ?? null;
  }, [selectedRewardCode, rewards]);

  const rewardDiscountCents = useMemo(() => {
    if (!selectedReward) return 0;
    if (selectedReward.reward_type === 'discount_percent') {
      const pct = parseInt(selectedReward.reward_value ?? '0', 10);
      return Math.round((totalCents * pct) / 100);
    }
    // BOGO (2e smoothie / drink XL offert) : seulement client déjà venu (≥1 cmd)
    // ET ≥2 éligibles → le moins cher offert.
    if (userOrders < 1) return 0;
    return bogoInfo(selectedReward, cart).discountCents;
  }, [selectedReward, totalCents, cart, userOrders]);

  // Calcul max XP utilisables sur ce panier (après réduction reward)
  const cartAfterReward = Math.max(0, totalCents - rewardDiscountCents);
  const maxXp = useMemo(() => maxSpendableXp(userXp, cartAfterReward), [userXp, cartAfterReward]);
  const safeXpToSpend = Math.min(xpToSpend, maxXp);
  const xpDiscountCents = xpToCents(safeXpToSpend);

  const discountCents = rewardDiscountCents + xpDiscountCents;
  const finalTotalCents = Math.max(0, totalCents - discountCents);
  const openStatus = useOpenStatus();

  if (!open) return null;

  const empty = cart.length === 0;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, .82)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 520,
          maxHeight: '94vh',
          // Quand le panier est vide, on lui donne une hauteur correcte pour
          // qu'il ne soit pas un mince bandeau collé en bas (desktop surtout).
          minHeight: empty ? '60vh' : undefined,
          background: `linear-gradient(180deg, ${palette.cardHi}, ${palette.card})`,
          border: `1px solid ${palette.line}`,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          overflow: 'hidden',
          color: palette.text,
          fontFamily: 'Inter, sans-serif',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: `1px solid ${palette.line}`,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 900,
                fontSize: 22,
                lineHeight: 1.1,
              }}
            >
              Ton panier
            </div>
            <div style={{ fontSize: 12, color: palette.textDim, marginTop: 2 }}>
              {empty
                ? 'Encore vide…'
                : `${cart.reduce((n, i) => n + i.quantity, 0)} article${cart.reduce((n, i) => n + i.quantity, 0) > 1 ? 's' : ''}`}
            </div>
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
            }}
          >
            ✕
          </button>
        </div>

        {/* Liste articles */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px 20px',
            paddingBottom: empty ? 20 : 240,
            // Centre verticalement le message quand le panier est vide
            display: empty ? 'flex' : undefined,
            alignItems: empty ? 'center' : undefined,
            justifyContent: empty ? 'center' : undefined,
          }}
        >
          {empty ? (
            <div
              style={{
                padding: '20px',
                textAlign: 'center',
                color: palette.textDim,
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 12 }}>🥤</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: palette.text }}>Panier vide</div>
              <div style={{ fontSize: 13, marginTop: 6, lineHeight: 1.5 }}>
                Ajoute tes shakes, drinks ou combos préférés depuis le menu.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(() => {
                const status = openStatus;
                if (status.isOpen) return null;
                return (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      padding: '12px 14px',
                      background: 'rgba(239,68,68,.12)',
                      border: '1px solid rgba(239,68,68,.4)',
                      borderRadius: 14,
                      marginBottom: 4,
                    }}
                  >
                    <div style={{ fontSize: 20, lineHeight: 1 }}>🔴</div>
                    <div style={{ fontSize: 12.5, color: palette.text, lineHeight: 1.4 }}>
                      <b>Le bar est fermé pour le moment.</b>
                      {status.nextOpenLabel ? ` ${status.nextOpenLabel}.` : ''} Tu peux
                      quand même commander : ton retrait se fera à la réouverture 🥤
                    </div>
                  </div>
                );
              })()}

              {/* Nudge ANONYME : crée un compte pour gagner XP + cadeaux */}
              {!isAuthed && onConnect && (
                <div
                  style={{
                    padding: 14,
                    borderRadius: 16,
                    background: `linear-gradient(135deg, ${palette.primary}22, ${palette.accent}11)`,
                    border: `1px solid ${palette.accent}66`,
                    marginBottom: 4,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <div style={{ fontSize: 24, lineHeight: 1 }}>🎁</div>
                    <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 15.5, color: palette.text }}>
                      Gagne sur cette commande !
                    </div>
                  </div>
                  <div style={{ fontSize: 12.5, color: palette.textDim, lineHeight: 1.45, marginBottom: 10 }}>
                    En créant ton compte (30s), tu cumules des <b style={{ color: palette.text }}>XP</b>,
                    tu débloques des <b style={{ color: palette.text }}>réductions & cadeaux</b>, et tu peux
                    tenter la <b style={{ color: palette.text }}>roue 🎰</b>.
                  </div>
                  <button
                    onClick={onConnect}
                    style={{
                      width: '100%', padding: '12px', border: 0, borderRadius: 12,
                      background: palette.cta, color: palette.ctaText,
                      fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 13.5, cursor: 'pointer',
                    }}
                  >
                    ✨ Créer mon compte / Me connecter
                  </button>
                </div>
              )}

              {/* Nudge CONNECTÉ : roue cadeau dispo avant de valider */}
              {isAuthed && onSpinWheel && getWheelCooldown().canSpin && (
                <button
                  onClick={onSpinWheel}
                  style={{
                    width: '100%', textAlign: 'left',
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: 14, borderRadius: 16, cursor: 'pointer',
                    background: `linear-gradient(135deg, ${palette.accent}, ${palette.primary})`,
                    color: palette.ctaText, border: 0, marginBottom: 4,
                    fontFamily: 'inherit',
                    boxShadow: `0 8px 22px ${palette.accent}44`,
                  }}
                >
                  <div style={{ fontSize: 26, lineHeight: 1 }}>🎰</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 14.5 }}>
                      Tu n'as pas tourné la roue !
                    </div>
                    <div style={{ fontSize: 11.5, opacity: 0.9, marginTop: 1 }}>
                      Tente ta chance avant de valider 🎁
                    </div>
                  </div>
                  <div style={{ fontSize: 18 }}>→</div>
                </button>
              )}

              {cart.map((item) => (
                <div
                  key={item.key}
                  style={{
                    background: palette.bg,
                    border: `1px solid ${palette.line}`,
                    borderRadius: 14,
                    padding: 14,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: 'Outfit, sans-serif',
                        fontWeight: 800,
                        fontSize: 15,
                        lineHeight: 1.2,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {item.name}
                    </div>
                    {item.option && (
                      <div
                        style={{
                          fontSize: 11,
                          color: palette.textDim,
                          marginTop: 2,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.option}
                      </div>
                    )}
                    {item.extras && item.extras.length > 0 && (
                      <div
                        style={{
                          fontSize: 10,
                          color: palette.accent,
                          marginTop: 2,
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        + {item.extras.join(', ')}
                      </div>
                    )}
                    <div style={{ fontSize: 12, color: palette.primary, fontWeight: 700, marginTop: 4 }}>
                      {fmtEuro(item.unitPriceCents * item.quantity)}
                    </div>
                    {onEditItem && editableKeys?.has(item.key) && (
                      <button
                        onClick={() => onEditItem(item)}
                        style={{
                          marginTop: 4,
                          padding: 0,
                          background: 'transparent',
                          border: 0,
                          color: palette.textDim,
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          fontFamily: 'inherit',
                        }}
                      >
                        ✏️ Modifier
                      </button>
                    )}
                  </div>

                  {/* Stepper */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      background: palette.cardHi,
                      borderRadius: 999,
                      padding: 4,
                      border: `1px solid ${palette.line}`,
                    }}
                  >
                    <button
                      onClick={() => onUpdateQty(item.key, -1)}
                      aria-label="Diminuer"
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: 'transparent',
                        border: 0,
                        color: palette.text,
                        cursor: 'pointer',
                        fontWeight: 800,
                        fontSize: 16,
                      }}
                    >
                      −
                    </button>
                    <div
                      style={{
                        minWidth: 18,
                        textAlign: 'center',
                        fontFamily: 'Outfit, sans-serif',
                        fontWeight: 800,
                        fontSize: 14,
                      }}
                    >
                      {item.quantity}
                    </div>
                    <button
                      onClick={() => onUpdateQty(item.key, 1)}
                      aria-label="Augmenter"
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: palette.primary,
                        border: 0,
                        color: palette.bg,
                        cursor: 'pointer',
                        fontWeight: 800,
                        fontSize: 16,
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Récompenses actives (codes roue cadeau) */}
          {!empty && rewards && rewards.length > 0 && setSelectedRewardCode && (
            <div style={{ marginTop: 20 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: palette.accent,
                  letterSpacing: '.1em',
                  textTransform: 'uppercase',
                  marginBottom: 10,
                }}
              >
                🎁 Tes récompenses
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {rewards.map((r) => {
                  const active = selectedRewardCode === r.reward_code;
                  const rBogo = bogoInfo(r, cart);
                  // BOGO : sélectionnable UNIQUEMENT si client déjà venu (≥1 cmd)
                  // ET ≥2 produits éligibles au panier (sinon grisé + hint).
                  const bogoReady = rBogo.isBogo && userOrders >= 1 && rBogo.eligibleCount >= 2;
                  const applicable = r.reward_type === 'discount_percent' || bogoReady;
                  return (
                    <button
                      key={r.id}
                      onClick={() => setSelectedRewardCode(active ? null : r.reward_code)}
                      disabled={!applicable}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: 12,
                        background: active ? palette.accent + '18' : palette.bg,
                        border: `1.5px solid ${active ? palette.accent : palette.line}`,
                        borderRadius: 12,
                        color: palette.text,
                        cursor: applicable ? 'pointer' : 'default',
                        opacity: applicable ? 1 : 0.6,
                        textAlign: 'left',
                        fontFamily: 'inherit',
                        transition: 'all .15s',
                      }}
                    >
                      <span
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 4,
                          border: `2px solid ${active ? palette.accent : palette.line}`,
                          background: active ? palette.accent : 'transparent',
                          color: palette.ctaText,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          fontWeight: 900,
                          flexShrink: 0,
                        }}
                      >
                        {active ? '✓' : ''}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontFamily: 'Outfit, sans-serif',
                            fontWeight: 800,
                            fontSize: 13,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {r.reward_label}
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            color: palette.textDim,
                            marginTop: 2,
                            fontFamily: 'ui-monospace, monospace',
                          }}
                        >
                          {r.reward_code}
                          {!applicable && !rBogo.isBogo && ' • à présenter au comptoir'}
                          {rBogo.isBogo && userOrders < 1 &&
                            ' • valable dès ta 2e commande'}
                          {rBogo.isBogo && userOrders >= 1 && rBogo.eligibleCount < 2 &&
                            ` • ajoute un 2e ${rBogo.kind === 'smoothie' ? 'smoothie' : 'drink XL'} pour l'activer`}
                          {rBogo.isBogo && userOrders >= 1 && rBogo.eligibleCount >= 2 && active &&
                            ' • le moins cher offert ✅'}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 🎁 Offre-toi un extra avec tes XP (catalogue, pas de réduction cash) */}
          {!empty && isAuthed && onClaimGift && (() => {
            const GIFTS = [
              { id: 'boost', title: 'Sirop / boost offert', emoji: '🍯', cost: 100, sub: 'Une dose de sirop parfumé ou un boost' },
              { id: 'topping', title: 'Topping offert', emoji: '✨', cost: 250, sub: 'Protéine, créatine, beurre de cacahuète…' },
              { id: 'boisson', title: 'Une boisson au choix', emoji: '🥤', cost: 800, sub: 'Smoothie ou shake offert' },
            ];
            const affordable = GIFTS.filter((g) => userXp >= g.cost);
            if (claimedGift) {
              return (
                <div style={{ marginTop: 20 }}>
                  <div
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: 14, borderRadius: 14,
                      background: `linear-gradient(135deg, ${palette.primary}22, ${palette.card})`,
                      border: `1px solid ${palette.primary}`,
                    }}
                  >
                    <span style={{ fontSize: 24 }}>{claimedGift.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 14 }}>
                        {claimedGift.title} <span style={{ color: palette.primary }}>offert ✓</span>
                      </div>
                      <div style={{ fontSize: 11, color: palette.textDim, marginTop: 2 }}>
                        −{claimedGift.cost} XP · débité à la validation de ta commande
                      </div>
                    </div>
                    <button
                      onClick={() => onClaimGift(null as any)}
                      style={{
                        background: 'transparent',
                        border: `1px solid ${palette.line}`,
                        color: palette.textDim,
                        borderRadius: 8,
                        padding: '6px 10px',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        flexShrink: 0,
                      }}
                    >
                      Retirer
                    </button>
                  </div>
                </div>
              );
            }
            if (affordable.length === 0) return null;
            return (
              <div style={{ marginTop: 20 }}>
                <div
                  style={{
                    fontSize: 11, fontWeight: 700, color: palette.primary,
                    letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 4,
                  }}
                >
                  🎁 Offre-toi un extra avec tes XP
                </div>
                <div style={{ fontSize: 11, color: palette.textDim, marginBottom: 10 }}>
                  Tu as {userXp} XP — utilise-les pour un cadeau, récupéré au comptoir.
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {affordable.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => onClaimGift(g)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: 13, borderRadius: 14, cursor: 'pointer',
                        background: palette.card,
                        border: `1px solid ${palette.line}`,
                        color: palette.text, fontFamily: 'inherit', textAlign: 'left',
                      }}
                    >
                      <span style={{ fontSize: 22 }}>{g.emoji}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 14 }}>{g.title}</div>
                        <div style={{ fontSize: 11, color: palette.textDim, marginTop: 2 }}>{g.sub}</div>
                      </div>
                      <span
                        style={{
                          fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 12,
                          color: palette.ctaText, background: palette.cta,
                          padding: '6px 10px', borderRadius: 999, flexShrink: 0,
                        }}
                      >
                        −{g.cost} XP
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Quick-adds intelligents */}
          {!empty && suggestions.length > 0 && onAddSuggestion && (
            <div style={{ marginTop: 20 }}>
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
                ⚡ Pour compléter ta commande
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {suggestions.map((s) => (
                  <button
                    key={s.product.id}
                    onClick={() => onAddSuggestion(s.product)}
                    style={{
                      background: `linear-gradient(135deg, ${palette.card}, ${palette.cardHi})`,
                      border: `1px solid ${palette.primary}33`,
                      borderRadius: 14,
                      padding: 12,
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'inherit',
                      color: palette.text,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 12,
                        background: `radial-gradient(circle at 50% 50%, ${palette.primary}22, transparent 70%)`,
                        flexShrink: 0,
                        overflow: 'hidden',
                        padding: 4,
                      }}
                    >
                      <ProductImage src={s.product.image} alt={s.product.name} palette={palette} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontFamily: 'Outfit, sans-serif',
                          fontWeight: 800,
                          fontSize: 14,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {s.product.name}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: palette.textDim,
                          marginTop: 2,
                          lineHeight: 1.35,
                        }}
                      >
                        {s.reason}
                      </div>
                    </div>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: palette.cta,
                        color: palette.ctaText,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 20,
                        fontWeight: 900,
                        flexShrink: 0,
                        boxShadow: `0 4px 12px ${palette.cta}66`,
                      }}
                    >
                      +
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer sticky : infos retrait + checkout */}
        {!empty && (
          <div
            style={{
              position: 'sticky',
              bottom: 0,
              background: `linear-gradient(180deg, transparent, ${palette.card} 15%)`,
              padding: '20px 20px calc(20px + env(safe-area-inset-bottom, 0px))',
              borderTop: `1px solid ${palette.line}`,
            }}
          >
            {/* Petite intro pour expliquer ce qu'on demande */}
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '.1em',
                textTransform: 'uppercase',
                color: palette.textDim,
                marginBottom: 8,
              }}
            >
              ✏️ Pour ta commande
            </div>

            {/* Champs prénom + heure
                ⚠️ fontSize: 16px MINIMUM : sinon iOS Safari zoom auto sur focus
                et ne dézoome pas → toute la page reste cassée. Standard iOS.   */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 10,
                    fontWeight: 700,
                    color: palette.textDim,
                    marginBottom: 4,
                    letterSpacing: '.06em',
                  }}
                >
                  Ton prénom
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="ex : Tom"
                  autoComplete="given-name"
                  enterKeyHint="next"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    background: palette.bg,
                    border: `1px solid ${palette.line}`,
                    borderRadius: 12,
                    color: palette.text,
                    fontSize: 16,
                    outline: 'none',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div style={{ width: 120 }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 10,
                    fontWeight: 700,
                    color: palette.textDim,
                    marginBottom: 4,
                    letterSpacing: '.06em',
                  }}
                >
                  Heure retrait
                </label>
                <input
                  type="time"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  enterKeyHint="done"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    background: palette.bg,
                    border: `1px solid ${palette.line}`,
                    borderRadius: 12,
                    color: palette.text,
                    fontSize: 16,
                    outline: 'none',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div
              style={{
                fontSize: 11,
                color: palette.textDim,
                marginBottom: 12,
                lineHeight: 1.4,
              }}
            >
              💡 On utilise ton prénom pour la commande au comptoir et l'heure pour préparer pile à temps.
            </div>

            {/* Récap réductions si appliquées */}
            {rewardDiscountCents > 0 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 12,
                  color: palette.accent,
                  marginBottom: 2,
                  fontWeight: 700,
                }}
              >
                <span>🎁 Code roue</span>
                <span>−{fmtEuro(rewardDiscountCents)}</span>
              </div>
            )}
            {xpDiscountCents > 0 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 12,
                  color: palette.primary,
                  marginBottom: 4,
                  fontWeight: 700,
                }}
              >
                <span>⚡ {safeXpToSpend} XP utilisés</span>
                <span>−{fmtEuro(xpDiscountCents)}</span>
              </div>
            )}
            {/* Total + boutons */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <div style={{ fontSize: 13, color: palette.textDim }}>Total</div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 8,
                }}
              >
                {discountCents > 0 && (
                  <span
                    style={{
                      fontSize: 13,
                      color: palette.textDim,
                      textDecoration: 'line-through',
                    }}
                  >
                    {fmtEuro(totalCents)}
                  </span>
                )}
                <span
                  style={{
                    fontFamily: 'Outfit, sans-serif',
                    fontWeight: 900,
                    fontSize: 22,
                    color: discountCents > 0 ? palette.accent : palette.text,
                  }}
                >
                  {fmtEuro(finalTotalCents)}
                </span>
              </div>
            </div>

            <button
              onClick={onSquareCheckout}
              disabled={isCreatingPayment || !hasRequiredPickupInfo}
              style={{
                width: '100%',
                padding: '16px',
                background: palette.cta,
                color: palette.ctaText,
                border: 0,
                borderRadius: 14,
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 900,
                fontSize: 15,
                cursor: isCreatingPayment ? 'wait' : 'pointer',
                boxShadow: `0 12px 32px ${palette.cta}55`,
                opacity: !hasRequiredPickupInfo ? 0.4 : 1,
                transition: 'opacity .2s',
              }}
            >
              {isCreatingPayment ? 'Création du paiement…' : `Payer · Square`}
            </button>

            <button
              onClick={onWhatsAppOrder}
              disabled={!hasRequiredPickupInfo}
              style={{
                width: '100%',
                marginTop: 8,
                padding: '12px',
                background: 'transparent',
                color: palette.text,
                border: `1px solid ${palette.line}`,
                borderRadius: 14,
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: 'inherit',
                opacity: !hasRequiredPickupInfo ? 0.4 : 1,
              }}
            >
              Commander par WhatsApp
            </button>

            {onPayOnSite && (
              <button
                onClick={onPayOnSite}
                disabled={!hasRequiredPickupInfo}
                style={{
                  width: '100%',
                  marginTop: 8,
                  padding: '12px',
                  background: 'transparent',
                  color: palette.text,
                  border: `1px solid ${palette.line}`,
                  borderRadius: 14,
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  opacity: !hasRequiredPickupInfo ? 0.4 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                💵 Payer en espèces sur place
              </button>
            )}

            {!hasRequiredPickupInfo && (
              <div
                style={{
                  marginTop: 8,
                  fontSize: 11,
                  color: palette.textDim,
                  textAlign: 'center',
                }}
              >
                Renseigne ton prénom et l'heure de retrait
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
