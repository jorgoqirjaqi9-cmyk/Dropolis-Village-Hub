import { Router } from "express";
import { fetchAllFeeds, retranslateEnglishArticles } from "../rss-fetcher.js";
import { requireAdmin } from "../lib/admin-auth.js";

const router = Router();

router.post("/rss/import", requireAdmin, async (req, res) => {
  try {
    void fetchAllFeeds();
    res.json({ ok: true, message: "RSS import started in background" });
  } catch (err) {
    req.log.error({ err }, "Failed to trigger RSS import");
    res.status(500).json({ ok: false, error: "Failed to start import" });
  }
});

router.post("/rss/retranslate", requireAdmin, async (req, res) => {
  try {
    void retranslateEnglishArticles();
    res.json({ ok: true, message: "Retranslation started in background" });
  } catch (err) {
    req.log.error({ err }, "Failed to trigger retranslation");
    res.status(500).json({ ok: false, error: "Failed to start retranslation" });
  }
});

export default router;
