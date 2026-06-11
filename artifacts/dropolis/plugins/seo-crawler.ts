/**
 * Vite dev-server plugin: intercepts known crawler User-Agents and returns
 * pre-populated HTML <head> with correct title / description / OG / JSON-LD.
 * Falls through silently for normal browsers and for any fetch error.
 */
import type { Plugin } from "vite";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const CRAWLER_UA =
  /googlebot|bingbot|yandex|duckduckbot|baiduspider|facebookexternalhit|twitterbot|linkedinbot|slackbot|whatsapp|telegram|discordbot|claudebot|gptbot|perplexitybot|applebot|ia_archiver|embedly|outbrain|pinterest/i;

const BASE_URL = "https://dropolis.net";
const DEFAULT_IMG = `${BASE_URL}/opengraph.jpg`;
const SITE_NAME = "Δρόπολη (Dropolis)";

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
        jsonLd: {
          "@context": "https://schema.org",
          "@type": "NewsArticle",
          headline: a.title,
          description: a.excerpt || "",
          image: a.imageUrl ? [a.imageUrl] : [],
          datePublished: a.createdAt,
          dateModified: a.createdAt,
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
