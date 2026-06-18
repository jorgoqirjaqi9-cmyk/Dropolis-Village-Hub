/**
 * Server-side HTML meta injection for public page routes.
 *
 * The shared proxy routes /news, /villages, /photos, /videos, /about,
 * /contact, /press, /help, /privacy, /terms, /cookie-policy, /disclaimer,
 * /sitemap, and /chat to this server (see artifact.toml paths).
 *
 * For each route, we load the frontend's built index.html as a template,
 * strip the generic root-level meta tags, inject page-specific title /
 * description / canonical / og:* / twitter:* / JSON-LD, and inject a
 * matching <h1> + <p> fallback inside #root. React hydrates the result on the
 * client so the full SPA experience is preserved.
 */

import { Router } from "express";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { db, articlesTable, villagesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger.js";

const BASE_URL = "https://dropolis.net";
const SITE_NAME = "Δρόπολη (Dropolis)";
const DEFAULT_IMG = `${BASE_URL}/opengraph-dropolis-2026.jpg`;

// ---------------------------------------------------------------------------
// Template loader (cached in production)
// ---------------------------------------------------------------------------

let _tpl: string | null = null;

async function loadTemplate(): Promise<string> {
  if (_tpl) return _tpl;
  const cwd = process.cwd();
  const isProd = process.env.NODE_ENV === "production";

  // In development: fetch from the Vite dev server so we get Vite's full HTML
  // injection (/@vite/client, /@react-refresh preamble, etc.). Without these,
  // the browser receives HTML with only <script src="/src/main.tsx"> but is
  // missing the HMR client and React Refresh preamble that Vite normally injects,
  // which causes "Expected JS module, got text/html" errors.
  if (!isProd) {
    const vitePort = process.env.VITE_PORT ?? "20727";
    try {
      const r = await fetch(`http://localhost:${vitePort}/`);
      if (r.ok) return await r.text();
    } catch {
      // Vite not ready yet — fall through to file-based fallback
    }
  }

  // Production: use the BUILT dist/index.html (hashed assets, correct for static serving).
  // Cache the template so it is only read once.
  const candidates = (isProd
    ? [
        process.env.FRONTEND_DIST_PATH
          ? resolve(process.env.FRONTEND_DIST_PATH, "index.html")
          : null,
        resolve(cwd, "artifacts/dropolis/dist/public/index.html"),
        resolve(cwd, "../../artifacts/dropolis/dist/public/index.html"),
        resolve(cwd, "artifacts/dropolis/index.html"),
        resolve(cwd, "../../artifacts/dropolis/index.html"),
      ]
    : [
        resolve(cwd, "artifacts/dropolis/index.html"),
        resolve(cwd, "../../artifacts/dropolis/index.html"),
        resolve(cwd, "artifacts/dropolis/dist/public/index.html"),
        resolve(cwd, "../../artifacts/dropolis/dist/public/index.html"),
      ]
  ).filter(Boolean) as string[];

  for (const p of candidates) {
    if (existsSync(p)) {
      const t = readFileSync(p, "utf-8");
      if (isProd) _tpl = t;
      return t;
    }
  }
  throw new Error(`No index.html template found for SEO injection (cwd=${cwd})`);
}

// ---------------------------------------------------------------------------
// HTML helpers
// ---------------------------------------------------------------------------

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

interface ArticleMeta {
  publishedTime?: string | null;
  modifiedTime?: string | null;
  author?: string | null;
  section?: string | null;
}

interface PageMeta {
  title: string;
  /** When set, used verbatim as the HTML <title> (no "| SITE_NAME" suffix appended). */
  titleFinal?: string;
  description: string;
  image?: string | null;
  url: string;
  type?: string;
  article?: ArticleMeta;
  jsonLd?: object | object[];
  breadcrumbs?: Array<{ name: string; item: string }>;
  hreflang?: Array<{ lang: string; href: string }>;
  bodyH1?: string;
  bodyP?: string;
  noindex?: boolean;
}

function jsonLdItems(v?: object | object[]): object[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

// ---------------------------------------------------------------------------
// Description helper — ensures 120-155 char descriptions for articles
// ---------------------------------------------------------------------------

function generateArticleDesc(a: {
  metaDescription?: string | null;
  excerpt?: string | null;
  content: string;
  title: string;
}): string {
  const clean = (s: string) =>
    s.replace(/[#*_`[\]!]/g, "").replace(/\s+/g, " ").trim();

  const candidates: string[] = [
    a.metaDescription ? clean(a.metaDescription) : "",
    a.excerpt ? clean(a.excerpt) : "",
    clean(a.content),
  ].filter((s) => s.length > 0);

  // Pick first source with at least 80 chars
  const primary = candidates.find((s) => s.length >= 80) ?? candidates.sort((x, y) => y.length - x.length)[0] ?? "";

  if (primary.length >= 120) return primary.slice(0, 155);

  // Try combining to reach target length
  const combined = candidates.join(" — ");
  if (combined.length >= 60) return combined.slice(0, 155);

  return `${a.title} — ${combined}`.slice(0, 155);
}

function buildSeoTags(m: PageMeta): string {
  // Use titleFinal verbatim when set (no suffix); otherwise append site name.
  // Hard-truncate to 60 chars as a safety guard against future long titles.
  const rawTitle = m.titleFinal ?? `${m.title} | ${SITE_NAME}`;
  const title = esc(rawTitle.length > 60 ? rawTitle.slice(0, 59) + "…" : rawTitle);
  const desc = esc((m.description ?? "").slice(0, 160));
  const img = esc(m.image || DEFAULT_IMG);
  // Enforce trailing slash on all page URLs for canonical consistency
  const normalizedUrl = m.url === `${BASE_URL}/` ? m.url : (m.url.endsWith("/") ? m.url : m.url + "/");
  const url = esc(normalizedUrl);
  const type = m.type || "website";

  const articleTags: string[] = [];
  if (m.article) {
    if (m.article.publishedTime) articleTags.push(`<meta property="article:published_time" content="${esc(m.article.publishedTime)}" />`);
    if (m.article.modifiedTime) articleTags.push(`<meta property="article:modified_time" content="${esc(m.article.modifiedTime)}" />`);
    if (m.article.author) articleTags.push(`<meta property="article:author" content="${esc(m.article.author)}" />`);
    if (m.article.section) articleTags.push(`<meta property="article:section" content="${esc(m.article.section)}" />`);
  }

  const breadcrumbLd: object | null = m.breadcrumbs && m.breadcrumbs.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Αρχική", item: BASE_URL },
          ...m.breadcrumbs.map((c, i) => ({ "@type": "ListItem", position: i + 2, name: c.name, item: c.item })),
        ],
      }
    : null;

  const schemas = [...jsonLdItems(m.jsonLd), ...(breadcrumbLd ? [breadcrumbLd] : [])];

  return [
    m.noindex ? `<meta name="robots" content="noindex,follow" />` : "",
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
    `<meta property="og:image:alt" content="${desc}" />`,
    `<meta property="og:site_name" content="${esc(SITE_NAME)}" />`,
    `<meta property="og:locale" content="el_GR" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${desc}" />`,
    `<meta name="twitter:image" content="${img}" />`,
    ...articleTags,
    ...(m.hreflang ?? []).map(({ lang, href }) =>
      `<link rel="alternate" hreflang="${esc(lang)}" href="${esc(href)}" />`
    ),
    schemas.length > 0
      ? `<script type="application/ld+json">${JSON.stringify(schemas.length === 1 ? schemas[0] : schemas)}</script>`
      : "",
  ].filter(Boolean).join("\n  ");
}

function buildBodyFallback(h1: string, p: string): string {
  const t = esc(h1.slice(0, 150));
  const d = esc(p.slice(0, 240));
  return `<main class="seo-prerender-content" aria-label="${t}">\n    <h1>${t}</h1>\n    <p>${d}</p>\n  </main>`;
}

function injectMeta(template: string, m: PageMeta): string {
  let html = template
    .replace(/<title>[^<]*<\/title>/g, "")
    .replace(/<meta\s+name="description"[^>]*>/gi, "")
    .replace(/<link\s+rel="canonical"[^>]*>/gi, "")
    .replace(/<meta\s+property="og:title"[^>]*>/gi, "")
    .replace(/<meta\s+property="og:description"[^>]*>/gi, "")
    .replace(/<meta\s+property="og:type"[^>]*>/gi, "")
    .replace(/<meta\s+property="og:url"[^>]*>/gi, "")
    .replace(/<meta\s+property="og:image(?::\w+)?"[^>]*>/gi, "")
    .replace(/<meta\s+property="og:site_name"[^>]*>/gi, "")
    .replace(/<meta\s+property="og:locale"[^>]*>/gi, "")
    .replace(/<meta\s+name="twitter:[^"]*"[^>]*>/gi, "")
    .replace(/<script\s+type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/gi, "");
  // When noindex is set, strip the template's existing robots meta to avoid conflicts
  if (m.noindex) {
    html = html.replace(/<meta\s+name="robots"[^>]*>/gi, "");
  }
  html = html.replace("<head>", `<head>\n  ${buildSeoTags(m)}`);
  html = html.replace(
    /<div id="root">[^]*?<\/div>/,
    `<div id="root">\n  ${buildBodyFallback(m.bodyH1 || m.title, m.bodyP || m.description)}\n</div>`
  );
  return html;
}

// ---------------------------------------------------------------------------
// Static page meta map (mirrors STATIC_PRERENDER in route-manifest.ts)
// ---------------------------------------------------------------------------

const STATIC_META: Record<string, PageMeta> = {
  "/": {
    title: "Δρόπολη Βόρεια Ήπειρος — Ειδήσεις, Χωριά, Φωτογραφίες & Πολιτισμός",
    description: "Ειδήσεις, φωτογραφίες, βίντεο και κοινότητα για τα χωριά της Δρόπολης (Βόρεια Ήπειρος). Μείνετε ενημερωμένοι για την ελληνική μειονότητα στην Αλβανία.",
    url: `${BASE_URL}/`,
    type: "website",
    bodyH1: "Δρόπολη Βόρεια Ήπειρος — Ειδήσεις, Χωριά, Φωτογραφίες & Πολιτισμός",
    bodyP: "Ειδήσεις, φωτογραφίες, βίντεο και κοινότητα για τα χωριά της Δρόπολης (Βόρεια Ήπειρος).",
    hreflang: [
      { lang: "el",        href: `${BASE_URL}/` },
      { lang: "en",        href: `${BASE_URL}/en/` },
      { lang: "x-default", href: `${BASE_URL}/` },
    ],
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": `${BASE_URL}/#website`,
        name: "Δρόπολη (Dropolis)",
        alternateName: "Dropolis — Dropull",
        url: `${BASE_URL}/`,
        description: "Portal ειδήσεων, φωτογραφιών και κοινότητας για τα 41 χωριά της Δρόπολης (Βόρεια Ήπειρος). Ελληνική μειονότητα, ιστορία, Αργυρόκαστρο, Dropull.",
        inLanguage: "el",
        publisher: { "@id": `${BASE_URL}/#organization` },
      },
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        "@id": `${BASE_URL}/#organization`,
        name: "Δρόπολη (Dropolis)",
        alternateName: "Dropolis",
        url: `${BASE_URL}/`,
        logo: { "@type": "ImageObject", url: `${BASE_URL}/logo.png` },
        foundingLocation: { "@type": "Place", name: "Δρόπολη, Βόρεια Ήπειρος, Αλβανία" },
        sameAs: [
          "https://www.facebook.com/profile.php?id=61590959938071",
          "https://www.youtube.com/@dropolis",
        ],
      },
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "@id": `${BASE_URL}/#webpage`,
        name: "Δρόπολη Βόρεια Ήπειρος — Ειδήσεις, Χωριά, Φωτογραφίες & Πολιτισμός",
        description: "Ειδήσεις, φωτογραφίες, βίντεο και κοινότητα για τα χωριά της Δρόπολης (Βόρεια Ήπειρος). Ελληνική μειονότητα, Αργυρόκαστρο, Dropull.",
        url: `${BASE_URL}/`,
        inLanguage: "el",
        isPartOf: { "@id": `${BASE_URL}/#website` },
        about: {
          "@type": "AdministrativeArea",
          name: "Δήμος Δρόπολης",
          alternateName: "Municipality of Dropull",
          containedInPlace: { "@type": "Country", name: "Αλβανία" },
        },
        keywords: "Δρόπολη, Dropolis, Dropull, Βόρεια Ήπειρος, 41 χωριά, ελληνική μειονότητα, Αργυρόκαστρο, ειδήσεις",
      },
    ],
  },
  "/chat": {
    title: "Ζωντανή Συζήτηση",
    description: "Ζωντανή συνομιλία για την κοινότητα της Δρόπολης.",
    url: `${BASE_URL}/chat`,
    noindex: true,
    breadcrumbs: [{ name: "Ζωντανή Συζήτηση", item: `${BASE_URL}/chat` }],
    jsonLd: { "@context": "https://schema.org", "@type": "WebPage", name: "Ζωντανή Συζήτηση — Δρόπολη", url: `${BASE_URL}/chat`, inLanguage: "el" },
  },
  "/news": {
    title: "Ειδήσεις Δρόπολης — Τελευταία Νέα & Ρεπορτάζ",
    description: "Τελευταία νέα, ρεπορτάζ και ειδήσεις από τη Δρόπολη και τα 41 χωριά της Βόρειας Ηπείρου. Ελληνική μειονότητα Αλβανία, Αργυρόκαστρο, πολιτισμός, εκπαίδευση.",
    url: `${BASE_URL}/news/`,
    breadcrumbs: [{ name: "Ειδήσεις", item: `${BASE_URL}/news/` }],
    hreflang: [
      { lang: "el",        href: `${BASE_URL}/news/` },
      { lang: "en",        href: `${BASE_URL}/en/news/` },
      { lang: "x-default", href: `${BASE_URL}/news/` },
    ],
    jsonLd: { "@context": "https://schema.org", "@type": "CollectionPage", name: "Ειδήσεις Δρόπολης — Τελευταία Νέα & Ρεπορτάζ", description: "Τελευταία νέα, ρεπορτάζ και ειδήσεις από τη Δρόπολη και τα 41 χωριά της Βόρειας Ηπείρου.", url: `${BASE_URL}/news/`, inLanguage: "el" },
  },
  "/villages": {
    title: "Τα 41 Χωριά της Δρόπολης — Ιστορία & Πληροφορίες",
    description: "Ανακαλύψτε και τα 41 ιστορικά χωριά της Δρόπολης (Βόρεια Ήπειρος). Πληθυσμός, ιστορία, παραδόσεις και φωτογραφικό υλικό για κάθε χωριό.",
    url: `${BASE_URL}/villages/`,
    breadcrumbs: [{ name: "Χωριά", item: `${BASE_URL}/villages/` }],
    hreflang: [
      { lang: "el",        href: `${BASE_URL}/villages/` },
      { lang: "en",        href: `${BASE_URL}/en/villages/` },
      { lang: "x-default", href: `${BASE_URL}/villages/` },
    ],
    jsonLd: { "@context": "https://schema.org", "@type": "CollectionPage", name: "Τα 41 Χωριά της Δρόπολης", url: `${BASE_URL}/villages/`, inLanguage: "el", numberOfItems: 41 },
  },
  "/villages/map": {
    title: "Διαδραστικός Χάρτης Χωριών Δρόπολης",
    description: "Διαδραστικός χάρτης με τα 41 χωριά της Δρόπολης — πληροφορίες, φωτογραφίες, ειδήσεις και σύνδεση με κάθε χωριό της Βόρειας Ηπείρου.",
    url: `${BASE_URL}/villages/map/`,
    breadcrumbs: [
      { name: "Χωριά", item: `${BASE_URL}/villages/` },
      { name: "Διαδραστικός Χάρτης", item: `${BASE_URL}/villages/map/` },
    ],
    jsonLd: { "@context": "https://schema.org", "@type": "CollectionPage", name: "Διαδραστικός Χάρτης Χωριών Δρόπολης", url: `${BASE_URL}/villages/map/`, inLanguage: "el", numberOfItems: 41 },
  },
  "/photos": {
    title: "Φωτογραφίες Δρόπολης — Φωτογραφικό Αρχείο",
    description: "Φωτογραφικό αρχείο από τα χωριά της Δρόπολης — τοπία, παραδοσιακά κτίρια, πολιτιστικές εκδηλώσεις και η καθημερινή ζωή στη Βόρεια Ήπειρο.",
    url: `${BASE_URL}/photos/`,
    breadcrumbs: [{ name: "Φωτογραφίες", item: `${BASE_URL}/photos/` }],
    hreflang: [
      { lang: "el",        href: `${BASE_URL}/photos/` },
      { lang: "en",        href: `${BASE_URL}/en/photos/` },
      { lang: "x-default", href: `${BASE_URL}/photos/` },
    ],
    jsonLd: { "@context": "https://schema.org", "@type": "CollectionPage", name: "Φωτογραφίες Δρόπολης — Φωτογραφικό Αρχείο", url: `${BASE_URL}/photos/`, inLanguage: "el" },
  },
  "/videos": {
    title: "Βίντεο Δρόπολης — Εκδηλώσεις & Ζωή στα Χωριά",
    description: "Βίντεο από τη Δρόπολη — εκδηλώσεις, πολιτισμός, τουρισμός και η ζωή στα 41 χωριά της Βόρειας Ηπείρου.",
    url: `${BASE_URL}/videos/`,
    breadcrumbs: [{ name: "Βίντεο", item: `${BASE_URL}/videos/` }],
    jsonLd: { "@context": "https://schema.org", "@type": "CollectionPage", name: "Βίντεο Δρόπολης", url: `${BASE_URL}/videos/`, inLanguage: "el" },
  },
  "/about": {
    title: "Σχετικά με το Dropolis",
    description: "Μάθετε για το Dropolis — portal ειδήσεων, φωτογραφιών και κοινότητας για τα χωριά της Δρόπολης (Βόρεια Ήπειρος, Αλβανία).",
    url: `${BASE_URL}/about/`,
    breadcrumbs: [{ name: "Σχετικά", item: `${BASE_URL}/about/` }],
    jsonLd: { "@context": "https://schema.org", "@type": "AboutPage", name: "Σχετικά με το Dropolis", url: `${BASE_URL}/about/`, inLanguage: "el" },
  },
  "/contact": {
    title: "Επικοινωνία — Dropolis",
    description: "Επικοινωνήστε με το Dropolis. Υποβολή άρθρων, φωτογραφιών, ερωτήσεων και συνεργασιών για το portal της Δρόπολης.",
    url: `${BASE_URL}/contact/`,
    breadcrumbs: [{ name: "Επικοινωνία", item: `${BASE_URL}/contact/` }],
    jsonLd: { "@context": "https://schema.org", "@type": "ContactPage", name: "Επικοινωνία — Dropolis", url: `${BASE_URL}/contact/`, inLanguage: "el" },
  },
  "/press": {
    title: "Τύπος & Νέα — Dropolis",
    description: "Δελτία τύπου, media kit και επικοινωνία τύπου για το Dropolis — portal ειδήσεων της Δρόπολης.",
    url: `${BASE_URL}/press/`,
    breadcrumbs: [{ name: "Τύπος", item: `${BASE_URL}/press/` }],
    jsonLd: { "@context": "https://schema.org", "@type": "WebPage", name: "Τύπος & Νέα — Dropolis", url: `${BASE_URL}/press/`, inLanguage: "el" },
  },
  "/help": {
    title: "Κέντρο Βοήθειας — Dropolis",
    description: "Απαντήσεις σε συχνές ερωτήσεις για το Dropolis — portal ειδήσεων και κοινότητας της Δρόπολης.",
    url: `${BASE_URL}/help/`,
    breadcrumbs: [{ name: "Βοήθεια", item: `${BASE_URL}/help/` }],
    jsonLd: { "@context": "https://schema.org", "@type": "FAQPage", name: "Κέντρο Βοήθειας — Dropolis", url: `${BASE_URL}/help/`, inLanguage: "el" },
  },
  "/privacy": {
    title: "Πολιτική Απορρήτου — Dropolis",
    description: "Πολιτική Απορρήτου του Dropolis. Πληροφορίες για τη συλλογή, χρήση και προστασία των προσωπικών δεδομένων σας.",
    url: `${BASE_URL}/privacy/`,
    breadcrumbs: [{ name: "Πολιτική Απορρήτου", item: `${BASE_URL}/privacy/` }],
    jsonLd: { "@context": "https://schema.org", "@type": "WebPage", name: "Πολιτική Απορρήτου — Dropolis", url: `${BASE_URL}/privacy/`, inLanguage: "el" },
  },
  "/terms": {
    title: "Όροι Χρήσης — Dropolis",
    description: "Όροι Χρήσης του Dropolis. Πληροφορίες για τη χρήση του portal ειδήσεων και κοινότητας της Δρόπολης.",
    url: `${BASE_URL}/terms/`,
    breadcrumbs: [{ name: "Όροι Χρήσης", item: `${BASE_URL}/terms/` }],
    jsonLd: { "@context": "https://schema.org", "@type": "WebPage", name: "Όροι Χρήσης — Dropolis", url: `${BASE_URL}/terms/`, inLanguage: "el" },
  },
  "/cookie-policy": {
    title: "Πολιτική Cookies — Dropolis",
    description: "Πολιτική Cookies του Dropolis. Πληροφορίες για τη χρήση cookies και τεχνολογιών παρακολούθησης.",
    url: `${BASE_URL}/cookie-policy/`,
    breadcrumbs: [{ name: "Πολιτική Cookies", item: `${BASE_URL}/cookie-policy/` }],
    jsonLd: { "@context": "https://schema.org", "@type": "WebPage", name: "Πολιτική Cookies — Dropolis", url: `${BASE_URL}/cookie-policy/`, inLanguage: "el" },
  },
  "/disclaimer": {
    title: "Αποποίηση Ευθύνης — Dropolis",
    description: "Αποποίηση Ευθύνης του Dropolis. Πληροφορίες για τα όρια ευθύνης του ιστότοπου.",
    url: `${BASE_URL}/disclaimer/`,
    breadcrumbs: [{ name: "Αποποίηση Ευθύνης", item: `${BASE_URL}/disclaimer/` }],
    jsonLd: { "@context": "https://schema.org", "@type": "WebPage", name: "Αποποίηση Ευθύνης — Dropolis", url: `${BASE_URL}/disclaimer/`, inLanguage: "el" },
  },
  "/sitemap": {
    title: "Χάρτης Ιστότοπου — Dropolis",
    description: "Χάρτης ιστότοπου του Dropolis — πλήρης κατάλογος σελίδων και ενότητες του portal.",
    url: `${BASE_URL}/sitemap/`,
    breadcrumbs: [{ name: "Χάρτης Ιστότοπου", item: `${BASE_URL}/sitemap/` }],
    jsonLd: { "@context": "https://schema.org", "@type": "WebPage", name: "Χάρτης Ιστότοπου — Dropolis", url: `${BASE_URL}/sitemap/`, inLanguage: "el" },
  },
  "/editorial-policy": {
    title: "Συντακτική Πολιτική — Dropolis",
    description: "Οι συντακτικές αρχές του Dropolis — πολιτική πηγών, χρήση AI και αυτοματισμών, ανεξαρτησία και διαφάνεια.",
    url: `${BASE_URL}/editorial-policy/`,
    breadcrumbs: [{ name: "Συντακτική Πολιτική", item: `${BASE_URL}/editorial-policy/` }],
    jsonLd: { "@context": "https://schema.org", "@type": "WebPage", name: "Συντακτική Πολιτική — Dropolis", url: `${BASE_URL}/editorial-policy/`, inLanguage: "el" },
  },
  "/corrections-policy": {
    title: "Πολιτική Διορθώσεων — Dropolis",
    description: "Πώς μπορείτε να ζητήσετε διόρθωση άρθρου στο Dropolis — διαδικασία αξιολόγησης, χρονοδιάγραμμα και διαφάνεια.",
    url: `${BASE_URL}/corrections-policy/`,
    breadcrumbs: [{ name: "Πολιτική Διορθώσεων", item: `${BASE_URL}/corrections-policy/` }],
    jsonLd: { "@context": "https://schema.org", "@type": "WebPage", name: "Πολιτική Διορθώσεων — Dropolis", url: `${BASE_URL}/corrections-policy/`, inLanguage: "el" },
  },
  "/contributors": {
    title: "Συνεισφέρετε στο Dropolis",
    description: "Πώς μπορείτε να υποβάλετε ειδήσεις, φωτογραφίες και ιστορικές μαρτυρίες από τη Δρόπολη — οδηγός για τοπικούς ανταποκριτές.",
    url: `${BASE_URL}/contributors/`,
    breadcrumbs: [{ name: "Συνεισφορά", item: `${BASE_URL}/contributors/` }],
    jsonLd: { "@context": "https://schema.org", "@type": "WebPage", name: "Συνεισφέρετε στο Dropolis", url: `${BASE_URL}/contributors/`, inLanguage: "el" },
  },
  "/advertise": {
    title: "Διαφήμιση — Dropolis",
    description: "Πληροφορίες για διαφήμιση και χορηγία στο Dropolis — portal ειδήσεων της ελληνικής μειονότητας στη Βόρεια Ήπειρο.",
    url: `${BASE_URL}/advertise/`,
    breadcrumbs: [{ name: "Διαφήμιση", item: `${BASE_URL}/advertise/` }],
    jsonLd: { "@context": "https://schema.org", "@type": "WebPage", name: "Διαφήμιση — Dropolis", url: `${BASE_URL}/advertise/`, inLanguage: "el" },
  },
  "/en": {
    title: "Dropolis — Northern Epirus News Portal (English)",
    description: "English-language guide to Dropolis — the digital community portal for Dropull (Northern Epirus, Albania) and the Greek minority villages.",
    url: `${BASE_URL}/en/`,
    breadcrumbs: [{ name: "English", item: `${BASE_URL}/en/` }],
    jsonLd: { "@context": "https://schema.org", "@type": "WebPage", name: "Dropolis — Northern Epirus in English", url: `${BASE_URL}/en/`, inLanguage: "en" },
  },
  "/en/about": {
    title: "About Dropolis",
    description: "Learn about Dropolis — the digital community platform for the 41 villages of Dropull, Northern Epirus, covering news, history and culture of the Greek minority in Albania.",
    url: `${BASE_URL}/en/about/`,
    breadcrumbs: [{ name: "English", item: `${BASE_URL}/en/` }, { name: "About", item: `${BASE_URL}/en/about/` }],
    jsonLd: { "@context": "https://schema.org", "@type": "AboutPage", name: "About Dropolis", url: `${BASE_URL}/en/about/`, inLanguage: "en" },
  },
  "/en/villages": {
    title: "The 41 Villages of Dropull, Northern Epirus",
    description: "Explore the 41 villages of the Dropull municipality in southern Albania — geography, history, and the Greek minority heritage of Northern Epirus.",
    url: `${BASE_URL}/en/villages/`,
    breadcrumbs: [{ name: "English", item: `${BASE_URL}/en/` }, { name: "Villages", item: `${BASE_URL}/en/villages/` }],
    jsonLd: { "@context": "https://schema.org", "@type": "CollectionPage", name: "The 41 Villages of Dropull", url: `${BASE_URL}/en/villages/`, inLanguage: "en" },
  },
  "/en/news": {
    title: "News from Dropull, Northern Epirus",
    description: "Guide to Dropolis news coverage — what we report on, news categories, and how to find articles about the Greek minority of Dropull, Northern Epirus.",
    url: `${BASE_URL}/en/news/`,
    breadcrumbs: [{ name: "English", item: `${BASE_URL}/en/` }, { name: "News", item: `${BASE_URL}/en/news/` }],
    jsonLd: { "@context": "https://schema.org", "@type": "WebPage", name: "News from Dropull — Dropolis", url: `${BASE_URL}/en/news/`, inLanguage: "en" },
  },
  "/en/contact": {
    title: "Contact Dropolis",
    description: "Get in touch with the Dropolis team in English — news tips, photo submissions, research enquiries and partnership proposals.",
    url: `${BASE_URL}/en/contact/`,
    breadcrumbs: [{ name: "English", item: `${BASE_URL}/en/` }, { name: "Contact", item: `${BASE_URL}/en/contact/` }],
    jsonLd: { "@context": "https://schema.org", "@type": "ContactPage", name: "Contact Dropolis", url: `${BASE_URL}/en/contact/`, inLanguage: "en" },
  },
  "/en/photos": {
    title: "Photo Gallery — Dropull Villages",
    description: "Photographs from the villages of Dropull, Northern Epirus — landscapes, village life, cultural heritage and the Greek minority communities of southern Albania.",
    url: `${BASE_URL}/en/photos/`,
    breadcrumbs: [{ name: "English", item: `${BASE_URL}/en/` }, { name: "Photos", item: `${BASE_URL}/en/photos/` }],
    jsonLd: { "@context": "https://schema.org", "@type": "ImageGallery", name: "Photo Gallery — Dropull Villages", url: `${BASE_URL}/en/photos/`, inLanguage: "en" },
  },
  "/faq": {
    title: "Συχνές Ερωτήσεις — Dropolis",
    description: "Απαντήσεις σε συχνές ερωτήσεις για το Dropolis — πώς να υποβάλετε ειδήσεις, φωτογραφίες και βίντεο από τη Δρόπολη.",
    url: `${BASE_URL}/faq/`,
    breadcrumbs: [{ name: "Συχνές Ερωτήσεις", item: `${BASE_URL}/faq/` }],
    jsonLd: { "@context": "https://schema.org", "@type": "FAQPage", name: "Συχνές Ερωτήσεις — Dropolis", url: `${BASE_URL}/faq/`, inLanguage: "el" },
  },
  "/submit-news": {
    title: "Στείλτε Είδηση — Dropolis",
    description: "Υποβάλετε είδηση ή ανακοίνωση από τα χωριά της Δρόπολης. Η ομάδα μας αξιολογεί κάθε υποβολή πριν τη δημοσίευση.",
    url: `${BASE_URL}/submit-news/`,
    breadcrumbs: [{ name: "Στείλτε Είδηση", item: `${BASE_URL}/submit-news/` }],
    jsonLd: { "@context": "https://schema.org", "@type": "WebPage", name: "Στείλτε Είδηση — Dropolis", url: `${BASE_URL}/submit-news/`, inLanguage: "el" },
  },
  "/submit-video": {
    title: "Ανεβάστε Βίντεο — Dropolis",
    description: "Μοιραστείτε βίντεο από τα χωριά της Δρόπολης — εκδηλώσεις, πολιτισμός, τοπία. Η ομάδα αξιολογεί κάθε υποβολή.",
    url: `${BASE_URL}/submit-video/`,
    breadcrumbs: [{ name: "Ανεβάστε Βίντεο", item: `${BASE_URL}/submit-video/` }],
    jsonLd: { "@context": "https://schema.org", "@type": "WebPage", name: "Ανεβάστε Βίντεο — Dropolis", url: `${BASE_URL}/submit-video/`, inLanguage: "el" },
  },
  "/upload-photo": {
    title: "Υποβολή Φωτογραφίας — Dropolis",
    description: "Στείλτε τη δική σας φωτογραφία από τα χωριά της Δρόπολης. Κάθε υποβολή αξιολογείται πριν δημοσιευτεί.",
    url: `${BASE_URL}/upload-photo/`,
    noindex: false,
    breadcrumbs: [{ name: "Υποβολή Φωτογραφίας", item: `${BASE_URL}/upload-photo/` }],
    jsonLd: { "@context": "https://schema.org", "@type": "WebPage", name: "Υποβολή Φωτογραφίας — Dropolis", url: `${BASE_URL}/upload-photo/`, inLanguage: "el" },
  },
  "/diaspora": {
    title: "Έλληνες της Διασποράς | Δρόπολη",
    description: "Σελίδα για Δροπολίτες, Βορειοηπειρώτες και ελληνική ομογένεια ανά τον κόσμο. Μοιραστείτε φωτογραφίες και ιστορίες από τη ζωή σας στο εξωτερικό.",
    url: `${BASE_URL}/diaspora/`,
    noindex: false,
    breadcrumbs: [{ name: "Ομογένεια", item: `${BASE_URL}/diaspora/` }],
    jsonLd: { "@context": "https://schema.org", "@type": "WebPage", name: "Έλληνες της Διασποράς — Dropolis", url: `${BASE_URL}/diaspora/`, inLanguage: "el" },
  },
  "/finiq": {
    title: "Δήμος Φοινικαίων | Βόρεια Ήπειρος",
    description: "Ο Δήμος Φοινικαίων (Bashkia Finiq) της Βόρειας Ηπείρου. Κοινότητες, χωριά, φωτογραφίες, βίντεο και νέα από τη Φοινίκη, το Δελβινάκι και την ευρύτερη περιοχή.",
    url: `${BASE_URL}/finiq/`,
    breadcrumbs: [{ name: "Φοινικαίοι", item: `${BASE_URL}/finiq/` }],
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "AdministrativeArea",
      name: "Δήμος Φοινικαίων",
      alternateName: "Bashkia Finiq",
      url: `${BASE_URL}/finiq/`,
      description: "Ο Δήμος Φοινικαίων (Bashkia Finiq) στη Βόρεια Ήπειρο, Αλβανία — με κοινότητες Φοινίκης, Δίβρης, Λιβαδειάς, Αλύκου και Μεσοποτάμου.",
      containedInPlace: { "@type": "Country", name: "Αλβανία" },
      inLanguage: "el",
    },
    bodyH1: "Δήμος Φοινικαίων — Βόρεια Ήπειρος",
    bodyP: "Κοινότητες, χωριά, φωτογραφίες και νέα από τον Δήμο Φοινικαίων (Bashkia Finiq) στη Βόρεια Ήπειρο.",
  },
  "/paradosiaka-faghta": {
    title: "Παραδοσιακά Φαγητά της Δρόπολης: Η Αυθεντική Γαστρονομία της Βορείου Ηπείρου",
    description: "Ανακαλύψτε τα κορυφαία παραδοσιακά φαγητά της Δρόπολης και της Βορείου Ηπείρου. Από την αυθεντική Κασιόπιτα μέχρι τα μελωμένα κρέατα στη γάστρα!",
    url: `${BASE_URL}/paradosiaka-faghta/`,
    breadcrumbs: [
      { name: "Αρχική",             item: `${BASE_URL}/` },
      { name: "Παραδοσιακά Φαγητά", item: `${BASE_URL}/paradosiaka-faghta/` },
    ],
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Παραδοσιακά Φαγητά της Δρόπολης — Dropolis",
      url: `${BASE_URL}/paradosiaka-faghta/`,
      inLanguage: "el",
      description: "Παραδοσιακά φαγητά της Δρόπολης, Βορείου Ηπείρου και ελληνικής μειονότητας.",
    },
    bodyH1: "Παραδοσιακά Φαγητά της Δρόπολης: Η Αυθεντική Γαστρονομία της Βορείου Ηπείρου",
    bodyP: "Ανακαλύψτε τα κορυφαία παραδοσιακά φαγητά της Δρόπολης και της Βορείου Ηπείρου — Κασιόπιτα, κρέατα στη γάστρα, πασούλ και άλλες τοπικές συνταγές.",
  },
  "/ta-41-xoria-tis-dropolis": {
    title: "Τα 41 Χωριά της Δρόπολης — Ιστορία & Παράδοση",
    titleFinal: "Τα 41 Χωριά της Δρόπολης — Ιστορία & Παράδοση",
    description: "Ανακαλύψτε τα 41 ελληνικά χωριά της Δρόπολης στη Βόρεια Ήπειρο. Ιστορία, αξιοθέατα, φωτογραφίες και πολιτιστική κληρονομιά της ομογένειας.",
    url: `${BASE_URL}/ta-41-xoria-tis-dropolis/`,
    breadcrumbs: [
      { name: "Αρχική",        item: `${BASE_URL}/` },
      { name: "Χωριά",         item: `${BASE_URL}/villages/` },
      { name: "Τα 41 Χωριά",  item: `${BASE_URL}/ta-41-xoria-tis-dropolis/` },
    ],
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${BASE_URL}/ta-41-xoria-tis-dropolis/`,
      name: "Τα 41 Χωριά της Δρόπολης — Dropolis",
      url: `${BASE_URL}/ta-41-xoria-tis-dropolis/`,
      inLanguage: "el",
      description: "Πλήρης οδηγός για τα 41 χωριά της Δρόπολης στη Βόρεια Ήπειρο — ιστορία, πολιτισμός, αξιοθέατα, ελληνική μειονότητα, Αργυρόκαστρο.",
      publisher: {
        "@type": "Organization",
        name: "Δρόπολη — Dropolis",
        url: `${BASE_URL}/`,
      },
    },
    bodyH1: "Τα 41 Χωριά της Δρόπολης: Ιστορία, Πολιτισμός & Αξιοθέατα",
    bodyP: "Πλήρης οδηγός για τα 41 χωριά της Δρόπολης στη Βόρεια Ήπειρο — ιστορία, πολιτισμός, αξιοθέατα και νέα για κάθε χωριό της ελληνικής μειονότητας στο Αργυρόκαστρο.",
  },
};

// ---------------------------------------------------------------------------
// Response helper
// ---------------------------------------------------------------------------

async function sendPage(
  res: import("express").Response,
  meta: PageMeta,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _cacheSeconds = 3600
): Promise<void> {
  try {
    const html = injectMeta(await loadTemplate(), meta);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    // HTML pages must never be served from a stale browser cache.
    // After each deployment Vite produces new content-hashed asset filenames;
    // if the browser serves a cached HTML page that references the old hashes
    // those assets 404 and React fails to load — the user sees only the
    // server-side fallback text.  `no-cache` tells the browser to revalidate
    // with the server on every navigation (304 if unchanged, fresh HTML if
    // the template changed).  Static assets (/assets/*) retain their own
    // long-term immutable cache set in app.ts.
    res.setHeader("Cache-Control", "no-cache, must-revalidate");
    res.send(html);
  } catch (err) {
    logger.warn({ err }, "seo-pages: failed to inject meta — falling back");
    res.status(500).send("Internal error generating page");
  }
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

const router = Router();

// Static routes — register both with and without trailing slash
for (const [path, meta] of Object.entries(STATIC_META)) {
  router.get([path, `${path}/`], (_req, res) => sendPage(res, meta));
}

// Admin panel — noindex, no body text (React SPA handles rendering)
router.get(/^\/admin(\/.*)?$/, (_req, res) => {
  sendPage(
    res,
    {
      title: "Διαχείριση — Dropolis",
      description: "",
      url: `${BASE_URL}/admin`,
      noindex: true,
    },
    0 // no-cache
  );
});

// /news/:id — article detail
router.get(["/news/:id", "/news/:id/"], async (req, res) => {
  const id = parseInt(String(req.params.id), 10);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(404).send("Not found");
    return;
  }

  try {
    const [article] = await db
      .select()
      .from(articlesTable)
      .where(eq(articlesTable.id, id));

    if (!article || !article.published) {
      res.status(404).send("Not found");
      return;
    }

    const cleanedDesc = generateArticleDesc(article);

    const meta: PageMeta = {
      title: article.seoTitle || article.title,
      description: cleanedDesc,
      image: article.imageUrl,
      url: `${BASE_URL}/news/${article.id}`,
      type: "article",
      article: {
        publishedTime: article.createdAt.toISOString(),
        modifiedTime: (article.updatedAt ?? article.createdAt).toISOString(),
        author: article.author,
        section: article.category,
      },
      breadcrumbs: [
        { name: "Ειδήσεις", item: `${BASE_URL}/news` },
        { name: article.title, item: `${BASE_URL}/news/${article.id}` },
      ],
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        headline: article.title,
        description: cleanedDesc,
        image: [article.imageUrl || DEFAULT_IMG],
        datePublished: article.createdAt.toISOString(),
        dateModified: (article.updatedAt ?? article.createdAt).toISOString(),
        author: { "@type": "Person", name: article.author || "Dropolis" },
        publisher: {
          "@type": "Organization",
          name: SITE_NAME,
          logo: { "@type": "ImageObject", url: `${BASE_URL}/logo.png`, width: 1080, height: 1080 },
        },
        mainEntityOfPage: { "@type": "WebPage", "@id": `${BASE_URL}/news/${article.id}` },
        articleSection: article.category,
        inLanguage: "el",
      },
      bodyH1: article.title,
      bodyP: cleanedDesc,
    };

    sendPage(res, meta, 300);
  } catch (err) {
    logger.error({ err, id }, "seo-pages: error fetching article");
    res.status(500).send("Internal error");
  }
});

// /villages/:id — village detail
router.get(["/villages/:id", "/villages/:id/"], async (req, res) => {
  const id = parseInt(String(req.params.id), 10);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(404).send("Not found");
    return;
  }

  try {
    const [village] = await db
      .select()
      .from(villagesTable)
      .where(eq(villagesTable.id, id));

    if (!village) {
      res.status(404).send("Not found");
      return;
    }

    const description = (village.description
      ? village.description.slice(0, 155)
      : `Ανακαλύψτε το χωριό ${village.nameEl} στη Δρόπολη, Βόρεια Ήπειρος.`
    );

    const jsonLd: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "City",
      name: village.nameEl,
      alternateName: village.name,
      description: village.description,
      url: `${BASE_URL}/villages/${village.id}`,
      containedInPlace: {
        "@type": "AdministrativeArea",
        name: "Δήμος Δρόπολης",
        containedInPlace: { "@type": "Country", name: "Αλβανία" },
      },
    };
    if (village.latitude && village.longitude) {
      jsonLd["geo"] = {
        "@type": "GeoCoordinates",
        latitude: village.latitude,
        longitude: village.longitude,
      };
    }

    const meta: PageMeta = {
      title: `${village.nameEl} — Χωριό της Δρόπολης`,
      description,
      image: village.imageUrl,
      url: `${BASE_URL}/villages/${village.id}`,
      breadcrumbs: [
        { name: "Χωριά", item: `${BASE_URL}/villages` },
        { name: village.nameEl, item: `${BASE_URL}/villages/${village.id}` },
      ],
      jsonLd,
      bodyH1: village.nameEl,
      bodyP: description,
    };

    sendPage(res, meta, 3600);
  } catch (err) {
    logger.error({ err, id }, "seo-pages: error fetching village");
    res.status(500).send("Internal error");
  }
});

// ---------------------------------------------------------------------------
// Catch-all: any path reaching this router that wasn't matched above
// → real HTTP 404 with noindex (fixes "soft 404" for crawlers).
// Must call next() for /api/* so the API router can handle those.
// ---------------------------------------------------------------------------

// Prefixes that the Vite dev server owns — never serve 404 HTML for these.
const VITE_DEV_PREFIXES = ["/@", "/src/", "/node_modules/.vite", "/__vite", "/__hmr"];

router.use(async (req, res, next) => {
  // Pass /api/* through to the main API router
  if (req.path.startsWith("/api")) {
    next();
    return;
  }
  // In development, let Vite-specific paths fall through to the dev-proxy middleware
  if (process.env.NODE_ENV !== "production") {
    const isVitePath = VITE_DEV_PREFIXES.some((p) => req.path.startsWith(p));
    if (isVitePath) {
      next();
      return;
    }
  }
  try {
    const html = injectMeta(await loadTemplate(), {
      title: "Σελίδα δεν βρέθηκε",
      description: "Η σελίδα που ζητήσατε δεν υπάρχει στο Dropolis.",
      url: `${BASE_URL}/`,
      noindex: true,
      bodyH1: "Σελίδα δεν βρέθηκε",
      bodyP: "Η διεύθυνση που ζητήσατε δεν υπάρχει. Επιστρέψτε στην αρχική σελίδα.",
    });
    res
      .status(404)
      .setHeader("X-Robots-Tag", "noindex,follow")
      .setHeader("Cache-Control", "no-store")
      .send(html);
  } catch {
    res
      .status(404)
      .setHeader("X-Robots-Tag", "noindex,follow")
      .setHeader("Cache-Control", "no-store")
      .type("text/html")
      .send('<!doctype html><html lang="el"><head><meta charset="utf-8"><meta name="robots" content="noindex,follow"><title>404</title></head><body><h1>Σελίδα δεν βρέθηκε</h1><p><a href="/">Αρχική</a></p></body></html>');
  }
});

export default router;
