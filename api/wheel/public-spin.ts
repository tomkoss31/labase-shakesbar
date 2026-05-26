// Roue concours publique — accessible sans login depuis /jeu.html
// POST /api/wheel/public-spin
// Body : { email, firstName?, source? }
//
// Vérifie :
// - Email valide
// - Pas de spin déjà fait avec cet email (LOWER unique)
// - Pas plus de 3 spins pour cette IP dans les 24h (anti-bot léger)
// Tire un segment côté serveur, génère code, stocke dans public_spins.

import { createHash } from 'node:crypto';

// Segments roue publique — différents de la roue authentifiée
// Plus généreux pour attirer + collecter des emails
const PUBLIC_SEGMENTS = [
  {
    id: 'public-discount-10',
    label: '−10% sur ta 1ère commande',
    weight: 40,
    rewardType: 'discount_percent',
    rewardValue: '10',
  },
  {
    id: 'public-gaufre',
    label: 'Gaufre healthy offerte (dès 12€)',
    weight: 22,
    rewardType: 'free_product',
    rewardValue: 'Gaufre healthy',
  },
  {
    id: 'public-discount-15',
    label: '−15% gros gagnant !',
    weight: 8,
    rewardType: 'discount_percent',
    rewardValue: '15',
  },
  {
    id: 'public-smoothie',
    label: 'Smoothie offert (dès 15€)',
    weight: 5,
    rewardType: 'free_product',
    rewardValue: 'Smoothie au choix',
  },
  {
    id: 'public-discount-5',
    label: '−5% sur ta 1ère commande',
    weight: 22,
    rewardType: 'discount_percent',
    rewardValue: '5',
  },
  {
    id: 'public-goodies',
    label: 'Goodies La Base au comptoir',
    weight: 3,
    rewardType: 'manual_pickup',
    rewardValue: 'goodies',
  },
];

function pickPublicSegment() {
  const total = PUBLIC_SEGMENTS.reduce((s, x) => s + x.weight, 0);
  const target = Math.random() * total;
  let acc = 0;
  for (const seg of PUBLIC_SEGMENTS) {
    acc += seg.weight;
    if (target <= acc) return seg;
  }
  return PUBLIC_SEGMENTS[0];
}

function generatePublicCode(): string {
  const r = () =>
    Math.random().toString(36).slice(2, 6).toUpperCase().replace(/[O0I1]/g, 'X');
  return `LB-WEB-${r()}-${r()}`;
}

function hashIp(ip: string): string {
  return createHash('sha256').update(ip + (process.env.IP_SALT ?? 'labase')).digest('hex').slice(0, 32);
}

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
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

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: 'Supabase non configuré' });
  }

  const body = await readBody(req);
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : null;
  const firstName = typeof body?.firstName === 'string' ? body.firstName.trim().slice(0, 60) : null;
  const source = typeof body?.source === 'string' ? body.source.slice(0, 60) : 'public_wheel';

  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ error: 'Email invalide' });
  }

  // IP pour anti-bot (anonymisée via hash)
  const xff = req.headers?.['x-forwarded-for'] ?? '';
  const ip = (typeof xff === 'string' ? xff.split(',')[0].trim() : '') || '0.0.0.0';
  const ipHash = hashIp(ip);

  const { createClient } = await import('@supabase/supabase-js');
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Anti-abus 1 : email déjà joué ?
  const { data: existingEmail } = await admin
    .from('public_spins')
    .select('id, reward_label, reward_code')
    .eq('email', email)
    .maybeSingle();

  if (existingEmail) {
    return res.status(429).json({
      error: 'Tu as déjà tenté ta chance avec cet email',
      alreadyPlayed: true,
      reward: existingEmail.reward_label,
      code: existingEmail.reward_code,
    });
  }

  // Anti-abus 2 : > 3 spins depuis cette IP en 24h
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await admin
    .from('public_spins')
    .select('id', { count: 'exact', head: true })
    .eq('ip_hash', ipHash)
    .gt('spun_at', oneDayAgo);

  if ((count ?? 0) >= 3) {
    return res.status(429).json({ error: 'Trop de tentatives depuis cette connexion. Reviens demain.' });
  }

  // Tirage côté serveur
  const segment = pickPublicSegment();
  const code = generatePublicCode();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const { error: insertError } = await admin.from('public_spins').insert({
    email,
    first_name: firstName,
    ip_hash: ipHash,
    reward_code: code,
    reward_label: segment.label,
    reward_type: segment.rewardType,
    reward_value: segment.rewardValue,
    expires_at: expiresAt,
    source,
  });

  if (insertError) {
    // Si erreur unique constraint, c'est qu'on a un duplicate email (race condition)
    if (insertError.message?.includes('public_spins_email_idx')) {
      return res.status(429).json({ error: 'Email déjà utilisé' });
    }
    return res.status(500).json({ error: 'Échec enregistrement', details: insertError.message });
  }

  return res.status(200).json({
    ok: true,
    segment: {
      id: segment.id,
      label: segment.label,
      rewardType: segment.rewardType,
      rewardValue: segment.rewardValue,
    },
    code,
    expiresAt,
  });
}
