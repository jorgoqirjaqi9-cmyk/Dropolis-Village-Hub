import { Router } from "express";
import { db } from "@workspace/db";
import { photosTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../lib/admin-auth.js";
import { ObjectStorageService } from "../lib/objectStorage.js";

const router = Router();
const objectStorageService = new ObjectStorageService();

// ---------------------------------------------------------------------------
// GET /admin/photos?status=pending|approved|rejected
// ---------------------------------------------------------------------------

router.get("/admin/photos", requireAdmin, async (req, res) => {
  const status =
    typeof req.query.status === "string" &&
    ["pending", "approved", "rejected"].includes(req.query.status)
      ? req.query.status
      : "pending";

  const photos = await db.select()
    .from(photosTable)
    .where(eq(photosTable.status, status))
    .orderBy(photosTable.createdAt);

  res.json(photos.map(formatAdminPhoto));
});

// ---------------------------------------------------------------------------
// PUT /admin/photos/:id/approve
// ---------------------------------------------------------------------------

router.put("/admin/photos/:id/approve", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [photo] = await db.select().from(photosTable).where(eq(photosTable.id, id));
  if (!photo) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const [updated] = await db.update(photosTable)
    .set({ status: "approved" })
    .where(eq(photosTable.id, id))
    .returning();

  res.json(formatAdminPhoto(updated));
});

// ---------------------------------------------------------------------------
// PUT /admin/photos/:id/reject — marks as rejected (keeps record + files)
// ---------------------------------------------------------------------------

router.put("/admin/photos/:id/reject", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [photo] = await db.select().from(photosTable).where(eq(photosTable.id, id));
  if (!photo) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const [updated] = await db.update(photosTable)
    .set({ status: "rejected" })
    .where(eq(photosTable.id, id))
    .returning();

  res.json(formatAdminPhoto(updated));
});

// ---------------------------------------------------------------------------
// DELETE /admin/photos/:id — permanently removes record + storage files
// ---------------------------------------------------------------------------

router.delete("/admin/photos/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [photo] = await db.select().from(photosTable).where(eq(photosTable.id, id));
  if (!photo) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  await db.delete(photosTable).where(eq(photosTable.id, id));

  // Delete files from GCS (best-effort — don't fail if file is already gone)
  if (photo.objectPath) {
    await objectStorageService.deleteObjectEntity(photo.objectPath);
  }
  if (photo.thumbnailObjectPath) {
    await objectStorageService.deleteObjectEntity(photo.thumbnailObjectPath);
  }

  res.status(204).end();
});

// ---------------------------------------------------------------------------
// PATCH /admin/photos/:id — update metadata (title, description, photographer)
// ---------------------------------------------------------------------------

router.patch("/admin/photos/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) { res.status(400).json({ error: "Invalid id" }); return; }

  const update: {
    title?: string;
    description?: string | null;
    photographer?: string | null;
  } = {};

  if ("title" in req.body && typeof req.body.title === "string" && req.body.title.trim()) {
    update.title = req.body.title.trim();
  }
  if ("description" in req.body) {
    update.description = req.body.description ? String(req.body.description) : null;
  }
  if ("photographer" in req.body) {
    update.photographer = req.body.photographer ? String(req.body.photographer) : null;
  }

  if (Object.keys(update).length === 0) { res.status(400).json({ error: "No fields to update" }); return; }

  const [updated] = await db.update(photosTable).set(update).where(eq(photosTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(formatAdminPhoto(updated));
});

// ---------------------------------------------------------------------------

function formatAdminPhoto(p: typeof photosTable.$inferSelect) {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    url: p.url,
    thumbnailUrl: p.thumbnailUrl,
    villageId: p.villageId,
    villageName: p.villageName,
    photographer: p.photographer,
    status: p.status,
    objectPath: p.objectPath,
    thumbnailObjectPath: p.thumbnailObjectPath,
    copyrightConfirmed: p.copyrightConfirmed,
    uploaderName: p.uploaderName,
    createdAt: p.createdAt.toISOString(),
  };
}

export default router;
