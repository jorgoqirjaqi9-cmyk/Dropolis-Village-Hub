import { Router } from "express";
import { db } from "@workspace/db";
import { articlesTable, villagesTable, photosTable, videosTable, submittedVideosTable, chatMessagesTable } from "@workspace/db";
import { eq, and, gte, count } from "drizzle-orm";
import { sql } from "drizzle-orm";

const router = Router();

router.get("/stats", async (req, res) => {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const [
    [articlesRow],
    [villagesRow],
    [photosRow],
    [ytVideosRow],
    [svVideosRow],
    [messagesRow],
    [recentRow],
    [featuredRow],
  ] = await Promise.all([
    db.select({ count: count() }).from(articlesTable),
    db.select({ count: count() }).from(villagesTable),
    db.select({ count: count() }).from(photosTable).where(eq(photosTable.status, "approved")),
    db.select({ count: count() }).from(videosTable),
    db.select({ count: count() }).from(submittedVideosTable).where(eq(submittedVideosTable.status, "approved")),
    db.select({ count: count() }).from(chatMessagesTable),
    db.select({ count: count() }).from(articlesTable).where(gte(articlesTable.createdAt, oneWeekAgo)),
    db.select({ count: count() }).from(articlesTable).where(eq(articlesTable.featured, true)),
  ]);

  res.json({
    totalArticles: articlesRow.count,
    totalVillages: villagesRow.count,
    totalPhotos: photosRow.count,
    totalVideos: ytVideosRow.count + svVideosRow.count,
    totalMessages: messagesRow.count,
    recentArticles: recentRow.count,
    featuredCount: featuredRow.count,
  });
});

export default router;
