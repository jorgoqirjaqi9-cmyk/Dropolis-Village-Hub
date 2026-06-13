/**
 * Build-time prerender script.
 * Run with: tsx prerender.ts  (from artifacts/dropolis/ directory)
 *
 * For every article, village, and known static route, generates a
 * pre-populated index.html inside dist/public/<path>/index.html so Replit's
 * static server (try_files semantics) serves correct OG / JSON-LD head tags
 * to social bots and AI crawlers WITHOUT needing any server-side rendering in
 * production.
 *
 * Also writes dist/public/prerender-manifest.json — a machine-readable record
 * of every article ID and village ID for which a prerendered HTML file was
 * successfully published in this build. The API server's live sitemap and
 * IndexNow submission pipeline read this manifest so they only advertise or
 * notify crawlers about URLs whose HTML already exists in the deployed build.
 *
 * If dist/public/index.html does not exist yet (build not run), exits silently.
 */

import { db, pool, articlesTable, villagesTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { readFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  BASE_URL,
  STATIC_ROUTES,
  STATIC_PRERENDER,
  CRAWLER_REDIRECTS,
  type Meta,
} from "./src/route-manifest.js";

const DEFAULT_IMG = `${BASE_URL}/opengraph.jpg`;
const SITE_NAME = "Δρόπολη (Dropolis)";

const DIST = resolve(process.cwd(), "dist/public");
const INDEX_HTML = resolve(DIST, "index.html");

if (!existsSync(INDEX_HTML)) {
  console.warn("[prerender] dist/public/index.html not found — skipping.");
  process.exit(0);
}

const TEMPLATE = readFileSync(INDEX_HTML, "utf-8");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function esc(s: unknown): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function jsonLdItems(value?: object | object[]): object[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}


function buildBodyFallback(m: Meta): string {
  const rawTitle = `${m.title} | ${SITE_NAME}`.slice(0, 150);
  const rawDesc = String(m.description || "").slice(0, 240);
  const title = esc(rawTitle);
  const desc = esc(rawDesc);
  return `<main class="seo-prerender-content" aria-label="${title}">\n    <h1>${title}</h1>\n    <p>${desc}</p>\n  </main>`;
}

function buildSeoTags(m: Meta): string {
  const title = esc(`${m.title} | ${SITE_NAME}`);
  const desc = esc(m.description.slice(0, 160));
  const img = esc(m.image || DEFAULT_IMG);
  const url = esc(m.url);
  const type = m.type || "website";

  const articleTags: string[] = [];
  if (m.article) {
    if (m.article.publishedTime) articleTags.push(`<meta property="article:published_time" content="${esc(m.article.publishedTime)}" />`);
    if (m.article.modifiedTime) articleTags.push(`<meta property="article:modified_time" content="${esc(m.article.modifiedTime)}" />`);
    if (m.article.author) articleTags.push(`<meta property="article:author" content="${esc(m.article.author)}" />`);
    if (m.article.section) articleTags.push(`<meta property="article:section" content="${esc(m.article.section)}" />`);
  }

  const breadcrumbLd = m.breadcrumbs && m.breadcrumbs.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Αρχική", item: BASE_URL },
          ...m.breadcrumbs.map((crumb, i) => ({
            "@type": "ListItem",
            position: i + 2,
            name: crumb.name,
            item: crumb.item,
          })),
        ],
      }
    : null;

  const schemas = [...jsonLdItems(m.jsonLd), breadcrumbLd].filter(Boolean);

  return [
    `<title>${title}</title>`,
    `<meta name="description" content="${desc}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${desc}" />`,
    `<meta property="og:type" content="${type}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${img}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:site_name" content="${esc(SITE_NAME)}" />`,
    `<meta property="og:locale" content="el_GR" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${desc}" />`,
    `<meta name="twitter:image" content="${img}" />`,
    ...articleTags,
    schemas.length > 0
      ? `<script type="application/ld+json">${JSON.stringify(schemas.length === 1 ? schemas[0] : schemas)}</script>`
      : "",
  ]
    .filter(Boolean)
    .join("\n  ");
}

