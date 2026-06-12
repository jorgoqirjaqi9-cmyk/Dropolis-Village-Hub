import { Router } from "express";
import { db } from "@workspace/db";
import { videosTable } from "@workspace/db";
import { eq } from "drizzle-orm";
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
  let q = db.select().from(videosTable);
  if (query.village_id) {
    q = q.where(eq(videosTable.villageId, query.village_id)) as typeof q;
  }
  const videos = await q.orderBy(videosTable.createdAt).limit(limit);
  res.json(videos.map(formatVideo));
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
  res.status(201).json(formatVideo(video));
});

function formatVideo(v: typeof videosTable.$inferSelect) {
  return {
    id: v.id,
    title: v.title,
    description: v.description,
    youtubeId: v.youtubeId,
    villageId: v.villageId,
    villageName: v.villageName,
    duration: v.duration,
    createdAt: v.createdAt.toISOString(),
  };
}

export default router;
