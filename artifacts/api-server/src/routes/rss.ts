import { Router } from "express";
import { fetchAllFeeds, retranslateEnglishArticles } from "../rss-fetcher.js";

const router = Router();

router.post("/rss/import", async (req, res) => {
  try {
    void fetchAllFeeds();
    res.json({ ok: true, message: "RSS import started in background" });
  } catch (err) {
    req.log.error({ err }, "Failed to trigger RSS import");
    res.status(500).json({ ok: false, error: "Failed to start import" });
  }
});

router.post("/rss/retranslate", async (req, res) => {
  try {
    void retranslateEnglishArticles();
    res.json({ ok: true, message: "Retranslation started in background" });
  } catch (err) {
    req.log.error({ err }, "Failed to trigger retranslation");
    res.status(500).json({ ok: false, error: "Failed to start retranslation" });
  }
});

export default router;
