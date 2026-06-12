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

// Static routes served to crawlers without a dynamic API fetch
const STATIC_META: Record<string, Meta> = {
  "/news": {
    title: "Ειδήσεις",
    description: "Τελευταία νέα, ρεπορτάζ και ειδήσεις από τη Δρόπολη και τα χωριά της Βόρειας Ηπείρου.",
    url: `${BASE_URL}/news`,
    breadcrumbs: [{ name: "Ειδήσεις", item: `${BASE_URL}/news` }],
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Ειδήσεις — Δρόπολη",
      description: "Τελευταία νέα και ρεπορτάζ από τη Δρόπολη.",
      url: `${BASE_URL}/news`,
      inLanguage: "el",
    },
  },
  "/villages": {
    title: "Τα Χωριά της Δρόπολης",
    description: "Ανακαλύψτε και τα 41 ιστορικά χωριά της Κάτω Δρόπολης, Άνω Δρόπολης και Πωγωνίου. Πληθυσμός, ιστορία και παραδόσεις.",
    url: `${BASE_URL}/villages`,
    breadcrumbs: [{ name: "Χωριά", item: `${BASE_URL}/villages` }],
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Τα Χωριά της Δρόπολης",
      description: "41 ιστορικά χωριά σε τρεις Δημοτικές Ενότητες — Κάτω Δρόπολης, Άνω Δρόπολης και Πωγωνίου.",
      url: `${BASE_URL}/villages`,
      inLanguage: "el",
      numberOfItems: 41,
    },
  },
  "/photos": {
    title: "Φωτογραφικό Αρχείο",
    description: "Φωτογραφίες από τα χωριά της Δρόπολης — τοπία, παραδοσιακά κτίρια, πολιτιστικές εκδηλώσεις.",
    url: `${BASE_URL}/photos`,
    breadcrumbs: [{ name: "Φωτογραφίες", item: `${BASE_URL}/photos` }],
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Φωτογραφικό Αρχείο — Δρόπολη",
      description: "Φωτογραφίες από τα χωριά της Δρόπολης.",
      url: `${BASE_URL}/photos`,
      inLanguage: "el",
    },
  },
  "/videos": {
    title: "Βίντεο",
    description: "Βίντεο από τη Δρόπολη — εκδηλώσεις, πολιτισμός, τουρισμός και ζωή στα χωριά της Βόρειας Ηπείρου.",
    url: `${BASE_URL}/videos`,
    breadcrumbs: [{ name: "Βίντεο", item: `${BASE_URL}/videos` }],
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Βίντεο — Δρόπολη",
      description: "Βίντεο από τα χωριά της Δρόπολης.",
      url: `${BASE_URL}/videos`,
      inLanguage: "el",
    },
  },
  "/about": {
    title: "Σχετικά με το Dropolis",
    description: "Μάθετε για το Dropolis — το portal ειδήσεων, φωτογραφιών και κοινότητας για τα χωριά της Δρόπολης (Βόρεια Ήπειρος, Αλβανία).",
    url: `${BASE_URL}/about`,
    breadcrumbs: [{ name: "Σχετικά", item: `${BASE_URL}/about` }],
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      name: "Σχετικά με το Dropolis",
      description: "Portal ειδήσεων και κοινότητας για τα χωριά της Δρόπολης, Βόρεια Ήπειρος.",
      url: `${BASE_URL}/about`,
    },
  },
  "/contact": {
    title: "Επικοινωνία",
    description: "Επικοινωνήστε με το Dropolis. Υποβολή άρθρων, φωτογραφιών, ερωτήσεων και συνεργασιών για το portal της Δρόπολης.",
    url: `${BASE_URL}/contact`,
    breadcrumbs: [{ name: "Επικοινωνία", item: `${BASE_URL}/contact` }],
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      name: "Επικοινωνία — Dropolis",
      description: "Επικοινωνήστε με το Dropolis.",
      url: `${BASE_URL}/contact`,
    },
  },
  "/press": {
    title: "Τύπος & Νέα",
    description: "Δελτία τύπου, media kit και επικοινωνία τύπου για το Dropolis — portal ειδήσεων της Δρόπολης.",
    url: `${BASE_URL}/press`,
    breadcrumbs: [{ name: "Τύπος", item: `${BASE_URL}/press` }],
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Τύπος & Νέα — Dropolis",
      description: "Ανακοινώσεις τύπου, media kit και επικοινωνία για δημοσιογράφους.",
      url: `${BASE_URL}/press`,
      inLanguage: "el",
    },
  },
  "/help": {
    title: "Κέντρο Βοήθειας",
    description: "Απαντήσεις σε συχνές ερωτήσεις για το Dropolis — portal ειδήσεων και κοινότητας της Δρόπολης.",
    url: `${BASE_URL}/help`,
    breadcrumbs: [{ name: "Βοήθεια", item: `${BASE_URL}/help` }],
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Κέντρο Βοήθειας — Dropolis",
      url: `${BASE_URL}/help`,
      inLanguage: "el",
    },
  },
};

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
