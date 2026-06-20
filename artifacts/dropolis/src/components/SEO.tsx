import { useEffect } from "react";
import { useLocation } from "wouter";

const ARTICLE_SUFFIX = " | Dropolis";
const MAX_TITLE_LEN = 60;

/**
 * Produces a page title for a news article that stays within 60 characters.
 *
 * Rules (applied in order):
 *   1. rawTitle + " | Dropolis" ≤ 60 chars  → use it as-is
 *   2. rawTitle alone ≤ 60 chars             → skip the suffix
 *   3. rawTitle > 60 chars                   → truncate to 59 chars + "…"
 */
export function smartArticleTitle(rawTitle: string): string {
  if (rawTitle.length + ARTICLE_SUFFIX.length <= MAX_TITLE_LEN) {
    return rawTitle + ARTICLE_SUFFIX;
  }
  if (rawTitle.length <= MAX_TITLE_LEN) {
    return rawTitle;
  }
  return rawTitle.slice(0, MAX_TITLE_LEN - 1).trimEnd() + "…";
}

export const SITE = {
  name: "Δρόπολη",
  nameEn: "Dropolis",
  url: "https://dropolis.net",
  locale: "el_GR",
  defaultImage: "https://dropolis.net/og-home.jpg",
  description:
    "Η ψηφιακή πλατφόρμα της Δρόπολης με ειδήσεις, ιστορία, χωριά, φωτογραφίες, βίντεο και κοινότητα για τα 41 χωριά της Βόρειας Ηπείρου.",
};

export const seoPages = {
  home: {
    title: "Δρόπολη Βόρεια Ήπειρος — Τα 41 Χωριά, Ειδήσεις & Φωτογραφίες | Dropolis.net",
    description:
      "Επίσημη ψηφιακή πύλη της Δρόπολης. Ανακαλύψτε τα 41 χωριά, ιστορικά στοιχεία, φωτογραφίες, διαδραστικό χάρτη και τελευταίες ειδήσεις από την ελληνική μειονότητα της Βόρειας Ηπείρου.",
    ogDescription:
      "Τα 41 χωριά της Δρόπολης — ειδήσεις, φωτογραφίες, ιστορία, βίντεο και διαδραστικός χάρτης από την ελληνική μειονότητα της Βόρειας Ηπείρου.",
    image: "https://dropolis.net/og-home.jpg",
    url: "https://dropolis.net/",
  },
  photos: {
    title: "Φωτογραφίες Δρόπολης | Χωριά, Παράδοση και Ιστορία",
    description:
      "Φωτογραφικό αρχείο της Δρόπολης με εικόνες από χωριά, τοπία, παραδόσεις, ιστορικά σημεία και την καθημερινότητα της ελληνικής κοινότητας.",
    image: "https://dropolis.net/og-photos.jpg",
    url: "https://dropolis.net/photos/",
  },
  videos: {
    title: "Βίντεο Δρόπολης | Ρεπορτάζ, Εκδηλώσεις και Ιστορία",
    description:
      "Βίντεο, ρεπορτάζ, ντοκιμαντέρ και εκδηλώσεις από τη Δρόπολη, τα 41 χωριά της και την ελληνική κοινότητα της Βόρειας Ηπείρου.",
    image: "https://dropolis.net/og-videos.jpg",
    url: "https://dropolis.net/videos",
  },
};

export interface SEOProps {
  title: string;
  description?: string;
  /** Override og:description / twitter:description separately from meta description */
  ogDescription?: string;
  image?: string;
  type?: "website" | "article";
  article?: {
    author?: string;
    publishedTime?: string;
    modifiedTime?: string;
    section?: string;
    tags?: string[];
  };
  jsonLd?: object | object[];
  breadcrumbs?: Array<{ name: string; url: string }>;
  noindex?: boolean;
  keywords?: string;
  /** When true, use title as-is without appending site name */
  standalone?: boolean;
  /**
   * hreflang alternate links for multilingual SEO.
   * Use lang codes like "el-GR", "en", "x-default".
   * Example: [{ lang: "el-GR", href: "https://dropolis.net/" }, { lang: "en", href: "https://dropolis.net/en/" }, { lang: "x-default", href: "https://dropolis.net/" }]
   */
  hreflang?: Array<{ lang: string; href: string }>;
}

