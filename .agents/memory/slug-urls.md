---
name: Slug-based article URLs
description: Article URL format, routing, and SEO trimming for /news/{slug}-{id}/ URLs.
---

## Rule
Article URLs use the format `/news/{romanized-title}-{id}/`. The numeric ID is always the last segment after the final `-`.

**Why:** SEO-friendly slugs improve click-through rates and crawl equity vs. bare numeric IDs.

## Key files
- `artifacts/dropolis/src/lib/article-url.ts` — `articleUrl(article)` and `parseArticleParam(param)` utilities
- `artifacts/dropolis/src/App.tsx` — Route params use `:slug` not `:id`
- `artifacts/api-server/src/routes/seo-pages.ts` — Handles slug + numeric routes; 301 redirect numeric→slug
- `artifacts/api-server/src/routes/sitemap.ts` — Uses `a.slug ?? a.id` in URL generation

## How to apply
- All article links must use `articleUrl(article)` (never hardcode `/news/${id}/`)
- `parseArticleParam(param)` extracts ID from either `"10362"` or `"my-title-10362"`
- If slug has no trailing numeric ID, seo-pages.ts does a full-slug DB lookup (fallback)
- `buildSeoTags` enforces: title ≤ 60 chars (59 + "…"), description ≤ 155 chars

## Pitfall
Articles created with a custom slug that has NO numeric ID at the end (e.g. `odoiporiko-sta-xoria-tis-dropolis`) will 404 on the frontend. Fix: ensure slug ends with `-{id}`. The seo-pages.ts fallback handles bots but the React router won't find the article without the ID.
