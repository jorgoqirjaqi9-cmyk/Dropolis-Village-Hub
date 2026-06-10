---
name: Crawler SEO Architecture
description: How social-bot / AI-crawler OG & JSON-LD injection works in Dropolis.
---

## Rule
Two-layer approach — dev plugin + build-time prerender — avoids changing the proxy routing.

## Dev (Vite plugin)
`artifacts/dropolis/plugins/seo-crawler.ts` — `configureServer` middleware.  
Detects crawler UA → fetches from `http://localhost:8080/api/articles/:id` or `/api/villages/:id` → injects correct `<head>` into index.html response.  
Falls through silently on any error or non-HTML path.

## Production (prerender script)
`artifacts/dropolis/prerender.ts` — run via `tsx prerender.ts` after `vite build`.  
Connects to PostgreSQL via `@workspace/db`, generates `dist/public/news/:id/index.html` and `dist/public/villages/:id/index.html` (68 pages: 26 articles + 42 villages).  
Replit's static server serves these prerendered files BEFORE the `/*` → `/index.html` SPA fallback.

**Why:** The production frontend is `serve = "static"` (no Node.js server). Changing proxy routing to route `/` through Express would conflict with the Vite dev server. Prerendering sidesteps both problems.

**How to apply:** When adding new content types (e.g., photos page), extend both the Vite plugin (`fetchMeta` function) and the prerender script.
