// Hook panier — état + persistance localStorage + compteurs + mutations de base.
// Extrait de App.tsx pour alléger le god-component et centraliser la logique
// panier. NE contient AUCUN appel Square : les handlers de paiement restent
// dans App.tsx et lisent simplement `cart`.
import { useState, useEffect, useMemo } from 'react';

export type CartItem = {
  key: string;
  name: string;
  categoryName: string;
  quantity: number;
  option: string;
  unitPriceCents: number;
  extras?: string[];
};

// Persistance : survit au reload de l'auth (inscription depuis le panier)
const CART_STORAGE_KEY = 'labase-cart-v1';

function loadStoredCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>(loadStoredCart);

  // Sauvegarde à chaque changement
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      /* quota / mode privé : pas bloquant */
    }
  }, [cart]);

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart],
  );

  const cartTotalCents = useMemo(
    () => cart.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0),
    [cart],
  );

  function updateQuantity(key: string, delta: number) {
    setCart((prev) =>
      prev
        .map((item) =>
          item.key === key
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  function clearCart() {
    setCart([]);
  }

  return { cart, setCart, cartCount, cartTotalCents, updateQuantity, clearCart };
}
