// Génère une paire de clés VAPID pour les push notifications web.
// Usage : node scripts/generate-vapid.mjs
//
// Ajoute ensuite dans Vercel Env Variables :
// - VITE_VAPID_PUBLIC_KEY = la clé publique (utilisable côté front)
// - VAPID_PRIVATE_KEY = la clé privée (côté serveur uniquement, JAMAIS exposée)
// - VAPID_SUBJECT = mailto:ton-email@example.com (contact pour les push)

import webpush from 'web-push';

const keys = webpush.generateVAPIDKeys();

console.log('\n✨ Paire de clés VAPID générée\n');
console.log('Ajoute ces variables dans Vercel (Settings → Environment Variables) :\n');
console.log('VITE_VAPID_PUBLIC_KEY=' + keys.publicKey);
console.log('VAPID_PRIVATE_KEY=' + keys.privateKey);
console.log('VAPID_SUBJECT=mailto:tom@labase-nutrition.com');
console.log('\n⚠️  La clé privée ne doit JAMAIS être commitée ou exposée côté front.\n');
console.log('💡 Active aussi ces vars sur Production + Preview (pas Development).');
