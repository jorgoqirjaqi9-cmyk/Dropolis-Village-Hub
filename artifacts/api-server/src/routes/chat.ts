import { Router } from "express";
import { db } from "@workspace/db";
import { chatMessagesTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import {
  DeleteChatMessageQueryParams,
  ListChatMessagesQueryParams,
  SendChatMessageBody,
  PingChatPresenceBody,
} from "@workspace/api-zod";

const router = Router();

// In-memory presence tracking
const presence = new Map<string, number>();
const PRESENCE_TTL = 90_000; // 90 seconds
const recentPosts = new Map<string, number[]>();
const POST_WINDOW_MS = 60_000;
const MAX_POSTS_PER_WINDOW = 8;
const MAX_CHAT_LIMIT = 100;
const DEFAULT_CHAT_LIMIT = 50;
const MAX_USERNAME_LENGTH = 40;
const MAX_MESSAGE_LENGTH = 500;

function cleanText(value: string, maxLength: number): string {
  return value.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, maxLength);
}

function assertWithinRateLimit(key: string): boolean {
  const now = Date.now();
  const recent = (recentPosts.get(key) ?? []).filter((ts) => now - ts < POST_WINDOW_MS);
  if (recent.length >= MAX_POSTS_PER_WINDOW) {
    recentPosts.set(key, recent);
    return false;
  }
  recent.push(now);
  recentPosts.set(key, recent);
  return true;
}

function pruneAndCount(): number {
  const now = Date.now();
  for (const [user, ts] of presence) {
    if (now - ts > PRESENCE_TTL) presence.delete(user);
  }
  return presence.size;
}

router.get("/chat/messages", async (req, res) => {
  const query = ListChatMessagesQueryParams.parse(req.query);
  const limit = Math.min(Math.max(query.limit ?? DEFAULT_CHAT_LIMIT, 1), MAX_CHAT_LIMIT);
  const messages = await db
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.isBot, false))
    .orderBy(desc(chatMessagesTable.createdAt))
    .limit(limit);
  res.json(messages.reverse().map(formatMessage));
});

router.post("/chat/messages", async (req, res) => {
  const body = SendChatMessageBody.parse(req.body);
  const username = cleanText(body.username, MAX_USERNAME_LENGTH);
  const messageText = cleanText(body.message, MAX_MESSAGE_LENGTH);
  const avatar = body.avatar ? cleanText(body.avatar, 16) : null;

  if (!username || !messageText) {
    res.status(400).json({ error: "Username and message are required" });
    return;
  }

  const rateKey = req.ip || username.toLowerCase();
  if (!assertWithinRateLimit(rateKey)) {
    res.status(429).json({ error: "Too many chat messages. Please wait a moment." });
    return;
  }

  const [message] = await db.insert(chatMessagesTable).values({
    username,
    message: messageText,
    avatar,
    isBot: false,
  }).returning();
  res.status(201).json(formatMessage(message));
});

router.delete("/chat/messages/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { username: rawUsername } = DeleteChatMessageQueryParams.parse(req.query);
  const username = cleanText(rawUsername, MAX_USERNAME_LENGTH);
  if (!Number.isInteger(id) || id <= 0 || !username) {
    res.status(400).json({ error: "Missing or invalid id/username" });
    return;
  }

  const [msg] = await db.select().from(chatMessagesTable).where(eq(chatMessagesTable.id, id));
  if (!msg) { res.status(404).json({ error: "Not found" }); return; }
  if (msg.username !== username) { res.status(403).json({ error: "Not your message" }); return; }

  await db.delete(chatMessagesTable).where(eq(chatMessagesTable.id, id));
  res.status(204).end();
});

router.get("/chat/presence", (req, res) => {
  res.json({ online: pruneAndCount() });
});

router.post("/chat/presence", (req, res) => {
  const body = PingChatPresenceBody.parse(req.body);
  const username = cleanText(body.username, MAX_USERNAME_LENGTH);
  if (!username) {
    res.status(400).json({ error: "Username is required" });
    return;
  }
  presence.set(username, Date.now());
  res.json({ online: pruneAndCount() });
});

function formatMessage(m: typeof chatMessagesTable.$inferSelect) {
  return {
    id: m.id,
    username: m.username,
    message: m.message,
    avatar: m.avatar,
    isBot: m.isBot,
    createdAt: m.createdAt.toISOString(),
  };
}

export default router;
