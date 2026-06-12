import { createSign } from "crypto";
import { logger } from "./logger.js";

const HOST = "dropolis.net";
const BASE_URL = `https://${HOST}`;
const SITEMAP_URL = `${BASE_URL}/api/sitemap.xml`;
const INDEXNOW_KEY = "a65c5858b7f74b93a331bbe527a487d3";
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/IndexNow";
const MANIFEST_URL = `${BASE_URL}/prerender-manifest.json`;

export interface IndexingEvent {
  ts: string;
  type: "google-ping" | "bing-ping" | "indexnow" | "google-indexing-api";
  status: "ok" | "fail" | "skipped";
  url?: string;
  detail?: string;
}

// Circular in-memory log — last 200 events, no DB required
const recentEvents: IndexingEvent[] = [];
function logEvent(ev: IndexingEvent): void {
  recentEvents.unshift(ev);
  if (recentEvents.length > 200) recentEvents.pop();
}

export function getRecentIndexingEvents(): IndexingEvent[] {
  return [...recentEvents];
}

// ---------------------------------------------------------------------------
// Prerender manifest check
//
// Format: { generatedAt, articles: { "<id>": "<ISO ts>" }, villages: { ... } }
//
// The manifest is written by prerender.ts (build-time) and on-demand-prerender.ts
// (runtime, immediately after article/village create/update). Each entry maps an
// ID to the timestamp of when its HTML was last prerendered.
//
// Staleness check (article):
//   - If the article ID is absent from the manifest → HTML never existed → SKIP
//   - If manifest fetch fails → SKIP (fail closed — we can't verify prerender)
//
// We do NOT check updatedAt vs prerenderTs here because autoIndexArticle is only
// called on CREATE (articles.ts). On-demand prerender writes the HTML and updates
// the manifest immediately, so by the time the INDEXNOW_DELAY_MS timer fires the
// manifest entry will already reflect the on-demand prerender timestamp.
// ---------------------------------------------------------------------------

type PrerenderManifest = {
  articles: Record<string, string>;
  villages: Record<string, string>;
};
let cachedManifest: { data: PrerenderManifest; fetchedAt: number } | null = null;
const MANIFEST_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

async function fetchManifest(): Promise<PrerenderManifest | null> {
  if (cachedManifest && Date.now() - cachedManifest.fetchedAt < MANIFEST_CACHE_TTL_MS) {
    return cachedManifest.data;
  }
  try {
    const res = await fetch(MANIFEST_URL, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const data = (await res.json()) as PrerenderManifest;
    if (typeof data.articles !== "object" || Array.isArray(data.articles)) return null;
    cachedManifest = { data, fetchedAt: Date.now() };
    return data;
  } catch {
    return null;
  }
}

/**
 * Returns true if the article has prerendered HTML in the currently deployed build.
 *
 * Fail-closed: returns false (skip submission) if the manifest cannot be fetched.
 * This prevents crawlers from being pointed at the generic SPA shell.
 */
async function isArticlePrerendered(articleId: number): Promise<boolean> {
  const manifest = await fetchManifest();
  if (!manifest) {
    // Manifest unavailable — cannot verify; fail closed to avoid advertising
    // a URL that might serve the generic SPA shell to crawlers.
    logger.warn({ articleId }, "auto-indexing: manifest unavailable — failing closed (submission skipped)");
    return false;
  }
  return String(articleId) in manifest.articles;
}

// ---------------------------------------------------------------------------
// Sitemap ping — notifies Bing/Yandex of sitemap updates via IndexNow.
//
// Note: Google's sitemap ping URL (google.com/ping) was deprecated in 2024.
//       Bing's ping URL (bing.com/ping) was also deprecated; use IndexNow.
//       For Google, use the Google Indexing API (requires service account).
// ---------------------------------------------------------------------------
export async function pingSitemaps(): Promise<void> {
  const payload = {
    host: HOST,
    key: INDEXNOW_KEY,
    keyLocation: `${BASE_URL}/${INDEXNOW_KEY}.txt`,
    urlList: [SITEMAP_URL],
  };

  await Promise.allSettled([
    fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    })
      .then((r) => {
        const ok = r.status === 200 || r.status === 202;
        logEvent({ ts: new Date().toISOString(), type: "bing-ping", status: ok ? "ok" : "fail", detail: `IndexNow sitemap HTTP ${r.status}` });
        logger.info({ status: r.status }, "Bing/IndexNow sitemap ping sent");
      })
      .catch((err: unknown) => {
        logEvent({ ts: new Date().toISOString(), type: "bing-ping", status: "fail", detail: String(err) });
        logger.warn({ err }, "Bing/IndexNow sitemap ping failed");
      }),

    // Google: no public sitemap ping URL since 2024.
    // Discovery happens via Google Indexing API (called per-article in autoIndexArticle)
    // or by Googlebot re-crawling the sitemap naturally.
    Promise.resolve().then(() => {
      logEvent({ ts: new Date().toISOString(), type: "google-ping", status: "skipped", detail: "Google sitemap ping deprecated in 2024 — use Indexing API" });
    }),
  ]);
}

