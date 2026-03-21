/**
 * Service worker — safe caching for Vite hashed assets + SPA.
 * Build injects a unique id into CACHE_NAME (vite.config.ts injectSwCacheRevision).
 */
const CACHE_NAME = 'workings-sw-__SW_CACHE_REVISION__';

/** Small static files only — do NOT precache HTML (stale shell breaks hashed /assets/). */
const PRECACHE_URLS = ['/manifest.json', '/icons/app-icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch((err) => {
        console.warn('Service Worker: precache failed (non-fatal)', err);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('Service Worker: deleting old cache', name);
            return caches.delete(name);
          })
      )
    )
  );
  self.clients.claim();
});

function isNavigateOrDocument(request) {
  return request.mode === 'navigate' || request.destination === 'document';
}

function isScriptOrStyle(request) {
  return request.destination === 'script' || request.destination === 'style';
}

/**
 * Never cache SPA fallback HTML as JS/CSS — that caused MIME errors + blank screens.
 */
function shouldCacheResponse(request, response) {
  if (!response || response.status !== 200 || response.type !== 'basic') {
    return false;
  }
  const ct = (response.headers.get('content-type') || '').toLowerCase();

  if (isScriptOrStyle(request)) {
    if (ct.includes('text/html')) return false;
    if (request.destination === 'script') {
      if (!ct.includes('javascript') && !ct.includes('ecmascript')) return false;
    }
    if (request.destination === 'style' && !ct.includes('css')) return false;
  }

  return true;
}

/** Drop poisoned cache entries from older SW versions. */
async function sanitizeCachedAsset(request, cached) {
  if (!cached) return null;
  const ct = (cached.headers.get('content-type') || '').toLowerCase();
  if (isScriptOrStyle(request) && ct.includes('text/html')) {
    const cache = await caches.open(CACHE_NAME);
    await cache.delete(request);
    return null;
  }
  return cached;
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (shouldCacheResponse(request, response)) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    let cached = await cache.match(request);
    cached = await sanitizeCachedAsset(request, cached);
    if (cached) return cached;
    throw err;
  }
}

/**
 * Hashed files under /assets/ — fast repeat visits, background update.
 * Still rejects caching HTML disguised as JS/CSS.
 */
async function staleWhileRevalidateAssets(request) {
  const cache = await caches.open(CACHE_NAME);
  let cached = await cache.match(request);
  cached = await sanitizeCachedAsset(request, cached);

  const networkPromise = fetch(request)
    .then(async (response) => {
      if (shouldCacheResponse(request, response)) {
        await cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => undefined);

  if (cached) {
    void networkPromise;
    return cached;
  }

  const fresh = await networkPromise;
  if (fresh) return fresh;

  throw new Error('Service Worker: network error and no cache');
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (isNavigateOrDocument(request)) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(staleWhileRevalidateAssets(request));
    return;
  }

  event.respondWith(networkFirst(request));
});
