import { Router } from "express";
import { GoogleGenAI } from "@google/genai";
import { db, articlesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger.js";
import { requireAdmin } from "../lib/admin-auth.js";

const router = Router();

router.post("/social/publish/:id", requireAdmin, async (req, res) => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Μη έγκυρο αναγνωριστικό" });
    return;
  }

  const [article] = await db.select().from(articlesTable).where(eq(articlesTable.id, id));
  if (!article) {
    res.status(404).json({ error: "Άρθρο δεν βρέθηκε" });
    return;
  }

  const articleUrl = `https://dropolis.net/news/${article.id}`;
  const title = article.seoTitle || article.title;
  const summary = article.metaDescription || article.excerpt || article.content.slice(0, 300);

  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Είσαι υπεύθυνος social media για το ειδησεογραφικό portal "Δρόπολη" (dropolis.net) που καλύπτει τα χωριά της Δρόπολης στη Β. Ήπειρο.

Δημιούργησε περιεχόμενο για δημοσίευση στα social media για το παρακάτω άρθρο. Χρησιμοποίησε αποκλειστικά Νέα Ελληνικά.

Τίτλος: ${title}
Περίληψη: ${summary}
Σύνδεσμος: ${articleUrl}
Κατηγορία: ${article.category}

Επέστρεψε ΜΟΝΟ ένα JSON αντικείμενο (χωρίς markdown fences) με τα παρακάτω πεδία:
- "fbPost": κείμενο για Facebook (2-3 παράγραφοι, ελκυστικό, με call-to-action και τον σύνδεσμο στο τέλος)
- "shortCaption": σύντομο κείμενο 1-2 προτάσεων για Instagram/Twitter
- "hashtags": πίνακας 12-15 hashtags (mix ελληνικών και αγγλικών, σχετικά με Δρόπολη/Αλβανία/Β.Ήπειρο)`;

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-lite",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { responseMimeType: "application/json", maxOutputTokens: 2048 },
      });

      const raw = (response.text ?? "{}")
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```\s*$/i, "")
        .trim();
      const parsed = JSON.parse(raw) as { fbPost?: string; shortCaption?: string; hashtags?: string[] };

      if (parsed.fbPost && parsed.shortCaption && Array.isArray(parsed.hashtags)) {
        res.json({
          articleId: article.id,
          articleTitle: article.title,
          fbPost: parsed.fbPost,
          shortCaption: parsed.shortCaption,
          hashtags: parsed.hashtags,
        });
        logger.info({ id, title: article.title }, "Social post generated via Gemini");
        return;
      }
    } catch (err) {
      logger.warn({ err, id }, "Gemini social post generation failed — using fallback");
    }
  }

  // Fallback — simple template-based generation
  const hashtags = [
    "#Δρόπολη", "#Dropolis", "#ΒόρειαΉπειρος",
    "#Αλβανία", "#Albania", "#Ήπειρος",
    "#Epirus", "#ΕλληνισμόςΑλβανίας", "#Greeks",
    `#${article.category.replace(/\s+/g, "")}`,
    "#ΕλληνικάΝέα", "#GreekNews", "#Δήμος",
  ];

  res.json({
    articleId: article.id,
    articleTitle: article.title,
    fbPost: `📰 ${title}\n\n${summary}\n\n👉 Διαβάστε ολόκληρο το άρθρο: ${articleUrl}\n\n${hashtags.slice(0, 5).join(" ")}`,
    shortCaption: `${summary.slice(0, 150)}... 👉 ${articleUrl}`,
    hashtags,
  });
});

export default router;
