import { Router } from "express";
import { db } from "@workspace/db";
import {
  articlesTable, villagesTable, photosTable, videosTable,
  newsSubmissionsTable, submittedVideosTable, eventsTable,
} from "@workspace/db";
import { eq, and, count, desc, gte } from "drizzle-orm";
import { requireAdmin } from "../lib/admin-auth.js";

const router = Router();

router.get("/admin/dashboard", requireAdmin, async (req, res) => {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const [
    [totalArticles],
    [publishedArticles],
    [draftArticles],
    [featuredArticles],
    [totalVillages],
    [approvedPhotos],
    [pendingPhotos],
    [totalVideos],
    [pendingSubmittedVideos],
    [pendingNews],
    [recentArticles],
    [approvedEvents],
    [pendingEvents],
    latestArticles,
  ] = await Promise.all([
    db.select({ count: count() }).from(articlesTable),
    db.select({ count: count() }).from(articlesTable).where(eq(articlesTable.published, true)),
    db.select({ count: count() }).from(articlesTable).where(eq(articlesTable.published, false)),
    db.select({ count: count() }).from(articlesTable).where(and(eq(articlesTable.featured, true), eq(articlesTable.published, true))),
    db.select({ count: count() }).from(villagesTable),
    db.select({ count: count() }).from(photosTable).where(eq(photosTable.status, "approved")),
    db.select({ count: count() }).from(photosTable).where(eq(photosTable.status, "pending")),
    db.select({ count: count() }).from(videosTable),
    db.select({ count: count() }).from(submittedVideosTable).where(eq(submittedVideosTable.status, "pending")),
    db.select({ count: count() }).from(newsSubmissionsTable).where(eq(newsSubmissionsTable.status, "pending")),
    db.select({ count: count() }).from(articlesTable).where(gte(articlesTable.createdAt, oneWeekAgo)),
    db.select({ count: count() }).from(eventsTable).where(eq(eventsTable.status, "approved")),
    db.select({ count: count() }).from(eventsTable).where(eq(eventsTable.status, "pending")),
    db.select({
      id: articlesTable.id, title: articlesTable.title,
      category: articlesTable.category, published: articlesTable.published,
      createdAt: articlesTable.createdAt,
    }).from(articlesTable).orderBy(desc(articlesTable.createdAt)).limit(8),
  ]);

  const pendingApprovals =
    (pendingPhotos?.count ?? 0) +
    (pendingSubmittedVideos?.count ?? 0) +
    (pendingNews?.count ?? 0) +
    (pendingEvents?.count ?? 0);

  res.json({
    articles: {
      total: totalArticles?.count ?? 0,
      published: publishedArticles?.count ?? 0,
      draft: draftArticles?.count ?? 0,
      featured: featuredArticles?.count ?? 0,
      recentWeek: recentArticles?.count ?? 0,
    },
    villages: { total: totalVillages?.count ?? 0 },
    photos: { approved: approvedPhotos?.count ?? 0, pending: pendingPhotos?.count ?? 0 },
    videos: { total: totalVideos?.count ?? 0, pendingSubmissions: pendingSubmittedVideos?.count ?? 0 },
    events: { approved: approvedEvents?.count ?? 0, pending: pendingEvents?.count ?? 0 },
    pendingApprovals,
    pendingNewsSubmissions: pendingNews?.count ?? 0,
    latestArticles: latestArticles.map((a) => ({
      id: a.id, title: a.title, category: a.category,
      published: a.published, createdAt: a.createdAt.toISOString(),
    })),
  });
});

export default router;
