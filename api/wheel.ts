// Route consolidée roue
// POST ?action=spin         → roue hebdo (Bearer Supabase JWT)
// POST ?action=public-spin  → roue publique (sans login)

import { createHash } from 'node:crypto';

const WHEEL_SEGMENTS = [
  { id: 'discount-5',  label: '−5% sur ta prochaine commande', weight: 27, rewardType: 'discount_percent', rewardValue: '5' },
  { id: 'tente-encore', label: 'Tente encore la semaine prochaine', weight: 20, rewardType: 'retry', rewardValue: null },
  { id: 'discount-10', label: '−10% sur ta prochaine commande', weight: 15, rewardType: 'discount_percent', rewardValue: '10' },
  { id: 'xp-x2',       label: 'Boost XP ×2 pendant 24h', weight: 12, rewardType: 'xp_multiplier', rewardValue: '2' },
  { id: 'gaufre-offerte', label: 'Gaufre healthy offerte', weight: 8, rewardType: 'free_product', rewardValue: 'Gaufre healthy' },
  { id: 'smoothie-offert', label: '2ème smoothie offert (1 acheté = 1 offert)', weight: 8, rewardType: 'free_product', rewardValue: '2e smoothie offert' },
  { id: 'boost-drink', label: 'Boost : 2ème drink XL offert (1 acheté = 1 offert)', weight: 7, rewardType: 'free_product', rewardValue: '2e drink XL offert' },
  { id: 'goodies', label: 'Goodies au comptoir', weight: 3, rewardType: 'manual_pickup', rewardValue: 'goodies' },
];

const PUBLIC_SEGMENTS = [
  { id: 'public-discount-10', label: '−10% sur ta 1ère commande', weight: 28, rewardType: 'discount_percent', rewardValue: '10' },
  { id: 'public-discount-5', label: '−5% sur ta 1ère commande', weight: 28, rewardType: 'discount_percent', rewardValue: '5' },
  { id: 'public-gaufre', label: 'Gaufre healthy offerte (dès 5€)', weight: 10, rewardType: 'free_product', rewardValue: 'Gaufre healthy' },
  { id: 'public-discount-15', label: '−15% gros gagnant !', weight: 12, rewardType: 'discount_percent', rewardValue: '15' },
  { id: 'public-smoothie', label: '2ème smoothie offert (1 acheté = 1 offert)', weight: 10, rewardType: 'free_product', rewardValue: '2e smoothie offert' },
  { id: 'public-boost', label: 'Boost : 2ème drink XL offert (1 acheté = 1 offert)', weight: 10, rewardType: 'free_product', rewardValue: '2e drink XL offert' },
  { id: 'public-goodies', label: 'Goodies La Base au comptoir', weight: 2, rewardType: 'manual_pickup', rewardValue: 'goodies' },
];

const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
const EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;

function pick<T extends { weight: number }>(segments: T[]): T {
  const total = segments.reduce((s, x) => s + x.weight, 0);
  const target = Math.random() * total;
  let acc = 0;
  for (const seg of segments) {
    acc += seg.weight;
    if (target <= acc) return seg;
  }
  return segments[segments.length - 1];
}

function generateCode(prefix: string): string {
  const r = () =>
    Math.random().toString(36).slice(2, 6).toUpperCase().replace(/[O0I1]/g, 'X');
  return `LB-${prefix}-${r()}-${r()}`;
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
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return {};
}

