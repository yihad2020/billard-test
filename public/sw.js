const VERSION = 'billar-control-v2';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', () => {
  // Network behavior remains unchanged. The service worker exists so the
  // HTTPS app can be installed and can receive Web Push in production.
});

self.addEventListener('push', event => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: 'Billar Control', body: event.data?.text() || 'Tienes una nueva alerta.' };
  }

  const title = payload.title || 'Billar Control';
  const options = {
    body: payload.body || payload.message || 'Tienes una nueva alerta.',
    icon: '/assets/branding/billar-app-icon-192.png',
    badge: '/assets/branding/billar-app-icon-192.png',
    tag: payload.tag || `billar-push-${Date.now()}`,
    data: { url: payload.url || '/control' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || '/control';

  event.waitUntil((async () => {
    const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clientList) {
      try {
        const current = new URL(client.url);
        const target = new URL(targetUrl, self.location.origin);
        if (current.origin === target.origin) {
          await client.focus();
          if ('navigate' in client) await client.navigate(target.href);
          return;
        }
      } catch {}
    }
    if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
  })());
});
