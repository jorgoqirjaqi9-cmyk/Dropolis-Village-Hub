import type { RequestHandler } from "express";

function readBearerToken(value: string | undefined): string | null {
  if (!value) return null;
  const [scheme, token] = value.split(" ");
  return scheme?.toLowerCase() === "bearer" && token ? token : null;
}

export const requireAdmin: RequestHandler = (req, res, next) => {
  const configuredKey = process.env.ADMIN_API_KEY;

  if (!configuredKey && process.env.NODE_ENV !== "production") {
    next();
    return;
  }

  if (!configuredKey) {
    res.status(503).json({ error: "Admin API is not configured" });
    return;
  }

  const providedKey =
    req.get("x-admin-api-key") ?? readBearerToken(req.get("authorization"));

  if (providedKey !== configuredKey) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  next();
};
