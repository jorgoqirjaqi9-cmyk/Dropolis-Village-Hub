import { Router } from "express";
import { db } from "@workspace/db";
import { photosTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../lib/admin-auth.js";

const router = Router();

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
// DELETE /admin/photos/:id — reject/delete
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
  res.status(204).end();
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
    copyrightConfirmed: p.copyrightConfirmed,
    uploaderName: p.uploaderName,
    createdAt: p.createdAt.toISOString(),
  };
}

export default router;
