import { useEffect } from "react";
import { useLocation } from "wouter";

const SITE_NAME = "Δρόπολη";
const SITE_NAME_EN = "Dropolis";
const BASE_URL = typeof window !== "undefined" ? window.location.origin : "https://dropolis.replit.app";
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
}

function setMeta(selector: string, attr: string, value: string) {
  let el = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    const [attrName, attrValue] = selector.replace("[", "").replace("]", "").replace(/"/g, "").split("=");
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
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
}: SEOProps) {
  const [location] = useLocation();
  const canonicalUrl = `${BASE_URL}${location === "/" ? "" : location}`;
  const fullTitle = `${title} | ${SITE_NAME} (${SITE_NAME_EN})`;
  const metaDesc = description || DEFAULT_DESCRIPTION;
  const ogImage = image ? (image.startsWith("http") ? image : `${BASE_URL}${image}`) : `${BASE_URL}${DEFAULT_IMAGE}`;

  useEffect(() => {
    document.title = fullTitle;

    setMeta('meta[name="description"]', "content", metaDesc);
    setMeta(
      'meta[name="robots"]',
      "content",
      noindex
        ? "noindex, nofollow"
        : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
    );

    setLink("canonical", canonicalUrl);

    setMeta('meta[property="og:title"]', "content", fullTitle);
    setMeta('meta[property="og:description"]', "content", metaDesc);
    setMeta('meta[property="og:type"]', "content", type);
    setMeta('meta[property="og:url"]', "content", canonicalUrl);
    setMeta('meta[property="og:image"]', "content", ogImage);
    setMeta('meta[property="og:site_name"]', "content", SITE_NAME);
    setMeta('meta[property="og:locale"]', "content", "el_GR");

    setMeta('meta[name="twitter:card"]', "content", "summary_large_image");
    setMeta('meta[name="twitter:title"]', "content", fullTitle);
    setMeta('meta[name="twitter:description"]', "content", metaDesc);
    setMeta('meta[name="twitter:image"]', "content", ogImage);

    if (type === "article" && article) {
      if (article.publishedTime) setMeta('meta[property="article:published_time"]', "content", article.publishedTime);
      if (article.modifiedTime) setMeta('meta[property="article:modified_time"]', "content", article.modifiedTime);
      if (article.author) setMeta('meta[property="article:author"]', "content", article.author);
      if (article.section) setMeta('meta[property="article:section"]', "content", article.section);
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
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${BASE_URL}/news?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    };

    const orgSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${BASE_URL}/#organization`,
      name: `${SITE_NAME} (${SITE_NAME_EN})`,
      url: BASE_URL,
      logo: { "@type": "ImageObject", url: `${BASE_URL}/favicon.svg` },
      sameAs: ["https://www.facebook.com/dropolis", "https://www.youtube.com/@dropolis"],
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
