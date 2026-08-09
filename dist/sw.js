// DDSE Service Worker — N-7 PWA support
// Provides offline capability for static assets and cached API responses.
// Integrates with the existing offlineSync.ts IndexedDB draft system.

const CACHE_NAME   = 'ddse-v1';
const STATIC_PATHS = ['/', '/index.html', '/manifest.json'];

// ── Install: pre-cache shell ─────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(STATIC_PATHS).catch(() => {
        // Non-fatal: continue even if pre-caching fails (first-load offline)
      })
    )
  );
  self.skipWaiting();
});

// ── Activate: clean old caches ───────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch: network-first for API, cache-first for static assets ──────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET, cross-origin (Supabase), and dev HMR requests
  if (request.method !== 'GET') return;
  if (url.origin !== location.origin) return;
  if (url.pathname.startsWith('/__')) return;

  // Cache-first for static assets (JS, CSS, fonts, images)
  const isStatic = /\.(js|css|woff2?|ttf|png|jpg|svg|ico)(\?.*)?$/.test(url.pathname);

  if (isStatic) {
    event.respondWith(
      caches.match(request).then((cached) =>
        cached ?? fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          }
          return response;
        })
      )
    );
    return;
  }

  // Network-first for HTML pages (allow offline fallback to shell)
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && request.destination === 'document') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then((cached) =>
          cached ?? caches.match('/index.html')
        )
      )
  );
});

// ── Background sync: replay offline draft queue ──────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'ddse-draft-sync') {
    // Signal to the app that connectivity is restored — the app's
    // useNetworkStatus hook handles the actual sync via offlineSync.ts
    event.waitUntil(
      self.clients.matchAll().then((clients) =>
        clients.forEach((c) => c.postMessage({ type: 'SYNC_READY' }))
      )
    );
  }
});

// ── Push notifications (future) ───────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;
  let payload;
  try { payload = event.data.json(); } catch { return; }

  event.waitUntil(
    self.registration.showNotification(payload.title ?? 'DDSE Alert', {
      body:  payload.body ?? '',
      icon:  '/images/icon-192.png',
      badge: '/images/icon-192.png',
      tag:   payload.tag ?? 'ddse',
      data:  payload.url ? { url: payload.url } : undefined,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      const existing = clients.find((c) => c.url === url && 'focus' in c);
      if (existing) return existing.focus();
      return self.clients.openWindow(url);
    })
  );
});
