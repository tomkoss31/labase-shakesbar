// Gère l'abonnement / désabonnement aux push notifications
// POST   : enregistre un nouvel abonnement dans push_subscriptions
// DELETE : supprime un abonnement (logout / désactivation client)
import { createClient } from '@supabase/supabase-js';

interface SubscribeBody {
  endpoint?: string;
  p256dh?: string;
  auth?: string;
  userId?: string | null;
  userAgent?: string;
}

async function readBody(req: any): Promise<any> {
  if (typeof req.body === 'object' && req.body !== null) return req.body;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return {};
}

function getSupabaseAdmin() {
  const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export default async function handler(req: any, res: any) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase non configuré côté serveur' });
  }

  if (req.method === 'POST') {
    const body = (await readBody(req)) as SubscribeBody;
    const { endpoint, p256dh, auth, userId, userAgent } = body;

    if (!endpoint || !p256dh || !auth) {
      return res.status(400).json({ error: 'Champs requis : endpoint, p256dh, auth' });
    }

    // Upsert : si endpoint déjà connu, on update les keys (peut changer lors d'un refresh navigateur)
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert(
        {
          endpoint,
          p256dh_key: p256dh,
          auth_key: auth,
          user_id: userId ?? null,
          user_agent: userAgent ?? null,
          last_used_at: new Date().toISOString(),
        },
        { onConflict: 'endpoint' },
      );

    if (error) {
      console.error('[push/subscribe] upsert failed:', error.message);
      return res.status(500).json({ error: 'Échec enregistrement', details: error.message });
    }

    return res.status(200).json({ ok: true });
  }

  if (req.method === 'DELETE') {
    const body = (await readBody(req)) as SubscribeBody;
    const { endpoint } = body;
    if (!endpoint) return res.status(400).json({ error: 'endpoint requis' });

    const { error } = await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
    if (error) {
      console.error('[push/subscribe] delete failed:', error.message);
      return res.status(500).json({ error: 'Échec suppression' });
    }
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
