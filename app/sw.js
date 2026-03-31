// Smart Fit Coach — Service Worker
// Cache version: bump this string to force a full cache refresh on next visit.
const CACHE_VERSION = 'sfc-v13';
const RUNTIME_CACHE = 'sfc-runtime-v13';

// Local assets to pre-cache during install.
const APP_SHELL = [
  './',
  './index.html',
  './security-init.js',
  './gate.js',
  './error-boundary.js',
  './sw-register.js',
  './app-core.js',
  './app-main.js',
  './app-sport.js',
  './app-nutrition.js',
  './auth.js',
  './recipe-engine.js',
  './exercises-db.js',
  './gamification.js',
  './extras.js',
  './tips-assistant.js',
  './scanner.js',
  './crossfit-haltero-cycles.js',
  './crossfit-wods.js',
  './muscu-programs.js',
  './triathlon-program.js',
  './dashboard.js',
  './prices-db.js',
  './nutrition-master.js',
  './perf-history.js',
  './premium-ui.css',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './jspdf.umd.min.js',
  './supabase-client.js',
  './recipes-db.js'
];

// Third-party CDN scripts to pre-cache.
const CDN_ASSETS = [
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js'
];

// ---------------------------------------------------------------------------
// Install — cache the app shell and CDN dependencies
// ---------------------------------------------------------------------------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(async (cache) => {
      // Cache local assets — these must all succeed.
      await cache.addAll(APP_SHELL).catch((err) => {
        console.warn('[SW] Some app-shell assets failed to cache:', err);
      });

      // Cache CDN assets individually so one failure doesn't block the rest.
      await Promise.allSettled(
        CDN_ASSETS.map((url) =>
          cache.add(url).catch((err) =>
            console.warn(`[SW] CDN cache miss: ${url}`, err)
          )
        )
      );
    })
  );

  // Activate immediately instead of waiting for existing tabs to close.
  self.skipWaiting();
});

// ---------------------------------------------------------------------------
// Activate — clean up old caches
// ---------------------------------------------------------------------------
self.addEventListener('activate', (event) => {
  const keepCaches = new Set([CACHE_VERSION, RUNTIME_CACHE]);
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => !keepCaches.has(name))
          .map((name) => caches.delete(name))
      )
    )
  );

  // Start controlling all open clients immediately.
  self.clients.claim();
});

// ---------------------------------------------------------------------------
// Fetch — strategy depends on the request type
// ---------------------------------------------------------------------------
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests.
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Navigation requests & the HTML file: network-first so updates are picked up.
  if (request.mode === 'navigate' || url.pathname.endsWith('.html')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Everything else (JS, CSS, CDN libs, images): cache-first for speed.
  event.respondWith(cacheFirst(request));
});

// ---------------------------------------------------------------------------
// Strategies
// ---------------------------------------------------------------------------

/**
 * Network-first: try the network, fall back to cache, and update the cache
 * with every successful network response.
 */
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    // Only cache successful responses (avoid caching 404/500)
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_VERSION);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (_) {
    const cached = await caches.match(request);
    return cached || offlineFallback();
  }
}

/**
 * Cache-first: serve from cache immediately, fall back to network (and update
 * the runtime cache for future offline visits).
 */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const networkResponse = await fetch(request);
    // Cache successful responses in the runtime cache.
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (_) {
    // If both cache and network fail, return a minimal error response.
    return new Response('Offline — ressource non disponible.', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}

/**
 * Minimal offline fallback page when even the cached HTML is unavailable.
 */
function offlineFallback() {
  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Smart Fit Coach — Hors ligne</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:Georgia,serif;background:#FAF9F6;color:#0A0A09;
         display:flex;align-items:center;justify-content:center;
         min-height:100vh;text-align:center;padding:2rem}
    h1{font-size:1.5rem;margin-bottom:.75rem}
    p{opacity:.7;line-height:1.6}
  </style>
</head>
<body>
  <div>
    <h1>Vous êtes hors ligne</h1>
    <p>Vérifiez votre connexion Internet puis rechargez la page.</p>
  </div>
</body>
</html>`;
  return new Response(html, {
    status: 503,
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}
