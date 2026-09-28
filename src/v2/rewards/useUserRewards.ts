// Hook qui récupère les récompenses actives (codes roue non utilisés non expirés)
// du user authentifié. Se recharge :
//   - quand le client change (connexion / déconnexion) → passer son id en paramètre
//   - quand l'écran qui l'utilise s'ouvre → paramètre `active`
//   - dès qu'un code est gagné à la roue → notifyRewardsChanged()
import { useCallback, useEffect, useState } from 'react';
import { getSupabase, getFreshSession } from '../../lib/supabase';

export interface UserReward {
  id: string;
  reward_code: string;
  reward_label: string;
  reward_type: 'discount_percent' | 'free_product' | 'xp_multiplier' | 'manual_pickup' | 'retry';
  reward_value: string | null;
  expires_at: string;
  spun_at: string;
}

const REWARDS_CHANGED_EVENT = 'labase:rewards-changed';

// À appeler après un gain à la roue : toutes les instances du hook se rechargent.
export function notifyRewardsChanged(): void {
  window.dispatchEvent(new Event(REWARDS_CHANGED_EVENT));
}

export function useUserRewards(userId?: string | null, active = true) {
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
      // Jeton rafraîchi si périmé (bypass getSession() qui hang iOS PWA)
      const token = (await getFreshSession())?.access_token;
      if (!token) {
        setRewards([]);
        return;
      }
      const resp = await fetch('/api/rewards/active', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) {
        // On garde la liste déjà connue plutôt que de la vider sur une erreur réseau
        setError(`HTTP ${resp.status}`);
        return;
      }
      const data = await resp.json();
      setRewards(data.rewards ?? []);
    } catch (err: any) {
      setError(err?.message ?? 'Erreur');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!active) return;
    if (userId === null) {
      setRewards([]); // déconnecté
      return;
    }
    fetchRewards();
  }, [fetchRewards, userId, active]);

  useEffect(() => {
    const onChanged = () => void fetchRewards();
    window.addEventListener(REWARDS_CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(REWARDS_CHANGED_EVENT, onChanged);
  }, [fetchRewards]);

  return { rewards, loading, error, refetch: fetchRewards };
}