function getQuery(req: any, key: string): string | null {
  if (typeof req.query?.[key] === 'string') return req.query[key];
  const url = req.url || '';
  const qs = url.split('?')[1];
  if (!qs) return null;
  return new URLSearchParams(qs).get(key);
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const action = getQuery(req, 'action');
  if (!action) return res.status(400).json({ error: 'action requise' });

  const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return res.status(500).json({ error: 'Supabase non configuré' });

  const { createClient } = await import('@supabase/supabase-js');

  // ─── SPIN authentifié ─────────────────────────────────────────
  if (action === 'spin') {
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
    if (!anonKey) return res.status(500).json({ error: 'Anon key manquante' });

    const authHeader = req.headers?.authorization ?? '';
    const accessToken = authHeader.replace(/^Bearer\s+/, '').trim();
    if (!accessToken) return res.status(401).json({ error: 'Auth requise' });

    const publicClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userError } = await publicClient.auth.getUser(accessToken);
    if (userError || !userData.user) return res.status(401).json({ error: 'Token invalide' });

    const userId = userData.user.id;

    // Admin : tirages illimités (test des cadeaux). On ne contrôle pas le
    // cooldown et on ne marque pas last_spin_at pour ce compte.
    const adminEmails = String(process.env.VITE_ADMIN_EMAIL || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    const isAdmin = userData.user.email
      ? adminEmails.includes(userData.user.email.toLowerCase())
      : false;

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: profile } = await admin
      .from('profiles')
      .select('last_spin_at')
      .eq('id', userId)
      .maybeSingle();

    if (!isAdmin && profile?.last_spin_at) {
      const lastTs = new Date(profile.last_spin_at).getTime();
      const elapsed = Date.now() - lastTs;
      if (elapsed < COOLDOWN_MS) {
        const nextDate = new Date(lastTs + COOLDOWN_MS);
        return res.status(429).json({
          error: 'Cooldown actif',
          nextSpinAt: nextDate.toISOString(),
          daysRemaining: Math.ceil((COOLDOWN_MS - elapsed) / (24 * 60 * 60 * 1000)),
        });
      }
    }

    const segment = pick(WHEEL_SEGMENTS);
    const code = generateCode('SPIN');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + EXPIRY_MS);

    await admin.from('wheel_spins').insert({
      user_id: userId,
      reward_code: code,
      reward_label: segment.label,
      reward_type: segment.rewardType,
      reward_value: segment.rewardValue,
      expires_at: expiresAt.toISOString(),
      used_at: segment.rewardType === 'retry' ? now.toISOString() : null,
    });

    if (!isAdmin) {
      await admin.from('profiles').update({ last_spin_at: now.toISOString() }).eq('id', userId);
    }

    return res.status(200).json({
      ok: true,
      segment: { id: segment.id, label: segment.label, rewardType: segment.rewardType, rewardValue: segment.rewardValue },
      code: segment.rewardType === 'retry' ? null : code,
      expiresAt: segment.rewardType === 'retry' ? null : expiresAt.toISOString(),
    });
  }

  // ─── PUBLIC SPIN (sans login) ─────────────────────────────────
  if (action === 'public-spin') {
    const body = await readBody(req);
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : null;
    const firstName = typeof body?.firstName === 'string' ? body.firstName.trim().slice(0, 60) : null;
    const source = typeof body?.source === 'string' ? body.source.slice(0, 60) : 'public_wheel';
    if (!email || !isValidEmail(email)) return res.status(400).json({ error: 'Email invalide' });

    const xff = req.headers?.['x-forwarded-for'] ?? '';
    const ip = (typeof xff === 'string' ? xff.split(',')[0].trim() : '') || '0.0.0.0';
    const ipHash = hashIp(ip);

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: existingEmail } = await admin
      .from('public_spins')
      .select('id, reward_label, reward_code')
      .eq('email', email)
      .maybeSingle();

    if (existingEmail) {
      return res.status(429).json({
        error: 'Tu as déjà tenté ta chance',
        alreadyPlayed: true,
        reward: existingEmail.reward_label,
        code: existingEmail.reward_code,
      });
    }

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await admin
      .from('public_spins')
      .select('id', { count: 'exact', head: true })
      .eq('ip_hash', ipHash)
      .gt('spun_at', oneDayAgo);

    if ((count ?? 0) >= 3) {
      return res.status(429).json({ error: 'Trop de tentatives. Reviens demain.' });
    }

    const segment = pick(PUBLIC_SEGMENTS);
    const code = generateCode('WEB');
    const expiresAt = new Date(Date.now() + EXPIRY_MS).toISOString();

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
      if (insertError.message?.includes('public_spins_email_idx')) {
        return res.status(429).json({ error: 'Email déjà utilisé' });
      }
      return res.status(500).json({ error: insertError.message });
    }

    return res.status(200).json({
      ok: true,
      segment: { id: segment.id, label: segment.label, rewardType: segment.rewardType, rewardValue: segment.rewardValue },
      code,
      expiresAt,
    });
  }

  // ─── SIGNUP-CLAIM : créer le compte + lier le cadeau gagné ────────
  // Après la roue publique, le client crée son compte pour récupérer son
  // cadeau. On crée le user, on lie le public_spin à son compte (insertion
  // wheel_spins) et on renvoie une session pour le connecter direct.
  if (action === 'signup-claim') {
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
    if (!anonKey) return res.status(500).json({ error: 'Anon key manquante' });

    const body = await readBody(req);
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : null;
    const password = typeof body?.password === 'string' ? body.password : null;
    const refCode = typeof body?.ref === 'string' ? body.ref.trim().toUpperCase().slice(0, 12) : null;
    if (!email || !isValidEmail(email)) return res.status(400).json({ error: 'Email invalide' });
    if (!password || password.length < 6) return res.status(400).json({ error: 'Mot de passe trop court (6 min)' });

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 1. Le cadeau doit exister (la personne a joué)
    const { data: spin } = await admin
      .from('public_spins')
      .select('id, first_name, reward_code, reward_label, reward_type, reward_value, expires_at')
      .eq('email', email)
      .maybeSingle();
    if (!spin) {
      return res.status(400).json({ error: 'Aucun cadeau trouvé pour cet email. Joue d\'abord à la roue.' });
    }

    // 2. Créer le compte (email auto-confirmé → connexion immédiate possible)
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: spin.first_name ? { first_name: spin.first_name } : undefined,
    });
    if (createErr) {
      const msg = createErr.message || '';
      if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('exist')) {
        return res.status(409).json({ error: 'Un compte existe déjà avec cet email. Connecte-toi dans l\'app.' });
      }
      return res.status(500).json({ error: msg });
    }
    const userId = created.user?.id;

    // 3. Renseigner le prénom dans le profil (le trigger a créé la ligne)
    if (userId && spin.first_name) {
      await admin.from('profiles').update({ first_name: spin.first_name }).eq('id', userId);
    }

    // 3b. Parrainage : rattacher le filleul au parrain + bonus de bienvenue.
    //     Le parrain ne sera récompensé qu'à la 1ère commande payée du
    //     filleul (géré dans le webhook Square / mark-paid espèces).
    if (userId && refCode) {
      try {
        const { data: sponsor } = await admin
          .from('profiles')
          .select('id')
          .eq('referral_code', refCode)
          .maybeSingle();
        // On n'auto-parraine pas, et le parrain doit exister
        if (sponsor && sponsor.id && sponsor.id !== userId) {
          const { data: filleul } = await admin
            .from('profiles')
            .select('xp, referred_by')
            .eq('id', userId)
            .maybeSingle();
          if (filleul && !filleul.referred_by) {
            await admin
              .from('profiles')
              .update({
                referred_by: sponsor.id,
                xp: (filleul.xp ?? 0) + 200, // bonus de bienvenue filleul
              })
              .eq('id', userId);
          }
        }
      } catch (err: any) {
        console.warn('[signup-claim] referral link failed:', err?.message);
      }
    }

    // 4. Lier le cadeau au compte → apparaît dans "Mes récompenses" + scanner
    if (userId && spin.reward_type !== 'retry') {
      await admin.from('wheel_spins').insert({
        user_id: userId,
        reward_code: spin.reward_code,
        reward_label: spin.reward_label,
        reward_type: spin.reward_type,
        reward_value: spin.reward_value,
        expires_at: spin.expires_at,
        used_at: null,
      });
    }

    // 5. Ouvrir une session (login REST) pour connecter le client direct
    let session: any = null;
    try {
      const tokenResp = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: anonKey, Authorization: `Bearer ${anonKey}` },
        body: JSON.stringify({ email, password }),
      });
      if (tokenResp.ok) session = await tokenResp.json();
    } catch {
      // pas bloquant : le compte est créé, le client pourra se connecter
    }

    const projectRef = supabaseUrl.replace(/^https?:\/\//, '').split('.')[0];
    return res.status(200).json({
      ok: true,
      reward: spin.reward_label,
      storageKey: `sb-${projectRef}-auth-token`,
      session: session
        ? {
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_in: session.expires_in,
            expires_at: session.expires_at,
            token_type: session.token_type,
            user: session.user,
          }
        : null,
    });
  }

  return res.status(400).json({ error: 'Action non reconnue' });
}
