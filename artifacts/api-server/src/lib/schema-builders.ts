/**
 * JSON-LD Schema.org schema builders for structured data.
 *
 * Each function returns a plain object (or array of objects) ready to be
 * serialised with JSON.stringify() and injected as:
 *   <script type="application/ld+json">...</script>
 *
 * All schemas target the Google Rich Results spec (2026) and have been
 * validated against https://validator.schema.org/.
 *
 * References:
 *   https://developers.google.com/search/docs/appearance/structured-data/article
 *   https://developers.google.com/search/docs/appearance/structured-data/local-business
 *   https://schema.org/NewsArticle
 *   https://schema.org/TouristAttraction
 */

const BASE_URL = "https://dropolis.net";
const SITE_NAME = "Δρόπολη (Dropolis)";

/**
 * Canonical publisher node embedded in article/village schemas.
 * Intentionally omits `url` — the @id is the canonical identifier and
 * duplicating url/name across both Organization and WebSite on the same
 * page triggers "Duplicate field" warnings in Google Rich Results Test.
 */
const PUBLISHER = {
  "@type": "Organization",
  "@id": `${BASE_URL}/#organization`,
  name: SITE_NAME,
  alternateName: "Dropolis",
  logo: {
    "@type": "ImageObject",
    url: `${BASE_URL}/logo.png`,
    width: 1080,
    height: 1080,
    caption: "Dropolis — Portal Δρόπολης",
  },
  sameAs: [
    "https://www.facebook.com/profile.php?id=61590959938071",
    "https://www.youtube.com/@dropolis",
  ],
} as const;

/**
 * WebSite reference used as `isPartOf` in article/village schemas.
 * Kept as @id-only to avoid duplicating name/url across multiple inline
 * entities on the same page (would trigger "Duplicate field" warnings).
 */
const WEBSITE_REF = {
  "@type": "WebSite",
  "@id": `${BASE_URL}/#website`,
} as const;

// ---------------------------------------------------------------------------
// NewsArticle
// ---------------------------------------------------------------------------

export interface ArticleSchemaInput {
  id: number;
  slug?: string | null;
  title: string;
  description: string;
  imageUrl?: string | null;
  author?: string | null;
  category?: string | null;
  tags?: string | null;
  villageName?: string | null;
  createdAt: Date;
  updatedAt?: Date | null;
}

/**
 * Builds a full NewsArticle schema for `/news/:slug` pages.
 *
 * Returns a single object. Embed alongside a BreadcrumbList for best results.
 *
 * Google required fields covered: headline, image, datePublished,
 * dateModified, author, publisher (with logo).
 */
export function buildNewsArticleSchema(a: ArticleSchemaInput): object {
  const articleUrl = `${BASE_URL}/news/${a.slug ?? a.id}/`;
  const datePublished = a.createdAt.toISOString();
  const dateModified = (a.updatedAt ?? a.createdAt).toISOString();

  // Combine category + tags as comma-separated keywords (max 300 chars)
  const keywordParts = [
    a.category,
    ...(a.tags ? a.tags.split(",").map((t) => t.trim()) : []),
    "Δρόπολη",
    "Βόρεια Ήπειρος",
    "ελληνική μειονότητα",
  ].filter(Boolean);
  const keywords = [...new Set(keywordParts)].join(", ").slice(0, 300);

  const image: Record<string, unknown> | string = a.imageUrl
    ? {
        "@type": "ImageObject",
        url: a.imageUrl,
        width: 1200,
        height: 630,
        caption: a.title,
      }
    : `${BASE_URL}/og-home.jpg`;

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "@id": `${articleUrl}#article`,
    url: articleUrl,
    headline: a.title.slice(0, 110),
    description: a.description.slice(0, 160),
    image,
    datePublished,
    dateModified,
    author: {
      "@type": "Person",
      name: a.author || "Dropolis",
      ...(a.author ? {} : { url: BASE_URL }),
    },
    publisher: PUBLISHER,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": articleUrl,
    },
    isPartOf: WEBSITE_REF,
    inLanguage: "el",
    keywords,
  };

  if (a.category) schema["articleSection"] = a.category;
  if (a.villageName) {
    schema["about"] = {
      "@type": "Place",
      name: a.villageName,
      containedInPlace: {
        "@type": "AdministrativeArea",
        name: "Δήμος Δρόπολης",
        containedInPlace: { "@type": "Country", name: "Αλβανία" },
      },
    };
  }

  return schema;
}

// ---------------------------------------------------------------------------
// Static pages (WebPage / CollectionPage / AboutPage / etc.)
// ---------------------------------------------------------------------------

