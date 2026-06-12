import { Router } from "express";
import { requireAdmin } from "../lib/admin-auth.js";

const router = Router();

const INDEXNOW_KEY = "a65c5858b7f74b93a331bbe527a487d3";
const HOST = "dropolis.net";
const KEY_LOCATION = `https://${HOST}/${INDEXNOW_KEY}.txt`;
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/IndexNow";

/**
 * POST /api/indexnow/submit
 * Body: { urls: string[] }
 *
 * Pings Bing/IndexNow with the given URLs so they are re-crawled faster.
 * Call this after publishing new articles or updating village data.
 *
 * Example:
 *   curl -X POST https://dropolis.net/api/indexnow/submit \
 *     -H "Content-Type: application/json" \
 *     -d '{"urls":["https://dropolis.net/news/27"]}'
 */
router.post("/indexnow/submit", requireAdmin, async (req, res) => {
  const { urls } = req.body as { urls?: unknown };

  if (!Array.isArray(urls) || urls.length === 0) {
    res.status(400).json({ error: "urls must be a non-empty array of strings" });
    return;
  }

  const validUrls = urls.filter(
    (u): u is string => typeof u === "string" && u.startsWith(`https://${HOST}`)
  );

  if (validUrls.length === 0) {
    res.status(400).json({ error: `All URLs must start with https://${HOST}` });
    return;
  }

  const payload = {
    host: HOST,
    key: INDEXNOW_KEY,
    keyLocation: KEY_LOCATION,
    urlList: validUrls,
  };

  try {
    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(payload),
    });

    if (response.status === 200 || response.status === 202) {
      req.log.info({ count: validUrls.length }, "IndexNow: URLs submitted successfully");
      res.json({ ok: true, submitted: validUrls.length, urls: validUrls });
    } else {
      const text = await response.text().catch(() => "");
      req.log.warn({ status: response.status, body: text }, "IndexNow: non-success response");
      res.status(502).json({ ok: false, status: response.status, message: text });
    }
  } catch (err) {
    req.log.error({ err }, "IndexNow: fetch failed");
    res.status(503).json({ ok: false, error: "Failed to reach IndexNow API" });
  }
});

/**
 * GET /api/indexnow/key
 * Returns the current IndexNow key metadata (safe to expose — key is public by design).
 */
router.get("/indexnow/key", (_req, res) => {
  res.json({
    key: INDEXNOW_KEY,
    keyLocation: KEY_LOCATION,
    host: HOST,
  });
});

export default router;
