// Route consolidée profile (admin)
// GET  ?action=lookup&id=<uuid> → récupère un profil + rewards actifs
// POST ?action=credit-manual    → crédite XP après paiement caisse

// ⚠️ Helpers bienvenue INLINE. Un import relatif vers api/_lib/* échoue à
// l'exécution sur Vercel (ESM ERR_MODULE_NOT_FOUND : le sous-dossier n'est pas
// embarqué dans la fonction). On garde donc tout ici. NB : l'import dynamique
// d'un PACKAGE ('web-push') fonctionne, lui — seul le relatif local casse.

// Domaine VÉRIFIÉ dans Resend = labase360.fr (labase-nutrition.com ne l'est pas →
// Resend renvoyait 403). Surchargeable via RESEND_FROM si besoin.
const WELCOME_FROM = process.env.RESEND_FROM ?? 'La Base <bonjour@labase360.fr>';
const WELCOME_PUSH = {
  title: 'Bienvenue à La Base 💚',
  body: 'Ton club bien-être à Verdun. Gagne des XP à chaque visite et débloque des cadeaux 🎁',
};

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildWelcomeHtml(firstName?: string | null): string {
  const name = firstName && firstName.trim() ? escHtml(firstName.trim()) : '';
  const hi = name ? `Salut ${name} 👋` : 'Salut 👋';
  const BILAN = 'https://www.labase360.fr/bilan-online';
  const APP = 'https://commande.labase-nutrition.com';
  const OPP = 'https://www.labase360.fr/rejoindre?ref=656dcf35-4859-4a70-9d20-990104813423';
  const btn = (href: string, label: string, bg: string, color: string) =>
    `<a href="${href}" target="_blank" style="display:inline-block;width:100%;box-sizing:border-box;padding:15px 18px;background:${bg};color:${color};text-decoration:none;text-align:center;border-radius:14px;font-family:'Segoe UI',Arial,sans-serif;font-weight:800;font-size:16px;">${label}</a>`;
  const step = (num: string, title: string, txt: string) =>
    `<tr><td style="padding:8px 0;" valign="top"><table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr><td width="40" valign="top"><div style="width:32px;height:32px;border-radius:9px;background:rgba(245,158,11,.16);color:#f59e0b;font-weight:900;font-size:16px;text-align:center;line-height:32px;font-family:Arial,sans-serif;">${num}</div></td><td valign="top" style="padding-left:12px;font-family:'Segoe UI',Arial,sans-serif;color:#cbe4df;font-size:14px;line-height:1.5;"><b style="color:#ecfdf5;">${title}</b><br>${txt}</td></tr></table></td></tr>`;
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark light"></head>
<body style="margin:0;padding:0;background:#04100f;">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;color:#04100f;">Ton club bien-être à Verdun — et ton bilan est offert.</span>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#04100f;"><tr><td align="center" style="padding:24px 12px 40px;">
<table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;width:100%;">
<tr><td style="padding:8px 8px 18px;font-family:'Segoe UI',Arial,sans-serif;"><span style="font-weight:900;font-size:18px;color:#ecfdf5;letter-spacing:.02em;">LA BASE</span><span style="font-size:10px;color:#94b8b1;letter-spacing:.22em;font-weight:700;"> &nbsp;SHAKES &amp; DRINKS</span></td></tr>
<tr><td style="background:linear-gradient(160deg,#13302c,#0e1f1d);border:1px solid rgba(94,234,212,.18);border-radius:22px;padding:30px 26px;text-align:center;font-family:'Segoe UI',Arial,sans-serif;"><div style="font-size:56px;line-height:1;">💪</div><h1 style="margin:12px 0 6px;color:#ecfdf5;font-size:28px;font-weight:900;line-height:1.15;">Bienvenue dans<br>le club</h1><p style="margin:0;color:#b9d4ce;font-size:15px;line-height:1.55;">Bien plus qu’un shake bar : ton club bien-être à Verdun.</p></td></tr>
<tr><td style="padding:26px 8px 8px;font-family:'Segoe UI',Arial,sans-serif;color:#cbe4df;font-size:15px;line-height:1.6;"><p style="margin:0 0 12px;color:#ecfdf5;font-size:17px;font-weight:800;">${hi}</p><p style="margin:0;">Merci d’avoir rejoint <b style="color:#ecfdf5;">La Base</b>. Ici, on ne fait pas que des shakes &amp; smoothies : on t’accompagne pour te sentir mieux — <b style="color:#ecfdf5;">perdre du poids</b>, <b style="color:#ecfdf5;">retrouver ton énergie</b> et <b style="color:#ecfdf5;">booster tes performances</b>.</p></td></tr>
<tr><td style="padding:18px 8px 6px;"><table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:linear-gradient(180deg,rgba(19,48,44,.6),rgba(14,31,29,.6));border:1px solid rgba(94,234,212,.12);border-radius:18px;"><tr><td style="padding:20px;font-family:'Segoe UI',Arial,sans-serif;"><div style="display:inline-block;font-weight:800;font-size:11px;letter-spacing:.1em;color:#f59e0b;background:rgba(245,158,11,.12);padding:5px 11px;border-radius:999px;">★ DEPUIS 2022 · VERDUN ★</div><p style="margin:14px 0 0;color:#cbe4df;font-size:14px;line-height:1.6;">Ce qui a commencé comme un shake bar est devenu un vrai <b style="color:#ecfdf5;">club bien-être</b> : des centaines de personnes accompagnées, une note de <b style="color:#ecfdf5;">4,9/5 sur Google</b>, et une obsession — que tu repartes avec <b style="color:#ecfdf5;">plus d’énergie qu’en arrivant</b>.</p></td></tr></table></td></tr>
<tr><td style="padding:22px 8px 4px;font-family:'Segoe UI',Arial,sans-serif;color:#5eead4;font-size:12px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;">Comment on t’accompagne</td></tr>
<tr><td style="padding:4px 8px;"><table role="presentation" cellpadding="0" cellspacing="0" width="100%">${step('1', 'Ton bilan offert', 'On fait le point sur tes objectifs et ta composition corporelle.')}${step('2', 'Un programme sur-mesure', 'Nutrition, hydratation, habitudes : un plan adapté à TON quotidien.')}${step('3', 'Un suivi régulier', 'On mesure tes progrès et on ajuste avec toi, semaine après semaine.')}</table></td></tr>
<tr><td style="padding:18px 8px 4px;">${btn(BILAN, '💪 Faire mon bilan offert', 'linear-gradient(100deg,#f59e0b,#fbbf24)', '#1a0f00')}</td></tr>
<tr><td style="padding:8px 8px 0;text-align:center;font-family:'Segoe UI',Arial,sans-serif;color:#7fa99f;font-size:12px;">Gratuit · sans engagement · en ligne</td></tr>
<tr><td style="padding:26px 8px 6px;"><table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:linear-gradient(160deg,#13302c,#0e1f1d);border:1px solid rgba(94,234,212,.18);border-radius:18px;"><tr><td style="padding:20px;font-family:'Segoe UI',Arial,sans-serif;"><p style="margin:0 0 8px;color:#ecfdf5;font-size:16px;font-weight:900;">Ton appli, c’est Le Club 🎁</p><p style="margin:0 0 14px;color:#cbe4df;font-size:14px;line-height:1.6;">À chaque visite tu cumules des <b style="color:#ecfdf5;">XP</b> → cadeaux (boisson offerte, toppings…), <b style="color:#ecfdf5;">roue de la fortune</b> et défis bien-être. Plus tu viens, plus tu gagnes.</p>${btn(APP, 'Ouvrir mon appli', 'linear-gradient(100deg,#14b8a6,#5eead4)', '#02100e')}</td></tr></table></td></tr>
<tr><td style="padding:22px 8px 6px;font-family:'Segoe UI',Arial,sans-serif;color:#cbe4df;font-size:14px;line-height:1.6;"><p style="margin:0 0 6px;color:#ecfdf5;font-size:15px;font-weight:800;">🚀 Et si tu en faisais ton activité ?</p><p style="margin:0 0 12px;">Un complément de revenu ou un vrai projet ? On te forme et on t’épaule. <a href="${OPP}" target="_blank" style="color:#5eead4;font-weight:700;text-decoration:none;">Découvrir l’opportunité →</a></p></td></tr>
<tr><td style="padding:24px 8px 0;text-align:center;font-family:'Segoe UI',Arial,sans-serif;color:#7fa99f;font-size:12px;line-height:1.7;">📍 La Base · 11 rue Saint Pierre, 55100 Verdun<br>À très vite ! 💚</td></tr>
</table></td></tr></table></body></html>`;
}

async function sendWelcomeEmail(to: string, firstName?: string | null): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: 'RESEND_API_KEY manquant (Vercel env)' };
  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        from: WELCOME_FROM,
        to: [to],
        subject: '💪 Bienvenue à La Base — bien plus qu’un shake bar',
        html: buildWelcomeHtml(firstName),
      }),
    });
    if (!resp.ok) {
      const t = await resp.text().catch(() => '');
      return { ok: false, error: `Resend ${resp.status}: ${t.slice(0, 240)}` };
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Erreur envoi email' };
  }
}

async function sendWelcomePush(admin: any, userId: string): Promise<void> {
  // Boîte de réception (toujours)
  try {
    await admin.from('user_notifications').insert({
      user_id: userId,
      title: WELCOME_PUSH.title,
      body: WELCOME_PUSH.body,
      url: '/',
      emoji: '🎉',
      kind: 'targeted',
    });
  } catch { /* non bloquant */ }
  // Push web (best-effort)
  const vapidPublic = process.env.VITE_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT ?? 'mailto:tom@labase-nutrition.com';
  if (!vapidPublic || !vapidPrivate) return;
  try {
    const { data: subs } = await admin
      .from('push_subscriptions')
      .select('endpoint, p256dh_key, auth_key')
      .eq('user_id', userId);
    if (!subs || subs.length === 0) return;
    const webpushMod = await import('web-push');
    const webpush: any = (webpushMod as any).default ?? webpushMod;
    webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
    const payload = JSON.stringify({
      title: WELCOME_PUSH.title,
      body: WELCOME_PUSH.body,
      url: '/',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'labase-welcome',
    });
    await Promise.all(
      subs.map(async (s: any) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh_key, auth: s.auth_key } },
            payload,
          );
        } catch { /* abonnement mort, ignore */ }
      }),
    );
  } catch { /* non bloquant */ }
}

// Push « merci pour ta visite » après crédit caisse (récap + XP + avis Google).
// Copie locale (imports cross-fichier api/ cassent sur Vercel). Best-effort.
const GOOGLE_REVIEW_URL = 'https://g.page/r/CeJabN1yW1toEAE/review';
const REWARD_TIERS = [
  { cost: 150, label: 'un boost offert' },
  { cost: 300, label: 'un topping offert' },
  { cost: 1500, label: 'une boisson offerte' },
  { cost: 2200, label: 'une boisson + gaufre' },
  { cost: 3800, label: 'le cadeau du mois' },
];

async function notifyThanks(
  admin: any,
  orderId: string | null,
  userId: string,
  opts: { xpTotal: number; xpGained: number; firstName?: string | null },
): Promise<void> {
  if (!userId) return;
  let recap = '';
  if (orderId) {
    const { data: items } = await admin
      .from('order_items')
      .select('product_name, quantity')
      .eq('order_id', orderId);
    recap = (items ?? [])
      .map((it: any) => `${it.quantity > 1 ? it.quantity + '× ' : ''}${it.product_name}`)
      .join(', ');
  }
  const first = (opts.firstName || '').trim().split(' ')[0] || '';
  const next = REWARD_TIERS.find((t) => t.cost > opts.xpTotal);
  const xpLine = next
    ? `+${opts.xpGained} XP 🎉 Te voilà à ${opts.xpTotal} XP — plus que ${next.cost - opts.xpTotal} avant ${next.label} !`
    : `+${opts.xpGained} XP 🎉 Te voilà à ${opts.xpTotal} XP — tu peux tout débloquer 🎁`;
  const title = `💚 Merci${first ? ' ' + first : ''} pour ta visite !`;
  const body = `${recap ? 'Ta commande : ' + recap + '. ' : ''}${xpLine}  ⭐ Laisse-nous un avis, ça aide énormément le club !`;
  try {
    await admin.from('user_notifications').insert({
      user_id: userId, title, body, url: GOOGLE_REVIEW_URL, emoji: '💚', kind: 'order',
    });
  } catch { /* best-effort */ }
  const vapidPublic = process.env.VITE_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT ?? 'mailto:tom@labase-nutrition.com';
  if (!vapidPublic || !vapidPrivate) return;
  const { data: subs } = await admin
    .from('push_subscriptions')
    .select('endpoint, p256dh_key, auth_key')
    .eq('user_id', userId);
  if (!subs || subs.length === 0) return;
  const webpushMod = await import('web-push');
  const webpush: any = (webpushMod as any).default ?? webpushMod;
  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
  const payload = JSON.stringify({
    title, body, url: GOOGLE_REVIEW_URL, icon: '/icon-192.png', badge: '/icon-192.png', tag: 'labase-thanks',
  });
  const expired: string[] = [];
  await Promise.all((subs as any[]).map(async (sub: any) => {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh_key, auth: sub.auth_key } },
        payload,
      );
    } catch (err: any) {
      if (err?.statusCode === 404 || err?.statusCode === 410) expired.push(sub.endpoint);
    }
  }));
  if (expired.length > 0) await admin.from('push_subscriptions').delete().in('endpoint', expired);
}

const VIP_TIERS = [
  { id: 'starter', minSpentCents: 0 },
  { id: 'regulier', minSpentCents: 5000 },
  { id: 'vip', minSpentCents: 15000 },
  { id: 'elite', minSpentCents: 40000 },
  { id: 'legende', minSpentCents: 80000 },
];

function computeVipTier(totalSpentCents: number): string {
  let tier = 'starter';
  for (const t of VIP_TIERS) {
    if (totalSpentCents >= t.minSpentCents) tier = t.id;
  }
  return tier;
}

function computeMascotteLevel(xp: number): string {
  if (xp >= 1500) return 'pro';
  if (xp >= 500) return 'regulier';
  return 'apprenti';
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
  const action = getQuery(req, 'action');
  if (!action) return res.status(400).json({ error: 'action requise' });

  const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return res.status(500).json({ error: 'Supabase non configuré' });

  const { createClient } = await import('@supabase/supabase-js');
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // ════ ACTIONS PUBLIQUES (avant la barrière admin) ════

  // ─── GET ?action=get-settings (statut magasin, lu par l'app cliente) ───
  if (action === 'get-settings' && req.method === 'GET') {
    const { data } = await admin
      .from('store_settings')
      .select('override_mode, hours, theme')
      .eq('id', 1)
      .maybeSingle();
    return res.status(200).json({
      override_mode: data?.override_mode ?? 'auto',
      hours: data?.hours ?? null,
      theme: data?.theme ?? null,
    });
  }

  // ─── POST ?action=welcome (CLIENT, auth JWT) : bienvenue 1er login ───
  // Envoie l'email + la push de bienvenue UNE SEULE fois (flag welcome_sent).
  // Appelé par l'app à chaque SIGNED_IN → idempotent : ne fait rien si déjà envoyé.
  if (action === 'welcome' && req.method === 'POST') {
    const accessToken = (req.headers?.authorization ?? '').replace(/^Bearer\s+/, '').trim();
    if (!accessToken) return res.status(401).json({ error: 'Token manquant' });
    const { data: userData, error: userError } = await admin.auth.getUser(accessToken);
    if (userError || !userData?.user) return res.status(401).json({ error: 'Session invalide' });
    const uid = userData.user.id;

    const { data: prof } = await admin
      .from('profiles')
      .select('email, first_name, welcome_sent')
      .eq('id', uid)
      .maybeSingle();
    if (!prof) return res.status(404).json({ error: 'Profil introuvable' });
    if (prof.welcome_sent) return res.status(200).json({ ok: true, already: true });

    // Push + boîte de réception de bienvenue (best-effort, inline)
    await sendWelcomePush(admin, uid);

    // Email de bienvenue (best-effort, inline)
    const email = prof.email ?? userData.user.email ?? null;
    let emailResult: { ok: boolean; error?: string } = { ok: false, error: 'aucune adresse email' };
    if (email) emailResult = await sendWelcomeEmail(email, prof.first_name);

    // Log de diagnostic (visible dans les logs Vercel)
    console.log('[welcome]', JSON.stringify({ uid, email, emailSent: emailResult.ok, emailError: emailResult.error ?? null }));

    // On ne marque « accueilli » QUE si l'email est parti (ou s'il n'y a pas
    // d'adresse). Sinon on laisse welcome_sent=false → nouvel essai au prochain
    // login (évite de « brûler » le compte sur un échec temporaire de config).
    if (emailResult.ok || !email) {
      await admin
        .from('profiles')
        .update({ welcome_sent: true, welcome_sent_at: new Date().toISOString() })
        .eq('id', uid);
    }
    return res.status(200).json({
      ok: true,
      emailSent: emailResult.ok,
      emailError: emailResult.ok ? undefined : emailResult.error,
    });
  }

  // ─── GET ?action=referral-stats (CLIENT, auth JWT) ────────────
  // Renvoie le code de parrainage du client + nb de filleuls / validés.
  if (action === 'referral-stats' && req.method === 'GET') {
    const authHeader = req.headers?.authorization ?? '';
    const accessToken = authHeader.replace(/^Bearer\s+/, '').trim();
    if (!accessToken) return res.status(401).json({ error: 'Token manquant' });

    const { data: userData, error: userError } = await admin.auth.getUser(accessToken);
    if (userError || !userData?.user) return res.status(401).json({ error: 'Session invalide' });
    const uid = userData.user.id;

    const { data: me } = await admin
      .from('profiles')
      .select('referral_code')
      .eq('id', uid)
      .maybeSingle();

    const { count: filleuls } = await admin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('referred_by', uid);

    const { count: rewarded } = await admin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('referred_by', uid)
      .eq('referral_rewarded', true);

    return res.status(200).json({
      code: me?.referral_code ?? null,
      filleuls: filleuls ?? 0,
      rewarded: rewarded ?? 0,
    });
  }

  // ─── POST ?action=claim-referral (CLIENT, auth JWT) ───────────
  // Rattache le client connecté à un parrain via son code, APRÈS une
  // inscription in-app classique (modale auth) où le ?ref= n'est pas capté
  // par /jeu. Garde-fous : on ne rattache QUE si le client n'a pas déjà de
  // parrain ET n'a passé aucune commande (on ne peut être parrainé qu'avant
  // son 1er achat). Idempotent : ré-appeler après coup ne fait rien.
  if (action === 'claim-referral' && req.method === 'POST') {
    const authHeader = req.headers?.authorization ?? '';
    const accessToken = authHeader.replace(/^Bearer\s+/, '').trim();
    if (!accessToken) return res.status(401).json({ error: 'Token manquant' });

    const { data: userData, error: userError } = await admin.auth.getUser(accessToken);
    if (userError || !userData?.user) return res.status(401).json({ error: 'Session invalide' });
    const uid = userData.user.id;

    const body = await readBody(req);
    const rawCode = typeof body?.code === 'string' ? body.code.trim().toUpperCase().slice(0, 12) : '';
    if (!rawCode) return res.status(400).json({ error: 'code requis' });

    const { data: me } = await admin
      .from('profiles')
      .select('referred_by, total_orders, referral_code')
      .eq('id', uid)
      .maybeSingle();
    if (!me) return res.status(404).json({ error: 'Profil non trouvé' });

    // Déjà parrainé, ou a déjà commandé → on ne fait rien (pas une erreur).
    if (me.referred_by || me.total_orders > 0) {
      return res.status(200).json({ ok: true, linked: false, reason: 'not_eligible' });
    }
    // On ne peut pas se parrainer soi-même.
    if (me.referral_code && me.referral_code.toUpperCase() === rawCode) {
      return res.status(200).json({ ok: true, linked: false, reason: 'self' });
    }

    const { data: sponsor } = await admin
      .from('profiles')
      .select('id')
      .eq('referral_code', rawCode)
      .maybeSingle();
    if (!sponsor || sponsor.id === uid) {
      return res.status(200).json({ ok: true, linked: false, reason: 'unknown_code' });
    }

    // Rattachement + bonus de bienvenue filleul (+200 XP), cohérent avec
    // le flux /jeu (api/wheel.ts signup-claim).
    const { data: cur } = await admin.from('profiles').select('xp').eq('id', uid).maybeSingle();
    const { error: linkErr } = await admin
      .from('profiles')
      .update({ referred_by: sponsor.id, xp: (cur?.xp ?? 0) + 200 })
      .eq('id', uid)
      .is('referred_by', null); // anti-race : ne lie que si toujours non parrainé
    if (linkErr) return res.status(500).json({ error: linkErr.message });

    return res.status(200).json({ ok: true, linked: true, bonusXp: 200 });
  }

  // ════ BARRIÈRE ADMIN (mot de passe) pour toutes les actions suivantes ════
  const expectedPassword = process.env.ADMIN_PASSWORD || process.env.ADMIN_PUSH_PASSWORD;
  if (!expectedPassword) return res.status(500).json({ error: 'ADMIN_PASSWORD non configuré' });
  const adminAuthHeader = req.headers?.authorization ?? '';
  const adminProvided = adminAuthHeader.replace(/^Bearer\s+/, '').trim();
  if (adminProvided !== expectedPassword) return res.status(401).json({ error: 'Non autorisé' });

  // ─── POST ?action=set-settings (admin : pilote l'ouverture) ───
  if (action === 'set-settings' && req.method === 'POST') {
    const body = await readBody(req);
    const mode = typeof body?.override_mode === 'string' ? body.override_mode : null;
    if (!mode || !['auto', 'force_open', 'force_closed'].includes(mode)) {
      return res.status(400).json({ error: 'override_mode invalide' });
    }
    const { error } = await admin
      .from('store_settings')
      .update({ override_mode: mode, updated_at: new Date().toISOString() })
      .eq('id', 1);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true, override_mode: mode });
  }

  // ─── POST ?action=set-theme (admin : thème saisonnier programmé) ───
  // Body: { themeId: string|null, durationDays: number }
  // themeId null/'default' → retire le thème. Sinon stocke { id, endsAt }
  // (endsAt = maintenant + durationDays jours) → expiration automatique.
  if (action === 'set-theme' && req.method === 'POST') {
    const body = await readBody(req);
    const themeId = typeof body?.themeId === 'string' ? body.themeId.trim() : null;
    const durationDays = Number(body?.durationDays);

    let theme: { id: string; startsAt: string; endsAt: string } | null = null;
    if (themeId && themeId !== 'default') {
      const days = Number.isFinite(durationDays) && durationDays > 0 ? Math.min(durationDays, 365) : 3;
      const now = new Date();
      const endsAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      theme = { id: themeId, startsAt: now.toISOString(), endsAt: endsAt.toISOString() };
    }

    const { error } = await admin
      .from('store_settings')
      .update({ theme, updated_at: new Date().toISOString() })
      .eq('id', 1);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true, theme });
  }

  // ─── GET ?action=lookup&id=<uuid> ─────────────────────────────
  if (action === 'lookup' && req.method === 'GET') {
    const userId = getQuery(req, 'id');
    if (!userId) return res.status(400).json({ error: 'id requis' });

    const { data: profile, error } = await admin
      .from('profiles')
      .select('id, email, first_name, vip_tier, xp, level, total_orders, total_spent_cents')
      .eq('id', userId)
      .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });
    if (!profile) return res.status(404).json({ error: 'Profil non trouvé' });

    const nowIso = new Date().toISOString();
    const { data: rewards } = await admin
      .from('wheel_spins')
      .select('id, reward_code, reward_label, reward_type, reward_value, expires_at')
      .eq('user_id', userId)
      .is('used_at', null)
      .gt('expires_at', nowIso)
      .neq('reward_type', 'retry');

    return res.status(200).json({ profile, rewards: rewards ?? [] });
  }

  // ─── POST ?action=credit-manual ───────────────────────────────
  // Encaisse une vente Square caisse + crédit XP.
  // Optionnel : wheelSpinId → marque le code promo comme utilisé
  // ATOMIQUEMENT avec la vente (pas de marquage si l'encaissement plante).
  if (action === 'credit-manual' && req.method === 'POST') {
    const body = await readBody(req);
    const userId = typeof body?.userId === 'string' ? body.userId : null;
    const amountCents = Number(body?.amountCents);
    const paymentMethod = typeof body?.paymentMethod === 'string' ? body.paymentMethod : 'square_pos';
    const wheelSpinId = typeof body?.wheelSpinId === 'string' && body.wheelSpinId
      ? body.wheelSpinId
      : null;
    const note = typeof body?.note === 'string' ? body.note.trim().slice(0, 120) : '';

    if (!userId || !Number.isFinite(amountCents) || amountCents <= 0) {
      return res.status(400).json({ error: 'userId + amountCents > 0 requis' });
    }

    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('total_spent_cents, total_orders, xp, first_name, email, xp_multiplier_until, referred_by, referral_rewarded')
      .eq('id', userId)
      .single();
    if (profileError || !profile) return res.status(404).json({ error: 'Profil non trouvé' });

    // Si un code promo est passé : vérifier qu'il est valide (appartient au
    // client, non utilisé, non expiré) AVANT d'encaisser. Évite de marquer un
    // code utilisé qui ne l'était pas, et évite l'attaque "wheelSpinId d'un
    // autre client".
    let validatedSpin: { id: string; reward_code: string; reward_label: string } | null = null;
    if (wheelSpinId) {
      const nowIso = new Date().toISOString();
      const { data: spin } = await admin
        .from('wheel_spins')
        .select('id, reward_code, reward_label, used_at, expires_at, user_id')
        .eq('id', wheelSpinId)
        .maybeSingle();
      if (!spin) return res.status(400).json({ error: 'Code promo introuvable' });
      if (spin.user_id !== userId) return res.status(400).json({ error: 'Code promo ne correspond pas à ce client' });
      if (spin.used_at) return res.status(400).json({ error: 'Code déjà utilisé' });
      if (spin.expires_at && spin.expires_at <= nowIso) return res.status(400).json({ error: 'Code expiré' });
      validatedSpin = { id: spin.id, reward_code: spin.reward_code, reward_label: spin.reward_label };
    }

    const nowIso = new Date().toISOString();
    const { data: createdOrder } = await admin
      .from('orders')
      .insert({
        user_id: userId,
        status: 'paid',
        payment_method: paymentMethod,
        total_cents: amountCents,
        customer_name: profile.first_name || profile.email || null,
        paid_at: nowIso,
        created_at: nowIso,
      })
      .select('id')
      .maybeSingle();

    // Note libre du comptoir (« 2 smoothies + gaufre ») → on la stocke comme
    // un order_item unique, ce qui la fait apparaître dans le détail de la
    // commande (sinon « Détail non dispo »). Best-effort, ne casse pas la vente.
    if (note && createdOrder?.id) {
      try {
        await admin.from('order_items').insert({
          order_id: createdOrder.id,
          product_name: note,
          quantity: 1,
          unit_price_cents: amountCents,
        });
      } catch { /* non bloquant */ }
    }

    const isFirstOrder = profile.total_orders === 0;
    const isCombo = body?.combo === true;
    const eurosSpent = Math.floor(amountCents / 100);
    // Mardi Double XP (jour creux → ramène du monde). getUTCDay: 2 = mardi.
    // Le bar opère en journée → UTC = même jour qu'à Paris, fiable.
    const isTuesday = new Date().getUTCDay() === 2;
    // 🎁 Boost XP ×2 (roue) : actif tant que xp_multiplier_until > maintenant.
    const xpBoostActive = !!profile.xp_multiplier_until && new Date(profile.xp_multiplier_until).getTime() > Date.now();
    const xpFromEuros = eurosSpent * 10 * (isTuesday ? 2 : 1) * (xpBoostActive ? 2 : 1);
    const comboBonus = isCombo ? 25 : 0;
    const xpGained = xpFromEuros + 50 + comboBonus + (isFirstOrder ? 200 : 0);

    const newTotalSpent = profile.total_spent_cents + amountCents;
    const newTotalOrders = profile.total_orders + 1;
    const newXp = profile.xp + xpGained;

    await admin
      .from('profiles')
      .update({
        total_spent_cents: newTotalSpent,
        total_orders: newTotalOrders,
        xp: newXp,
        vip_tier: computeVipTier(newTotalSpent),
        level: computeMascotteLevel(newXp),
      })
      .eq('id', userId);

    // 💚 Push « merci pour ta visite » (récap + XP + avis) — best-effort
    try {
      await notifyThanks(admin, createdOrder?.id ?? null, userId, {
        xpTotal: newXp,
        xpGained,
        firstName: profile.first_name,
      });
    } catch (err: any) {
      console.warn('[credit-manual] thanks push failed:', err?.message);
    }

    // ─── Récompense parrainage à la 1ère commande payée au comptoir ───
    // Cohérent avec api/square-webhook.ts (CB) et api/orders.ts (espèces) :
    // une vente encaissée à la caisse compte aussi comme la 1ère commande du
    // filleul → le parrain gagne +500 XP. Bloc 100% gardé : toute erreur ici
    // ne doit JAMAIS perturber l'encaissement (déjà fait au-dessus).
    if (isFirstOrder && profile.referred_by && !profile.referral_rewarded) {
      try {
        const { data: sponsor } = await admin
          .from('profiles')
          .select('xp')
          .eq('id', profile.referred_by)
          .single();
        if (sponsor) {
          await admin
            .from('profiles')
            .update({ xp: (sponsor.xp ?? 0) + 500 })
            .eq('id', profile.referred_by);
          await admin
            .from('profiles')
            .update({ referral_rewarded: true })
            .eq('id', userId);
        }
      } catch (err: any) {
        console.warn('[credit-manual] referral reward failed:', err?.message);
      }
    }

    // Marquer le code promo comme utilisé MAINTENANT (après la vente OK).
    // Si ça plante ici, on log mais on ne casse pas la réponse — la vente
    // est passée, le code reste actif (le client peut le réutiliser une fois,
    // c'est moins grave qu'une vente refusée).
    let rewardUsed: { code: string; label: string } | null = null;
    if (validatedSpin) {
      const { error: markErr } = await admin
        .from('wheel_spins')
        .update({ used_at: nowIso, used_in_order_id: createdOrder?.id ?? null })
        .eq('id', validatedSpin.id)
        .is('used_at', null); // double-check anti race condition
      if (markErr) {
        console.warn('[credit-manual] mark-used failed:', markErr.message);
      } else {
        rewardUsed = { code: validatedSpin.reward_code, label: validatedSpin.reward_label };
      }
    }

    return res.status(200).json({ ok: true, xpGained, newTotalSpent, newXp, rewardUsed });
  }

  // ─── POST ?action=credit-xp-manual ────────────────────────────
  // Crédit XP direct sans vente (migration carte fidélité papier).
  // Ne touche PAS total_spent_cents / total_orders : c'est pas une vente.
  // Trace dans xp_manual_credits avec la raison libre saisie par l'admin.
  if (action === 'credit-xp-manual' && req.method === 'POST') {
    const body = await readBody(req);
    const userId = typeof body?.userId === 'string' ? body.userId : null;
    const xpAmount = Number(body?.xpAmount);
    const reason = typeof body?.reason === 'string' ? body.reason.trim().slice(0, 280) : '';

    if (!userId) return res.status(400).json({ error: 'userId requis' });
    if (!Number.isFinite(xpAmount) || xpAmount <= 0 || xpAmount > 100000) {
      return res.status(400).json({ error: 'XP invalide (1 à 100000)' });
    }
    if (!reason || reason.length < 3) {
      return res.status(400).json({ error: 'Raison requise (3 caractères min)' });
    }

    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('xp')
      .eq('id', userId)
      .single();
    if (profileError || !profile) return res.status(404).json({ error: 'Profil non trouvé' });

    const newXp = profile.xp + Math.floor(xpAmount);

    const { error: updateError } = await admin
      .from('profiles')
      .update({ xp: newXp, level: computeMascotteLevel(newXp) })
      .eq('id', userId);
    if (updateError) return res.status(500).json({ error: updateError.message });

    // Log la trace même si l'insert échoue (table absente sur prod p.ex.) :
    // l'XP a été crédité, on ne reverse pas pour un log raté.
    const { error: logError } = await admin.from('xp_manual_credits').insert({
      user_id: userId,
      xp_added: Math.floor(xpAmount),
      reason,
      source: 'console_admin',
    });
    if (logError) console.warn('[credit-xp-manual] log failed:', logError.message);

    return res.status(200).json({ ok: true, xpAdded: Math.floor(xpAmount), newXp });
  }

  // ─── POST ?action=redeem-reward (admin déduit XP pour offrir un cadeau) ───
  // Catalogue serveur = source de vérité du coût (empêche un client de
  // tricher en envoyant un coût faux). Garder synchro avec
  // src/v2/rewards/catalog.ts côté front.
  if (action === 'redeem-reward' && req.method === 'POST') {
    const REWARDS: Record<string, { cost: number; label: string }> = {
      boost: { cost: 150, label: 'Sirop / boost offert' },
      topping: { cost: 300, label: 'Topping offert' },
      boisson: { cost: 1500, label: 'Une boisson au choix' },
      'combo-gaufre': { cost: 2200, label: 'Boisson + gaufre healthy' },
      'cadeau-mois': { cost: 3800, label: 'Cadeau du mois' },
    };

    const body = await readBody(req);
    const userId = typeof body?.userId === 'string' ? body.userId : null;
    const rewardId = typeof body?.rewardId === 'string' ? body.rewardId : null;
    if (!userId || !rewardId) return res.status(400).json({ error: 'userId + rewardId requis' });

    const reward = REWARDS[rewardId];
    if (!reward) return res.status(400).json({ error: 'Cadeau inconnu' });

    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('xp')
      .eq('id', userId)
      .single();
    if (profileError || !profile) return res.status(404).json({ error: 'Profil non trouvé' });

    if (profile.xp < reward.cost) {
      return res.status(400).json({ error: `XP insuffisants (${profile.xp}/${reward.cost})` });
    }

    const newXp = profile.xp - reward.cost;
    const { error: updateError } = await admin
      .from('profiles')
      .update({ xp: newXp, level: computeMascotteLevel(newXp) })
      .eq('id', userId);
    if (updateError) return res.status(500).json({ error: updateError.message });

    // Journalise le cadeau offert (suivi stock, séparé du CA Square)
    const source = typeof body?.source === 'string' ? body.source : 'comptoir';
    await admin.from('reward_redemptions').insert({
      user_id: userId,
      reward_id: rewardId,
      reward_label: reward.label,
      xp_cost: reward.cost,
      source,
    });

    return res.status(200).json({ ok: true, rewardLabel: reward.label, cost: reward.cost, newXp });
  }

  // ─── GET ?action=redemptions-summary (récap cadeaux offerts pour la console) ───
  if (action === 'redemptions-summary' && req.method === 'GET') {
    // Bornes : début du jour et début du mois (UTC, suffisant pour un récap)
    const now = new Date();
    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();

    const { data: rows, error } = await admin
      .from('reward_redemptions')
      .select('reward_id, reward_label, xp_cost, created_at')
      .gte('created_at', startOfMonth)
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });

    const all = rows ?? [];
    const today = all.filter((r) => r.created_at >= startOfDay);

    function tally(list: typeof all) {
      const byType: Record<string, { label: string; count: number; xp: number }> = {};
      let totalXp = 0;
      for (const r of list) {
        if (!byType[r.reward_id]) byType[r.reward_id] = { label: r.reward_label, count: 0, xp: 0 };
        byType[r.reward_id].count += 1;
        byType[r.reward_id].xp += r.xp_cost;
        totalXp += r.xp_cost;
      }
      return { total: list.length, totalXp, byType: Object.values(byType) };
    }

    // ─── Cadeaux roue RÉELLEMENT donnés au comptoir (used_at) ───
    // Suivi stock à part : ces cadeaux ne passent pas par les XP, ils sont
    // gagnés à la roue puis remis au comptoir (used_at horodate la remise).
    const { data: wheelRows } = await admin
      .from('wheel_spins')
      .select('reward_label, reward_type, used_at')
      .gte('used_at', startOfMonth)
      .in('reward_type', ['free_product', 'manual_pickup'])
      .order('used_at', { ascending: false });

    const wheelAll = (wheelRows ?? []) as { reward_label: string; used_at: string }[];
    const wheelToday = wheelAll.filter((r) => r.used_at >= startOfDay);

    function wheelTally(list: typeof wheelAll) {
      const byType: Record<string, { label: string; count: number }> = {};
      for (const r of list) {
        if (!byType[r.reward_label]) byType[r.reward_label] = { label: r.reward_label, count: 0 };
        byType[r.reward_label].count += 1;
      }
      return { total: list.length, byType: Object.values(byType) };
    }

    return res.status(200).json({
      today: tally(today),
      month: tally(all),
      wheel: { today: wheelTally(wheelToday), month: wheelTally(wheelAll) },
    });
  }

  // ─── GET ?action=stats (dashboard admin : compteurs business) ───
  if (action === 'stats' && req.method === 'GET') {
    const countOf = async (table: string, filter?: (q: any) => any) => {
      let q = admin.from(table).select('id', { count: 'exact', head: true });
      if (filter) q = filter(q);
      const { count } = await q;
      return count ?? 0;
    };

    const [members, publicPlayers, wheelSpins, pushSubs, redemptions, paidOrders] =
      await Promise.all([
        countOf('profiles'),
        countOf('public_spins'),
        countOf('wheel_spins'),
        countOf('push_subscriptions'),
        countOf('reward_redemptions'),
        countOf('orders', (q) => q.eq('status', 'paid')),
      ]);

    // CA encaissé (somme des commandes payées) — fetch léger
    const { data: paidRows } = await admin
      .from('orders')
      .select('total_cents')
      .eq('status', 'paid');
    const revenueCents = (paidRows ?? []).reduce((s: number, r: any) => s + (r.total_cents || 0), 0);

    // Nouveaux membres aujourd'hui
    const now = new Date();
    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
    const newToday = await countOf('profiles', (q) => q.gte('created_at', startOfDay));

    // Parrainage : filleuls rattachés + parrainages validés (1ère commande)
    const [referredTotal, referredRewarded] = await Promise.all([
      countOf('profiles', (q) => q.not('referred_by', 'is', null)),
      countOf('profiles', (q) => q.eq('referral_rewarded', true)),
    ]);

    return res.status(200).json({
      members,
      newToday,
      publicPlayers,
      wheelSpins,
      pushSubs,
      redemptions,
      paidOrders,
      revenueCents,
      referredTotal,
      referredRewarded,
    });
  }

  return res.status(400).json({ error: 'Action non reconnue' });
}
