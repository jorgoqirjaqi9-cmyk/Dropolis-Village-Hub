import { Router } from "express";
import { db } from "@workspace/db";
import { chatMessagesTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { ListChatMessagesQueryParams, SendChatMessageBody, PingChatPresenceBody } from "@workspace/api-zod";

const router = Router();

// In-memory presence tracking
const presence = new Map<string, number>();
const PRESENCE_TTL = 90_000; // 90 seconds

function pruneAndCount(): number {
  const now = Date.now();
  for (const [user, ts] of presence) {
    if (now - ts > PRESENCE_TTL) presence.delete(user);
  }
  return presence.size;
}

router.get("/chat/messages", async (req, res) => {
  const query = ListChatMessagesQueryParams.parse(req.query);
  const messages = await db
    .select()
    .from(chatMessagesTable)
    .orderBy(desc(chatMessagesTable.createdAt))
    .limit(query.limit ?? 50);
  res.json(messages.reverse().map(formatMessage));
});

router.post("/chat/messages", async (req, res) => {
  const body = SendChatMessageBody.parse(req.body);
  const [message] = await db.insert(chatMessagesTable).values({
    username: body.username,
    message: body.message,
    avatar: body.avatar ?? null,
  }).returning();
  res.status(201).json(formatMessage(message));
});

router.get("/chat/presence", (req, res) => {
  res.json({ online: pruneAndCount() });
});

router.post("/chat/presence", (req, res) => {
  const body = PingChatPresenceBody.parse(req.body);
  presence.set(body.username.trim(), Date.now());
  res.json({ online: pruneAndCount() });
});

function formatMessage(m: typeof chatMessagesTable.$inferSelect) {
  return {
    id: m.id,
    username: m.username,
    message: m.message,
    avatar: m.avatar,
    createdAt: m.createdAt.toISOString(),
  };
}

export default router;
