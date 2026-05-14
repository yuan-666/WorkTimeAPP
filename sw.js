const CACHE_NAME = "worktimeapp-v27";
const ASSET_VERSION = "v=0.3.4";
const ASSETS = [
  "./",
  "./index.html",
  "./admin.html",
  "./changelog.html",
  `./styles.css?${ASSET_VERSION}`,
  `./src/app.js?${ASSET_VERSION}`,
  `./src/calculations.js?${ASSET_VERSION}`,
  `./src/export.js?${ASSET_VERSION}`,
  `./src/storage.js?${ASSET_VERSION}`,
  `./manifest.webmanifest?${ASSET_VERSION}`,
  "./assets/icon.svg",
  "./assets/social-icons.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.pathname.startsWith("/api/")) return;
  event.respondWith(
    fetch(event.request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
      return response;
    }).catch(() => {
      return caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return caches.match("./index.html");
      });
    })
  );
});
