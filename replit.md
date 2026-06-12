# Dropolis — Δρόπολη

Portal ειδήσεων, φωτογραφιών, βίντεο και κοινότητας για τα χωριά της Δρόπολης (Β. Ήπειρος).

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/dropolis run dev` — run the frontend (port 20727)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind + shadcn/ui + wouter
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for API contracts
- `lib/db/src/schema/` — Drizzle schema (articles, villages, photos, videos, chat)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/dropolis/src/` — React frontend (Greek language)
- `lib/api-client-react/src/generated/` — generated React Query hooks (do not edit)
- `lib/api-zod/src/generated/` — generated Zod schemas (do not edit)

## Architecture decisions

- Contract-first: OpenAPI spec → Orval codegen → typed hooks + Zod schemas
- All UI text in Modern Greek
- AdSense placeholder zones as reusable `<AdSenseSlot>` component
- Chat polling every 5 seconds via `refetchInterval`
- SEO via document.title + meta tags on each page
- Crawler/bot requests intercepted by Vite dev plugin (dev) + prerendered HTML files (production)

## Product

- Homepage with news ticker, stats bar, featured articles, AdSense zones
- News listing filterable by category and village
- Village directory with individual village pages
- Photo gallery (masonry-style, filterable by village)
- YouTube video gallery
- Live community chat room

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After any OpenAPI spec change, re-run `pnpm --filter @workspace/api-spec run codegen`
- After schema changes in `lib/db/src/schema/`, run `pnpm run typecheck:libs` before checking API server

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details

---

## Search Engine Setup

> Complete these steps **after** the site is deployed and accessible at `https://dropolis.net`.

### Sitemaps

The site exposes two sitemaps:

| URL | Type | Use |
|-----|------|-----|
| `https://dropolis.net/sitemap.xml` | Static XML | Built into the production bundle |
| `https://dropolis.net/api/sitemap.xml` | Dynamic XML | Auto-generated from the database with real `lastmod` dates |

Submit **both** to search engines. The dynamic one is preferred because it reflects actual content dates.

---

### Google Search Console

**Step-by-step setup:**

1. Go to <https://search.google.com/search-console>
2. Click **Add property** → choose **URL prefix** → enter `https://dropolis.net`
3. Under **Verify ownership**, choose **HTML tag**
4. You will receive a meta tag like:
   ```html
   <meta name="google-site-verification" content="abc123XYZ..." />
   ```
5. Open `artifacts/dropolis/index.html`
6. Find this comment block near line 34:
   ```html
   <!-- <meta name="google-site-verification" content="REPLACE_WITH_GOOGLE_CODE" /> -->
   ```
7. Uncomment it and replace `REPLACE_WITH_GOOGLE_CODE` with the value Google gave you
8. Redeploy the site
9. Back in Search Console, click **Verify**

**Submit the sitemap:**

After verification is confirmed:

1. In Search Console sidebar, go to **Sitemaps**
2. Enter `api/sitemap.xml` in the "Add a new sitemap" field → click **Submit**
3. Also submit `sitemap.xml` → click **Submit**
4. Both should show status **Success** within a few minutes

---

### Bing Webmaster Tools

**Step-by-step setup:**

1. Go to <https://www.bing.com/webmasters>
2. Sign in with a Microsoft account
3. Click **Add a site** → enter `https://dropolis.net` → click **Add**
4. Choose **Meta tag** verification method
5. You will receive a meta tag like:
   ```html
   <meta name="msvalidate.01" content="abc123XYZ..." />
   ```
6. Open `artifacts/dropolis/index.html`
7. Find this comment block near line 35:
   ```html
   <!-- <meta name="msvalidate.01" content="REPLACE_WITH_BING_CODE" /> -->
   ```
8. Uncomment it and replace `REPLACE_WITH_BING_CODE` with the value Bing gave you
9. Redeploy the site
10. Back in Bing Webmaster Tools, click **Verify**

**Submit the sitemap:**

After verification is confirmed:

1. In the left sidebar, go to **Sitemaps**
2. Click **Submit sitemap**
3. Enter `https://dropolis.net/api/sitemap.xml` → click **Submit**
4. Also submit `https://dropolis.net/sitemap.xml`

---

### IndexNow (Bing/Yandex faster indexing)

IndexNow is a protocol that notifies search engines instantly when content changes, eliminating the wait for their crawlers to discover new pages. **The key file is already deployed** at:

```
https://dropolis.net/a65c5858b7f74b93a331bbe527a487d3.txt
```

**To notify search engines after publishing a new article** (e.g., article ID 27):

```bash
curl -X POST https://dropolis.net/api/indexnow/submit \
  -H "Content-Type: application/json" \
  -d '{"urls":["https://dropolis.net/news/27"]}'
```

**To submit multiple URLs at once:**

```bash
curl -X POST https://dropolis.net/api/indexnow/submit \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [
      "https://dropolis.net/news/27",
      "https://dropolis.net/news/28",
      "https://dropolis.net/villages/93"
    ]
  }'
```

A successful response looks like:
```json
{ "ok": true, "submitted": 3, "urls": [...] }
```

Bing will typically crawl and index submitted URLs within minutes to hours.

**To check the current key metadata:**
```bash
curl https://dropolis.net/api/indexnow/key
```

> Note: IndexNow submissions are not automatic — call the endpoint manually (or from a script/webhook) after publishing new content.

---

### Indexability summary

| Page | Indexed | Reason |
|------|---------|--------|
| Homepage `/` | ✅ Yes | |
| News list `/news` | ✅ Yes | |
| Article `/news/:id` | ✅ Yes | Prerendered HTML for bots |
| Villages list `/villages` | ✅ Yes | |
| Village `/villages/:id` | ✅ Yes | Prerendered HTML for bots |
| Photos `/photos` | ✅ Yes | |
| Videos `/videos` | ✅ Yes | |
| About, Contact, Press, Help | ✅ Yes | |
| Privacy, Terms, Cookie, Disclaimer | ✅ Yes | |
| Chat `/chat` | ❌ No | `noindex` — real-time UGC |
| 404 page | ❌ No | `noindex` — expected |
| API routes `/api/*` | ❌ No | Blocked in `robots.txt` |
