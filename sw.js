const CACHE_NAME = "cmv-ia-cache-v2";
const urlsToCache = [
  "./",
  "./index.html",
  "./taco-data.js",
  "./smart-ingredients.js"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener("fetch", event => {
  // Only intercept GET requests, ignore firestore API
  if (event.request.method !== "GET" || event.request.url.includes("firestore.googleapis.com")) return;

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) return response;
        
        return fetch(event.request).then(
          networkResponse => {
            // Se for resposta válida OU resposta de CDN externa (opaque), armazenar no cache
            if(!networkResponse || (networkResponse.status !== 200 && networkResponse.type !== "opaque")) {
              return networkResponse;
            }

            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          }
        ).catch(() => {
          // Ignore network errors
        });
      })
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});
