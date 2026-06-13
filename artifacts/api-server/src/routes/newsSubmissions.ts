import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { db } from "@workspace/db";
import { newsSubmissionsTable, articlesTable, villagesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAdmin } from "../lib/admin-auth.js";
import { notifyAdminNewSubmission } from "../lib/mailer.js";
import {
  CreateNewsSubmissionBody,
  UpdateNewsSubmissionBody,
} from "@workspace/api-zod";

const router = Router();

const submissionRateLimit = rateLimit({
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

function generateSlug(title: string): string {
  return (
    title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .substring(0, 80) +
    "-" +
    Date.now()
  );
}

function formatSubmission(s: typeof newsSubmissionsTable.$inferSelect) {
  return {
    id: s.id,
    title: s.title,
    content: s.content,
    villageId: s.villageId,
    senderName: s.senderName,
    senderEmail: s.senderEmail,
    eventDate: s.eventDate,
    eventTime: s.eventTime,
    imageUrl: s.imageUrl,
    status: s.status,
    consentGiven: s.consentGiven,
    submittedAt: s.submittedAt.toISOString(),
    reviewedAt: s.reviewedAt ? s.reviewedAt.toISOString() : null,
  };
}

router.post("/news-submissions", submissionRateLimit, async (req, res) => {
  const parseResult = CreateNewsSubmissionBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid request data" });
    return;
  }

  const body = parseResult.data;

  if (!body.consentGiven) {
    res.status(400).json({ error: "Απαιτείται συγκατάθεση" });
    return;
  }

  const cleanTitle = stripHtml(body.title);
  const cleanContent = stripHtml(body.content);
  const cleanSenderName = stripHtml(body.senderName);

  if (cleanContent.length < 80) {
    res.status(400).json({ error: "Το κείμενο πρέπει να έχει τουλάχιστον 80 χαρακτήρες (χωρίς HTML)." });
    return;
  }

  const [submission] = await db
    .insert(newsSubmissionsTable)
    .values({
      title: cleanTitle,
      content: cleanContent,
      villageId: body.villageId ?? null,
      senderName: cleanSenderName,
      senderEmail: body.senderEmail ?? null,
      eventDate: body.eventDate,
      eventTime: body.eventTime ?? null,
      imageUrl: body.imageUrl ?? null,
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

router.get("/news-submissions", requireAdmin, async (req, res) => {
  const statusFilter = Array.isArray(req.query["status"])
    ? req.query["status"][0]
    : req.query["status"];
  const validStatuses = ["pending", "approved", "rejected"];

  if (typeof statusFilter === "string" && validStatuses.includes(statusFilter)) {
    const submissions = await db
      .select()
      .from(newsSubmissionsTable)
      .where(eq(newsSubmissionsTable.status, statusFilter))
      .orderBy(desc(newsSubmissionsTable.submittedAt));
    res.json(submissions.map(formatSubmission));
    return;
  }

  const submissions = await db
    .select()
    .from(newsSubmissionsTable)
    .orderBy(desc(newsSubmissionsTable.submittedAt));
  res.json(submissions.map(formatSubmission));
});

router.patch("/news-submissions/:id", requireAdmin, async (req, res) => {
  const rawId = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
  const id = parseInt(String(rawId ?? ""), 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const parseResult = UpdateNewsSubmissionBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Status must be 'approved' or 'rejected'" });
    return;
  }

  const { status } = parseResult.data;

  const [submission] = await db
    .update(newsSubmissionsTable)
    .set({ status, reviewedAt: new Date() })
    .where(eq(newsSubmissionsTable.id, id))
    .returning();

  if (!submission) {
    res.status(404).json({ error: "Submission not found" });
    return;
  }

  if (status === "approved") {
    let villageName: string | null = null;
    if (submission.villageId) {
      const [village] = await db
        .select({ nameEl: villagesTable.nameEl })
        .from(villagesTable)
        .where(eq(villagesTable.id, submission.villageId));
      villageName = village?.nameEl ?? null;
    }

    const eventDateLine = submission.eventTime
      ? `📅 Ημερομηνία εκδήλωσης: ${submission.eventDate} ${submission.eventTime}\n\n`
      : `📅 Ημερομηνία εκδήλωσης: ${submission.eventDate}\n\n`;

    const fullContent = eventDateLine + submission.content;

    await db.insert(articlesTable).values({
      title: submission.title,
      content: fullContent,
      excerpt: submission.content.substring(0, 200),
      category: "Ειδήσεις Κοινότητας",
      author: submission.senderName,
      imageUrl: submission.imageUrl ?? null,
      villageName: villageName ?? null,
      published: true,
      featured: false,
      slug: generateSlug(submission.title),
    });
  }

  res.json(formatSubmission(submission));
});

router.delete("/news-submissions/:id", requireAdmin, async (req, res) => {
  const rawId = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
  const id = parseInt(String(rawId ?? ""), 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const [deleted] = await db
    .delete(newsSubmissionsTable)
    .where(eq(newsSubmissionsTable.id, id))
    .returning({ id: newsSubmissionsTable.id });

  if (!deleted) {
    res.status(404).json({ error: "Submission not found" });
    return;
  }

  res.status(204).send();
});

export default router;
