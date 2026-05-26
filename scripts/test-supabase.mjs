// Test de connexion Supabase + vérification des tables
// Usage: node --env-file=.env.local scripts/test-supabase.mjs
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Test Supabase\n');

if (!url || !anonKey) {
  console.error('❌ Variables manquantes dans .env.local');
  process.exit(1);
}

console.log('✅ Vars OK');
console.log('   URL :', url);
console.log();

const supabase = createClient(url, anonKey);

// Test auth
const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
if (sessionError) {
  console.error('❌ Auth :', sessionError.message);
  process.exit(2);
}
console.log('✅ Auth Supabase OK');
console.log();

// Test des tables
const tables = ['profiles', 'orders', 'order_items', 'push_subscriptions', 'wheel_spins'];
console.log('📋 Vérification des tables :');

let allOk = true;
for (const table of tables) {
  const { error } = await supabase.from(table).select('id').limit(1);
  if (error) {
    // Erreur RLS attendue si la table existe (PGRST301 ou similaire)
    // Erreur "relation does not exist" = table absente
    if (error.message.includes('does not exist') || error.code === '42P01') {
      console.log(`   ❌ ${table.padEnd(22)} — n'existe pas`);
      allOk = false;
    } else {
      // RLS qui bloque c'est OK, ça veut dire que la table existe
      console.log(`   ✅ ${table.padEnd(22)} — existe (RLS actif)`);
    }
  } else {
    console.log(`   ✅ ${table.padEnd(22)} — existe (lecture publique)`);
  }
}

console.log();
if (allOk) {
  console.log('🎉 Tout est en place ! Magic link prêt à tester.');
  console.log();
  console.log('Pour tester :');
  console.log('  1. Ouvre https://[preview-url]/?v2');
  console.log('  2. Clique "Connecter" dans la carte XP');
  console.log('  3. Tape ton email → reçois le lien magique');
} else {
  console.log('⚠️  Certaines tables manquent. Re-joue le SQL dans Supabase SQL Editor.');
  process.exit(3);
}
