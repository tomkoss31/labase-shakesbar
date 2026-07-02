// Helper EMAIL — envoi via l'API Resend (le domaine expéditeur est déjà vérifié
// dans Resend, cf. mails auth Supabase). Best-effort : renvoie {ok,error} sans
// jamais throw. Adresse d'envoi surchargeable via RESEND_FROM.

const DEFAULT_FROM = 'La Base <bonjour@labase-nutrition.com>';
const APP_URL = 'https://commande.labase-nutrition.com';
const BILAN_URL = 'https://www.labase360.fr/bilan-online';
const OPP_URL = 'https://www.labase360.fr/rejoindre?ref=656dcf35-4859-4a70-9d20-990104813423';

export interface EmailInput {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(input: EmailInput): Promise<{ ok: boolean; error?: string; id?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: 'RESEND_API_KEY manquant (à ajouter dans Vercel)' };
  const from = process.env.RESEND_FROM ?? DEFAULT_FROM;

  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ from, to: [input.to], subject: input.subject, html: input.html }),
    });
    if (!resp.ok) {
      const t = await resp.text().catch(() => '');
      return { ok: false, error: `Resend ${resp.status}: ${t.slice(0, 240)}` };
    }
    const data = await resp.json().catch(() => ({}));
    return { ok: true, id: data?.id };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Erreur envoi email' };
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── Template : email de BIENVENUE (1ʳᵉ inscription) ────────────────────
// Dark premium, inline styles (compatibilité clients mail), largeur 600px.
// Contenu inspiré de la page /club (qui sommes-nous, bilan, opportunité).
export function buildWelcomeEmail(firstName?: string | null): { subject: string; html: string } {
  const name = firstName && firstName.trim() ? escapeHtml(firstName.trim()) : '';
  const hi = name ? `Salut ${name} 👋` : 'Salut 👋';
  const subject = '💪 Bienvenue à La Base — bien plus qu’un shake bar';

  const btn = (href: string, label: string, bg: string, color: string) =>
    `<a href="${href}" target="_blank" style="display:inline-block;width:100%;box-sizing:border-box;padding:15px 18px;background:${bg};color:${color};text-decoration:none;text-align:center;border-radius:14px;font-family:'Segoe UI',Arial,sans-serif;font-weight:800;font-size:16px;">${label}</a>`;

  const step = (num: string, title: string, txt: string) =>
    `<tr>
      <td style="padding:8px 0;" valign="top">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr>
          <td width="40" valign="top">
            <div style="width:32px;height:32px;border-radius:9px;background:rgba(245,158,11,.16);color:#f59e0b;font-weight:900;font-size:16px;text-align:center;line-height:32px;font-family:Arial,sans-serif;">${num}</div>
          </td>
          <td valign="top" style="padding-left:12px;font-family:'Segoe UI',Arial,sans-serif;color:#cbe4df;font-size:14px;line-height:1.5;">
            <b style="color:#ecfdf5;">${title}</b><br>${txt}
          </td>
        </tr></table>
      </td>
    </tr>`;

  const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark light"></head>
<body style="margin:0;padding:0;background:#04100f;">
  <span style="display:none;max-height:0;overflow:hidden;opacity:0;color:#04100f;">Ton club bien-être à Verdun — et ton bilan est offert.</span>
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#04100f;">
    <tr><td align="center" style="padding:24px 12px 40px;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="padding:8px 8px 18px;font-family:'Segoe UI',Arial,sans-serif;">
          <span style="font-weight:900;font-size:18px;color:#ecfdf5;letter-spacing:.02em;">LA BASE</span>
          <span style="font-size:10px;color:#94b8b1;letter-spacing:.22em;font-weight:700;"> &nbsp;SHAKES &amp; DRINKS</span>
        </td></tr>

        <!-- Hero -->
        <tr><td style="background:linear-gradient(160deg,#13302c,#0e1f1d);border:1px solid rgba(94,234,212,.18);border-radius:22px;padding:30px 26px;text-align:center;font-family:'Segoe UI',Arial,sans-serif;">
          <div style="font-size:56px;line-height:1;">💪</div>
          <h1 style="margin:12px 0 6px;color:#ecfdf5;font-size:28px;font-weight:900;line-height:1.15;">Bienvenue dans<br>le club</h1>
          <p style="margin:0;color:#b9d4ce;font-size:15px;line-height:1.55;">Bien plus qu’un shake bar : ton club bien-être à Verdun.</p>
        </td></tr>

        <!-- Intro -->
        <tr><td style="padding:26px 8px 8px;font-family:'Segoe UI',Arial,sans-serif;color:#cbe4df;font-size:15px;line-height:1.6;">
          <p style="margin:0 0 12px;color:#ecfdf5;font-size:17px;font-weight:800;">${hi}</p>
          <p style="margin:0;">Merci d’avoir rejoint <b style="color:#ecfdf5;">La Base</b>. Ici, on ne fait pas que des shakes &amp; smoothies : on t’accompagne pour te sentir mieux — <b style="color:#ecfdf5;">perdre du poids</b>, <b style="color:#ecfdf5;">retrouver ton énergie</b> et <b style="color:#ecfdf5;">booster tes performances</b>.</p>
        </td></tr>

        <!-- Qui on est -->
        <tr><td style="padding:18px 8px 6px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:linear-gradient(180deg,rgba(19,48,44,.6),rgba(14,31,29,.6));border:1px solid rgba(94,234,212,.12);border-radius:18px;">
            <tr><td style="padding:20px;font-family:'Segoe UI',Arial,sans-serif;">
              <div style="display:inline-block;font-weight:800;font-size:11px;letter-spacing:.1em;color:#f59e0b;background:rgba(245,158,11,.12);padding:5px 11px;border-radius:999px;">★ DEPUIS 2022 · VERDUN ★</div>
              <p style="margin:14px 0 0;color:#cbe4df;font-size:14px;line-height:1.6;">Ce qui a commencé comme un shake bar est devenu un vrai <b style="color:#ecfdf5;">club bien-être</b> : des centaines de personnes accompagnées, une note de <b style="color:#ecfdf5;">4,9/5 sur Google</b>, et une obsession — que tu repartes avec <b style="color:#ecfdf5;">plus d’énergie qu’en arrivant</b>. Avec écoute, sans jugement, et dans la bonne humeur.</p>
            </td></tr>
          </table>
        </td></tr>

        <!-- Comment on t'accompagne -->
        <tr><td style="padding:22px 8px 4px;font-family:'Segoe UI',Arial,sans-serif;color:#5eead4;font-size:12px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;">Comment on t’accompagne</td></tr>
        <tr><td style="padding:4px 8px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
            ${step('1', 'Ton bilan offert', 'On fait le point sur tes objectifs et ta composition corporelle.')}
            ${step('2', 'Un programme sur-mesure', 'Nutrition, hydratation, habitudes : un plan adapté à TON quotidien.')}
            ${step('3', 'Un suivi régulier', 'On mesure tes progrès et on ajuste avec toi, semaine après semaine.')}
          </table>
        </td></tr>

        <!-- CTA bilan -->
        <tr><td style="padding:18px 8px 4px;">${btn(BILAN_URL, '💪 Faire mon bilan offert', 'linear-gradient(100deg,#f59e0b,#fbbf24)', '#1a0f00')}</td></tr>
        <tr><td style="padding:8px 8px 0;text-align:center;font-family:'Segoe UI',Arial,sans-serif;color:#7fa99f;font-size:12px;">Gratuit · sans engagement · en ligne</td></tr>

        <!-- Le Club (app) -->
        <tr><td style="padding:26px 8px 6px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:linear-gradient(160deg,#13302c,#0e1f1d);border:1px solid rgba(94,234,212,.18);border-radius:18px;">
            <tr><td style="padding:20px;font-family:'Segoe UI',Arial,sans-serif;">
              <p style="margin:0 0 8px;color:#ecfdf5;font-size:16px;font-weight:900;">Ton appli, c’est Le Club 🎁</p>
              <p style="margin:0 0 14px;color:#cbe4df;font-size:14px;line-height:1.6;">À chaque visite tu cumules des <b style="color:#ecfdf5;">XP</b> → cadeaux (boisson offerte, toppings…), <b style="color:#ecfdf5;">roue de la fortune</b> et défis bien-être. Plus tu viens, plus tu gagnes.</p>
              ${btn(APP_URL, 'Ouvrir mon appli', 'linear-gradient(100deg,#14b8a6,#5eead4)', '#02100e')}
            </td></tr>
          </table>
        </td></tr>

        <!-- Opportunité -->
        <tr><td style="padding:22px 8px 6px;font-family:'Segoe UI',Arial,sans-serif;color:#cbe4df;font-size:14px;line-height:1.6;">
          <p style="margin:0 0 6px;color:#ecfdf5;font-size:15px;font-weight:800;">🚀 Et si tu en faisais ton activité ?</p>
          <p style="margin:0 0 12px;">Un complément de revenu ou un vrai projet ? On te forme et on t’épaule à chaque étape. <a href="${OPP_URL}" target="_blank" style="color:#5eead4;font-weight:700;text-decoration:none;">Découvrir l’opportunité →</a></p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:24px 8px 0;text-align:center;font-family:'Segoe UI',Arial,sans-serif;color:#7fa99f;font-size:12px;line-height:1.7;">
          📍 La Base · 11 rue Saint Pierre, 55100 Verdun<br>
          À très vite ! 💚
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`;

  return { subject, html };
}
