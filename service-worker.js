const CACHE_NAME = "spese-cache-v1";
const urlsToCache = [
    "/gestione-spese-2/",
    "/gestione-spese-2/index.html",
    "/gestione-spese-2/expenses.html",
    "/gestione-spese-2/settings.html",
    "/gestione-spese-2/style.css",
    "/gestione-spese-2/app.js",
    "/gestione-spese-2/manifest.json",
    "/gestione-spese-2/icon-192x192.png",
    "/gestione-spese-2/icon-512x512.png"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener("fetch", event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                return response || fetch(event.request);
            })
    );
});

self.addEventListener("activate", event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
