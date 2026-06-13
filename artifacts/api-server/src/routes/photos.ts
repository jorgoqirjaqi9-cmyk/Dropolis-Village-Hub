import { Router } from "express";
import { db } from "@workspace/db";
import { photosTable, villagesTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import rateLimit from "express-rate-limit";
import {
  ListPhotosQueryParams,
  CreatePhotoBody,
  GetPhotoParams,
  DeletePhotoParams,
  RequestPhotoUploadUrlBody,
  SubmitPhotoBody,
} from "@workspace/api-zod";
import { requireAdmin } from "../lib/admin-auth.js";
import { ObjectStorageService } from "../lib/objectStorage.js";

const router = Router();
const objectStorageService = new ObjectStorageService();

const DEFAULT_PHOTO_LIMIT = 100;
const MAX_PHOTO_LIMIT = 300;
const MAX_PHOTO_OFFSET = 10_000;
const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3 MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

// Rate limit: upload-url allows 2 calls per submission (main + thumbnail), 3 submissions/h = 6 calls
const uploadUrlRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Πολλές αιτήσεις. Δοκιμάστε ξανά σε 1 ώρα." },
});

// Stricter limit on actual submissions: 3 per hour per IP
const submitRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Έχετε φτάσει το όριο υποβολών. Δοκιμάστε ξανά σε 1 ώρα." },
});

// Voting: 60 requests per hour per IP (like/dislike/toggle actions)
const voteRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Πολλές ψήφοι. Δοκιμάστε ξανά σε 1 ώρα." },
});

// ---------------------------------------------------------------------------
// GET /photos — approved only
// ---------------------------------------------------------------------------

router.get("/photos", async (req, res) => {
  const query = ListPhotosQueryParams.parse(req.query);
  const limit = Math.min(Math.max(query.limit ?? DEFAULT_PHOTO_LIMIT, 1), MAX_PHOTO_LIMIT);
  const offset = Math.min(Math.max(query.offset ?? 0, 0), MAX_PHOTO_OFFSET);

  const conditions = [eq(photosTable.status, "approved")];
  if (query.village_id) {
    conditions.push(eq(photosTable.villageId, query.village_id));
  }

  const photos = await db.select()
    .from(photosTable)
    .where(and(...conditions))
    .orderBy(photosTable.createdAt)
    .limit(limit)
    .offset(offset);

  res.json(photos.map(formatPhoto));
});

// ---------------------------------------------------------------------------
// POST /photos/upload-url — rate-limited presigned URL (validates type + size)
// ---------------------------------------------------------------------------

router.post("/photos/upload-url", uploadUrlRateLimit, async (req, res) => {
  const parsed = RequestPhotoUploadUrlBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Λείπουν υποχρεωτικά πεδία (name, size, contentType)" });
    return;
  }

  const { size, contentType } = parsed.data;

  if (!ALLOWED_TYPES.has(contentType)) {
    res.status(400).json({ error: "Μόνο JPG, PNG και WEBP επιτρέπονται." });
    return;
  }

  if (size > MAX_FILE_SIZE) {
    res.status(400).json({ error: "Το αρχείο δεν πρέπει να υπερβαίνει τα 3 MB." });
    return;
  }

  try {
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);
    res.json({ uploadURL, objectPath });
  } catch (err) {
    req.log.error({ err }, "Error generating photo upload URL");
    res.status(500).json({ error: "Αποτυχία δημιουργίας URL αποστολής." });
  }
});

// ---------------------------------------------------------------------------
// POST /photos/submit — rate-limited public submission
// ---------------------------------------------------------------------------

router.post("/photos/submit", submitRateLimit, async (req, res) => {
  const parsed = SubmitPhotoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Μη έγκυρα δεδομένα υποβολής." });
    return;
  }

  const { title, objectPath, thumbnailObjectPath, villageId, villageName, photographer, uploaderName, copyrightConfirmed } =
    parsed.data;

  if (!copyrightConfirmed) {
    res.status(400).json({ error: "Απαιτείται αποδοχή δήλωσης πνευματικών δικαιωμάτων." });
    return;
  }

  // Resolve villageName if not provided
  let resolvedVillageName = villageName ?? null;
  if (villageId && !resolvedVillageName) {
    const [village] = await db.select({ name: villagesTable.name })
      .from(villagesTable)
      .where(eq(villagesTable.id, villageId));
    resolvedVillageName = village?.name ?? null;
  }

  // The serving URL is /api/storage + objectPath
  const url = `/api/storage${objectPath}`;
  const thumbnailUrl = thumbnailObjectPath ? `/api/storage${thumbnailObjectPath}` : null;

  const [photo] = await db.insert(photosTable).values({
    title,
    url,
    objectPath,
    thumbnailObjectPath: thumbnailObjectPath ?? null,
    thumbnailUrl,
    villageId: villageId ?? null,
    villageName: resolvedVillageName,
    photographer: photographer ?? null,
    uploaderName: uploaderName ?? null,
    copyrightConfirmed,
    status: "pending",
  }).returning();

  res.status(201).json(formatPhoto(photo));
});

