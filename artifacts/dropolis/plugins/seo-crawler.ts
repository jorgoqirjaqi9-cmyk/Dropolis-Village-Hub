/**
 * Vite dev-server plugin: intercepts known crawler User-Agents and returns
 * pre-populated HTML <head> with correct title / description / OG / JSON-LD.
 * Falls through silently for normal browsers and for any fetch error.
 *
 * Static route inventory and redirect map are imported from the centralized
 * route-manifest so prerender.ts, seo-crawler.ts, and sitemap.ts stay in sync.
 */
import type { Plugin } from "vite";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  STATIC_META,
  CRAWLER_REDIRECTS,
  BASE_URL,
  type Meta,
} from "../src/route-manifest.js";

const CRAWLER_UA =
  /googlebot|bingbot|yandex|duckduckbot|baiduspider|facebookexternalhit|twitterbot|linkedinbot|slackbot|whatsapp|telegram|discordbot|claudebot|gptbot|perplexitybot|applebot|ia_archiver|embedly|outbrain|pinterest/i;

const DEFAULT_IMG = `${BASE_URL}/opengraph.jpg`;
const SITE_NAME = "Δρόπολη (Dropolis)";

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

function staticExtraSchemas(m: Meta): object[] {
  if (m.url.endsWith("/help") === false) return [];
  return [
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      name: "Dropolis Help Center",
      url: BASE_URL + "/help",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is Dropolis?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Dropolis is a community portal for villages, news, photos, videos and local information."
          }
        },
        {
          "@type": "Question",
          name: "Where can I find news?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "News articles are published on /news with title, description, image and structured data."
          }
        },
        {
          "@type": "Question",
          name: "How are search engines notified?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "The site updates its sitemap and sends indexing notifications when new articles are published."
          }
        }
      ],
    },
  ];
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

  const schemas = [...jsonLdItems(m.jsonLd), ...staticExtraSchemas(m), breadcrumbLd].filter(Boolean);

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

async function fetchMeta(urlPath: string, apiPort: number): Promise<Meta | null> {
  const base = `http://localhost:${apiPort}/api`;

  // Check static routes first (no API call needed)
  if (STATIC_META[urlPath]) {
    return STATIC_META[urlPath];
  }

  const newsMatch = urlPath.match(/^\/news\/(\d+)(?:\/|$)/);
  const villageMatch = urlPath.match(/^\/villages\/(\d+)(?:\/|$)/);

  try {
    if (newsMatch) {
      const id = newsMatch[1];
      const r = await fetch(`${base}/articles/${id}`);
      if (!r.ok) return null;
      const a = (await r.json()) as {
        id: number;
        title: string;
        excerpt?: string | null;
        content: string;
        imageUrl?: string | null;
        author?: string;
        createdAt: string;
        updatedAt?: string | null;
        category?: string;
      };
      const description =
        a.excerpt ||
        a.content.replace(/[#*_`]/g, "").slice(0, 155) + "…";
      return {
        title: a.title,
        description,
        image: a.imageUrl,
        url: `${BASE_URL}/news/${id}`,
        type: "article",
        article: {
          publishedTime: a.createdAt,
          modifiedTime: a.updatedAt ?? a.createdAt,
          author: a.author,
          section: a.category,
        },
        breadcrumbs: [
          { name: "Ειδήσεις", item: `${BASE_URL}/news` },
          { name: a.title, item: `${BASE_URL}/news/${id}` },
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
            "@id": `${BASE_URL}/news/${id}`,
          },
          articleSection: a.category,
          inLanguage: "el",
        },
      };
    }

    if (villageMatch) {
      const id = villageMatch[1];
      const r = await fetch(`${base}/villages/${id}`);
      if (!r.ok) return null;
      const v = (await r.json()) as {
        id: number;
        nameEl: string;
        name: string;
        description?: string | null;
        imageUrl?: string | null;
        population?: number | null;
        latitude?: number | null;
        longitude?: number | null;
      };
      const raw = v.description || "";
      const description = raw
        ? raw.slice(0, 155) + (raw.length > 155 ? "…" : "")
        : `Ανακαλύψτε το χωριό ${v.nameEl} στη Δρόπολη, Βόρεια Ήπειρος.`;
      return {
        title: `${v.nameEl} — Χωριό της Δρόπολης`,
        description,
        image: v.imageUrl,
        url: `${BASE_URL}/villages/${id}`,
        breadcrumbs: [
          { name: "Χωριά", item: `${BASE_URL}/villages` },
          { name: v.nameEl, item: `${BASE_URL}/villages/${id}` },
        ],
        jsonLd: {
          "@context": "https://schema.org",
          "@type": "City",
          name: v.nameEl,
          alternateName: v.name,
          description: v.description,
          url: `${BASE_URL}/villages/${id}`,
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
          },
        },
      };
    }
  } catch {
    return null;
  }
  return null;
}

export function seoCrawlerPlugin(opts: { apiPort?: number } = {}): Plugin {
  const apiPort = opts.apiPort ?? 8080;
  return {
    name: "seo-crawler-middleware",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const ua = String((req.headers as Record<string, string>)["user-agent"] ?? "");
        if (!CRAWLER_UA.test(ua)) return next();

        const urlPath = String(req.url ?? "/").split("?")[0];
        if (/\.\w{1,6}$/.test(urlPath)) return next();

        try {
          // Handle legacy alias URLs with a proper 301 so bots follow the
          // canonical rather than indexing the alias as a 200 SPA page.
          // In production, the Express API server returns the 301 for these
          // paths; this clause covers the Vite dev server equivalent.
          if (CRAWLER_REDIRECTS[urlPath]) {
            res.statusCode = 301;
            (res as import("node:http").ServerResponse).setHeader("Location", CRAWLER_REDIRECTS[urlPath]);
            res.end();
            return;
          }

          const meta = await fetchMeta(urlPath, apiPort);
          if (!meta) return next();

          const raw = readFileSync(resolve(process.cwd(), "index.html"), "utf-8");
          const html = injectMeta(raw, meta);

          res.statusCode = 200;
          (res as import("node:http").ServerResponse).setHeader("Content-Type", "text/html; charset=utf-8");
          (res as import("node:http").ServerResponse).setHeader("Cache-Control", "public, max-age=300");
          (res as import("node:http").ServerResponse).setHeader("X-Prerendered", "seo-crawler");
          res.end(html);
        } catch {
          next();
        }
      });
    },
  };
}
