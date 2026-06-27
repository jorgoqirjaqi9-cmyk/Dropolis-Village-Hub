---
name: Cyrillic slug handling
description: Architecture for normalizing Cyrillic lookalike chars in article slugs across redirects, DB lookup, canonical, sitemap, and JSON-LD.
---

# Cyrillic slug handling

## Rule
Cyrillic lookalike characters (U+0430 а, U+0435 е, U+043E о, U+0440 р, U+0441 с, U+0445 х, U+0443 у) must never appear in any canonical URL, sitemap entry, or JSON-LD @id. All slug surfaces must call `latinizeCyrillicSlug()` from `artifacts/api-server/src/lib/cyrillic.ts`.

## Why
GSC surfaces article URLs with Cyrillic lookalike chars injected by scrapers/linkers. These cause duplicate-URL and canonical-mismatch issues. Must redirect to Latin canonical and ensure all metadata uses the Latin form.

## How to apply

**Shared utility:** `artifacts/api-server/src/lib/cyrillic.ts`
- `hasCyrillicLookalike(s)` — plain `string.includes()`, NOT `/g` regex (global regex lastIndex bug)
- `latinizeCyrillicSlug(s)` — `string.replaceAll()` for each pair

**redirects.ts** — catches at path level:
- `req.path` is NOT decoded by Express/parseurl — must call `decodeURIComponent(req.path)` explicitly with try/catch before checking for Cyrillic

**seo-pages.ts** — three touch points:
1. Early-return 301 if `req.params.idOrSlug` itself has Cyrillic (safety net — Express DOES decode route params)
2. Full-slug fallback: exact lookup, then SQL REPLACE normalization: `replace(replace(replace(replace(replace(replace(replace(slug,'а','a'),'е','e'),'о','o'),'р','r'),'с','c'),'х','x'),'у','u') = $param`
3. Canonical URL and numeric-only redirect both call `latinizeCyrillicSlug(article.slug)`

**sitemap.ts** — `latinizeCyrillicSlug(a.slug)` in article URL construction

**schema-builders.ts** — `latinizeCyrillicSlug(a.slug)` for `articleUrl` used in `@id`, `url`, `mainEntityOfPage`

## Current state
DB has 0 articles with Cyrillic in slug (as of 2026-06-27). The architecture is correct and will handle any future Cyrillic slugs automatically.