function injectMeta(m: Meta): string {
  let html = TEMPLATE
    .replace(/<title>[^<]*<\/title>/g, "")
    .replace(/<meta\s+name="description"[^>]*>/gi, "")
    .replace(/<link\s+rel="canonical"[^>]*>/gi, "")
    .replace(/<meta\s+property="og:title"[^>]*>/gi, "")
    .replace(/<meta\s+property="og:description"[^>]*>/gi, "")
    .replace(/<meta\s+property="og:type"[^>]*>/gi, "")
    .replace(/<meta\s+property="og:url"[^>]*>/gi, "")
    .replace(/<meta\s+property="og:image(?::\w+)?"[^>]*>/gi, "")
    .replace(/<meta\s+name="twitter:[^"]*"[^>]*>/gi, "");
  html = html.replace("<head>", `<head>\n  ${buildSeoTags(m)}`);
  html = html.replace(/<div id="root">[^]*?<\/div>/, `<div id="root">\n  ${buildBodyFallback(m)}\n</div>`);
  return html;
}

function writeRoute(routePath: string, html: string) {
  const dir = resolve(DIST, routePath.replace(/^\//, ""));
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, "index.html"), html, "utf-8");
}

// ---------------------------------------------------------------------------
// Sitemap generation
// ---------------------------------------------------------------------------

function escXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function urlEntry(
  loc: string,
  lastmod: string,
  changefreq: string,
  priority: string,
): string {
  return `  <url>
    <loc>${escXml(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

function buildSitemap(
  articles: Array<{ id: number; createdAt: Date }>,
  villages: Array<{ id: number; createdAt: Date }>,
): string {
  const today = new Date().toISOString().slice(0, 10);

  const staticEntries = STATIC_ROUTES.map((r) =>
    urlEntry(`${BASE_URL}${r.loc}`, today, r.changefreq, r.priority),
  );

  const articleEntries = articles.map((a) => {
    const lastmod = a.createdAt
      ? new Date(a.createdAt).toISOString().slice(0, 10)
      : today;
    return urlEntry(`${BASE_URL}/news/${a.id}`, lastmod, "monthly", "0.8");
  });

  const villageEntries = villages.map((v) => {
    const lastmod = v.createdAt
      ? new Date(v.createdAt).toISOString().slice(0, 10)
      : today;
    return urlEntry(`${BASE_URL}/villages/${v.id}`, lastmod, "monthly", "0.7");
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">

  <!-- Static routes -->
${staticEntries.join("\n")}

  <!-- Article pages (${articles.length}) -->
${articleEntries.join("\n")}

  <!-- Village pages (${villages.length}) -->
${villageEntries.join("\n")}

</urlset>`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("[prerender] Starting...");

  // Run idempotent schema migrations so the production DB is always up to date
  // before querying. Each statement runs independently — one failure never blocks
  // the rest (e.g. index already exists on a retry).
  const migrations = [
    `ALTER TABLE articles ADD COLUMN IF NOT EXISTS source_url text`,
    `CREATE UNIQUE INDEX IF NOT EXISTS articles_source_url_unique ON articles(source_url) WHERE source_url IS NOT NULL`,
    `ALTER TABLE articles ADD COLUMN IF NOT EXISTS seo_title text`,
    `ALTER TABLE articles ADD COLUMN IF NOT EXISTS meta_description text`,
    `ALTER TABLE articles ADD COLUMN IF NOT EXISTS slug text`,
    `CREATE UNIQUE INDEX IF NOT EXISTS articles_slug_unique ON articles(slug) WHERE slug IS NOT NULL`,
    `ALTER TABLE articles ADD COLUMN IF NOT EXISTS score integer NOT NULL DEFAULT 0`,
    `ALTER TABLE articles ADD COLUMN IF NOT EXISTS likes_count integer NOT NULL DEFAULT 0`,
    `ALTER TABLE articles ADD COLUMN IF NOT EXISTS dislikes_count integer NOT NULL DEFAULT 0`,
    `ALTER TABLE videos ADD COLUMN IF NOT EXISTS likes_count integer NOT NULL DEFAULT 0`,
    `ALTER TABLE videos ADD COLUMN IF NOT EXISTS dislikes_count integer NOT NULL DEFAULT 0`,
    `ALTER TABLE submitted_videos ADD COLUMN IF NOT EXISTS likes_count integer NOT NULL DEFAULT 0`,
    `ALTER TABLE submitted_videos ADD COLUMN IF NOT EXISTS dislikes_count integer NOT NULL DEFAULT 0`,
    `CREATE TABLE IF NOT EXISTS content_votes (id serial PRIMARY KEY, content_type text NOT NULL, content_id integer NOT NULL, voter_key text NOT NULL, vote_type text NOT NULL, created_at timestamp NOT NULL DEFAULT now(), updated_at timestamp NOT NULL DEFAULT now())`,
    `CREATE UNIQUE INDEX IF NOT EXISTS content_votes_unique ON content_votes(content_type, content_id, voter_key)`,
    `CREATE TABLE IF NOT EXISTS submitted_videos (id serial PRIMARY KEY, title text NOT NULL, description text, video_url text NOT NULL, object_path text NOT NULL, thumbnail_url text, thumbnail_object_path text, village_id integer, village_name text, uploader_name text, uploader_email text, event_date text, copyright_confirmed boolean NOT NULL DEFAULT false, status text NOT NULL DEFAULT 'pending', created_at timestamp NOT NULL DEFAULT now(), reviewed_at timestamp)`,
  ];

  const client = await pool.connect();
  try {
    for (const stmt of migrations) {
      try {
        await client.query(stmt);
      } catch (err) {
        console.warn(`[prerender] Migration skipped (${stmt.slice(0, 60)}):`, (err as Error).message);
      }
    }
  } finally {
    client.release();
  }

  const [articles, villages] = await Promise.all([
    db.select().from(articlesTable).where(eq(articlesTable.published, true)).orderBy(desc(articlesTable.createdAt)),
    db.select().from(villagesTable).orderBy(villagesTable.id),
  ]);

  let count = 0;

  // Static routes — prerender with route-specific metadata (from centralized
  // route-manifest so prerender.ts, seo-crawler.ts, and sitemap.ts stay in sync)
  for (const route of STATIC_PRERENDER) {
    const { path, ...meta } = route;
    writeRoute(path, injectMeta(meta));
    count++;
  }
  console.log(`[prerender] Static routes: ${STATIC_PRERENDER.length} pages written.`);

  // Legacy redirect stubs — these paths are aliased in the client router but
  // bots receive a 200 SPA shell rather than a clean redirect. The Express API
  // server handles genuine HTTP 301s for these paths in production (via the
  // /privacy-policy and /terms-of-service paths in artifact.toml). These stubs
  // are a belt-and-suspenders fallback: any bot that somehow reaches the static
  // server directly gets a canonical link + meta refresh so it still signals
  // the correct canonical URL.
  for (const [from, to] of Object.entries(CRAWLER_REDIRECTS)) {
    const redirectHtml = `<!DOCTYPE html>
<html lang="el">
<head>
  <meta charset="UTF-8" />
  <link rel="canonical" href="${to}" />
  <meta http-equiv="refresh" content="0; url=${to}" />
  <title>Μετανάστευση — Dropolis</title>
</head>
<body>
  <p>Μεταφορά στη σελίδα <a href="${to}">${to}</a>…</p>
</body>
</html>`;
    writeRoute(from, redirectHtml);
    count++;
  }
  console.log(`[prerender] Redirect stubs: ${Object.keys(CRAWLER_REDIRECTS).length} pages written.`);

  // Articles
  for (const a of articles) {
    const description =
      a.excerpt ||
      a.content.replace(/[#*_`]/g, "").slice(0, 155) + "…";

    const meta: Meta = {
      title: a.title,
      description,
      image: a.imageUrl,
      url: `${BASE_URL}/news/${a.id}`,
      type: "article",
      article: {
        publishedTime: a.createdAt ? new Date(a.createdAt).toISOString() : null,
        modifiedTime: a.updatedAt
          ? new Date(a.updatedAt).toISOString()
          : a.createdAt
            ? new Date(a.createdAt).toISOString()
            : null,
        author: a.author,
        section: a.category,
      },
      breadcrumbs: [
        { name: "Ειδήσεις", item: `${BASE_URL}/news` },
        { name: a.title, item: `${BASE_URL}/news/${a.id}` },
      ],
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        headline: a.title,
        description: a.excerpt || "",
        image: a.imageUrl ? [a.imageUrl] : [],
        datePublished: a.createdAt,
        dateModified: a.updatedAt ?? a.createdAt,
        author: { "@type": "Person", name: a.author || "Dropolis" },
        publisher: {
          "@type": "Organization",
          name: SITE_NAME,
          logo: { "@type": "ImageObject", url: `${BASE_URL}/favicon.svg` },
        },
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": `${BASE_URL}/news/${a.id}`,
        },
        articleSection: a.category,
        inLanguage: "el",
      },
    };

    writeRoute(`/news/${a.id}`, injectMeta(meta));
    count++;
  }

  // Villages
  for (const v of villages) {
    const raw = v.description || "";
    const description = raw
      ? raw.slice(0, 155) + (raw.length > 155 ? "…" : "")
      : `Ανακαλύψτε το χωριό ${v.nameEl} στη Δρόπολη, Βόρεια Ήπειρος.`;

    const meta: Meta = {
      title: `${v.nameEl} — Χωριό της Δρόπολης`,
      description,
      image: v.imageUrl,
      url: `${BASE_URL}/villages/${v.id}`,
      breadcrumbs: [
        { name: "Χωριά", item: `${BASE_URL}/villages` },
        { name: v.nameEl, item: `${BASE_URL}/villages/${v.id}` },
      ],
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "City",
        name: v.nameEl,
        alternateName: v.name,
        description: v.description,
        url: `${BASE_URL}/villages/${v.id}`,
        ...(v.latitude && v.longitude
          ? {
              geo: {
                "@type": "GeoCoordinates",
                latitude: v.latitude,
                longitude: v.longitude,
              },
            }
          : {}),
        containedInPlace: {
          "@type": "AdministrativeArea",
          name: "Δήμος Δρόπολης",
          containedInPlace: { "@type": "Country", name: "Αλβανία" },
        },
      },
    };

    writeRoute(`/villages/${v.id}`, injectMeta(meta));
    count++;
  }

  // Generate fresh sitemap.xml with real lastmod dates from DB.
  // This sitemap only contains URLs for which prerendered HTML now exists,
  // since it is generated in the same run that produces the HTML files.
  const sitemapXml = buildSitemap(
    articles.map((a) => ({ id: a.id, createdAt: a.createdAt })),
    villages.map((v) => ({ id: v.id, createdAt: v.createdAt })),
  );
  writeFileSync(resolve(DIST, "sitemap.xml"), sitemapXml, "utf-8");
  console.log(`[prerender] sitemap.xml written (${articles.length + villages.length + STATIC_ROUTES.length} URLs).`);

  // Write the prerender manifest — a machine-readable record of every article
  // and village ID whose HTML file was successfully published in this build,
  // together with the timestamp of when each page was prerendered.
  //
  // Format: { generatedAt, articles: { "id": "ISO timestamp" }, villages: {...} }
  //
  // The API server's live sitemap (/api/sitemap.xml) uses these per-item
  // timestamps to detect staleness: if article.updatedAt > manifest.articles[id],
  // the prerendered HTML is older than the content — the article is withheld
  // from the sitemap until the next prerender run (build-time or on-demand).
  // The IndexNow pipeline uses the same logic before submitting to crawlers.
  const prerenderTs = new Date().toISOString();
  const manifest = {
    generatedAt: prerenderTs,
    articles: Object.fromEntries(articles.map((a) => [String(a.id), prerenderTs])),
    villages: Object.fromEntries(villages.map((v) => [String(v.id), prerenderTs])),
  };
  writeFileSync(resolve(DIST, "prerender-manifest.json"), JSON.stringify(manifest), "utf-8");
  console.log(`[prerender] prerender-manifest.json written (${articles.length} articles, ${villages.length} villages).`);

  console.log(`[prerender] Done. Generated ${count} pages (${STATIC_PRERENDER.length} static, ${articles.length} articles, ${villages.length} villages, ${Object.keys(CRAWLER_REDIRECTS).length} redirect stubs).`);
  process.exit(0);
}

main().catch((err) => {
  console.error("[prerender] Error:", err);
  process.exit(1);
});
