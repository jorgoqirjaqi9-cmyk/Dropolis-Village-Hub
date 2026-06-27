/**
 * Cyrillic-to-Latin slug normalization utilities.
 *
 * Certain Cyrillic characters are visually identical to Latin ones (e.g.
 * U+0430 CYRILLIC SMALL LETTER A looks exactly like Latin "a"). Search engines
 * and social scrapers may store or link article URLs that contain these Cyrillic
 * lookalikes instead of their Latin counterparts, causing duplicate-URL and
 * canonical-mismatch issues.
 *
 * These helpers are used in three places:
 *   1. redirects.ts   — 301-redirect incoming Cyrillic paths to the Latin URL
 *   2. seo-pages.ts   — resolve articles whose DB slug contains Cyrillic,
 *                       and always emit a Latin canonical URL
 *   3. sitemap.ts     — emit only Latin-slug URLs in the XML sitemap
 *
 * IMPORTANT: uses String#includes / String#replaceAll (plain strings, NOT /g
 * regexes) to avoid the global-regex lastIndex state bug that causes alternating
 * pass/fail when reusing module-level RegExp objects across requests.
 */

export const CYRILLIC_LOOKALIKES: [string, string][] = [
  ["\u0430", "a"], // а → a  (CYRILLIC SMALL LETTER A)
  ["\u0435", "e"], // е → e  (CYRILLIC SMALL LETTER IE)
  ["\u043e", "o"], // о → o  (CYRILLIC SMALL LETTER O)
  ["\u0440", "r"], // р → r  (CYRILLIC SMALL LETTER ER)
  ["\u0441", "c"], // с → c  (CYRILLIC SMALL LETTER ES)
  ["\u0445", "x"], // х → x  (CYRILLIC SMALL LETTER HA)
  ["\u0443", "u"], // у → u  (CYRILLIC SMALL LETTER U)
];

/** Returns true if `s` contains any Cyrillic lookalike character. */
export function hasCyrillicLookalike(s: string): boolean {
  return CYRILLIC_LOOKALIKES.some(([ch]) => s.includes(ch));
}

/**
 * Replaces all Cyrillic lookalike characters in `s` with their Latin
 * equivalents, producing a clean slug safe for canonical URLs and sitemaps.
 */
export function latinizeCyrillicSlug(s: string): string {
  let result = s;
  for (const [from, to] of CYRILLIC_LOOKALIKES) {
    result = result.replaceAll(from, to);
  }
  return result;
}
