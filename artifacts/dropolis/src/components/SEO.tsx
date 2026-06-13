import { useEffect } from "react";
import { useLocation } from "wouter";

const SITE_NAME = "Δρόπολη";
const SITE_NAME_EN = "Dropolis";
const BASE_URL = "https://dropolis.net";
const DEFAULT_IMAGE = "/opengraph.jpg";
const DEFAULT_DESCRIPTION =
  "Το portal ειδήσεων, φωτογραφιών, βίντεο και κοινότητας για τα χωριά της Δρόπολης (Βόρεια Ήπειρος).";

export interface SEOProps {
  title: string;
  description?: string;
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
  /** When true, use title as-is without appending site name (for homepage) */
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
  image,
  type = "website",
  article,
  jsonLd,
  breadcrumbs,
  noindex = false,
  standalone = false,
}: SEOProps) {
  const [location] = useLocation();
  const canonicalUrl = `${BASE_URL}${location === "/" ? "" : location}`;
  const fullTitle = standalone ? title : `${title} | ${SITE_NAME} (${SITE_NAME_EN})`;
  const metaDesc = description || DEFAULT_DESCRIPTION;
  const ogImage = image ? (image.startsWith("http") ? image : `${BASE_URL}${image}`) : `${BASE_URL}${DEFAULT_IMAGE}`;

  useEffect(() => {
    document.title = fullTitle;

    setMeta("name", "description", metaDesc);
    setMeta(
      "name",
      "robots",
      noindex
        ? "noindex, nofollow"
        : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
    );

    setLink("canonical", canonicalUrl);

    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:description", metaDesc);
    setMeta("property", "og:type", type);
    setMeta("property", "og:url", canonicalUrl);
    setMeta("property", "og:image", ogImage);
    setMeta("property", "og:site_name", SITE_NAME);
    setMeta("property", "og:locale", "el_GR");

    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", fullTitle);
    setMeta("name", "twitter:description", metaDesc);
    setMeta("name", "twitter:image", ogImage);

    if (type === "article" && article) {
      if (article.publishedTime) setMeta("property", "article:published_time", article.publishedTime);
      if (article.modifiedTime) setMeta("property", "article:modified_time", article.modifiedTime);
      if (article.author) setMeta("property", "article:author", article.author);
      if (article.section) setMeta("property", "article:section", article.section);
    }
  }, [fullTitle, metaDesc, canonicalUrl, ogImage, type, noindex]);

  useEffect(() => {
    const schemas: object[] = [];

    const websiteSchema = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${BASE_URL}/#website`,
      name: `${SITE_NAME} (${SITE_NAME_EN})`,
      url: BASE_URL,
      description: DEFAULT_DESCRIPTION,
      inLanguage: "el",
    };

    const orgSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${BASE_URL}/#organization`,
      name: `${SITE_NAME} (${SITE_NAME_EN})`,
      url: BASE_URL,
      logo: { "@type": "ImageObject", url: `${BASE_URL}/favicon.svg` },
      sameAs: ["https://www.facebook.com/profile.php?id=61590717183098", "https://www.youtube.com/@dropolis"],
      description: DEFAULT_DESCRIPTION,
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
            item: BASE_URL,
          },
          ...breadcrumbs.map((crumb, index) => ({
            "@type": "ListItem",
            position: index + 2,
            name: crumb.name,
            item: `${BASE_URL}${crumb.url}`,
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
