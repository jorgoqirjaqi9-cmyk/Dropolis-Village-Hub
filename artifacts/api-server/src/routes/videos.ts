import { Router } from "express";
import { db } from "@workspace/db";
import { videosTable, submittedVideosTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  ListVideosQueryParams,
  CreateVideoBody,
} from "@workspace/api-zod";
import { requireAdmin } from "../lib/admin-auth.js";

const router = Router();
const DEFAULT_VIDEO_LIMIT = 100;
const MAX_VIDEO_LIMIT = 200;

router.get("/videos", async (req, res) => {
  const query = ListVideosQueryParams.parse(req.query);
  const limit = Math.min(Math.max(query.limit ?? DEFAULT_VIDEO_LIMIT, 1), MAX_VIDEO_LIMIT);

  // YouTube videos
  let ytQ = db.select().from(videosTable);
  if (query.village_id) {
    ytQ = ytQ.where(eq(videosTable.villageId, query.village_id)) as typeof ytQ;
  }
  const ytVideos = await ytQ.orderBy(videosTable.createdAt).limit(limit);

  // Approved submitted videos
  const svConditions = [eq(submittedVideosTable.status, "approved")];
  if (query.village_id) {
    svConditions.push(eq(submittedVideosTable.villageId, query.village_id));
  }
  const svVideos = await db
    .select()
    .from(submittedVideosTable)
    .where(and(...svConditions))
    .orderBy(submittedVideosTable.createdAt)
    .limit(limit);

  const merged = [
    ...ytVideos.map(formatYouTubeVideo),
    ...svVideos.map(formatSubmittedVideo),
  ].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).slice(0, limit);

  res.json(merged);
});

router.delete("/admin/videos/all", requireAdmin, async (req, res) => {
  const { count: ytCount } = await db.delete(videosTable).returning({ id: videosTable.id }).then(r => ({ count: r.length }));
  const { count: svCount } = await db.delete(submittedVideosTable).returning({ id: submittedVideosTable.id }).then(r => ({ count: r.length }));
  res.json({ deleted: { youtubeVideos: ytCount, submittedVideos: svCount } });
});

router.post("/videos", requireAdmin, async (req, res) => {
  const body = CreateVideoBody.parse(req.body);
  const [video] = await db.insert(videosTable).values({
    title: body.title,
    description: body.description ?? null,
    youtubeId: body.youtubeId,
    villageId: body.villageId ?? null,
    duration: body.duration ?? null,
  }).returning();
  res.status(201).json(formatYouTubeVideo(video));
});

function formatYouTubeVideo(v: typeof videosTable.$inferSelect) {
  return {
    id: v.id,
    title: v.title,
    description: v.description,
    youtubeId: v.youtubeId,
    videoUrl: null as string | null,
    thumbnailUrl: null as string | null,
    villageId: v.villageId,
    villageName: v.villageName,
    uploaderName: null as string | null,
    eventDate: null as string | null,
    duration: v.duration,
    contentType: "youtube_video" as const,
    likesCount: v.likesCount,
    dislikesCount: v.dislikesCount,
    createdAt: v.createdAt.toISOString(),
  };
}

function formatSubmittedVideo(sv: typeof submittedVideosTable.$inferSelect) {
  return {
    id: sv.id,
    title: sv.title,
    description: sv.description,
    youtubeId: null as string | null,
    videoUrl: sv.videoUrl,
    thumbnailUrl: sv.thumbnailUrl,
    villageId: sv.villageId,
    villageName: sv.villageName,
    uploaderName: sv.uploaderName,
    eventDate: sv.eventDate,
    duration: null as string | null,
    contentType: "uploaded_video" as const,
    likesCount: sv.likesCount,
    dislikesCount: sv.dislikesCount,
    createdAt: sv.createdAt.toISOString(),
  };
}

export default router;
