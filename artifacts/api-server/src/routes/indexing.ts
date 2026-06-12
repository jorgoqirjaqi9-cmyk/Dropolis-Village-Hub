import { Router } from "express";
import { db, articlesTable } from "@workspace/db";
import { inArray, desc } from "drizzle-orm";
import {
  autoIndexArticle,
  pingSitemaps,
  getRecentIndexingEvents,
} from "../lib/auto-indexing.js";

const router = Router();

/**
 * POST /api/indexing/trigger
 *
 * Manually trigger indexing for specific article IDs, or ping sitemaps only.
 *
 * Body:
 *   { ids: number[] }         — index specific articles
 *   { pingOnly: true }        — just ping Google + Bing sitemaps
 *   { latest: number }        — index N most recently published articles
 *
 * Example:
 *   curl -X POST https://dropolis.net/api/indexing/trigger \
 *     -H "Content-Type: application/json" \
 *     -d '{"ids":[123,124,125]}'
 */
router.post("/indexing/trigger", async (req, res) => {
  const body = req.body as { ids?: unknown; pingOnly?: unknown; latest?: unknown };

  if (body.pingOnly === true) {
    void pingSitemaps();
    res.json({ ok: true, action: "sitemap-ping" });
    return;
  }

  if (typeof body.latest === "number" && body.latest > 0) {
    const limit = Math.min(body.latest, 50);
    const articles = await db
      .select({ id: articlesTable.id })
      .from(articlesTable)
      .orderBy(desc(articlesTable.createdAt))
      .limit(limit);

    for (const a of articles) {
      void autoIndexArticle(a.id);
    }
    req.log.info({ count: articles.length }, "Indexing latest articles triggered");
    res.json({ ok: true, triggered: articles.length, ids: articles.map((a) => a.id) });
    return;
  }

  if (!Array.isArray(body.ids) || body.ids.length === 0) {
    res.status(400).json({
      error: "Provide one of: ids (number[]), pingOnly (true), or latest (number)",
    });
    return;
  }

  const validIds = body.ids.filter(
    (id): id is number => typeof id === "number" && Number.isInteger(id) && id > 0
  );
  if (validIds.length === 0) {
    res.status(400).json({ error: "No valid positive integer IDs provided" });
    return;
  }

  const articles = await db
    .select({ id: articlesTable.id })
    .from(articlesTable)
    .where(inArray(articlesTable.id, validIds));

  for (const a of articles) {
    void autoIndexArticle(a.id);
  }

  req.log.info({ ids: articles.map((a) => a.id) }, "Manual indexing trigger");
  res.json({ ok: true, triggered: articles.length, ids: articles.map((a) => a.id) });
});

/**
 * GET /api/indexing/status
 * Returns the last 200 indexing events (in-memory, resets on server restart).
 */
router.get("/indexing/status", (_req, res) => {
  const events = getRecentIndexingEvents();
  const summary = {
    total: events.length,
    ok: events.filter((e) => e.status === "ok").length,
    fail: events.filter((e) => e.status === "fail").length,
    skipped: events.filter((e) => e.status === "skipped").length,
    googleIndexingApiEnabled:
      !!(process.env.GOOGLE_INDEXING_CLIENT_EMAIL && process.env.GOOGLE_INDEXING_PRIVATE_KEY),
  };
  res.json({ summary, events });
});

export default router;
