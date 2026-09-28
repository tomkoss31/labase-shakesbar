// Hook pour gérer l'inscription aux push notifications web (PWA)
import { useCallback, useEffect, useState } from 'react';
import { getSupabase, getFreshSession } from '../../lib/supabase';

export type PushPermission = NotificationPermission | 'unsupported';

interface UsePushNotificationsState {
  permission: PushPermission;
  subscribed: boolean;
  loading: boolean;
  error: string | null;
}

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}

function isPushSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

// Envoie l'abonnement au serveur, avec le jeton de connexion s'il existe
// (le serveur en déduit le compte — jamais d'id client dans le corps).
async function sendSubscription(subscription: PushSubscription): Promise<Response> {
  const token = (await getFreshSession())?.access_token;
  const payload = subscription.toJSON();
  return fetch('/api/push?action=subscribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      endpoint: payload.endpoint,
      p256dh: payload.keys?.p256dh,
      auth: payload.keys?.auth,
      userAgent: navigator.userAgent,
    }),
  });
}

/**
 * Rattache au compte un appareil déjà abonné (cas fréquent : notifications
 * activées AVANT la connexion → abonnement anonyme qui ne recevait jamais les
 * messages personnels : anniversaire, merci après visite, relance…).
 * 1 fois par session et par compte.
 */
export async function linkPushSubscriptionToAccount(userId: string): Promise<void> {
  if (!isPushSupported() || Notification.permission !== 'granted') return;
  const flag = `labase_push_linked_${userId}`;
  try {
    if (sessionStorage.getItem(flag) === '1') return;
  } catch {
    /* ignore */
  }
  try {
    const reg = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.getSubscription();
    if (!subscription) return;
    const resp = await sendSubscription(subscription);
    if (resp.ok) sessionStorage.setItem(flag, '1');
  } catch {
    /* best-effort : on réessaiera à la prochaine session */
  }
}

export function usePushNotifications() {
  const [state, setState] = useState<UsePushNotificationsState>({
    permission: 'unsupported',
    subscribed: false,
    loading: true,
    error: null,
  });

  // État initial
  useEffect(() => {
    if (!isPushSupported()) {
      setState((s) => ({ ...s, permission: 'unsupported', loading: false }));
      return;
    }

    (async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const existing = await reg.pushManager.getSubscription();
        setState({
          permission: Notification.permission,
          subscribed: Boolean(existing),
          loading: false,
          error: null,
        });
      } catch (err: any) {
        setState({
          permission: Notification.permission,
          subscribed: false,
          loading: false,
          error: err?.message ?? 'Erreur init',
        });
      }
    })();
  }, []);

  // Activation : demande permission + souscrit + envoie au backend
  const enable = useCallback(async (): Promise<{ ok: boolean; error?: string }> => {
    if (!isPushSupported()) return { ok: false, error: 'Push non supporté sur ce navigateur' };
    if (!VAPID_PUBLIC_KEY) {
      return { ok: false, error: 'Clé VAPID publique manquante (variable VITE_VAPID_PUBLIC_KEY)' };
    }

    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      // 1. Demande permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState((s) => ({ ...s, permission, loading: false }));
        return { ok: false, error: 'Permission refusée' };
      }

      // 2. Souscrit au push manager
      const reg = await navigator.serviceWorker.ready;
      let subscription = await reg.pushManager.getSubscription();
      if (!subscription) {
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
        });
      }

      // 3. Envoie au backend (le serveur rattache au compte via le JWT vérifié)
      const response = await sendSubscription(subscription);

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setState((s) => ({ ...s, loading: false, error: data?.error ?? 'Erreur enregistrement' }));
        return { ok: false, error: data?.error ?? 'Erreur enregistrement' };
      }

      setState({
        permission: 'granted',
        subscribed: true,
        loading: false,
        error: null,
      });
      return { ok: true };
    } catch (err: any) {
      setState((s) => ({ ...s, loading: false, error: err?.message ?? 'Erreur' }));
      return { ok: false, error: err?.message ?? 'Erreur' };
    }
  }, []);

  // Désactivation
  const disable = useCallback(async (): Promise<{ ok: boolean }> => {
    if (!isPushSupported()) return { ok: false };
    setState((s) => ({ ...s, loading: true }));
    try {
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.getSubscription();
      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        // Notifie le backend pour cleanup
        try {
          await fetch('/api/push?action=subscribe', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint }),
          });
        } catch {
          // peu grave si ça plante, l'abonnement local est déjà supprimé
        }
      }
      setState({
        permission: Notification.permission,
        subscribed: false,
        loading: false,
        error: null,
      });
      return { ok: true };
    } catch (err: any) {
      setState((s) => ({ ...s, loading: false, error: err?.message ?? 'Erreur' }));
      return { ok: false };
    }
  }, []);

  return {
    ...state,
    supported: state.permission !== 'unsupported',
    enable,
    disable,
  };
}
