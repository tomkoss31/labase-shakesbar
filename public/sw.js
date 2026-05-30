// La Base — Service Worker
// Gère install/activate (PWA basique), push notifications et clicks dessus.

const CACHE_VERSION = 'labase-v3-icon-2026-05-30';

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
