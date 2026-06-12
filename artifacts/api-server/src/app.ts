import express, {
  type ErrorRequestHandler,
  type Express,
  type RequestHandler,
} from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import redirectsRouter from "./routes/redirects.js";
import { logger } from "./lib/logger";

const app: Express = express();
const allowedOrigins = new Set(
  (process.env.CORS_ORIGINS ?? "https://dropolis.net,https://www.dropolis.net,https://dropolis-village.replit.app")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);

const securityHeaders: RequestHandler = (_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()",
  );
  next();
};

const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const isZodError =
    err &&
    typeof err === "object" &&
    "name" in err &&
    err.name === "ZodError";

  if (isZodError) {
    res.status(400).json({
      error: "Invalid request",
      details: "issues" in err ? err.issues : undefined,
    });
    return;
  }

  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({ error: "Invalid JSON body" });
    return;
  }

  req.log.error({ err }, "Unhandled API error");
  res.status(500).json({ error: "Internal server error" });
};

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(securityHeaders);
app.use(
  cors({
    origin(origin, callback) {
      if (
        !origin ||
        allowedOrigins.has(origin) ||
        origin.endsWith(".replit.app")
      ) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
  }),
);
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));

// Mount legacy redirect handlers at root level (not under /api) so the shared
// proxy can route /privacy-policy and /terms-of-service to this server and
// return genuine HTTP 301 redirects to bots and clients.
app.use(redirectsRouter);

app.use("/api", router);
app.use(errorHandler);

export default app;