// ---------------------------------------------------------------------------
// IndexNow — instant Bing/Yandex notification for specific URLs.
// ---------------------------------------------------------------------------
export async function submitToIndexNow(urls: string[]): Promise<void> {
  const validUrls = urls.filter((u) => typeof u === "string" && u.startsWith(BASE_URL));
  if (validUrls.length === 0) return;

  const payload = {
    host: HOST,
    key: INDEXNOW_KEY,
    keyLocation: `${BASE_URL}/${INDEXNOW_KEY}.txt`,
    urlList: validUrls,
  };

  try {
    const res = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });
    const ok = res.status === 200 || res.status === 202;
    logEvent({ ts: new Date().toISOString(), type: "indexnow", status: ok ? "ok" : "fail", url: validUrls[0], detail: `HTTP ${res.status}` });
    logger.info({ count: validUrls.length, status: res.status }, "IndexNow submission");
  } catch (err: unknown) {
    logEvent({ ts: new Date().toISOString(), type: "indexnow", status: "fail", url: validUrls[0], detail: String(err) });
    logger.warn({ err }, "IndexNow submission failed");
  }
}

// ---------------------------------------------------------------------------
// Google Indexing API (OPTIONAL)
// Requires env vars:
//   GOOGLE_INDEXING_CLIENT_EMAIL  — service account email
//   GOOGLE_INDEXING_PRIVATE_KEY   — RSA private key (newlines as \n)
//
// Setup guide:
//   1. Create a Google Cloud service account with Indexing API enabled
//   2. Download the JSON key and extract client_email + private_key
//   3. Add that service account as a verified owner in Google Search Console
//   4. Set the two env vars above in Replit Secrets
// ---------------------------------------------------------------------------
async function createGoogleJWT(clientEmail: string, privateKey: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const claims = Buffer.from(
    JSON.stringify({
      iss: clientEmail,
      scope: "https://www.googleapis.com/auth/indexing",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    })
  ).toString("base64url");

  const signingInput = `${header}.${claims}`;
  const sign = createSign("RSA-SHA256");
  sign.update(signingInput);
  const key = privateKey.replace(/\\n/g, "\n");
  const sig = sign.sign(key, "base64url");
  return `${signingInput}.${sig}`;
}

async function getGoogleAccessToken(clientEmail: string, privateKey: string): Promise<string | null> {
  try {
    const jwt = await createGoogleJWT(clientEmail, privateKey);
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      logger.warn({ status: res.status, text }, "Google OAuth: token request failed");
      return null;
    }
    const data = (await res.json()) as { access_token?: string };
    return data.access_token ?? null;
  } catch (err: unknown) {
    logger.warn({ err }, "Google OAuth: failed to get access token");
    return null;
  }
}

