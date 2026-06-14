import { useEffect } from "react";
import { useLocation } from "wouter";

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
    title: "Δρόπολη - Dropolis | Τα 41 χωριά της Δρόπολης στη Βόρεια Ήπειρο",
    description:
      "Το Dropolis.net είναι η ψηφιακή πλατφόρμα για τη Δρόπολη, τα 41 χωριά της Δρόπολης, την ελληνική μειονότητα στη Βόρεια Ήπειρο, με ειδήσεις, φωτογραφίες, ιστορία, βίντεο και διαδραστικό χάρτη.",
    ogDescription:
      "Ειδήσεις, φωτογραφίες, ιστορία, βίντεο και διαδραστικός χάρτης για τα 41 χωριά της Δρόπολης στη Βόρεια Ήπειρο.",
    image: "https://dropolis.net/og-home.jpg",
    url: "https://dropolis.net/",
  },
  photos: {
    title: "Φωτογραφίες Δρόπολης | Χωριά, Παράδοση και Ιστορία",
    description:
      "Φωτογραφικό αρχείο της Δρόπολης με εικόνες από χωριά, τοπία, παραδόσεις, ιστορικά σημεία και την καθημερινότητα της ελληνικής κοινότητας.",
    image: "https://dropolis.net/og-photos.jpg",
    url: "https://dropolis.net/photos",
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
}: SEOProps) {
  const [location] = useLocation();
  const canonicalUrl = `${SITE.url}${location === "/" ? "" : location}`;
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
    };

    const orgSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${SITE.url}/#organization`,
      name: "Δρόπολη - Dropolis",
      url: SITE.url,
      logo: { "@type": "ImageObject", url: `${SITE.url}/favicon.svg` },
      sameAs: [
        "https://www.facebook.com/profile.php?id=61590717183098",
        "https://www.youtube.com/@dropolis",
        "https://www.reddit.com/r/DropolisNet/",
      ],
      description: SITE.description,
    };

    schemas.push(websiteSchema, orgSchema);

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
