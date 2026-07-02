// Carte "Recommander" (Order Again) — re-remplit le panier avec la dernière
// commande en 1 tap. Levier de fréquence #1 (cf. recherche UX Baymard).
import React, { useEffect, useState } from 'react';
import type { Palette } from './palette';
import type { CartItem } from './cart/useCart';
import { getStoredSession } from '../lib/supabase';
import { OrderHistoryModal } from './orders/OrderHistoryModal';

interface RawItem {
  product_name: string;
  option_label: string | null;
  category_name: string | null;
  quantity: number;
  unit_price_cents: number;
}

interface ReorderCardProps {
  palette: Palette;
  isAuthed: boolean;
  onReorder: (items: CartItem[]) => void;
}

// Reconstruit un CartItem depuis une ligne stockée. product_name contient déjà
// les suppléments sous la forme "Nom + extra1, extra2".
function rebuildItem(it: RawItem): CartItem {
  const sep = ' + ';
  let name = it.product_name || '';
  let extras: string[] = [];
  const idx = name.indexOf(sep);
  if (idx >= 0) {
    extras = name
      .slice(idx + sep.length)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    name = name.slice(0, idx).trim();
  }
  return {
    key: `${name}|${it.option_label || ''}|${extras.join(',')}`,
    name,
    categoryName: it.category_name || '',
    quantity: Number(it.quantity) || 1,
    option: it.option_label || '',
    unitPriceCents: Number(it.unit_price_cents) || 0,
    extras: extras.length ? extras : undefined,
  };
}

export function ReorderCard({ palette, isAuthed, onReorder }: ReorderCardProps) {
  const [items, setItems] = useState<CartItem[] | null>(null);
  const [histOpen, setHistOpen] = useState(false);

  useEffect(() => {
    if (!isAuthed) {
      setItems(null);
      return;
    }
    let cancelled = false;
    const session = getStoredSession();
    if (!session?.access_token) return;
    fetch('/api/orders?action=last-order', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d || !Array.isArray(d.items) || d.items.length === 0) return;
        setItems(d.items.map(rebuildItem));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isAuthed]);

  if (!items || items.length === 0) return null;

  const summary = items
    .map((i) => `${i.quantity > 1 ? i.quantity + '× ' : ''}${i.name}`)
    .join(' · ');
  const totalCents = items.reduce((s, i) => s + i.unitPriceCents * i.quantity, 0);
  const total = (totalCents / 100).toFixed(2).replace('.', ',');

  return (
    <div style={{ padding: '0 16px 12px', maxWidth: 1240, margin: '0 auto' }}>
      <button
        onClick={() => onReorder(items)}
        style={{
          width: '100%',
          textAlign: 'left',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 16px',
          borderRadius: 16,
          cursor: 'pointer',
          fontFamily: 'inherit',
          background: `linear-gradient(135deg, ${palette.card}, ${palette.cardHi})`,
          border: `1px solid ${palette.primary}66`,
          color: palette.text,
        }}
      >
        <div style={{ fontSize: 26, lineHeight: 1 }}>🔁</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 15 }}>
            Recommander ta dernière commande
          </div>
          <div
            style={{
              fontSize: 12,
              color: palette.textDim,
              marginTop: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {summary} · {total}€
          </div>
        </div>
        <div
          style={{
            flex: 'none',
            padding: '8px 14px',
            borderRadius: 999,
            background: palette.cta,
            color: palette.ctaText,
            fontFamily: 'Outfit, sans-serif',
            fontWeight: 900,
            fontSize: 12.5,
          }}
        >
          + Panier
        </div>
      </button>

      <button
        onClick={() => setHistOpen(true)}
        style={{
          display: 'block',
          margin: '8px auto 0',
          background: 'transparent',
          border: 'none',
          color: palette.textDim,
          fontSize: 12.5,
          fontWeight: 700,
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        🧾 Voir tout mon historique →
      </button>

      <OrderHistoryModal palette={palette} open={histOpen} onClose={() => setHistOpen(false)} />
    </div>
  );
}
