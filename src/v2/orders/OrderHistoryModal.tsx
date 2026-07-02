// Écran client « Mon historique » — le client revoit ses commandes (descriptif
// des articles) + le détail de ses XP : gagnés par commande (estimation) et
// dépensés en cadeaux (reward_redemptions). Données via /api/orders?action=history.
import React, { useEffect, useState } from 'react';
import type { Palette } from '../palette';
import { getStoredSession } from '../../lib/supabase';

interface HistItem {
  product_name: string;
  option_label: string | null;
  quantity: number;
  unit_price_cents: number;
}
interface HistOrder {
  id: string;
  total_cents: number;
  status: string;
  payment_method: string | null;
  created_at: string;
  paid_at: string | null;
  items: HistItem[];
  xpEstimate: number;
}
interface HistReward {
  reward_label: string;
  xp_cost: number;
  source: string | null;
  created_at: string;
}

interface Props {
  palette: Palette;
  open: boolean;
  onClose: () => void;
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function OrderHistoryModal({ palette, open, onClose }: Props) {
  const [orders, setOrders] = useState<HistOrder[]>([]);
  const [rewards, setRewards] = useState<HistReward[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const session = getStoredSession();
    if (!session?.access_token) return;
    let cancelled = false;
    setLoading(true);
    fetch('/api/orders?action=history', { headers: { Authorization: `Bearer ${session.access_token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d) return;
        setOrders(Array.isArray(d.orders) ? d.orders : []);
        setRewards(Array.isArray(d.rewards) ? d.rewards : []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open) return null;

  const totalSpentXp = rewards.reduce((s, r) => s + (r.xp_cost || 0), 0);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.85)',
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
          maxWidth: 460,
          maxHeight: '85vh',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          background: `linear-gradient(180deg, ${palette.cardHi}, ${palette.bg})`,
          border: `1px solid ${palette.line}`,
          borderRadius: 24,
          padding: '22px 18px',
          color: palette.text,
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 22 }}>🧾 Mon historique</div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(0,0,0,.3)', border: `1px solid ${palette.line}`,
              color: palette.text, cursor: 'pointer', fontSize: 18,
            }}
          >
            ✕
          </button>
        </div>

        {loading && orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: palette.textDim }}>Chargement…</div>
        ) : orders.length === 0 && rewards.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: palette.textDim }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>🧾</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: palette.text }}>Pas encore de commande</div>
            <div style={{ fontSize: 12, marginTop: 6 }}>Ta première commande apparaîtra ici avec tes XP gagnés ✨</div>
          </div>
        ) : (
          <>
            {/* Commandes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {orders.map((o) => {
                const total = (o.total_cents / 100).toFixed(2).replace('.', ',');
                const summary = o.items
                  .map((it) => `${it.quantity > 1 ? it.quantity + '× ' : ''}${it.product_name}${it.option_label ? ' · ' + it.option_label : ''}`)
                  .join(' · ');
                return (
                  <div
                    key={o.id}
                    style={{
                      padding: 14,
                      background: palette.card,
                      border: `1px solid ${palette.line}`,
                      borderRadius: 16,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ fontSize: 11.5, color: palette.textDim }}>{fmtDate(o.paid_at || o.created_at)}</span>
                      <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 14 }}>{total}€</span>
                    </div>
                    <div style={{ fontSize: 13, marginTop: 5, lineHeight: 1.4 }}>
                      {summary || <span style={{ color: palette.textDim, fontStyle: 'italic' }}>Détail non disponible</span>}
                    </div>
                    <div
                      style={{
                        display: 'inline-block',
                        marginTop: 8,
                        fontSize: 11.5,
                        fontWeight: 800,
                        color: palette.primary,
                        background: palette.primary + '18',
                        borderRadius: 999,
                        padding: '3px 10px',
                      }}
                    >
                      ≈ +{o.xpEstimate} XP
                    </div>
                  </div>
                );
              })}
            </div>

            {/* XP dépensés (cadeaux réclamés) */}
            {rewards.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 900,
                    letterSpacing: '.1em',
                    textTransform: 'uppercase',
                    color: '#f59e0b',
                    marginBottom: 8,
                  }}
                >
                  🎁 XP utilisés ({totalSpentXp} au total)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {rewards.map((r, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 8,
                        fontSize: 13,
                        padding: '9px 12px',
                        background: palette.card,
                        border: `1px solid ${palette.line}`,
                        borderRadius: 12,
                      }}
                    >
                      <span>🎁 {r.reward_label}</span>
                      <span style={{ color: '#f59e0b', fontWeight: 800, whiteSpace: 'nowrap' }}>−{r.xp_cost} XP</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ fontSize: 10.5, color: palette.textDim, marginTop: 14, textAlign: 'center', lineHeight: 1.5 }}>
              XP gagnés = estimation (10 XP/€ + bonus). Les journées mardi x2 et les boosts roue peuvent avoir ajouté plus ✨
            </div>
          </>
        )}
      </div>
    </div>
  );
}
