/**
 * SmartFitCoach — Proprietary Software
 * Copyright (c) 2024-2026 SmartFitCoach. All rights reserved.
 * Unauthorized copying, modification, distribution, or use of this software
 * is strictly prohibited without explicit written permission.
 * Contact: contact@smartfitcoach.com
 */
// Smart Fit Coach — Service Worker
// Cache version: bump this string to force a full cache refresh on next visit.
// 2026-04 NIVEAU 1 : versions unifiées pour éviter caches orphelins lors du bump
const CACHE_VERSION = 'sfc-vmoc0omr8';
const RUNTIME_CACHE = 'sfc-runtime-vmoc0omr8';

// Max age for static assets in the runtime cache: 7 days (in milliseconds).
const STATIC_MAX_AGE_MS = 1 * 24 * 60 * 60 * 1000;

// Local assets to pre-cache during install.
const APP_SHELL = [
  './',
  './index.html',
  './security-init.js',
  './crash-reporter.js',
  './gate.js',
  './error-boundary.js',
  './tracker.js',
  './bundle.js',
  './jspdf.umd.min.js',
  './premium-ui.css',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

// Critical static assets to pre-cache during install.
const STATIC_ASSETS = [
  '/', '/index.html', '/app/premium-ui.css',
  '/app/app-core.js', '/app/recipe-engine.js'
];

// Third-party CDN scripts to pre-cache (currently none — chart.js is bundled locally).
const CDN_ASSETS = [];

// ---------------------------------------------------------------------------
// Message — écouter SKIP_WAITING du client pour activation immédiate
// ---------------------------------------------------------------------------
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ---------------------------------------------------------------------------
// Install — cache the app shell and CDN dependencies
// ---------------------------------------------------------------------------
self.addEventListener('install', (event) => {
  // FIX PWA #1 2026-04 : robust install — pas de skipWaiting si addAll a partiellement échoué.
  // Avant : un seul fichier 404 dans APP_SHELL → cache.addAll reject → .catch swallow
  //         → install "réussit" avec cache vide → skipWaiting + activate purge l'ancien
  //         → PWA briquée hors-ligne (501/écran blanc).
  // Maintenant : on cache les fichiers UN PAR UN avec Promise.allSettled, on compte les
  //              succès. Si moins de 90% des fichiers sont cachés, on N'APPELLE PAS
  //              skipWaiting → l'ancien SW reste actif, l'app continue de fonctionner
  //              avec la version précédente jusqu'au prochain essai d'install.
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_VERSION);
    // Cache fichier par fichier : une erreur sur un fichier ne plante pas les autres
    const results = await Promise.allSettled(
      APP_SHELL.map((url) =>
        cache.add(url).catch((err) => {
          console.warn(`[SW] App-shell cache miss: ${url}`, err);
          throw err; // re-throw pour que allSettled status='rejected'
        })
      )
    );
    const cached = results.filter((r) => r.status === 'fulfilled').length;
    const total = APP_SHELL.length;
    const ratio = cached / total;

    // Cache CDN assets (best-effort, ne bloque pas l'install)
    await Promise.allSettled(
      CDN_ASSETS.map((url) =>
        cache.add(url).catch((err) => console.warn(`[SW] CDN cache miss: ${url}`, err))
      )
    );

    // Seuil 90% : si install partielle, on évite le skipWaiting destructeur
    if (ratio >= 0.9) {
      console.log(`[SW] Install OK: ${cached}/${total} app-shell cached (${Math.round(ratio*100)}%)`);
      self.skipWaiting();
    } else {
      console.error(`[SW] Install INCOMPLET: ${cached}/${total} (${Math.round(ratio*100)}%) — skipWaiting bloqué pour ne pas briquer la PWA. Le SW précédent reste actif.`);
      // Throw pour que installEvent soit rejected → browser réessaiera plus tard
      throw new Error(`SW install incomplete: ${cached}/${total} files cached`);
    }
  })());
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

  // API calls to Netlify Functions: network-only (never cache AI responses).
  if (url.pathname.startsWith('/netlify/functions/')) {
    event.respondWith(fetch(request));
    return;
  }

  // Navigation requests & the HTML file: network-first so updates are picked up.
  if (request.mode === 'navigate' || url.pathname.endsWith('.html')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Supabase API data must always be network-first — stale data causes desync.
  if (url.hostname.includes('supabase.co')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // JS/CSS: stale-while-revalidate — serve cached copy instantly, fetch
  // update in the background so next visit has the latest. Cuts revisit
  // load from ~5 s (full network round-trip on every asset) to ~50 ms
  // (disk cache). Code fixes still propagate within one refresh.
  const ext = url.pathname.split('.').pop().toLowerCase();
  if (['js', 'css'].includes(ext)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Images/fonts : cache-first avec maxAge (changent rarement).
  const isBinaryAsset = ['png', 'ico', 'woff', 'woff2', 'ttf', 'svg', 'webp', 'jpg', 'jpeg'].includes(ext)
    || url.hostname.includes('cdn.jsdelivr.net')
    || url.hostname.includes('fonts.googleapis.com')
    || url.hostname.includes('fonts.gstatic.com');

  if (isBinaryAsset) {
    event.respondWith(cacheFirstWithMaxAge(request));
    return;
  }

  // Everything else: network-first for data freshness.
  event.respondWith(networkFirst(request));
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
 * Stale-while-revalidate: return the cached copy immediately (fast), and
 * kick off a background fetch that updates the cache for next time. If no
 * cache entry exists, await the network.
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_VERSION);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse && networkResponse.ok) {
        cache.put(request, networkResponse.clone()).catch(() => {});
      }
      return networkResponse;
    })
    .catch(() => null);

  if (cached) return cached;
  const fromNetwork = await networkPromise;
  if (fromNetwork) return fromNetwork;
  return offlineFallback();
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
 * Cache-first with maxAge: serve from cache if fresh (< 7 days), otherwise
 * fetch from network, update cache with a timestamp header for age tracking.
 */
async function cacheFirstWithMaxAge(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);

  if (cached) {
    const cachedDate = cached.headers.get('x-sw-cached-at');
    const age = cachedDate ? Date.now() - Number(cachedDate) : Infinity;
    if (age < STATIC_MAX_AGE_MS) return cached;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Clone and add a timestamp header before caching.
      const headers = new Headers(networkResponse.headers);
      headers.set('x-sw-cached-at', String(Date.now()));
      const timestampedResponse = new Response(await networkResponse.clone().arrayBuffer(), {
        status: networkResponse.status,
        statusText: networkResponse.statusText,
        headers
      });
      cache.put(request, timestampedResponse);
    }
    return networkResponse;
  } catch (_) {
    if (cached) return cached;
    return new Response('Offline — ressource non disponible.', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}

// ---------------------------------------------------------------------------
// Push Notifications
// ---------------------------------------------------------------------------

self.addEventListener('push', function(event) {
  var data = {};
  try { data = event.data ? event.data.json() : {}; } catch(e) {}
  var title = data.title || 'SmartFitCoach';
  // FIX 2026-04 : icônes sur /app/icon-{192,512}.png (répertoire /icons/ n'existait pas).
  var options = {
    body: data.body || 'Votre programme vous attend.',
    icon: data.icon || './icon-192.png',
    badge: data.badge || './icon-192.png',
    tag: data.tag || 'sfc-notif',
    requireInteraction: false,
    data: { url: data.url || '/' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  var url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(list) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].url.indexOf(url) !== -1 && 'focus' in list[i]) return list[i].focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

// ---------------------------------------------------------------------------

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
