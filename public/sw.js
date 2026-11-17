const CACHE_VERSION = 'myhomepage-v8';
const APP_SHELL = [
    '/',
    '/index.html',
    '/app.js',
    '/styles.css',
    '/favicon.ico'
];

// Install: precache the app shell
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_VERSION)
            .then((cache) => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_VERSION)
                    .map((key) => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch handler
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);

    // API GET requests: network-first, fall back to empty array when offline
    if (request.method === 'GET' && url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Cache successful API responses too
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
                    }
                    return response;
                })
                .catch(() => {
                    // Offline: try cache first, then synthetic empty response
                    return caches.match(request).then((cached) => {
                        if (cached) return cached;
                        // /api/version and others: return a minimal valid response
                        if (url.pathname === '/api/buttons') {
                            return new Response('[]', {
                                headers: { 'Content-Type': 'application/json' }
                            });
                        }
                        return new Response(JSON.stringify({ error: 'Offline' }), {
                            status: 503,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    });
                })
        );
        return;
    }

    // Non-GET API requests: let them go to the network (they will fail when offline,
    // and app.js already guards against offline mutations)
    if (request.method !== 'GET' && url.pathname.startsWith('/api/')) {
        return;
    }

    // Navigation requests (HTML): network-first, fall back to cached index.html
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .catch(() => caches.match('/index.html').then((cached) => {
                    return cached || caches.match('/');
                }))
        );
        return;
    }

    // Static assets: cache-first
    event.respondWith(
        caches.match(request).then((cached) => {
            if (cached) return cached;
            return fetch(request).then((response) => {
                if (response.ok && url.origin === self.location.origin) {
                    const clone = response.clone();
                    caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
                }
                return response;
            });
        })
    );
});