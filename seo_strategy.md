# SEO Strategy

## In scope
- Public marketing and informational pages (`/`, `/about`, `/contact`, `/press`, `/help`)
- Public content hubs (`/news`, `/villages`, `/photos`, `/videos`)
- Public detail pages for news articles and villages (`/news/:slug-id`, `/villages/:id`)
- Crawlability assets (`robots.txt`, `sitemap.xml`, favicon, manifest, social metadata, structured data, AI crawler readiness)

## Out of scope
- API routes under `/api/**`
- Internal implementation details that do not affect crawler-visible output
- Community chat route (`/chat`) as a ranking target, because the code explicitly marks it `noindex`

## Target audience
- Greek-speaking users interested in news, culture, villages, history, and community life in Dropolis / Δρόπολη and the Greek minority in Northern Epirus.

## Primary keywords
- Δρόπολη
- νέα Δρόπολης
- χωριά Δρόπολης
- Βόρεια Ήπειρος
- ελληνική μειονότητα Αλβανίας

## Dismissed categories
- (None yet)

## Notes
- The frontend is a Vite + React SPA using `wouter`.
- Public SEO is hybrid: `artifacts/api-server/src/routes/seo-pages.ts` serves route-specific HTML for many production public routes, while frontend prerendering (`artifacts/dropolis/prerender.ts` plus `route-manifest.ts`) covers another subset of frontend-served static routes.
- Public routes that are neither proxied through the Express SEO layer nor included in the prerender inventory should be treated as at risk for social bots and AI crawlers even if Google can render them eventually.
- The authoritative sitemap is the root `https://dropolis.net/sitemap.xml`; `/api/sitemap.xml` exists only as a backward-compatible redirect.
- Article canonicals are slug-based when a slug exists, with numeric article URLs retained only as legacy redirects.
