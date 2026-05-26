import { useCallback, useEffect, useState } from 'react';
import { getSupabase } from '../../lib/supabase';

export interface UserOrder {
  id: string;
  square_order_id: string | null;
  status: 'pending' | 'paid' | 'cancelled' | 'refunded';
  total_cents: number;
  customer_name: string | null;
  pickup_time: string | null;
  created_at: string;
  paid_at: string | null;
}

export function useUserOrders() {
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = getSupabase();
      if (!supabase) {
        setOrders([]);
        return;
      }
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setOrders([]);
        return;
      }
      const resp = await fetch('/api/orders?action=list', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) {
        setOrders([]);
        return;
      }
      const data = await resp.json();
      setOrders(data.orders ?? []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, loading, refetch: fetchOrders };
}
