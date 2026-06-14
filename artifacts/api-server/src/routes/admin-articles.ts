import { Router } from "express";
import { db, articlesTable } from "@workspace/db";
import { desc, eq, ilike, or, and, SQL } from "drizzle-orm";
import { requireAdmin } from "../lib/admin-auth.js";

const router = Router();

// Admin-only: list ALL articles (published + drafts), with search/filter
router.get("/admin/articles", requireAdmin, async (req, res) => {
  const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? "50"), 10) || 50, 1), 200);
  const offset = Math.max(parseInt(String(req.query.offset ?? "0"), 10) || 0, 0);
  const published = String(req.query.published ?? "all");
  const category = req.query.category ? String(req.query.category) : undefined;
  const search = req.query.search ? String(req.query.search) : undefined;

  const conditions: SQL<unknown>[] = [];
  if (published === "true") conditions.push(eq(articlesTable.published, true));
  if (published === "false") conditions.push(eq(articlesTable.published, false));
  if (category) conditions.push(eq(articlesTable.category, category));
  if (search) {
    const clause = or(
      ilike(articlesTable.title, `%${search}%`),
      ilike(articlesTable.author, `%${search}%`),
    );
    if (clause) conditions.push(clause);
  }

  const whereClause = conditions.length === 0
    ? undefined
    : conditions.length === 1
    ? conditions[0]
    : and(...(conditions as [SQL<unknown>, ...SQL<unknown>[]]))!;

  const rows = await db
    .select()
    .from(articlesTable)
    .where(whereClause)
    .orderBy(desc(articlesTable.createdAt))
    .limit(limit)
    .offset(offset);

  res.json(rows.map(formatArticle));
});

// Admin-only: get single article (including unpublished)
router.get("/admin/articles/:id", requireAdmin, async (req, res) => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: "Μη έγκυρο ID" }); return; }
  const [article] = await db.select().from(articlesTable).where(eq(articlesTable.id, id));
  if (!article) { res.status(404).json({ error: "Δεν βρέθηκε" }); return; }
  res.json(formatArticle(article));
});

function formatArticle(a: typeof articlesTable.$inferSelect) {
  return {
    id: a.id, title: a.title, excerpt: a.excerpt, content: a.content,
    category: a.category, author: a.author, imageUrl: a.imageUrl,
    villageName: a.villageName, tags: a.tags, seoTitle: a.seoTitle,
    metaDescription: a.metaDescription, slug: a.slug, score: a.score,
    viewCount: a.viewCount, published: a.published, featured: a.featured,
    createdAt: a.createdAt.toISOString(), updatedAt: a.updatedAt.toISOString(),
  };
}

export default router;
