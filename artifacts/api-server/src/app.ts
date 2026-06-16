import express, {
  type ErrorRequestHandler,
  type Express,
  type RequestHandler,
} from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import http from "node:http";
import router from "./routes";
import redirectsRouter from "./routes/redirects.js";
import seoPagesRouter from "./routes/seo-pages.js";
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
  // HSTS — tells browsers to always use HTTPS for this domain
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload",
  );
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      // Scripts: self + Google Ads / Analytics / YouTube
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'" +
        " https://pagead2.googlesyndication.com" +
        " https://www.googletagmanager.com" +
        " https://www.google.com" +
        " https://partner.googleadservices.com" +
        " https://static.doubleclick.net" +
        " https://adservice.google.com" +
        " https://www.gstatic.com" +
        " https://www.youtube.com",
      // Styles: self + Google Fonts
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Fonts: self + Google Fonts CDN
      "font-src 'self' data: https://fonts.gstatic.com",
      // Images: self + data/blob URIs + all HTTPS (covers object-storage CDN, YouTube thumbs, etc.)
      "img-src 'self' data: blob: https:",
      // Iframes: YouTube and Google Ads
      "frame-src" +
        " https://www.youtube.com" +
        " https://youtube-nocookie.com" +
        " https://pagead2.googlesyndication.com" +
        " https://tpc.googlesyndication.com" +
        " https://www.google.com" +
        " https://googleads.g.doubleclick.net",
      // Fetch/XHR: self + all HTTPS (covers API + external services)
      "connect-src 'self' https:",
      // Audio/Video
      "media-src 'self' https:",
      // No plugins
      "object-src 'none'",
      // Prevent base tag hijacking
      "base-uri 'self'",
    ].join("; "),
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

// Redirect www.dropolis.net → dropolis.net (permanent)
app.use((req, res, next) => {
  const host = req.headers.host ?? "";
  if (host.startsWith("www.")) {
    const target = `https://${host.slice(4)}${req.url}`;
    return res.redirect(301, target);
  }
  next();
});

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

// Serve hashed Vite bundles (/assets/*.js, /assets/*.css) with long-term
// immutable cache. The content hash in every filename guarantees correctness,
// so browsers can cache these forever and skip network round-trips on revisit.
const distAssets = resolve(process.cwd(), "artifacts/dropolis/dist/public/assets");
if (existsSync(distAssets)) {
  app.use(
    "/assets",
    express.static(distAssets, {
      maxAge: "1y",
      immutable: true,
      etag: false,
      lastModified: false,
    }),
  );
}

// Serve all other static files from the frontend build output (favicon, og images,
// sitemap.xml, robots.txt, .txt verification files, etc.) so that every response —
// including the homepage — goes through Express and gets security headers applied.
const distPublic = resolve(process.cwd(), "artifacts/dropolis/dist/public");
if (existsSync(distPublic)) {
  app.use(express.static(distPublic, { maxAge: "1h", index: false }));
}

// Mount legacy redirect handlers at root level (not under /api) so the shared
// proxy can route /privacy-policy and /terms-of-service to this server and
// return genuine HTTP 301 redirects to bots and clients.
app.use(redirectsRouter);

// Server-side HTML meta injection for public page routes (before /api).
// Returns route-specific title/canonical/OG/JSON-LD for crawlers and humans.
// React hydrates the result on the client — full SPA still works.
app.use(seoPagesRouter);

app.use("/api", router);

// In development, forward any request the API server doesn't recognise to the
// Vite dev server (port 20727). This covers /@vite/client, /src/*, /@react-refresh,
// HMR websocket, etc. so the preview pane loads the full React app.
if (process.env.NODE_ENV !== "production") {
  const VITE_PORT = process.env.VITE_PORT ?? "20727";
  app.use((req, res) => {
    const options: http.RequestOptions = {
      hostname: "localhost",
      port: Number(VITE_PORT),
      path: req.url,
      method: req.method,
      headers: { ...req.headers, host: `localhost:${VITE_PORT}` },
    };
    const proxy = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode ?? 200, proxyRes.headers);
      proxyRes.pipe(res);
    });
    proxy.on("error", () => res.status(502).end("Vite dev server unavailable"));
    req.pipe(proxy);
  });
}

app.use(errorHandler);

export default app;