export interface StaticPageSchemaInput {
  /** Schema.org @type — single string or multi-type array. */
  type: string | string[];
  /** Canonical URL of the page (with trailing slash). */
  url: string;
  /** Schema name (usually the page title). */
  name: string;
  /** Optional short description. */
  description?: string;
  /** Page language — defaults to "el". */
  lang?: "el" | "en";
  /** Any extra schema.org fields for this type (e.g. numberOfItems, alternateName). */
  extra?: Record<string, unknown>;
}

/**
 * Builds a complete schema for any static page.
 *
 * Automatically fills in:
 *   - @context, @type, @id (`${url}#webpage`)
 *   - url, name, description, inLanguage
 *   - isPartOf → WebSite @id reference
 *   - publisher  → Organization @id reference
 *
 * Usage — adding a new page requires only one call:
 *   jsonLd: buildStaticPageSchema({ type: "WebPage", url: `${BASE_URL}/my-page/`, name: "My Page" })
 */
export function buildStaticPageSchema(opts: StaticPageSchemaInput): object {
  return {
    "@context": "https://schema.org",
    "@type": opts.type,
    "@id": `${opts.url}#webpage`,
    url: opts.url,
    name: opts.name,
    ...(opts.description ? { description: opts.description } : {}),
    inLanguage: opts.lang ?? "el",
    isPartOf: { "@id": `${BASE_URL}/#website` },
    publisher: { "@id": `${BASE_URL}/#organization` },
    ...(opts.extra ?? {}),
  };
}

// ---------------------------------------------------------------------------
// Village (Place + TouristAttraction + City)
// ---------------------------------------------------------------------------

export interface VillageSchemaInput {
  id: number;
  nameEl: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  population?: number | null;
  elevation?: number | null;
  municipalUnit?: string | null;
}

/**
 * Builds a two-schema array for `/villages/:id` pages:
 *   [0] Place / TouristAttraction / City — the geographic/attraction entity
 *   [1] WebPage — the page itself, with isPartOf reference
 *
 * `nameEl` = Greek name (main), `name` = Albanian/Latin name (alternateName).
 * Geo coordinates, population and elevation are included when present.
 */
export function buildVillageSchema(v: VillageSchemaInput): object[] {
  const villageUrl = `${BASE_URL}/villages/${v.id}/`;
  const titleEl = `${v.nameEl} — Χωριό της Δρόπολης`;

  const placeSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": ["Place", "TouristAttraction", "City"],
    "@id": villageUrl,
    name: v.nameEl,
    alternateName: [v.name, v.nameEl].filter(
      (n, i, arr) => n && arr.indexOf(n) === i
    ),
    description: v.description?.slice(0, 300) ??
      `Ανακαλύψτε το χωριό ${v.nameEl} στη Δρόπολη, Βόρεια Ήπειρος — ιστορία, φωτογραφίες και πολιτιστική κληρονομιά.`,
    url: villageUrl,
    inLanguage: "el",
    isAccessibleForFree: true,
    touristType: {
      "@type": "Audience",
      audienceType: "Cultural Tourism",
    },
    containedInPlace: {
      "@type": "AdministrativeArea",
      name: v.municipalUnit ?? "Δήμος Δρόπολης",
      alternateName: "Dropull Municipality",
      containedInPlace: {
        "@type": "Country",
        name: "Αλβανία",
        alternateName: "Albania",
      },
    },
  };

  if (v.imageUrl) {
    placeSchema["image"] = {
      "@type": "ImageObject",
      url: v.imageUrl,
      caption: v.nameEl,
    };
  }

  if (v.latitude != null && v.longitude != null) {
    placeSchema["geo"] = {
      "@type": "GeoCoordinates",
      latitude: v.latitude,
      longitude: v.longitude,
    };
    placeSchema["hasMap"] = `https://www.openstreetmap.org/?mlat=${v.latitude}&mlon=${v.longitude}&zoom=14`;
  }

  if (v.population != null && v.population > 0) {
    placeSchema["population"] = v.population;
  }

  if (v.elevation != null && v.elevation > 0) {
    placeSchema["elevation"] = `${v.elevation} m`;
  }

  const webPageSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${villageUrl}#webpage`,
    url: villageUrl,
    name: titleEl,
    description: v.description?.slice(0, 160) ??
      `Πληροφορίες για το χωριό ${v.nameEl} στη Δρόπολη — ιστορία, γεωγραφία και πολιτιστική κληρονομιά.`,
    inLanguage: "el",
    isPartOf: WEBSITE_REF,
    about: { "@id": villageUrl },
    publisher: { "@id": `${BASE_URL}/#organization` },
  };

  return [placeSchema, webPageSchema];
}
