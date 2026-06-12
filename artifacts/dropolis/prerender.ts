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
 * If dist/public/index.html does not exist yet (build not run), exits silently.
 */

import { db, pool, articlesTable, villagesTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { readFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const BASE_URL = "https://dropolis.net";
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

// Static routes with their own metadata for prerendering
const STATIC_PRERENDER: Array<Meta & { path: string }> = [
  {
    path: "/news",
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
  {
    path: "/villages",
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
  {
    path: "/photos",
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
  {
    path: "/videos",
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
  {
    path: "/about",
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
  {
    path: "/contact",
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
  {
    path: "/press",
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
  {
    path: "/help",
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
    db.select().from(articlesTable).orderBy(desc(articlesTable.createdAt)),
    db.select().from(villagesTable).orderBy(villagesTable.id),
  ]);

  let count = 0;

  // Static routes — prerender with route-specific metadata
  for (const route of STATIC_PRERENDER) {
    const { path, ...meta } = route;
    writeRoute(path, injectMeta(meta));
    count++;
  }
  console.log(`[prerender] Static routes: ${STATIC_PRERENDER.length} pages written.`);

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

  // Generate fresh sitemap.xml with real lastmod dates from DB
  const sitemapXml = buildSitemap(
    articles.map((a) => ({ id: a.id, createdAt: a.createdAt })),
    villages.map((v) => ({ id: v.id, createdAt: v.createdAt })),
  );
  writeFileSync(resolve(DIST, "sitemap.xml"), sitemapXml, "utf-8");
  console.log(`[prerender] sitemap.xml written (${articles.length + villages.length + STATIC_ROUTES.length} URLs).`);

  console.log(`[prerender] Done. Generated ${count} pages (${STATIC_PRERENDER.length} static, ${articles.length} articles, ${villages.length} villages).`);
  process.exit(0);
}

main().catch((err) => {
  console.error("[prerender] Error:", err);
  process.exit(1);
});
