// La Base — Service Worker
// Gère install/activate (PWA), cache hors-ligne, push notifications et clicks.

const CACHE_VERSION = 'labase-v5-offline-2026-09-28';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Nettoie les anciens caches
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

// ─── CACHE HORS-LIGNE ───────────────────────────────────────────────
// But : l'app (et donc le QR fidélité, qui n'a besoin que de l'id client
// gardé sur le téléphone) s'ouvre même sans réseau au comptoir.
//   • Page de l'app (/) : RÉSEAU d'abord (4 s max) → toujours la dernière
//     version si le réseau répond ; copie en cache seulement en secours.
//   • /assets/* (noms hachés = immuables), images, icônes, polices : cache
//     d'abord, puis réseau (et mise en cache).
//   • JAMAIS : /api/*, Supabase, console/scanner/comptoir/jeu (toujours en direct).
const APP_SHELL = '/';
const NETWORK_TIMEOUT_MS = 4000;

function isCacheableAsset(url) {
  if (url.origin === self.location.origin) {
    return (
      url.pathname.startsWith('/assets/') ||
      url.pathname.startsWith('/images/') ||
      /^\/(icon|apple-touch-icon|favicon)[^/]*\.png$/.test(url.pathname) ||
      url.pathname === '/manifest.json'
    );
  }
  return url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
}

async function networkFirstShell(request) {
  const cache = await caches.open(CACHE_VERSION);
  try {
    const response = await Promise.race([
      fetch(request),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), NETWORK_TIMEOUT_MS)),
    ]);
    if (response && response.ok) cache.put(APP_SHELL, response.clone());
    return response;
  } catch {
    const cached = await cache.match(APP_SHELL);
    if (cached) return cached;
    return fetch(request); // pas de copie : on laisse le navigateur afficher l'erreur
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_VERSION);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && (response.ok || response.type === 'opaque')) cache.put(request, response.clone());
  return response;
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Navigation vers l'app elle-même (/, /?qr=1, /?payment=success…) uniquement
  if (request.mode === 'navigate' && url.origin === self.location.origin && url.pathname === '/') {
    event.respondWith(networkFirstShell(request));
    return;
  }
  if (isCacheableAsset(url)) {
    event.respondWith(cacheFirst(request));
  }
  // Tout le reste (API, Supabase, autres pages) : comportement réseau normal.
});

// ─── PUSH NOTIFICATIONS ─────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    // payload not JSON
    data = { title: 'La Base', body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'La Base';
  const options = {
    body: data.body || '',
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    image: data.image,
    tag: data.tag || 'labase-push',
    renotify: Boolean(data.renotify),
    requireInteraction: Boolean(data.requireInteraction),
    vibrate: data.vibrate || [80, 40, 80],
    data: {
      url: data.url || '/',
      timestamp: Date.now(),
    },
    actions: data.actions || [],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  // Par défaut, on ouvre la boîte de réception (?inbox=1) pour afficher le
  // message — sinon l'app s'ouvrait sans rien montrer. Si la notif a une url
  // spécifique (ex: une promo produit), on l'utilise.
  const dataUrl = event.notification.data && event.notification.data.url;
  const targetUrl = dataUrl && dataUrl !== '/' ? dataUrl : '/?inbox=1';

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      // Si une fenêtre existe déjà, la focus et navigue
      for (const client of allClients) {
        if ('focus' in client) {
          try {
            await client.focus();
            if ('navigate' in client && targetUrl) {
              await client.navigate(targetUrl);
            }
            return;
          } catch {
            // ignore
          }
        }
      }
      // Sinon ouvre une nouvelle fenêtre
      if (self.clients.openWindow) {
        await self.clients.openWindow(targetUrl);
      }
    })()
  );
});
