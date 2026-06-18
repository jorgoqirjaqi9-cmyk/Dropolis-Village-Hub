const CACHE_PREFIX = "dropolis-";
const STATIC_CACHE = CACHE_PREFIX + "static-v3";
const IMAGE_CACHE  = CACHE_PREFIX + "images-v3";
const FONT_CACHE   = CACHE_PREFIX + "fonts-v3";

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

/**
 * Cache-first: serve from cache; on miss fetch and store.
 * If the network fetch fails and there is nothing cached, returns a generic
 * 503 response so the SW promise never rejects.
 */
async function cacheFirst(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    if (cached) return cached;

    try {
      const response = await fetch(request);
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    } catch {
      return new Response(null, { status: 503, statusText: "Service Unavailable" });
    }
  } catch {
    return new Response(null, { status: 503, statusText: "Service Unavailable" });
  }
}

/**
 * Stale-while-revalidate: serve cached immediately; refresh in background.
 * The background fetch is fire-and-forget — its errors are swallowed silently.
 * If nothing is cached and the network fetch fails, returns 503.
 */
async function staleWhileRevalidate(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    const networkFetch = fetch(request)
      .then((response) => {
        if (response.ok) {
          cache.put(request, response.clone());
        }
        return response;
      })
      .catch(() => null);

    if (cached) {
      networkFetch.catch(() => {});
      return cached;
    }

    const response = await networkFetch;
    return response ?? new Response(null, { status: 503, statusText: "Service Unavailable" });
  } catch {
    return new Response(null, { status: 503, statusText: "Service Unavailable" });
  }
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() =>
        fetch("/").catch(
          () => new Response("<h1>Offline</h1>", {
            status: 503,
            headers: { "Content-Type": "text/html; charset=utf-8" },
          })
        )
      )
    );
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(event.request).catch(
        () => new Response(JSON.stringify({ error: "network_error" }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        })
      )
    );
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

  event.respondWith(
    fetch(event.request).catch(
      () => new Response(null, { status: 503, statusText: "Service Unavailable" })
    )
  );
});
