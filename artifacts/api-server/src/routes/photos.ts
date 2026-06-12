import { Router } from "express";
import { db } from "@workspace/db";
import { photosTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  ListPhotosQueryParams,
  CreatePhotoBody,
  GetPhotoParams,
  DeletePhotoParams,
} from "@workspace/api-zod";
import { requireAdmin } from "../lib/admin-auth.js";

const router = Router();
const DEFAULT_PHOTO_LIMIT = 100;
const MAX_PHOTO_LIMIT = 300;
const MAX_PHOTO_OFFSET = 10_000;

router.get("/photos", async (req, res) => {
  const query = ListPhotosQueryParams.parse(req.query);
  const limit = Math.min(Math.max(query.limit ?? DEFAULT_PHOTO_LIMIT, 1), MAX_PHOTO_LIMIT);
  const offset = Math.min(Math.max(query.offset ?? 0, 0), MAX_PHOTO_OFFSET);
  let q = db.select().from(photosTable);
  if (query.village_id) {
    q = q.where(eq(photosTable.villageId, query.village_id)) as typeof q;
  }
  const photos = await q
    .orderBy(photosTable.createdAt)
    .limit(limit)
    .offset(offset);
  res.json(photos.map(formatPhoto));
});

router.post("/photos", requireAdmin, async (req, res) => {
  const body = CreatePhotoBody.parse(req.body);
  const [photo] = await db.insert(photosTable).values({
    title: body.title,
    description: body.description ?? null,
    url: body.url,
    thumbnailUrl: body.thumbnailUrl ?? null,
    villageId: body.villageId ?? null,
    photographer: body.photographer ?? null,
  }).returning();
  res.status(201).json(formatPhoto(photo));
});

router.get("/photos/:id", async (req, res) => {
  const { id } = GetPhotoParams.parse({ id: Number(req.params.id) });
  const [photo] = await db.select().from(photosTable).where(eq(photosTable.id, id));
  if (!photo) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(formatPhoto(photo));
});

router.delete("/photos/:id", requireAdmin, async (req, res) => {
  const { id } = DeletePhotoParams.parse({ id: Number(req.params.id) });
  await db.delete(photosTable).where(eq(photosTable.id, id));
  res.status(204).end();
});

function formatPhoto(p: typeof photosTable.$inferSelect) {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    url: p.url,
    thumbnailUrl: p.thumbnailUrl,
    villageId: p.villageId,
    villageName: p.villageName,
    photographer: p.photographer,
    createdAt: p.createdAt.toISOString(),
  };
}

export default router;
