import { Router } from "express";
import { db } from "@workspace/db";
import { photosTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  ListPhotosQueryParams,
  CreatePhotoBody,
  GetPhotoParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/photos", async (req, res) => {
  const query = ListPhotosQueryParams.parse(req.query);
  let q = db.select().from(photosTable);
  if (query.village_id) {
    q = q.where(eq(photosTable.villageId, query.village_id)) as typeof q;
  }
  const photos = await q
    .orderBy(photosTable.createdAt)
    .limit(query.limit ?? 500)
    .offset(query.offset ?? 0);
  res.json(photos.map(formatPhoto));
});

router.post("/photos", async (req, res) => {
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
