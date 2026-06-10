import { Router } from "express";
import { db } from "@workspace/db";
import { videosTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  ListVideosQueryParams,
  CreateVideoBody,
} from "@workspace/api-zod";

const router = Router();

router.get("/videos", async (req, res) => {
  const query = ListVideosQueryParams.parse(req.query);
  let q = db.select().from(videosTable);
  if (query.village_id) {
    q = q.where(eq(videosTable.villageId, query.village_id)) as typeof q;
  }
  const videos = await q.orderBy(videosTable.createdAt).limit(query.limit ?? 200);
  res.json(videos.map(formatVideo));
});

router.post("/videos", async (req, res) => {
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
