import { Router } from "express";
import { db } from "@workspace/db";
import { chatMessagesTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { ListChatMessagesQueryParams, SendChatMessageBody, PingChatPresenceBody } from "@workspace/api-zod";
import { maybeRespondToMessage } from "../lib/chat-bot.js";

const router = Router();
const BOT_USERNAME = "\u0394\u03c1\u03cc\u03c0\u03bf\u03bb\u03b7 Bot";

// In-memory presence tracking
const presence = new Map<string, number>();
const PRESENCE_TTL = 90_000; // 90 seconds

async function pruneAndCount(): Promise<number> {
  const now = Date.now();
  const expiredUsers: string[] = [];

  for (const [user, ts] of presence) {
    if (now - ts > PRESENCE_TTL) {
      presence.delete(user);
      expiredUsers.push(user);
    }
  }

  for (const user of expiredUsers) {
    await db.delete(chatMessagesTable).where(eq(chatMessagesTable.username, user));
  }

  if (expiredUsers.length > 0) {
    await db.delete(chatMessagesTable).where(eq(chatMessagesTable.username, BOT_USERNAME));
  }

  return presence.size;
}

router.get("/chat/messages", async (req, res) => {
  await pruneAndCount();
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
  presence.set(body.username.trim(), Date.now());
  const [message] = await db.insert(chatMessagesTable).values({
    username: body.username,
    message: body.message,
    avatar: body.avatar ?? null,
    isBot: false,
  }).returning();
  res.status(201).json(formatMessage(message));
  void maybeRespondToMessage(body.message, body.username);
});

router.delete("/chat/messages/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const username = req.query.username as string;
  if (!id || !username) { res.status(400).json({ error: "Missing id or username" }); return; }

  const [msg] = await db.select().from(chatMessagesTable).where(eq(chatMessagesTable.id, id));
  if (!msg) { res.status(404).json({ error: "Not found" }); return; }
  if (msg.username !== username) { res.status(403).json({ error: "Not your message" }); return; }

  await db.delete(chatMessagesTable).where(eq(chatMessagesTable.id, id));
  res.status(204).end();
});

router.get("/chat/presence", async (req, res) => {
  res.json({ online: await pruneAndCount() });
});

router.post("/chat/presence", async (req, res) => {
  const body = PingChatPresenceBody.parse(req.body);
  presence.set(body.username.trim(), Date.now());
  res.json({ online: await pruneAndCount() });
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
