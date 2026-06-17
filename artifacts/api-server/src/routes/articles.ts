import { Router } from "express";
import { db } from "@workspace/db";
import { articlesTable } from "@workspace/db";
import { eq, desc, and, sql } from "drizzle-orm";
import { autoIndexArticle } from "../lib/auto-indexing.js";
import { prerenderArticle, removeArticlePrerender } from "../lib/on-demand-prerender.js";
import { invalidateSitemapManifestCache } from "./sitemap.js";
import { requireAdmin } from "../lib/admin-auth.js";
import { postArticleToFacebook } from "../lib/facebook-poster.js";
import { sanitizeArticleData } from "../lib/seo-sanitizer.js";
import {
  ListArticlesQueryParams,
  CreateArticleBody,
  GetArticleParams,
  UpdateArticleParams,
  UpdateArticleBody,
  DeleteArticleParams,
} from "@workspace/api-zod";

const router = Router();
const DEFAULT_ARTICLE_LIMIT = 20;
const MAX_ARTICLE_LIMIT = 100;
const MAX_ARTICLE_OFFSET = 10_000;

router.get("/articles", async (req, res) => {
  const query = ListArticlesQueryParams.parse(req.query);
  const limit = Math.min(Math.max(query.limit ?? DEFAULT_ARTICLE_LIMIT, 1), MAX_ARTICLE_LIMIT);
  const offset = Math.min(Math.max(query.offset ?? 0, 0), MAX_ARTICLE_OFFSET);
  const conditions = [eq(articlesTable.published, true)];
  if (query.category) conditions.push(eq(articlesTable.category, query.category));
  if (query.village) conditions.push(eq(articlesTable.villageName, query.village));

  const articles = await db
    .select()
    .from(articlesTable)
    .where(and(...conditions))
    .orderBy(desc(articlesTable.createdAt))
    .limit(limit)
    .offset(offset);

  res.json(articles.map(formatArticle));
});

router.post("/articles", requireAdmin, async (req, res) => {
  const body = CreateArticleBody.parse(req.body);

  // Full SEO sanitizer pass on create: strips fluff, fixes typography,
  // enforces trailing slashes in body links, and auto-fills empty
  // metaDescription and tags so every article ships SEO-ready.
  const { changes: _c, ...s } = sanitizeArticleData(body, { autoFill: true });

  const [article] = await db.insert(articlesTable).values({
    title:           s.title           ?? body.title,
    excerpt:         s.excerpt         ?? body.excerpt         ?? null,
    content:         s.content         ?? body.content,
    category:        body.category,
    author:          body.author,
    imageUrl:        body.imageUrl                             ?? null,
    villageName:     s.villageName     ?? body.villageName     ?? null,
    tags:            s.tags            ?? body.tags            ?? null,
    seoTitle:        s.seoTitle        ?? body.seoTitle        ?? null,
    metaDescription: s.metaDescription ?? body.metaDescription ?? null,
    slug:            body.slug                                 ?? null,
    published:       body.published                            ?? true,
    featured:        body.featured                             ?? false,
  }).returning();

  if (article.published) {
    void prerenderArticle({
      id: article.id,
      title: article.title,
      excerpt: article.excerpt,
      content: article.content,
      imageUrl: article.imageUrl,
      author: article.author,
      category: article.category,
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
    });
    void autoIndexArticle(article.id);
    void postArticleToFacebook(article);
  }
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
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 30);
  const articles = await db
    .select()
    .from(articlesTable)
    .where(eq(articlesTable.published, true))
    .orderBy(desc(articlesTable.score), desc(articlesTable.viewCount))
    .limit(limit);
  res.json(articles.map(formatArticle));
});

router.post("/articles/recalculate-scores", requireAdmin, async (req, res) => {
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
  const articles = await db.select({ category: articlesTable.category }).from(articlesTable).where(eq(articlesTable.published, true));
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
  if (!article || !article.published) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  await db.update(articlesTable).set({ viewCount: article.viewCount + 1 }).where(eq(articlesTable.id, id));
  res.json(formatArticle({ ...article, viewCount: article.viewCount + 1 }));
});

router.patch("/articles/:id", requireAdmin, async (req, res) => {
  const { id } = UpdateArticleParams.parse({ id: Number(req.params.id) });
  const body = UpdateArticleBody.parse(req.body);

  // Conservative sanitizer pass on update (autoFill:false = never inject new
  // fields on partial PATCH — only clean what was explicitly provided).
  const { changes: _c, ...s } = sanitizeArticleData(body, { autoFill: false });
  const patchBody = {
    ...body,
    // Only override a field if the sanitizer produced a non-null value.
    // title/content are non-nullable DB columns → use != null (excludes both null and undefined).
    // Nullable columns (excerpt, metaDescription, tags, villageName) use !== undefined.
    ...(s.title           != null      && { title:           s.title }),
    ...(s.content         != null      && { content:         s.content }),
    ...(s.excerpt         !== undefined && { excerpt:         s.excerpt }),
    ...(s.metaDescription !== undefined && { metaDescription: s.metaDescription }),
    ...(s.tags            !== undefined && { tags:            s.tags }),
    ...(s.villageName     !== undefined && { villageName:     s.villageName }),
  };

  // Read current published state before update to detect false → true transition
  const [existing] = await db
    .select({ published: articlesTable.published })
    .from(articlesTable)
    .where(eq(articlesTable.id, id));
  const wasPublished = existing?.published ?? false;

  const [article] = await db
    .update(articlesTable)
    .set({ ...patchBody, updatedAt: new Date() })
    .where(eq(articlesTable.id, id))
    .returning();
  if (!article) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  if (article.published) {
    void prerenderArticle({
      id: article.id,
      title: article.title,
      excerpt: article.excerpt,
      content: article.content,
      imageUrl: article.imageUrl,
      author: article.author,
      category: article.category,
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
    });
    void autoIndexArticle(article.id);
    if (!wasPublished) {
      void postArticleToFacebook(article);
    }
  } else {
    void removeArticlePrerender(article.id);
    invalidateSitemapManifestCache();
  }
  res.json(formatArticle(article));
});

router.delete("/articles/:id", requireAdmin, async (req, res) => {
  const { id } = DeleteArticleParams.parse({ id: Number(req.params.id) });
  await db.delete(articlesTable).where(eq(articlesTable.id, id));
  void removeArticlePrerender(id);
  invalidateSitemapManifestCache();
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
