import { Router } from "express";
import { db } from "@workspace/db";
import { submittedVideosTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../lib/admin-auth.js";
import { ObjectStorageService } from "../lib/objectStorage.js";

const router = Router();
const objectStorageService = new ObjectStorageService();

function formatSubmission(s: typeof submittedVideosTable.$inferSelect) {
  return {
    id: s.id,
    title: s.title,
    description: s.description,
    videoUrl: s.videoUrl,
    objectPath: s.objectPath,
    thumbnailUrl: s.thumbnailUrl,
    thumbnailObjectPath: s.thumbnailObjectPath,
    villageId: s.villageId,
    villageName: s.villageName,
    uploaderName: s.uploaderName,
    uploaderEmail: s.uploaderEmail,
    eventDate: s.eventDate,
    copyrightConfirmed: s.copyrightConfirmed,
    status: s.status,
    createdAt: s.createdAt.toISOString(),
    reviewedAt: s.reviewedAt ? s.reviewedAt.toISOString() : null,
  };
}

// ---------------------------------------------------------------------------
// GET /admin/video-submissions?status=pending|approved|rejected
// ---------------------------------------------------------------------------

router.get("/admin/video-submissions", requireAdmin, async (req, res) => {
  const status =
    typeof req.query.status === "string" &&
    ["pending", "approved", "rejected"].includes(req.query.status)
      ? req.query.status
      : "pending";

  const submissions = await db
    .select()
    .from(submittedVideosTable)
    .where(eq(submittedVideosTable.status, status))
    .orderBy(submittedVideosTable.createdAt);

  res.json(submissions.map(formatSubmission));
});

// ---------------------------------------------------------------------------
// PUT /admin/video-submissions/:id/approve
// ---------------------------------------------------------------------------

router.put("/admin/video-submissions/:id/approve", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [sub] = await db
    .select()
    .from(submittedVideosTable)
    .where(eq(submittedVideosTable.id, id));
  if (!sub) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const [updated] = await db
    .update(submittedVideosTable)
    .set({ status: "approved", reviewedAt: new Date() })
    .where(eq(submittedVideosTable.id, id))
    .returning();

  res.json(formatSubmission(updated));
});

// ---------------------------------------------------------------------------
// PUT /admin/video-submissions/:id/reject
// ---------------------------------------------------------------------------

router.put("/admin/video-submissions/:id/reject", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [sub] = await db
    .select()
    .from(submittedVideosTable)
    .where(eq(submittedVideosTable.id, id));
  if (!sub) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const [updated] = await db
    .update(submittedVideosTable)
    .set({ status: "rejected", reviewedAt: new Date() })
    .where(eq(submittedVideosTable.id, id))
    .returning();

  res.json(formatSubmission(updated));
});

// ---------------------------------------------------------------------------
// DELETE /admin/video-submissions/:id
// ---------------------------------------------------------------------------

router.delete("/admin/video-submissions/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [sub] = await db
    .select()
    .from(submittedVideosTable)
    .where(eq(submittedVideosTable.id, id));
  if (!sub) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  await db.delete(submittedVideosTable).where(eq(submittedVideosTable.id, id));

  if (sub.objectPath) {
    await objectStorageService.deleteObjectEntity(sub.objectPath);
  }
  if (sub.thumbnailObjectPath) {
    await objectStorageService.deleteObjectEntity(sub.thumbnailObjectPath);
  }

  res.status(204).end();
});

export default router;
