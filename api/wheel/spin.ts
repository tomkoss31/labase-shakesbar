// API roue cadeau hebdomadaire — POST /api/wheel/spin
// Vérifie l'auth (Bearer token Supabase), vérifie le cooldown 7j côté DB,
// tire un segment côté serveur (anti-cheat), enregistre dans wheel_spins.
//
// IMPORTANT : @supabase/supabase-js chargé via dynamic import pour éviter
// le piège FUNCTION_INVOCATION_FAILED (ESM/CJS Vercel).

// ─── Catalogue des segments (DOIT correspondre à src/v2/wheel/segments.ts) ─
const WHEEL_SEGMENTS = [
  { id: 'discount-5', label: '−5% sur ta prochaine commande', weight: 28, rewardType: 'discount_percent', rewardValue: '5' },
  { id: 'tente-encore', label: 'Tente encore la semaine prochaine', weight: 24, rewardType: 'retry', rewardValue: null },
  { id: 'discount-10', label: '−10% sur ta prochaine commande', weight: 15, rewardType: 'discount_percent', rewardValue: '10' },
  { id: 'xp-x2', label: 'Boost XP ×2 pendant 24h', weight: 14, rewardType: 'xp_multiplier', rewardValue: '2' },
  { id: 'gaufre-offerte', label: 'Gaufre healthy offerte', weight: 10, rewardType: 'free_product', rewardValue: 'Gaufre healthy' },
  { id: 'smoothie-offert', label: 'Smoothie offert', weight: 6, rewardType: 'free_product', rewardValue: 'Smoothie au choix' },
  { id: 'goodies', label: 'Goodies au comptoir', weight: 3, rewardType: 'manual_pickup', rewardValue: 'goodies' },
];

const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
const EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;

function pickSegment(): typeof WHEEL_SEGMENTS[number] {
  const total = WHEEL_SEGMENTS.reduce((s, x) => s + x.weight, 0);
  const target = Math.random() * total;
  let acc = 0;
  for (const seg of WHEEL_SEGMENTS) {
    acc += seg.weight;
    if (target <= acc) return seg;
  }
  return WHEEL_SEGMENTS[WHEEL_SEGMENTS.length - 1];
}

function generateRewardCode(): string {
  const r = () =>
    Math.random().toString(36).slice(2, 6).toUpperCase().replace(/[O0I1]/g, 'X');
  return `LB-${r()}-${r()}`;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !serviceKey || !anonKey) {
    return res.status(500).json({ error: 'Supabase non configuré' });
  }

  // 1. Vérification de l'auth via le Bearer token JWT du client
  const authHeader = req.headers?.authorization ?? '';
  const accessToken = authHeader.replace(/^Bearer\s+/, '').trim();
  if (!accessToken) {
    return res.status(401).json({ error: 'Authentification requise' });
  }

  const { createClient } = await import('@supabase/supabase-js');

  // Client public pour vérifier le JWT
  const publicClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await publicClient.auth.getUser(accessToken);
  if (userError || !userData.user) {
    return res.status(401).json({ error: 'Token invalide' });
  }
  const userId = userData.user.id;

  // Client admin (service role) pour les écritures côté serveur
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 2. Vérifier le cooldown — récupère last_spin_at du profil
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('last_spin_at')
    .eq('id', userId)
    .maybeSingle();

  if (profileError) {
    return res.status(500).json({ error: 'Erreur profil', details: profileError.message });
  }

  if (profile?.last_spin_at) {
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

  // 3. Tirage côté serveur (anti-cheat)
  const segment = pickSegment();
  const code = generateRewardCode();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + EXPIRY_MS);

  // 4. Persistance dans wheel_spins (sauf si segment "retry" : on enregistre
  // quand même pour tracer, mais sans code utilisable)
  const { error: insertError } = await admin.from('wheel_spins').insert({
    user_id: userId,
    reward_code: code,
    reward_label: segment.label,
    reward_type: segment.rewardType,
    reward_value: segment.rewardValue,
    expires_at: expiresAt.toISOString(),
    used_at: segment.rewardType === 'retry' ? now.toISOString() : null, // retry = "déjà consommé"
  });

  if (insertError) {
    return res.status(500).json({ error: 'Échec enregistrement', details: insertError.message });
  }

  // 5. Update last_spin_at du profil
  const { error: updateError } = await admin
    .from('profiles')
    .update({ last_spin_at: now.toISOString() })
    .eq('id', userId);

  if (updateError) {
    console.warn('[wheel/spin] last_spin_at update failed:', updateError.message);
  }

  return res.status(200).json({
    ok: true,
    segment: {
      id: segment.id,
      label: segment.label,
      rewardType: segment.rewardType,
      rewardValue: segment.rewardValue,
    },
    code: segment.rewardType === 'retry' ? null : code,
    expiresAt: segment.rewardType === 'retry' ? null : expiresAt.toISOString(),
  });
}
