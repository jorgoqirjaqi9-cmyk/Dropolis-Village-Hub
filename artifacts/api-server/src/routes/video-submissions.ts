import { Router } from "express";
import { db } from "@workspace/db";
import { submittedVideosTable, villagesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import rateLimit from "express-rate-limit";
import {
  RequestVideoUploadUrlBody,
  SubmitVideoBody,
} from "@workspace/api-zod";
import { ObjectStorageService } from "../lib/objectStorage.js";

const router = Router();
const objectStorageService = new ObjectStorageService();

const MAX_VIDEO_SIZE = 25 * 1024 * 1024; // 25 MB
const ALLOWED_VIDEO_TYPES = new Set(["video/mp4", "video/quicktime", "video/webm"]);

const uploadUrlRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Πολλές αιτήσεις. Δοκιμάστε ξανά σε 1 ώρα." },
});

const submitRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Έχετε φτάσει το όριο υποβολών. Δοκιμάστε ξανά σε 1 ώρα." },
});

// ---------------------------------------------------------------------------
// POST /video-submissions/upload-url
// ---------------------------------------------------------------------------

router.post("/video-submissions/upload-url", uploadUrlRateLimit, async (req, res) => {
  const parsed = RequestVideoUploadUrlBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Λείπουν υποχρεωτικά πεδία (name, size, contentType)" });
    return;
  }

  const { size, contentType } = parsed.data;

  if (!ALLOWED_VIDEO_TYPES.has(contentType)) {
    res.status(400).json({ error: "Μόνο MP4, MOV και WebM επιτρέπονται." });
    return;
  }

  if (size > MAX_VIDEO_SIZE) {
    res.status(400).json({ error: "Το βίντεο δεν πρέπει να υπερβαίνει τα 25 MB." });
    return;
  }

  try {
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);
    res.json({ uploadURL, objectPath });
  } catch (err) {
    req.log.error({ err }, "Error generating video upload URL");
    res.status(500).json({ error: "Αποτυχία δημιουργίας URL αποστολής." });
  }
});

// ---------------------------------------------------------------------------
// POST /video-submissions/submit
// ---------------------------------------------------------------------------

router.post("/video-submissions/submit", submitRateLimit, async (req, res) => {
  const parsed = SubmitVideoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Μη έγκυρα δεδομένα υποβολής." });
    return;
  }

  const {
    title,
    description,
    objectPath,
    thumbnailObjectPath,
    villageId,
    villageName,
    uploaderName,
    uploaderEmail,
    eventDate,
    copyrightConfirmed,
    website,
  } = parsed.data;

  // Honeypot
  if (website) {
    res.status(201).json({ id: 0, status: "pending" });
    return;
  }

  if (!copyrightConfirmed) {
    res.status(400).json({ error: "Απαιτείται αποδοχή δήλωσης πνευματικών δικαιωμάτων." });
    return;
  }

  // Resolve villageName if not provided
  let resolvedVillageName = villageName ?? null;
  if (villageId && !resolvedVillageName) {
    const [village] = await db
      .select({ nameEl: villagesTable.nameEl })
      .from(villagesTable)
      .where(eq(villagesTable.id, villageId));
    resolvedVillageName = village?.nameEl ?? null;
  }

  const videoUrl = `/api/storage${objectPath}`;
  const thumbUrl = thumbnailObjectPath ? `/api/storage${thumbnailObjectPath}` : null;

  const [submission] = await db
    .insert(submittedVideosTable)
    .values({
      title: title.trim(),
      description: description?.trim() ?? null,
      videoUrl,
      objectPath,
      thumbnailUrl: thumbUrl,
      thumbnailObjectPath: thumbnailObjectPath ?? null,
      villageId: villageId ?? null,
      villageName: resolvedVillageName,
      uploaderName: uploaderName?.trim() ?? null,
      uploaderEmail: uploaderEmail?.trim() ?? null,
      eventDate: eventDate ?? null,
      copyrightConfirmed: true,
      status: "pending",
    })
    .returning();

  res.status(201).json({ id: submission!.id, status: submission!.status });
});

export default router;
