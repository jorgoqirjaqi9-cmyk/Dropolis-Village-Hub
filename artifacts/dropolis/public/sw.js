const CACHE_PREFIX = "dropolis-";
const STATIC_CACHE = CACHE_PREFIX + "static-v2";
const IMAGE_CACHE  = CACHE_PREFIX + "images-v2";
const FONT_CACHE   = CACHE_PREFIX + "fonts-v2";

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function isHashedAsset(pathname) {
  return /\/assets\/[^/]+-[A-Za-z0-9]{8,}\.(js|css|woff2?|ttf|otf|svg|png|webp|avif|jpg|jpeg)(\?.*)?$/.test(pathname);
}

function isGoogleFont(url) {
  return url.hostname === "fonts.gstatic.com" || url.hostname === "fonts.googleapis.com";
}

function isExternalImage(url) {
  return (
    url.hostname.includes("unsplash.com") ||
    url.hostname.includes("placehold.co") ||
    url.hostname.includes("lh3.googleusercontent.com")
  );
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  });
  return cached ?? fetchPromise;
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).catch(() => fetch("/")));
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(event.request));
    return;
  }

  if (url.origin === self.location.origin && isHashedAsset(url.pathname)) {
    event.respondWith(cacheFirst(event.request, STATIC_CACHE));
    return;
  }

  if (isGoogleFont(url)) {
    event.respondWith(cacheFirst(event.request, FONT_CACHE));
    return;
  }

  if (isExternalImage(url)) {
    event.respondWith(staleWhileRevalidate(event.request, IMAGE_CACHE));
    return;
  }

  event.respondWith(fetch(event.request));
});
