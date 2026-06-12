/**
 * On-demand prerender — generates and writes prerendered HTML for a specific
 * article or village immediately after it is created or updated.
 *
 * This bridges the gap between build-time static prerendering and live content
 * changes: instead of waiting for the next full frontend rebuild, the API server
 * writes the page-specific HTML files directly into the deployed dist directory
 * and updates prerender-manifest.json so the live sitemap and IndexNow pipeline
 * immediately know the prerendered HTML is available.
 *
 * Call fire-and-forget: void prerenderArticle(id, data)
 *
 * Failures are logged but never throw — prerendering is a best-effort
 * enhancement; it must never block or break the API response.
 */

import { readFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { logger } from "./logger.js";

const BASE_URL = "https://dropolis.net";
const SITE_NAME = "Δρόπολη (Dropolis)";
const DEFAULT_IMG = `${BASE_URL}/opengraph.jpg`;

// Path to the frontend's dist/public directory.
// In Replit's production deployment both services run in the same container,
// so the API server can write directly into the static file tree.
// Override with FRONTEND_DIST_PATH env var for custom deployments.
function getDistDir(): string {
  return (
    process.env.FRONTEND_DIST_PATH ??
    resolve(process.cwd(), "artifacts/dropolis/dist/public")
  );
}

// ---------------------------------------------------------------------------
// Manifest I/O
// ---------------------------------------------------------------------------

export type PrerenderManifest = {
  generatedAt: string;
  articles: Record<string, string>;  // id → ISO prerender timestamp
  villages: Record<string, string>;  // id → ISO prerender timestamp
};

// Simple mutex: a pending Promise chain serialises concurrent manifest writes
let manifestWriteChain: Promise<void> = Promise.resolve();

function readManifest(distDir: string): PrerenderManifest {
  const path = resolve(distDir, "prerender-manifest.json");
  if (existsSync(path)) {
    try {
      return JSON.parse(readFileSync(path, "utf-8")) as PrerenderManifest;
    } catch {
      // corrupt manifest — reconstruct from scratch
    }
  }
  return { generatedAt: new Date().toISOString(), articles: {}, villages: {} };
}

function writeManifestSync(distDir: string, manifest: PrerenderManifest): void {
  writeFileSync(
    resolve(distDir, "prerender-manifest.json"),
    JSON.stringify(manifest),
    "utf-8"
  );
}

function updateManifestEntry(
  distDir: string,
  kind: "articles" | "villages",
  id: number,
  ts: string
): void {
  // Serialise manifest writes to avoid torn reads
  manifestWriteChain = manifestWriteChain.then(() => {
    try {
      const manifest = readManifest(distDir);
      manifest[kind][String(id)] = ts;
      writeManifestSync(distDir, manifest);
    } catch (err) {
      logger.warn({ err, kind, id }, "on-demand-prerender: failed to update manifest");
    }
  });
}

// ---------------------------------------------------------------------------
// HTML helpers (mirrors the logic in prerender.ts)
// ---------------------------------------------------------------------------

function esc(s: unknown): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

type ArticleMeta = {
  publishedTime?: string | null;
  modifiedTime?: string | null;
  author?: string | null;
  section?: string | null;
};

type Meta = {
  title: string;
  description: string;
  image?: string | null;
  url: string;
  type?: string;
  article?: ArticleMeta;
  jsonLd?: object;
  breadcrumbs?: Array<{ name: string; item: string }>;
};

function buildSeoTags(m: Meta): string {
  const title = esc(`${m.title} | ${SITE_NAME}`);
  const desc = esc(m.description.slice(0, 160));
  const img = esc(m.image || DEFAULT_IMG);
  const url = esc(m.url);
  const type = m.type || "website";

  const articleTags: string[] = [];
  if (m.article) {
    if (m.article.publishedTime)
      articleTags.push(`<meta property="article:published_time" content="${esc(m.article.publishedTime)}" />`);
    if (m.article.modifiedTime)
      articleTags.push(`<meta property="article:modified_time" content="${esc(m.article.modifiedTime)}" />`);
    if (m.article.author)
      articleTags.push(`<meta property="article:author" content="${esc(m.article.author)}" />`);
    if (m.article.section)
      articleTags.push(`<meta property="article:section" content="${esc(m.article.section)}" />`);
  }

  const breadcrumbLd =
    m.breadcrumbs && m.breadcrumbs.length > 0
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

  const schemas = [m.jsonLd, breadcrumbLd].filter(Boolean);

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

function injectMeta(template: string, m: Meta): string {
  let html = template
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

function writeRoute(distDir: string, routePath: string, html: string): void {
  const dir = resolve(distDir, routePath.replace(/^\//, ""));
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, "index.html"), html, "utf-8");
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export type ArticleData = {
  id: number;
  title: string;
  excerpt?: string | null;
  content: string;
  imageUrl?: string | null;
  author?: string | null;
  category?: string | null;
  createdAt: string;
  updatedAt?: string | null;
};

export type VillageData = {
  id: number;
  nameEl: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

/**
 * Generates and writes prerendered HTML for a specific article.
 * Updates prerender-manifest.json so the sitemap and indexing pipeline
 * immediately recognise this article as having current prerendered HTML.
 * Fire-and-forget: void prerenderArticle(data)
 */
export async function prerenderArticle(data: ArticleData): Promise<void> {
  const distDir = getDistDir();
  const templatePath = resolve(distDir, "index.html");

  if (!existsSync(templatePath)) {
    logger.warn({ id: data.id }, "on-demand-prerender: dist/public/index.html not found — skipping");
    return;
  }

  try {
    const template = readFileSync(templatePath, "utf-8");
    const description =
      data.excerpt ||
      data.content.replace(/[#*_`]/g, "").slice(0, 155) + "…";

    const meta: Meta = {
      title: data.title,
      description,
      image: data.imageUrl,
      url: `${BASE_URL}/news/${data.id}`,
      type: "article",
      article: {
        publishedTime: data.createdAt,
        modifiedTime: data.updatedAt ?? data.createdAt,
        author: data.author,
        section: data.category,
      },
      breadcrumbs: [
        { name: "Ειδήσεις", item: `${BASE_URL}/news` },
        { name: data.title, item: `${BASE_URL}/news/${data.id}` },
      ],
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        headline: data.title,
        description: data.excerpt || "",
        image: data.imageUrl ? [data.imageUrl] : [],
        datePublished: data.createdAt,
        dateModified: data.updatedAt ?? data.createdAt,
        author: { "@type": "Person", name: data.author || "Dropolis" },
        publisher: {
          "@type": "Organization",
          name: SITE_NAME,
          logo: { "@type": "ImageObject", url: `${BASE_URL}/favicon.svg` },
        },
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": `${BASE_URL}/news/${data.id}`,
        },
        articleSection: data.category,
        inLanguage: "el",
      },
    };

    const html = injectMeta(template, meta);
    writeRoute(distDir, `/news/${data.id}`, html);
    const ts = new Date().toISOString();
    updateManifestEntry(distDir, "articles", data.id, ts);
    logger.info({ id: data.id, url: `${BASE_URL}/news/${data.id}` }, "on-demand-prerender: article HTML written");
  } catch (err) {
    logger.warn({ err, id: data.id }, "on-demand-prerender: failed to prerender article");
  }
}

/**
 * Generates and writes prerendered HTML for a specific village.
 * Updates prerender-manifest.json so the sitemap and indexing pipeline
 * immediately recognise this village as having current prerendered HTML.
 * Fire-and-forget: void prerenderVillage(data)
 */
export async function prerenderVillage(data: VillageData): Promise<void> {
  const distDir = getDistDir();
  const templatePath = resolve(distDir, "index.html");

  if (!existsSync(templatePath)) {
    logger.warn({ id: data.id }, "on-demand-prerender: dist/public/index.html not found — skipping");
    return;
  }

  try {
    const template = readFileSync(templatePath, "utf-8");
    const raw = data.description || "";
    const description = raw
      ? raw.slice(0, 155) + (raw.length > 155 ? "…" : "")
      : `Ανακαλύψτε το χωριό ${data.nameEl} στη Δρόπολη, Βόρεια Ήπειρος.`;

    const meta: Meta = {
      title: `${data.nameEl} — Χωριό της Δρόπολης`,
      description,
      image: data.imageUrl,
      url: `${BASE_URL}/villages/${data.id}`,
      breadcrumbs: [
        { name: "Χωριά", item: `${BASE_URL}/villages` },
        { name: data.nameEl, item: `${BASE_URL}/villages/${data.id}` },
      ],
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "City",
        name: data.nameEl,
        alternateName: data.name,
        description: data.description,
        url: `${BASE_URL}/villages/${data.id}`,
        ...(data.latitude && data.longitude
          ? {
              geo: {
                "@type": "GeoCoordinates",
                latitude: data.latitude,
                longitude: data.longitude,
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

    const html = injectMeta(template, meta);
    writeRoute(distDir, `/villages/${data.id}`, html);
    const ts = new Date().toISOString();
    updateManifestEntry(distDir, "villages", data.id, ts);
    logger.info({ id: data.id, url: `${BASE_URL}/villages/${data.id}` }, "on-demand-prerender: village HTML written");
  } catch (err) {
    logger.warn({ err, id: data.id }, "on-demand-prerender: failed to prerender village");
  }
}
