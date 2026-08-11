const VERSION = 'billar-control-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', () => {
  // Network behavior remains unchanged. The service worker exists so the
  // HTTPS demo can be installed as an app without introducing stale caches.
});
