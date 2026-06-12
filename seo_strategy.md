# SEO Strategy

## In scope
- Public marketing and informational pages (`/`, `/about`, `/contact`, `/press`, `/help`)
- Public content hubs (`/news`, `/villages`, `/photos`, `/videos`)
- Public detail pages for news articles and villages (`/news/:id`, `/villages/:id`)
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
- Route-level SEO is currently implemented client-side through `artifacts/dropolis/src/components/SEO.tsx`.
- Public routes that depend on JavaScript rendering should be treated as at risk for social bots and AI crawlers even if Google can render them eventually.
