import { Router } from "express";
import { requireAdmin } from "../lib/admin-auth.js";
import { sanitizeArticleData } from "../lib/seo-sanitizer.js";

const router = Router();

/**
 * POST /api/admin/seo-sanitize
 *
 * Preview-only endpoint: runs the full SEO sanitizer pipeline and returns
 * the cleaned fields + a list of changes made — without saving anything to DB.
 *
 * The admin editor calls this when the user clicks "✨ SEO Fix", applies
 * the result to the form, and then lets the user review before saving.
 */
router.post("/admin/seo-sanitize", requireAdmin, (req, res) => {
  const body = req.body as Record<string, string | null | undefined>;
  const { title, content, excerpt, metaDescription, seoTitle, tags, villageName, category } = body;

  if (!title && !content) {
    res.status(400).json({ error: "Απαιτείται τουλάχιστον title ή content" });
    return;
  }

  const result = sanitizeArticleData(
    {
      title:           title           ?? undefined,
      content:         content         ?? undefined,
      excerpt:         excerpt         ?? undefined,
      metaDescription: metaDescription ?? undefined,
      seoTitle:        seoTitle        ?? undefined,
      tags:            tags            ?? undefined,
      villageName:     villageName     ?? undefined,
      category:        category        ?? undefined,
    },
    { autoFill: true },
  );

  res.json(result);
});

export default router;
