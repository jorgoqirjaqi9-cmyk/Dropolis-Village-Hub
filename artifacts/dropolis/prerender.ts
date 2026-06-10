/**
 * Build-time prerender script.
 * Run with: tsx prerender.ts  (from artifacts/dropolis/ directory)
 *
 * For every article and village, generates a pre-populated index.html inside
 * dist/public/<path>/index.html so Replit's static server (try_files semantics)
 * serves correct OG / JSON-LD head tags to social bots and AI crawlers WITHOUT
 * needing any server-side rendering in production.
 *
 * If dist/public/index.html does not exist yet (build not run), exits silently.
 */

import { db, articlesTable, villagesTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { readFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const BASE_URL = "https://dropolis.replit.app";
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

type Meta = {
  title: string;
  description: string;
  image?: string | null;
  url: string;
  type?: string;
  jsonLd?: object;
};

function buildSeoTags(m: Meta): string {
  const title = esc(`${m.title} | ${SITE_NAME}`);
  const desc = esc(m.description.slice(0, 160));
  const img = esc(m.image || DEFAULT_IMG);
  const url = esc(m.url);
  const type = m.type || "website";
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
    m.jsonLd
      ? `<script type="application/ld+json">${JSON.stringify(m.jsonLd)}</script>`
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
  return html.replace("<head>", `<head>\n  ${buildSeoTags(m)}`);
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

const STATIC_ROUTES: Array<{ loc: string; changefreq: string; priority: string }> = [
  { loc: "/",             changefreq: "daily",   priority: "1.0" },
  { loc: "/news",         changefreq: "hourly",  priority: "0.9" },
  { loc: "/villages",     changefreq: "weekly",  priority: "0.8" },
  { loc: "/photos",       changefreq: "weekly",  priority: "0.7" },
  { loc: "/videos",       changefreq: "weekly",  priority: "0.7" },
  { loc: "/about",        changefreq: "monthly", priority: "0.8" },
  { loc: "/contact",      changefreq: "monthly", priority: "0.7" },
  { loc: "/press",        changefreq: "monthly", priority: "0.6" },
  { loc: "/help",         changefreq: "monthly", priority: "0.5" },
  { loc: "/privacy",      changefreq: "yearly",  priority: "0.4" },
  { loc: "/terms",        changefreq: "yearly",  priority: "0.4" },
  { loc: "/cookie-policy",changefreq: "yearly",  priority: "0.3" },
  { loc: "/disclaimer",   changefreq: "yearly",  priority: "0.3" },
];

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

  const [articles, villages] = await Promise.all([
    db.select().from(articlesTable).orderBy(desc(articlesTable.createdAt)),
    db.select().from(villagesTable).orderBy(villagesTable.id),
  ]);

  let count = 0;

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
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        headline: a.title,
        description: a.excerpt || "",
        image: a.imageUrl ? [a.imageUrl] : [],
        datePublished: a.createdAt,
        dateModified: a.updatedAt,
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

  // Generate fresh sitemap.xml with real lastmod dates from DB
  const sitemapXml = buildSitemap(
    articles.map((a) => ({ id: a.id, createdAt: a.createdAt })),
    villages.map((v) => ({ id: v.id, createdAt: v.createdAt })),
  );
  writeFileSync(resolve(DIST, "sitemap.xml"), sitemapXml, "utf-8");
  console.log(`[prerender] sitemap.xml written (${articles.length + villages.length + STATIC_ROUTES.length} URLs).`);

  console.log(`[prerender] Done. Generated ${count} pages (${articles.length} articles, ${villages.length} villages).`);
  process.exit(0);
}

main().catch((err) => {
  console.error("[prerender] Error:", err);
  process.exit(1);
});
