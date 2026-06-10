import { Router } from "express";
import { db } from "@workspace/db";
import { chatMessagesTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { ListChatMessagesQueryParams, SendChatMessageBody } from "@workspace/api-zod";

const router = Router();

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
