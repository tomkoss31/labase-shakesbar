// Endpoint healthcheck : vérifie que les variables d'env sont bien
// configurées côté Vercel. Ne révèle JAMAIS les valeurs, juste l'état.
// Usage : GET /api/health

export default function handler(_req: any, res: any) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const squareToken = process.env.SQUARE_ACCESS_TOKEN;
  const squareLocation = process.env.SQUARE_LOCATION_ID;
  const squareWebhookKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;

  const status = {
    timestamp: new Date().toISOString(),
    deployment: process.env.VERCEL_ENV ?? 'local',
    region: process.env.VERCEL_REGION ?? 'unknown',
    supabase: {
      url_present: Boolean(supabaseUrl),
      url_format_ok: Boolean(supabaseUrl?.startsWith('https://') && supabaseUrl?.includes('.supabase.co')),
      anon_key_present: Boolean(supabaseAnonKey),
      anon_key_format_ok: Boolean(supabaseAnonKey?.startsWith('eyJ')),
      service_role_key_present: Boolean(supabaseServiceKey),
      service_role_key_format_ok: Boolean(supabaseServiceKey?.startsWith('eyJ')),
      url_hint: supabaseUrl ? supabaseUrl.slice(8, 16) + '...' : null,
    },
    square: {
      access_token_present: Boolean(squareToken),
      location_id_present: Boolean(squareLocation),
      webhook_signature_key_present: Boolean(squareWebhookKey),
    },
    ready: {
      payment: Boolean(squareToken && squareLocation),
      auth_xp_push: Boolean(supabaseUrl && supabaseAnonKey),
      webhook_xp_credit: Boolean(supabaseServiceKey && squareWebhookKey),
    },
  };

  return res.status(200).json(status);
}
