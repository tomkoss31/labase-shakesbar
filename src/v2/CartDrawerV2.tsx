// Drawer panier V2 — palette Teal × Ambre, bouton sticky checkout
import React from 'react';
import type { Palette } from './palette';

interface CartItem {
  key: string;
  name: string;
  categoryName: string;
  quantity: number;
  option: string;
  unitPriceCents: number;
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
  onSquareCheckout: () => void;
  onWhatsAppOrder: () => void;
  isCreatingPayment: boolean;
  hasRequiredPickupInfo: boolean;
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
  onSquareCheckout,
  onWhatsAppOrder,
  isCreatingPayment,
  hasRequiredPickupInfo,
}: CartDrawerV2Props) {
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
          }}
        >
          {empty ? (
            <div
              style={{
                padding: '40px 20px',
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
                    <div style={{ fontSize: 12, color: palette.primary, fontWeight: 700, marginTop: 4 }}>
                      {fmtEuro(item.unitPriceCents * item.quantity)}
                    </div>
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
            {/* Champs prénom + heure */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Prénom"
                autoComplete="given-name"
                style={{
                  flex: 1,
                  padding: '12px 14px',
                  background: palette.bg,
                  border: `1px solid ${palette.line}`,
                  borderRadius: 12,
                  color: palette.text,
                  fontSize: 14,
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
              <input
                type="time"
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                style={{
                  width: 120,
                  padding: '12px 14px',
                  background: palette.bg,
                  border: `1px solid ${palette.line}`,
                  borderRadius: 12,
                  color: palette.text,
                  fontSize: 14,
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
            </div>

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
                  fontFamily: 'Outfit, sans-serif',
                  fontWeight: 900,
                  fontSize: 22,
                  color: palette.text,
                }}
              >
                {fmtEuro(totalCents)}
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
