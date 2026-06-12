import { createSign } from "crypto";
import { logger } from "./logger.js";

const HOST = "dropolis.net";
const BASE_URL = `https://${HOST}`;
const SITEMAP_URL = `${BASE_URL}/api/sitemap.xml`;
const INDEXNOW_KEY = "a65c5858b7f74b93a331bbe527a487d3";
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/IndexNow";

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
// Sitemap ping — notifies Bing/Yandex of sitemap updates via IndexNow.
//
// Note: Google's sitemap ping URL (google.com/ping) was deprecated in 2024.
//       Bing's ping URL (bing.com/ping) was also deprecated; use IndexNow.
//       For Google, use the Google Indexing API (requires service account).
// ---------------------------------------------------------------------------
export async function pingSitemaps(): Promise<void> {
  // Submit the sitemap URL itself to IndexNow so Bing knows it updated
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
// Call fire-and-forget: void autoIndexArticle(id)
// ---------------------------------------------------------------------------
export async function autoIndexArticle(articleId: number): Promise<void> {
  const articleUrl = `${BASE_URL}/news/${articleId}`;
  logger.info({ articleId, url: articleUrl }, "Auto-indexing article");

  await Promise.allSettled([
    pingSitemaps(),
    submitToIndexNow([articleUrl]),
    submitToGoogleIndexingApi(articleUrl),
  ]);
}
