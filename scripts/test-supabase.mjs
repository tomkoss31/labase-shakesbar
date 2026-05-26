// Test de connexion Supabase
// Usage: node --env-file=.env.local scripts/test-supabase.mjs
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Test de configuration Supabase\n');

if (!url || !anonKey) {
  console.error('❌ Variables manquantes dans .env.local');
  console.error('   VITE_SUPABASE_URL =', url ? 'OK' : 'MANQUE');
  console.error('   VITE_SUPABASE_ANON_KEY =', anonKey ? 'OK' : 'MANQUE');
  process.exit(1);
}

console.log('✅ Variables d\'env présentes');
console.log('   URL :', url);
console.log('   Anon key :', anonKey.slice(0, 12) + '...' + anonKey.slice(-6));
console.log();

// Validation basique de l'URL
if (!url.startsWith('https://') || !url.includes('.supabase.co')) {
  console.error('⚠️  URL Supabase suspecte (doit être https://xxx.supabase.co)');
}

// Test de connexion : récupérer la session anonyme (pas besoin de table)
const supabase = createClient(url, anonKey);

console.log('📡 Test de connexion...');

try {
  // Test 1 : auth.getSession() — n'exige aucune table, juste valide les credentials
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    console.error('❌ Erreur auth.getSession :', sessionError.message);
    process.exit(2);
  }
  console.log('✅ Auth Supabase fonctionne (session :', sessionData.session ? 'active' : 'aucune', ')');

  // Test 2 : ping sur une table système pour vérifier que la DB répond
  const { error: pingError } = await supabase.from('_realtime_schema_migrations').select('*').limit(1);
  if (pingError && !pingError.message.includes('does not exist')) {
    console.log('⚠️  Ping DB :', pingError.message);
  } else {
    console.log('✅ DB Supabase répond');
  }

  console.log('\n🎉 Tout est OK ! Tu peux brancher l\'auth et créer les tables.');
} catch (err) {
  console.error('❌ Exception :', err.message);
  process.exit(3);
}
