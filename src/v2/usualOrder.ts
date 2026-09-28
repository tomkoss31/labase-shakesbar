// « Ta commande habituelle » : le produit que le client a commandé le plus
// souvent dans l'appli (au moins 2 fois), avec son format et ses extras, pour
// le recommander en un geste. Source : /api/orders?action=history (articles des
// commandes espèces / carte). Les passages scannés au comptoir n'ont qu'une note
// libre → ignorés. Gardé sur le téléphone (affichage immédiat, hors-ligne).
import { useEffect, useState } from 'react';
import { getFreshSession } from '../lib/supabase';
import { ALL_V2_PRODUCTS, type V2Product } from './products-adapter';

export interface UsualOrder {
  product: V2Product;
  option: string;
  extras: string[];
  count: number;
}

interface HistoryItem {
  product_name?: string | null;
  option_label?: string | null;
  quantity?: number | null;
}

const CACHE_KEY = 'labase-usual-order-v1';
const MIN_COUNT = 2;

export function computeUsualOrder(orders: Array<{ status?: string; items?: HistoryItem[] }>): UsualOrder | null {
  const tally = new Map<string, { name: string; option: string; extras: string[]; count: number }>();
  for (const order of orders) {
    if (order.status === 'cancelled') continue;
    for (const it of order.items ?? []) {
      const full = (it.product_name ?? '').trim();
      if (!full) continue;
      // « Bali + Créatine, Collagène » → nom « Bali », extras [Créatine, Collagène]
      const [name, extrasPart] = full.split(' + ');
      const extras = extrasPart ? extrasPart.split(',').map((e) => e.trim()).filter(Boolean).sort() : [];
      const option = (it.option_label ?? '').trim();
      const key = `${name}|${option}|${extras.join(',')}`;
      const row = tally.get(key) ?? { name, option, extras, count: 0 };
      row.count += Math.max(1, Number(it.quantity) || 1);
      tally.set(key, row);
    }
  }
  let best: UsualOrder | null = null;
  for (const row of tally.values()) {
    const product = ALL_V2_PRODUCTS.find((p) => p.name === row.name);
    if (!product) continue; // combo, note du comptoir, produit retiré de la carte
    if (row.option && !product.raw.options?.some((o) => o.label === row.option)) continue;
    if (row.count >= MIN_COUNT && (!best || row.count > best.count)) {
      best = { product, option: row.option, extras: row.extras, count: row.count };
    }
  }
  return best;
}

type Cached = { userId: string; name: string; option: string; extras: string[]; count: number } | null;

function readCache(userId: string): UsualOrder | null {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null') as Cached;
    if (!c || c.userId !== userId) return null;
    const product = ALL_V2_PRODUCTS.find((p) => p.name === c.name);
    return product ? { product, option: c.option, extras: c.extras, count: c.count } : null;
  } catch {
    return null;
  }
}

export function useUsualOrder(userId?: string | null): UsualOrder | null {
  const [usual, setUsual] = useState<UsualOrder | null>(() => (userId ? readCache(userId) : null));
  useEffect(() => {
    if (!userId) {
      setUsual(null);
      return;
    }
    setUsual(readCache(userId));
    let cancelled = false;
    (async () => {
      try {
        const token = (await getFreshSession())?.access_token;
        if (!token) return;
        const resp = await fetch('/api/orders?action=history', { headers: { Authorization: `Bearer ${token}` } });
        if (!resp.ok) return;
        const data = await resp.json();
        const result = computeUsualOrder(Array.isArray(data?.orders) ? data.orders : []);
        if (cancelled) return;
        setUsual(result);
        try {
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify(
              result
                ? { userId, name: result.product.name, option: result.option, extras: result.extras, count: result.count }
                : null,
            ),
          );
        } catch {
          /* ignore */
        }
      } catch {
        /* hors-ligne : on garde la version en cache */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);
  return usual;
}
