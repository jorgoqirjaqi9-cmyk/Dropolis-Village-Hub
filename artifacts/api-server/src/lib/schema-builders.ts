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

/** Canonical publisher node — referenced by @id from article schemas. */
const PUBLISHER = {
  "@type": "Organization",
  "@id": `${BASE_URL}/#organization`,
  name: SITE_NAME,
  alternateName: "Dropolis",
  url: BASE_URL,
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

/** Canonical WebSite node — used as isPartOf reference. */
const WEBSITE_REF = {
  "@type": "WebSite",
  "@id": `${BASE_URL}/#website`,
  name: SITE_NAME,
  url: BASE_URL,
} as const;

// ---------------------------------------------------------------------------
// NewsArticle
// ---------------------------------------------------------------------------

export interface ArticleSchemaInput {
  id: number;
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
 * Builds a full NewsArticle schema for `/news/:id` pages.
 *
 * Returns a single object. Embed alongside a BreadcrumbList for best results.
 *
 * Google required fields covered: headline, image, datePublished,
 * dateModified, author, publisher (with logo).
 */
export function buildNewsArticleSchema(a: ArticleSchemaInput): object {
  const articleUrl = `${BASE_URL}/news/${a.id}/`;
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
    : `${BASE_URL}/opengraph-dropolis-2026.jpg`;

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "@id": articleUrl,
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
