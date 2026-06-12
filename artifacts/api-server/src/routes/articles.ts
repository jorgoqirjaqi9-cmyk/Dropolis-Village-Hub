import { Router } from "express";
import { db } from "@workspace/db";
import { articlesTable } from "@workspace/db";
import { eq, desc, and, sql } from "drizzle-orm";
import { autoIndexArticle } from "../lib/auto-indexing.js";
import {
  ListArticlesQueryParams,
  CreateArticleBody,
  GetArticleParams,
  UpdateArticleParams,
  UpdateArticleBody,
  DeleteArticleParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/articles", async (req, res) => {
  const query = ListArticlesQueryParams.parse(req.query);
  const conditions = [];
  if (query.category) conditions.push(eq(articlesTable.category, query.category));
  if (query.village) conditions.push(eq(articlesTable.villageName, query.village));

  const articles = await db
    .select()
    .from(articlesTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(articlesTable.createdAt))
    .limit(query.limit ?? 20)
    .offset(query.offset ?? 0);

  res.json(articles.map(formatArticle));
});

router.post("/articles", async (req, res) => {
  const body = CreateArticleBody.parse(req.body);
  const [article] = await db.insert(articlesTable).values({
    title: body.title,
    excerpt: body.excerpt ?? null,
    content: body.content,
    category: body.category,
    author: body.author,
    imageUrl: body.imageUrl ?? null,
    villageName: body.villageName ?? null,
    tags: body.tags ?? null,
    seoTitle: body.seoTitle ?? null,
    metaDescription: body.metaDescription ?? null,
    slug: body.slug ?? null,
    published: body.published ?? true,
    featured: body.featured ?? false,
  }).returning();
  void autoIndexArticle(article.id);
  res.status(201).json(formatArticle(article));
});

router.get("/articles/featured", async (req, res) => {
  const articles = await db
    .select()
    .from(articlesTable)
    .where(and(eq(articlesTable.featured, true), eq(articlesTable.published, true)))
    .orderBy(desc(articlesTable.createdAt))
    .limit(6);
  res.json(articles.map(formatArticle));
});

router.get("/articles/trending", async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 10, 30);
  const articles = await db
    .select()
    .from(articlesTable)
    .where(eq(articlesTable.published, true))
    .orderBy(desc(articlesTable.score), desc(articlesTable.viewCount))
    .limit(limit);
  res.json(articles.map(formatArticle));
});

router.post("/articles/recalculate-scores", async (req, res) => {
  await db.execute(sql`
    UPDATE articles
    SET score = GREATEST(0,
      view_count * 2
      + CASE WHEN image_url IS NOT NULL THEN 20 ELSE 0 END
      + LEAST(CHAR_LENGTH(content) / 100, 20)
    )
  `);
  const [result] = await db.select({ count: sql<number>`COUNT(*)::int` }).from(articlesTable);
  res.json({ ok: true, updated: result?.count ?? 0 });
});

router.get("/articles/categories", async (req, res) => {
  const articles = await db.select({ category: articlesTable.category }).from(articlesTable);
  const counts: Record<string, number> = {};
  for (const a of articles) {
    counts[a.category] = (counts[a.category] ?? 0) + 1;
  }
  const categories = Object.entries(counts).map(([name, count]) => ({ name, count }));
  res.json(categories);
});

router.get("/articles/:id", async (req, res) => {
  const { id } = GetArticleParams.parse({ id: Number(req.params.id) });
  const [article] = await db.select().from(articlesTable).where(eq(articlesTable.id, id));
  if (!article) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  await db.update(articlesTable).set({ viewCount: article.viewCount + 1 }).where(eq(articlesTable.id, id));
  res.json(formatArticle({ ...article, viewCount: article.viewCount + 1 }));
});

router.patch("/articles/:id", async (req, res) => {
  const { id } = UpdateArticleParams.parse({ id: Number(req.params.id) });
  const body = UpdateArticleBody.parse(req.body);
  const [article] = await db
    .update(articlesTable)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(articlesTable.id, id))
    .returning();
  if (!article) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(formatArticle(article));
});

router.delete("/articles/:id", async (req, res) => {
  const { id } = DeleteArticleParams.parse({ id: Number(req.params.id) });
  await db.delete(articlesTable).where(eq(articlesTable.id, id));
  res.status(204).send();
});

function formatArticle(a: typeof articlesTable.$inferSelect) {
  return {
    id: a.id,
    title: a.title,
    excerpt: a.excerpt,
    content: a.content,
    category: a.category,
    author: a.author,
    imageUrl: a.imageUrl,
    villageName: a.villageName,
    tags: a.tags,
    seoTitle: a.seoTitle,
    metaDescription: a.metaDescription,
    slug: a.slug,
    score: a.score,
    viewCount: a.viewCount,
    published: a.published,
    featured: a.featured,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

export default router;
