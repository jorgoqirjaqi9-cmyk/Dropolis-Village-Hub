import { Router } from "express";
import { db } from "@workspace/db";
import {
  contentVotesTable,
  photosTable,
  videosTable,
  submittedVideosTable,
  articlesTable,
} from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { CastVoteBody } from "@workspace/api-zod";
import rateLimit from "express-rate-limit";

const router = Router();

const voteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Πάρα πολλές ψήφοι. Δοκιμάστε ξανά σε λίγο." },
});

router.post("/votes", voteLimiter, async (req, res) => {
  const body = CastVoteBody.parse(req.body);
  const { contentType, contentId, voteType, voterKey } = body;

  if (!voterKey || voterKey.length < 8 || voterKey.length > 128) {
    res.status(400).json({ error: "Μη έγκυρο voterKey." });
    return;
  }

  // Verify content is public/approved
  const exists = await checkContentPublic(contentType, contentId);
  if (!exists) {
    res.status(404).json({ error: "Το περιεχόμενο δεν βρέθηκε ή δεν είναι δημόσιο." });
    return;
  }

  // Find existing vote
  const [existing] = await db
    .select()
    .from(contentVotesTable)
    .where(
      and(
        eq(contentVotesTable.contentType, contentType),
        eq(contentVotesTable.contentId, contentId),
        eq(contentVotesTable.voterKey, voterKey),
      ),
    )
    .limit(1);

  let likesChange = 0;
  let dislikesChange = 0;

  if (!existing) {
    await db.insert(contentVotesTable).values({ contentType, contentId, voterKey, voteType });
    if (voteType === "like") likesChange = 1;
    else dislikesChange = 1;
  } else if (existing.voteType === voteType) {
    // Toggle off
    await db.delete(contentVotesTable).where(eq(contentVotesTable.id, existing.id));
    if (voteType === "like") likesChange = -1;
    else dislikesChange = -1;
  } else {
    // Switch vote
    await db
      .update(contentVotesTable)
      .set({ voteType, updatedAt: new Date() })
      .where(eq(contentVotesTable.id, existing.id));
    if (voteType === "like") { likesChange = 1; dislikesChange = -1; }
    else { likesChange = -1; dislikesChange = 1; }
  }

  const counts = await applyAndGetCounts(contentType, contentId, likesChange, dislikesChange);
  res.json(counts);
});

async function checkContentPublic(contentType: string, contentId: number): Promise<boolean> {
  if (contentType === "photo") {
    const [row] = await db.select({ id: photosTable.id }).from(photosTable)
      .where(eq(photosTable.id, contentId)).limit(1);
    return !!row;
  }
  if (contentType === "youtube_video") {
    const [row] = await db.select({ id: videosTable.id }).from(videosTable)
      .where(eq(videosTable.id, contentId)).limit(1);
    return !!row;
  }
  if (contentType === "uploaded_video") {
    const [row] = await db.select({ id: submittedVideosTable.id }).from(submittedVideosTable)
      .where(and(eq(submittedVideosTable.id, contentId), eq(submittedVideosTable.status, "approved")))
      .limit(1);
    return !!row;
  }
  if (contentType === "news") {
    const [row] = await db.select({ id: articlesTable.id }).from(articlesTable)
      .where(and(eq(articlesTable.id, contentId), eq(articlesTable.published, true)))
      .limit(1);
    return !!row;
  }
  return false;
}

async function applyAndGetCounts(
  contentType: string,
  contentId: number,
  likesChange: number,
  dislikesChange: number,
): Promise<{ likesCount: number; dislikesCount: number }> {
  if (contentType === "photo") {
    const [row] = await db
      .update(photosTable)
      .set({
        likes: sql`GREATEST(0, likes + ${likesChange})`,
        dislikes: sql`GREATEST(0, dislikes + ${dislikesChange})`,
      })
      .where(eq(photosTable.id, contentId))
      .returning({ likes: photosTable.likes, dislikes: photosTable.dislikes });
    return { likesCount: row?.likes ?? 0, dislikesCount: row?.dislikes ?? 0 };
  }
  if (contentType === "youtube_video") {
    const [row] = await db
      .update(videosTable)
      .set({
        likesCount: sql`GREATEST(0, likes_count + ${likesChange})`,
        dislikesCount: sql`GREATEST(0, dislikes_count + ${dislikesChange})`,
      })
      .where(eq(videosTable.id, contentId))
      .returning({ likesCount: videosTable.likesCount, dislikesCount: videosTable.dislikesCount });
    return { likesCount: row?.likesCount ?? 0, dislikesCount: row?.dislikesCount ?? 0 };
  }
  if (contentType === "uploaded_video") {
    const [row] = await db
      .update(submittedVideosTable)
      .set({
        likesCount: sql`GREATEST(0, likes_count + ${likesChange})`,
        dislikesCount: sql`GREATEST(0, dislikes_count + ${dislikesChange})`,
      })
      .where(eq(submittedVideosTable.id, contentId))
      .returning({ likesCount: submittedVideosTable.likesCount, dislikesCount: submittedVideosTable.dislikesCount });
    return { likesCount: row?.likesCount ?? 0, dislikesCount: row?.dislikesCount ?? 0 };
  }
  if (contentType === "news") {
    const [row] = await db
      .update(articlesTable)
      .set({
        likesCount: sql`GREATEST(0, likes_count + ${likesChange})`,
        dislikesCount: sql`GREATEST(0, dislikes_count + ${dislikesChange})`,
      })
      .where(eq(articlesTable.id, contentId))
      .returning({ likesCount: articlesTable.likesCount, dislikesCount: articlesTable.dislikesCount });
    return { likesCount: row?.likesCount ?? 0, dislikesCount: row?.dislikesCount ?? 0 };
  }
  return { likesCount: 0, dislikesCount: 0 };
}

export default router;
