// ─────────────────────────────────────────────────────────────
//  VArt Tools — Service Worker
//  Версия кэша: меняй CACHE_VERSION когда обновляешь сайт
// ─────────────────────────────────────────────────────────────

const CACHE_VERSION = 'vart-v1';

// Файлы которые кэшируются сразу при установке
const PRECACHE_URLS = [
  '/Free-Work/',
  '/Free-Work/index.html',
  '/Free-Work/work-tracker.html',
  '/Free-Work/radio.html',
  '/Free-Work/manifest.json',
  '/Free-Work/icons/icon-192.png',
  '/Free-Work/icons/icon-512.png'
];

// ── INSTALL: кэшируем нужные файлы ──────────────────────────
self.addEventListener('install', event => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => {
        console.log('[SW] Precaching files');
        // addAll может упасть если какого-то файла нет — используем add по одному
        return Promise.allSettled(
          PRECACHE_URLS.map(url => cache.add(url).catch(e => console.warn('[SW] Could not cache:', url, e)))
        );
      })
      .then(() => self.skipWaiting())
  );
});

// ── ACTIVATE: удаляем старые кэши ───────────────────────────
self.addEventListener('activate', event => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_VERSION)
          .map(key => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ── FETCH: стратегия "сначала кэш, потом сеть" ──────────────
self.addEventListener('fetch', event => {
  // Пропускаем не-GET запросы и chrome-extension
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // Есть в кэше — отдаём сразу, и фоном обновляем
          const fetchPromise = fetch(event.request)
            .then(networkResponse => {
              if (networkResponse && networkResponse.status === 200) {
                const clone = networkResponse.clone();
                caches.open(CACHE_VERSION).then(cache => cache.put(event.request, clone));
              }
              return networkResponse;
            })
            .catch(() => {}); // офлайн — ничего страшного, кэш уже отдан

          return cachedResponse;
        }

        // Нет в кэше — идём в сеть
        return fetch(event.request)
          .then(networkResponse => {
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }
            // Кэшируем ответ на будущее
            const clone = networkResponse.clone();
            caches.open(CACHE_VERSION).then(cache => cache.put(event.request, clone));
            return networkResponse;
          })
          .catch(() => {
            // Нет сети и нет кэша — показываем офлайн-страницу если есть
            return caches.match('/Free-Work/index.html');
          });
      })
  );
});
