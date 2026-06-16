import { Router } from "express";
import { randomUUID } from "crypto";

const router = Router();

const listeners = new Map<string, number>();
const STALE_MS = 35_000;

function cleanStale(): void {
  const now = Date.now();
  for (const [id, ts] of listeners) {
    if (now - ts > STALE_MS) listeners.delete(id);
  }
}

setInterval(cleanStale, 20_000).unref();

router.get("/radio/presence", (req, res) => {
  cleanStale();
  res.json({ count: listeners.size });
});

router.post("/radio/presence", (req, res) => {
  cleanStale();
  const body = req.body as { listenerId?: string };
  const id =
    typeof body.listenerId === "string" && listeners.has(body.listenerId)
      ? body.listenerId
      : randomUUID();
  listeners.set(id, Date.now());
  res.json({ listenerId: id, count: listeners.size });
});

router.delete("/radio/presence/:listenerId", (req, res) => {
  listeners.delete(req.params.listenerId);
  cleanStale();
  res.json({ ok: true, count: listeners.size });
});

export default router;
