/**
 * Returns the canonical SEO-friendly URL for a news article.
 * Uses the slug (format: "romanized-title-{id}") when available,
 * falls back to the numeric-ID path for articles without slugs.
 */
export function articleUrl(article: { id: number; slug?: string | null }): string {
  return article.slug ? `/news/${article.slug}/` : `/news/${article.id}/`;
}

/**
 * Parses the wouter route param from /news/:slug and returns the numeric article ID.
 *
 * Handles:
 *   "10362"              → 10362   (legacy numeric-only URL)
 *   "my-title-10362"     → 10362   (slug URL — ID is always the last segment)
 */
export function parseArticleParam(param: string): number {
  if (/^\d+$/.test(param)) return parseInt(param, 10);
  const match = param.match(/-(\d+)$/);
  return match ? parseInt(match[1], 10) : 0;
}