// ---------------------------------------------------------------------------
// POST /photos — admin-only direct creation (existing)
// ---------------------------------------------------------------------------

router.post("/photos", requireAdmin, async (req, res) => {
  const body = CreatePhotoBody.parse(req.body);
  const [photo] = await db.insert(photosTable).values({
    title: body.title,
    description: body.description ?? null,
    url: body.url,
    thumbnailUrl: body.thumbnailUrl ?? null,
    villageId: body.villageId ?? null,
    photographer: body.photographer ?? null,
    status: "approved",
  }).returning();
  res.status(201).json(formatPhoto(photo));
});

// ---------------------------------------------------------------------------
// GET /photos/:id
// ---------------------------------------------------------------------------

router.get("/photos/:id", async (req, res) => {
  const { id } = GetPhotoParams.parse({ id: Number(req.params.id) });
  const [photo] = await db.select().from(photosTable)
    .where(and(eq(photosTable.id, id), eq(photosTable.status, "approved")));
  if (!photo) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(formatPhoto(photo));
});

// ---------------------------------------------------------------------------
// POST /photos/:id/like — add like
// DELETE /photos/:id/like — remove like
// POST /photos/:id/dislike — add dislike
// DELETE /photos/:id/dislike — remove dislike
// ---------------------------------------------------------------------------

async function photoExists(id: number): Promise<boolean> {
  const [row] = await db.select({ id: photosTable.id }).from(photosTable)
    .where(and(eq(photosTable.id, id), eq(photosTable.status, "approved")));
  return !!row;
}

router.post("/photos/:id/like", voteRateLimit, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) { res.status(400).json({ error: "Invalid id" }); return; }
  if (!await photoExists(id)) { res.status(404).json({ error: "Not found" }); return; }
  const [row] = await db.update(photosTable)
    .set({ likes: sql`${photosTable.likes} + 1` })
    .where(eq(photosTable.id, id))
    .returning({ likes: photosTable.likes, dislikes: photosTable.dislikes });
  res.json(row);
});

router.delete("/photos/:id/like", voteRateLimit, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) { res.status(400).json({ error: "Invalid id" }); return; }
  if (!await photoExists(id)) { res.status(404).json({ error: "Not found" }); return; }
  const [row] = await db.update(photosTable)
    .set({ likes: sql`GREATEST(0, ${photosTable.likes} - 1)` })
    .where(eq(photosTable.id, id))
    .returning({ likes: photosTable.likes, dislikes: photosTable.dislikes });
  res.json(row);
});

router.post("/photos/:id/dislike", voteRateLimit, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) { res.status(400).json({ error: "Invalid id" }); return; }
  if (!await photoExists(id)) { res.status(404).json({ error: "Not found" }); return; }
  const [row] = await db.update(photosTable)
    .set({ dislikes: sql`${photosTable.dislikes} + 1` })
    .where(eq(photosTable.id, id))
    .returning({ likes: photosTable.likes, dislikes: photosTable.dislikes });
  res.json(row);
});

router.delete("/photos/:id/dislike", voteRateLimit, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) { res.status(400).json({ error: "Invalid id" }); return; }
  if (!await photoExists(id)) { res.status(404).json({ error: "Not found" }); return; }
  const [row] = await db.update(photosTable)
    .set({ dislikes: sql`GREATEST(0, ${photosTable.dislikes} - 1)` })
    .where(eq(photosTable.id, id))
    .returning({ likes: photosTable.likes, dislikes: photosTable.dislikes });
  res.json(row);
});

// ---------------------------------------------------------------------------
// DELETE /photos/:id — admin-only, also removes from storage
// ---------------------------------------------------------------------------

router.delete("/photos/:id", requireAdmin, async (req, res) => {
  const { id } = DeletePhotoParams.parse({ id: Number(req.params.id) });
  const [photo] = await db.select().from(photosTable).where(eq(photosTable.id, id));
  if (!photo) {
    res.status(404).end();
    return;
  }
  await db.delete(photosTable).where(eq(photosTable.id, id));
  // Delete files from storage (best-effort, don't fail the request if missing)
  if (photo.objectPath) {
    await objectStorageService.deleteObjectEntity(photo.objectPath);
  }
  if (photo.thumbnailObjectPath) {
    await objectStorageService.deleteObjectEntity(photo.thumbnailObjectPath);
  }
  res.status(204).end();
});

// ---------------------------------------------------------------------------

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
    likes: p.likes,
    dislikes: p.dislikes,
  };
}

export default router;
