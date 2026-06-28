import { Router } from "express";
import { db, articlesTable, villagesTable } from "@workspace/db";
import { desc, eq, ilike, or, and, SQL, sql, lt, isNull } from "drizzle-orm";
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

// One-time bulk data fix: unpublish thin articles + set village imageUrls + fix village 69
router.post("/admin/bulk-fix", requireAdmin, async (req, res) => {
  // 1. Unpublish all published articles with content < 300 chars
  const unpublished = await db
    .update(articlesTable)
    .set({ published: false })
    .where(and(eq(articlesTable.published, true), lt(sql`length(${articlesTable.content})`, 300)))
    .returning({ id: articlesTable.id });

  // 2. Set default imageUrl for villages missing one
  const defaultImage = "/images/travel-guide/dropolis-stone-village.webp";
  const villagesUpdated = await db
    .update(villagesTable)
    .set({ imageUrl: defaultImage })
    .where(isNull(villagesTable.imageUrl))
    .returning({ id: villagesTable.id });

  // 3. Fix village 69 (Βουλιαράτες): trim description to 149 chars
  const village69Desc =
    "Οι Βουλιαράτες αποτελούν ένα από τα πιο γνωστά χωριά της Δρόπολης, στην περιοχή της Βόρειας Ηπείρου. Το χωριό συνδέεται στενά με την ιστορία, την";
  await db
    .update(villagesTable)
    .set({ description: village69Desc })
    .where(eq(villagesTable.id, 69));

  res.json({
    ok: true,
    articlesUnpublished: unpublished.length,
    articleIds: unpublished.map((a) => a.id),
    villagesImageUpdated: villagesUpdated.length,
    village69DescLength: village69Desc.length,
  });
});

export default router;