export async function submitToGoogleIndexingApi(url: string): Promise<void> {
  const clientEmail = process.env.GOOGLE_INDEXING_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_INDEXING_PRIVATE_KEY;

  if (!clientEmail || !privateKey) {
    logEvent({ ts: new Date().toISOString(), type: "google-indexing-api", status: "skipped", url, detail: "Credentials not set — skipping" });
    return;
  }

  const accessToken = await getGoogleAccessToken(clientEmail, privateKey);
  if (!accessToken) {
    logEvent({ ts: new Date().toISOString(), type: "google-indexing-api", status: "fail", url, detail: "Could not obtain access token" });
    return;
  }

  try {
    const res = await fetch("https://indexing.googleapis.com/v3/urlNotifications:publish", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ url, type: "URL_UPDATED" }),
      signal: AbortSignal.timeout(10000),
    });
    const data = (await res.json()) as Record<string, unknown>;
    if (res.ok) {
      logEvent({ ts: new Date().toISOString(), type: "google-indexing-api", status: "ok", url, detail: JSON.stringify(data) });
      logger.info({ url, data }, "Google Indexing API: URL submitted");
    } else {
      logEvent({ ts: new Date().toISOString(), type: "google-indexing-api", status: "fail", url, detail: JSON.stringify(data) });
      logger.warn({ url, status: res.status, data }, "Google Indexing API: non-success response");
    }
  } catch (err: unknown) {
    logEvent({ ts: new Date().toISOString(), type: "google-indexing-api", status: "fail", url, detail: String(err) });
    logger.warn({ err, url }, "Google Indexing API request failed");
  }
}

// ---------------------------------------------------------------------------
// autoIndexArticle — orchestrates all indexing for a freshly published article.
// Called fire-and-forget from the POST /articles route: void autoIndexArticle(id)
//
// Flow:
//   1. Wait INDEXNOW_DELAY_MS (default 30 min) — gives on-demand-prerender.ts
//      time to write the HTML and update the manifest before we notify crawlers.
//      (In practice on-demand prerender completes in milliseconds, so this delay
//      is mostly a safety buffer against deployment edge-cases where the dist
//      directory might not be mounted yet.)
//
//   2. Manifest check (fail closed):
//      - Fetch prerender-manifest.json from the deployed frontend.
//      - If unavailable → SKIP and log. Operator should retry via
//        POST /api/indexnow/submit once the deployment is confirmed.
//      - If article ID absent from manifest → SKIP and log.
//      - If article ID present → proceed with IndexNow + Google Indexing API.
// ---------------------------------------------------------------------------
const INDEXNOW_DELAY_MS = (() => {
  const v = parseInt(process.env.INDEXNOW_DELAY_MS ?? "", 10);
  return Number.isFinite(v) && v >= 0 ? v : 60 * 1000;
})();

export async function autoIndexArticle(articleId: number): Promise<void> {
  const articleUrl = `${BASE_URL}/news/${articleId}`;
  logger.info({ articleId, url: articleUrl, delayMs: INDEXNOW_DELAY_MS }, "Auto-indexing article scheduled");

  if (INDEXNOW_DELAY_MS > 0) {
    await new Promise<void>((resolve) => setTimeout(resolve, INDEXNOW_DELAY_MS));
  }

  // Manifest check — fail closed if the manifest is unavailable or the
  // article is not yet in it (prerendered HTML not confirmed).
  const prerendered = await isArticlePrerendered(articleId);
  if (!prerendered) {
    // Logged inside isArticlePrerendered (manifest unavailable) or here (absent).
    logEvent({
      ts: new Date().toISOString(),
      type: "indexnow",
      status: "skipped",
      url: articleUrl,
      detail: "Article absent from prerender-manifest.json or manifest unavailable — retry via POST /api/indexnow/submit",
    });
    return;
  }

  logger.info({ articleId, url: articleUrl }, "Auto-indexing article: prerender confirmed — submitting");

  await Promise.allSettled([
    pingSitemaps(),
    submitToIndexNow([articleUrl]),
    submitToGoogleIndexingApi(articleUrl),
  ]);
}
