import { Router } from "express";
import { pool } from "@workspace/db";
import { requireAdmin } from "../lib/admin-auth.js";

const router = Router();

router.post("/pwa/install", async (req, res) => {
  const platform = typeof req.body?.platform === "string" ? req.body.platform : "unknown";
  const safe = ["ios", "android", "desktop", "unknown"].includes(platform) ? platform : "unknown";
  await pool.query("INSERT INTO pwa_installs (platform) VALUES ($1)", [safe]);
  res.status(201).json({ ok: true });
});

router.get("/admin/pwa/stats", requireAdmin, async (_req, res) => {
  const total = await pool.query<{ count: string }>("SELECT COUNT(*)::int AS count FROM pwa_installs");
  const byPlatform = await pool.query<{ platform: string; count: string }>(
    "SELECT platform, COUNT(*)::int AS count FROM pwa_installs GROUP BY platform ORDER BY count DESC"
  );
  const last30 = await pool.query<{ count: string }>(
    "SELECT COUNT(*)::int AS count FROM pwa_installs WHERE installed_at >= NOW() - INTERVAL '30 days'"
  );
  res.json({
    total: Number(total.rows[0]?.count ?? 0),
    last30Days: Number(last30.rows[0]?.count ?? 0),
    byPlatform: byPlatform.rows.map((r) => ({ platform: r.platform, count: Number(r.count) })),
  });
});

export default router;
