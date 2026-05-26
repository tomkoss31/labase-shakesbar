// Hook qui récupère les récompenses actives (codes roue non utilisés non expirés)
// du user authentifié. Refetch quand le user change ou quand on demande explicitement.
import { useCallback, useEffect, useState } from 'react';
import { getSupabase } from '../../lib/supabase';

export interface UserReward {
  id: string;
  reward_code: string;
  reward_label: string;
  reward_type: 'discount_percent' | 'free_product' | 'xp_multiplier' | 'manual_pickup' | 'retry';
  reward_value: string | null;
  expires_at: string;
  spun_at: string;
}

export function useUserRewards() {
  const [rewards, setRewards] = useState<UserReward[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRewards = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabase();
      if (!supabase) {
        setRewards([]);
        return;
      }
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setRewards([]);
        return;
      }
      const resp = await fetch('/api/rewards/active', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) {
        setError(`HTTP ${resp.status}`);
        setRewards([]);
        return;
      }
      const data = await resp.json();
      setRewards(data.rewards ?? []);
    } catch (err: any) {
      setError(err?.message ?? 'Erreur');
      setRewards([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRewards();
  }, [fetchRewards]);

  return { rewards, loading, error, refetch: fetchRewards };
}