function setMeta(kind: "name" | "property", key: string, value: string) {
  const selector = `meta[${kind}="${key}"]`;
  let el = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(kind, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", value);
}

function setLink(rel: string, href: string) {
  let el = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function setHreflangLinks(entries: Array<{ lang: string; href: string }>): () => void {
  // Remove any previously injected hreflang links
  document.head.querySelectorAll('link[data-hreflang]').forEach(el => el.remove());
  for (const { lang, href } of entries) {
    const el = document.createElement("link");
    el.setAttribute("rel", "alternate");
    el.setAttribute("hreflang", lang);
    el.setAttribute("href", href);
    el.setAttribute("data-hreflang", "1");
    document.head.appendChild(el);
  }
  return () => {
    document.head.querySelectorAll('link[data-hreflang]').forEach(el => el.remove());
  };
}

function injectJsonLd(id: string, data: object | object[]) {
  const existing = document.head.querySelector(`script[data-seo="${id}"]`);
  if (existing) existing.remove();
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.setAttribute("data-seo", id);
  script.textContent = JSON.stringify(Array.isArray(data) ? data : [data], null, 0);
  document.head.appendChild(script);
  return () => script.remove();
}

export function SEO({
  title,
  description,
  ogDescription,
  image,
  type = "website",
  article,
  jsonLd,
  breadcrumbs,
  noindex = false,
  keywords,
  standalone = false,
  hreflang,
}: SEOProps) {
  const [location] = useLocation();
  const canonicalUrl = location === "/"
    ? `${SITE.url}/`
    : `${SITE.url}${location.endsWith("/") ? location : location + "/"}`;
  const fullTitle = standalone ? title : `${title} | ${SITE.name} (${SITE.nameEn})`;
  const metaDesc = description || SITE.description;
  const socialDesc = ogDescription ?? metaDesc;
  const ogImage = image
    ? image.startsWith("http")
      ? image
      : `${SITE.url}${image}`
    : SITE.defaultImage;

  useEffect(() => {
    document.title = fullTitle;

    setMeta("name", "description", metaDesc);
    if (keywords) setMeta("name", "keywords", keywords);
    setMeta(
      "name",
      "robots",
      noindex
        ? "noindex, nofollow"
        : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
    );

    setLink("canonical", canonicalUrl);

    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:description", socialDesc);
    setMeta("property", "og:type", type);
    setMeta("property", "og:url", canonicalUrl);
    setMeta("property", "og:image", ogImage);
    setMeta("property", "og:site_name", `${SITE.name} - ${SITE.nameEn}`);
    setMeta("property", "og:locale", SITE.locale);

    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", fullTitle);
    setMeta("name", "twitter:description", socialDesc);
    setMeta("name", "twitter:image", ogImage);

    if (type === "article" && article) {
      if (article.publishedTime) setMeta("property", "article:published_time", article.publishedTime);
      if (article.modifiedTime) setMeta("property", "article:modified_time", article.modifiedTime);
      if (article.author) setMeta("property", "article:author", article.author);
      if (article.section) setMeta("property", "article:section", article.section);
    }
  }, [fullTitle, metaDesc, canonicalUrl, ogImage, type, noindex, keywords]);

  useEffect(() => {
    if (!hreflang || hreflang.length === 0) return;
    return setHreflangLinks(hreflang);
  }, [hreflang]);

  // Dynamically switch <html lang> and <meta name="language"> for multilingual pages
  useEffect(() => {
    const isEnglish = location.startsWith("/en");
    const lang = isEnglish ? "en" : "el";
    document.documentElement.lang = lang;
    setMeta("name", "language", lang);
    setMeta("property", "og:locale", isEnglish ? "en_US" : "el_GR");
    return () => {
      document.documentElement.lang = "el";
      setMeta("name", "language", "el");
      setMeta("property", "og:locale", "el_GR");
    };
  }, [location]);

  useEffect(() => {
    const schemas: object[] = [];

    const websiteSchema = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${SITE.url}/#website`,
      name: "Δρόπολη - Dropolis",
      alternateName: ["Dropolis", "Δρόπολη", "Dropull"],
      url: SITE.url,
      description: SITE.description,
      inLanguage: "el",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE.url}/news?search={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    };

    const orgSchema = {
      "@context": "https://schema.org",
      "@type": "NewsMediaOrganization",
      "@id": `${SITE.url}/#organization`,
      name: "Δρόπολη - Dropolis",
      alternateName: ["Dropolis", "Δρόπολη"],
      url: SITE.url,
      foundingDate: "2026",
      logo: {
        "@type": "ImageObject",
        url: `${SITE.url}/logo.webp`,
        width: 512,
        height: 512,
      },
      sameAs: [
        "https://www.facebook.com/profile.php?id=61590959938071",
        "https://www.instagram.com/dropolis_net/",
        "https://www.reddit.com/r/DropolisNet/",
        "https://www.youtube.com/@dropolis",
      ],
      description: SITE.description,
      foundingLocation: {
        "@type": "Place",
        name: "Δρόπολη, Βόρεια Ήπειρος",
      },
      masthead: `${SITE.url}/about/`,
      publishingPrinciples: `${SITE.url}/editorial-policy/`,
      ethicsPolicy: `${SITE.url}/editorial-policy/`,
      contactPoint: {
        "@type": "ContactPoint",
        email: "info@dropolis.net",
        contactType: "editorial",
        availableLanguage: ["Greek", "English", "Albanian"],
      },
      areaServed: {
        "@type": "AdministrativeArea",
        name: "Δήμος Δρόπολης, Αλβανία",
      },
    };

    const destinationSchema = {
      "@context": "https://schema.org",
      "@type": "TouristDestination",
      "@id": `${SITE.url}/#destination`,
      name: "Δρόπολη",
      alternateName: ["Dropolis", "Dropull"],
      description: "Ο Δήμος Δρόπολης βρίσκεται στη Νότια Αλβανία (Βόρεια Ήπειρος) και αποτελεί το κέντρο της ελληνικής μειονότητας. Περιλαμβάνει 41 χωριά με πλούσια ιστορία, βυζαντινές εκκλησίες και παραδοσιακή αρχιτεκτονική.",
      url: SITE.url,
      image: `${SITE.url}/og-home.jpg`,
      touristType: [
        { "@type": "Audience", audienceType: "Cultural tourists" },
        { "@type": "Audience", audienceType: "Heritage tourists" },
        { "@type": "Audience", audienceType: "Greek diaspora" },
      ],
      includesAttraction: [
        { "@type": "TouristAttraction", name: "Αντιγόνεια (αρχαιολογικός χώρος)" },
        { "@type": "TouristAttraction", name: "Βυζαντινές εκκλησίες Δρόπολης" },
        { "@type": "TouristAttraction", name: "Πανηγύρι Αγίου Γεωργίου Δερβιτσιάνης" },
      ],
      containedInPlace: {
        "@type": "Country",
        name: "Αλβανία",
        sameAs: "https://www.wikidata.org/wiki/Q222",
      },
    };

    schemas.push(websiteSchema, orgSchema, destinationSchema);

    if (breadcrumbs && breadcrumbs.length > 0) {
      const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Αρχική",
            item: SITE.url,
          },
          ...breadcrumbs.map((crumb, index) => ({
            "@type": "ListItem",
            position: index + 2,
            name: crumb.name,
            item: `${SITE.url}${crumb.url}`,
          })),
        ],
      };
      schemas.push(breadcrumbSchema);
    }

    if (jsonLd) {
      if (Array.isArray(jsonLd)) schemas.push(...jsonLd);
      else schemas.push(jsonLd);
    }

    const cleanup = injectJsonLd("page-schema", schemas);
    return cleanup;
  }, [canonicalUrl, jsonLd, breadcrumbs]);

  return null;
}
