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
import { readFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";

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
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("[prerender] Starting...");

  const [articles, villages] = await Promise.all([
    db.select().from(articlesTable),
    db.select().from(villagesTable),
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

  console.log(`[prerender] Done. Generated ${count} pages (${articles.length} articles, ${villages.length} villages).`);
  process.exit(0);
}

main().catch((err) => {
  console.error("[prerender] Error:", err);
  process.exit(1);
});
