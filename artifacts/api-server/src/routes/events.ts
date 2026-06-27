import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { db, eventsTable, villagesTable } from "@workspace/db";
import { eq, desc, gte, lt, and } from "drizzle-orm";
import { requireAdmin } from "../lib/admin-auth.js";
import { notifyAdminNewSubmission } from "../lib/mailer.js";
import { SubmitEventBody, UpdateEventSubmissionBody } from "@workspace/api-zod";

const router = Router();

const eventRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Πολλές αιτήσεις. Δοκιμάστε ξανά σε μία ώρα." },
  keyGenerator: (req) => {
    const forwarded = req.headers["x-forwarded-for"];
    const ip = Array.isArray(forwarded)
      ? forwarded[0]
      : (forwarded?.split(",")[0] ?? req.ip ?? "unknown");
    return ip ?? "unknown";
  },
});

function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, "").trim();
}

function formatEvent(e: typeof eventsTable.$inferSelect) {
  return {
    id: e.id,
    title: e.title,
    eventDate: e.eventDate,
    eventTime: e.eventTime ?? null,
    villageId: e.villageId ?? null,
    location: e.location ?? null,
    description: e.description,
    imageUrl: e.imageUrl ?? null,
    contactInfo: e.contactInfo ?? null,
    senderName: e.senderName,
    status: e.status,
    consentGiven: e.consentGiven,
    submittedAt: e.submittedAt.toISOString(),
    reviewedAt: e.reviewedAt ? e.reviewedAt.toISOString() : null,
  };
}

// GET /api/events — public list of approved events
router.get("/events", async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const past = req.query["past"] === "true";
  const villageIdRaw = req.query["villageId"];
  const limitRaw = req.query["limit"];
  const limit =
    typeof limitRaw === "string" ? Math.min(parseInt(limitRaw, 10) || 50, 100) : 50;

  const conditions = [eq(eventsTable.status, "approved")];
  if (!past) {
    conditions.push(gte(eventsTable.eventDate, today));
  } else {
    conditions.push(lt(eventsTable.eventDate, today));
  }
  if (typeof villageIdRaw === "string") {
    const vid = parseInt(villageIdRaw, 10);
    if (!isNaN(vid)) conditions.push(eq(eventsTable.villageId, vid));
  }

  const events = await db
    .select()
    .from(eventsTable)
    .where(and(...conditions))
    .orderBy(past ? desc(eventsTable.eventDate) : eventsTable.eventDate)
    .limit(limit);

  res.json(
    events.map((e) => ({
      id: e.id,
      title: e.title,
      eventDate: e.eventDate,
      eventTime: e.eventTime ?? null,
      villageId: e.villageId ?? null,
      location: e.location ?? null,
      description: e.description,
      imageUrl: e.imageUrl ?? null,
      contactInfo: e.contactInfo ?? null,
      status: e.status,
      submittedAt: e.submittedAt.toISOString(),
    }))
  );
});

// POST /api/events/submit — public submission
router.post("/events/submit", eventRateLimit, async (req, res) => {
  const parseResult = SubmitEventBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Μη έγκυρα δεδομένα αίτησης" });
    return;
  }

  const body = parseResult.data;

  // Honeypot
  if (body.website) {
    res.status(201).json({ id: 0, status: "pending" });
    return;
  }

  if (!body.consentGiven) {
    res.status(400).json({ error: "Απαιτείται συγκατάθεση" });
    return;
  }

  const [submission] = await db
    .insert(eventsTable)
    .values({
      title: stripHtml(body.title),
      eventDate: body.eventDate,
      eventTime: body.eventTime ?? null,
      villageId: body.villageId ?? null,
      location: body.location ? stripHtml(body.location) : null,
      description: stripHtml(body.description),
      imageUrl: body.imageUrl ?? null,
      contactInfo: body.contactInfo ? stripHtml(body.contactInfo) : null,
      senderName: stripHtml(body.senderName),
      status: "pending",
      consentGiven: true,
    })
    .returning();

  void notifyAdminNewSubmission({
    id: submission!.id,
    senderName: submission!.senderName,
    title: submission!.title,
    eventDate: submission!.eventDate ?? null,
  });

  res.status(201).json({ id: submission!.id, status: submission!.status });
});

// GET /api/admin/events — admin list
router.get("/admin/events", requireAdmin, async (req, res) => {
  const statusFilter = Array.isArray(req.query["status"])
    ? req.query["status"][0]
    : req.query["status"];
  const validStatuses = ["pending", "approved", "rejected"];

  let events: (typeof eventsTable.$inferSelect)[];
  if (typeof statusFilter === "string" && validStatuses.includes(statusFilter)) {
    events = await db
      .select()
      .from(eventsTable)
      .where(eq(eventsTable.status, statusFilter))
      .orderBy(desc(eventsTable.submittedAt));
  } else {
    events = await db
      .select()
      .from(eventsTable)
      .orderBy(desc(eventsTable.submittedAt));
  }

  res.json(events.map(formatEvent));
});

// PATCH /api/admin/events/:id
router.patch("/admin/events/:id", requireAdmin, async (req, res) => {
  const id = parseInt(String(req.params["id"] ?? ""), 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID non valido" });
    return;
  }

  const parseResult = UpdateEventSubmissionBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Μη έγκυρα δεδομένα" });
    return;
  }

  const { status, title, description, eventTime, location, contactInfo, imageUrl } = parseResult.data;
  const updateFields: Record<string, unknown> = {};
  if (status !== undefined) { updateFields["status"] = status; updateFields["reviewedAt"] = new Date(); }
  if (title !== undefined) updateFields["title"] = stripHtml(title);
  if (description !== undefined) updateFields["description"] = stripHtml(description);
  if (eventTime !== undefined) updateFields["eventTime"] = eventTime;
  if (location !== undefined) updateFields["location"] = location ? stripHtml(location) : null;
  if (contactInfo !== undefined) updateFields["contactInfo"] = contactInfo ? stripHtml(contactInfo) : null;
  if (imageUrl !== undefined) updateFields["imageUrl"] = imageUrl ?? null;

  if (Object.keys(updateFields).length === 0) {
    res.status(400).json({ error: "Κανένα πεδίο για ενημέρωση" });
    return;
  }

  const [event] = await db
    .update(eventsTable)
    .set(updateFields)
    .where(eq(eventsTable.id, id))
    .returning();

  if (!event) {
    res.status(404).json({ error: "Εκδήλωση δεν βρέθηκε" });
    return;
  }

  res.json(formatEvent(event));
});

// DELETE /api/admin/events/:id
router.delete("/admin/events/:id", requireAdmin, async (req, res) => {
  const id = parseInt(String(req.params["id"] ?? ""), 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID non valido" });
    return;
  }

  const [deleted] = await db
    .delete(eventsTable)
    .where(eq(eventsTable.id, id))
    .returning({ id: eventsTable.id });

  if (!deleted) {
    res.status(404).json({ error: "Εκδήλωση δεν βρέθηκε" });
    return;
  }

  res.status(204).send();
});

export default router;
