// Endpoint comptoir : change le status d'une order
// POST /api/orders/update-status
// Headers : Authorization: Bearer <ADMIN_PUSH_PASSWORD>
// Body : { orderId: string, status: 'preparing' | 'ready' | 'cancelled' }

const ALLOWED_STATUSES = ['paid', 'preparing', 'ready', 'cancelled', 'refunded'];

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

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const expectedPassword = process.env.ADMIN_PUSH_PASSWORD;
  if (!expectedPassword) {
    return res.status(500).json({ error: 'ADMIN_PUSH_PASSWORD non configuré' });
  }
  const authHeader = req.headers?.authorization ?? '';
  const provided = authHeader.replace(/^Bearer\s+/, '').trim();
  if (provided !== expectedPassword) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: 'Supabase non configuré' });
  }

  const body = await readBody(req);
  const orderId = typeof body?.orderId === 'string' ? body.orderId : null;
  const status = typeof body?.status === 'string' ? body.status : null;

  if (!orderId || !status || !ALLOWED_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'orderId et status valides requis' });
  }

  const { createClient } = await import('@supabase/supabase-js');
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await admin
    .from('orders')
    .update({ status })
    .eq('id', orderId)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ ok: true, order: data });
}
