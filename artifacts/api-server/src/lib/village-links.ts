/**
 * Internal Link Injection — Transform 9 in the SEO sanitizer pipeline.
 *
 * Scans an HTML article body and replaces the FIRST occurrence of each
 * Dropolë village name (in any of its Greek grammatical cases) with a
 * hyperlink to that village's canonical page on Dropolis.net.
 *
 * Edge-case guarantees:
 *  • Skips text inside existing <a>…</a> (no nested links — insideAnchor guard).
 *  • Skips HTML attributes (alt, src, href, title) — the replacer only
 *    touches text nodes, never tag chunks.
 *  • Greek word-boundary lookahead/lookbehind prevents partial matches
 *    inside longer words (e.g. "Κρα" won't fire on "κράτος").
 *  • Only the FIRST occurrence of each village is linked per article
 *    (one link per village, tracked via a Set<id>).
 *  • Variants are tried in declaration order (longest-first within each
 *    entry) so multi-word names are matched before shorter sub-strings.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

interface VillageEntry {
  /** Numeric DB primary-key — used to deduplicate linked villages. */
  id: number;
  canonical: string;
  /**
   * Greek name variants to try (nominative, genitive, etc.).
   * Declared longest-first within each entry to prefer more specific forms.
   */
  variants: readonly string[];
  url: string;
}

// ─── Greek word-boundary helpers ─────────────────────────────────────────────
// Standard \b doesn't work for non-ASCII characters.
// We use negative lookahead/lookbehind on the full Unicode Greek range
// (including polytonic and extended characters) to simulate word boundaries.

const GR_RANGE = 'α-ωΑ-ΩάέήίόύώΆΈΉΊΌΎΏϊϋΐΰΪΫ';

function escRxVillage(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function villageRx(variant: string): RegExp {
  return new RegExp(
    `(?<![${GR_RANGE}a-zA-Z])${escRxVillage(variant)}(?![${GR_RANGE}a-zA-Z])`,
  );
}

// ─── Village entity map ───────────────────────────────────────────────────────
// All 41 villages of Bashkia Dropull (DB IDs 51–93, two IDs absent: 85, 90).
// Sorted longest-canonical-first so multi-word compound names are checked
// before their shorter sub-strings (e.g. "Κάτω Επισκοπή" before "Επισκοπή").

export const VILLAGE_ENTITY_MAP: readonly VillageEntry[] = [
  // ── Multi-word names first ────────────────────────────────────────────────
  { id: 65, canonical: 'Βραχογοραντζή',  variants: ['Βραχογοραντζή',  'Βραχογοραντζής'],                        url: '/villages/65/' },
  { id: 62, canonical: 'Άνω Επισκοπή',   variants: ['Άνω Επισκοπή',   'Άνω Επισκοπής'],                          url: '/villages/62/' },
  { id: 63, canonical: 'Κάτω Επισκοπή',  variants: ['Κάτω Επισκοπή',  'Κάτω Επισκοπής'],                         url: '/villages/63/' },
  { id: 84, canonical: 'Άγιος Νικόλαος', variants: ['Άγιος Νικόλαος', 'Αγίου Νικολάου', 'Αγίω Νικολάω'],        url: '/villages/84/' },
  // ── Plural forms ──────────────────────────────────────────────────────────
  { id: 67, canonical: 'Γιωργουτσάτες',  variants: ['Γιωργουτσάτες',  'Γιωργουτσάτων'],                          url: '/villages/67/' },
  { id: 69, canonical: 'Βουλιαράτες',    variants: ['Βουλιαράτες',    'Βουλιαράτων'],                             url: '/villages/69/' },
  { id: 87, canonical: 'Σχωριάδες',      variants: ['Σχωριάδες',      'Σχωριάδων'],                               url: '/villages/87/' },
  // ── Longer single-word names ──────────────────────────────────────────────
  { id: 80, canonical: 'Κοσσοβίτσα',     variants: ['Κοσσοβίτσα',     'Κοσσοβίτσας'],                             url: '/villages/80/' },
  { id: 56, canonical: 'Σωφράτικα',      variants: ['Σωφράτικα', 'Σωφράτικας', 'Σωφράτικη', 'Σωφράτικης'],       url: '/villages/56/' },
  { id: 51, canonical: 'Δερβιτσάνη',     variants: ['Δερβιτσάνη',     'Δερβιτσάνης'],                             url: '/villages/51/' },
  { id: 57, canonical: 'Τεριαχάτι',      variants: ['Τεριαχάτι',      'Τεριαχατίου'],                              url: '/villages/57/' },
  { id: 60, canonical: 'Λιούγκαρη',      variants: ['Λιούγκαρη',      'Λιούγκαρης'],                               url: '/villages/60/' },
  { id: 89, canonical: 'Τσατίστα',       variants: ['Τσατίστα',       'Τσατίστας'],                                url: '/villages/89/' },
  { id: 52, canonical: 'Γοραντζή',       variants: ['Γοραντζή',       'Γοραντζής'],                                url: '/villages/52/' },
  { id: 55, canonical: 'Δούβιανη',       variants: ['Δούβιανη',       'Δούβιανης'],                                 url: '/villages/55/' },
  { id: 59, canonical: 'Φράστανη',       variants: ['Φράστανη',       'Φράστανης'],                                url: '/villages/59/' },
  { id: 81, canonical: 'Κακαβιά',        variants: ['Κακαβιά',        'Κακαβιάς'],                                  url: '/villages/81/' },
  { id: 86, canonical: 'Πολίτσανη',      variants: ['Πολίτσανη',      'Πολίτσανης'],                               url: '/villages/86/' },
  { id: 93, canonical: 'Μαυρόγερο',      variants: ['Μαυρόγερο',      'Μαυρόγερου'],                               url: '/villages/93/' },
  { id: 66, canonical: 'Ραντάτι',        variants: ['Ραντάτι',        'Ραντατίου'],                                 url: '/villages/66/' },
  { id: 68, canonical: 'Ζερβάτι',        variants: ['Ζερβάτι',        'Ζερβατίου'],                                 url: '/villages/68/' },
  { id: 73, canonical: 'Κλεισάρι',       variants: ['Κλεισάρι',       'Κλεισαρίου'],                                url: '/villages/73/' },
  { id: 75, canonical: 'Λυκομίλι',       variants: ['Λυκομίλι',       'Λυκομιλίου'],                                url: '/villages/75/' },
  { id: 78, canonical: 'Κρυονέρι',       variants: ['Κρυονέρι',       'Κρυονερίου'],                                url: '/villages/78/' },
  { id: 88, canonical: 'Σωπίκι',         variants: ['Σωπίκι',         'Σωπικίου'],                                  url: '/villages/88/' },
  { id: 92, canonical: 'Σέλτση',         variants: ['Σέλτση',         'Σέλτσης'],                                   url: '/villages/92/' },
  { id: 82, canonical: 'Βρυσερά',        variants: ['Βρυσερά',        'Βρυσεράς'],                                  url: '/villages/82/' },
  { id: 70, canonical: 'Βόδριστα',       variants: ['Βόδριστα',       'Βόδριστας'],                                 url: '/villages/70/' },
  // ── Shorter single-word names ─────────────────────────────────────────────
  { id: 53, canonical: 'Βάνιστα',        variants: ['Βάνιστα',        'Βάνιστας'],                                  url: '/villages/53/' },
  { id: 54, canonical: 'Χάσκοβο',        variants: ['Χάσκοβο',        'Χάσκοβου'],                                  url: '/villages/54/' },
  { id: 58, canonical: 'Γορίτσα',        variants: ['Γορίτσα',        'Γορίτσας'],                                  url: '/villages/58/' },
  { id: 61, canonical: 'Γράψη',          variants: ['Γράψη',          'Γράψης'],                                    url: '/villages/61/' },
  { id: 64, canonical: 'Γλύνα',          variants: ['Γλύνα',          'Γλύνας'],                                    url: '/villages/64/' },
  { id: 71, canonical: 'Βοδίνο',         variants: ['Βοδίνο',         'Βοδίνου'],                                   url: '/villages/71/' },
  { id: 72, canonical: 'Πέπελη',         variants: ['Πέπελη',         'Πέπελης'],                                   url: '/villages/72/' },
  { id: 74, canonical: 'Σελλιό',         variants: ['Σελλιό',         'Σελλιού'],                                   url: '/villages/74/' },
  { id: 76, canonical: 'Λοβίνα',         variants: ['Λοβίνα',         'Λοβίνας'],                                   url: '/villages/76/' },
  { id: 77, canonical: 'Σωτήρα',         variants: ['Σωτήρα',         'Σωτήρας'],                                   url: '/villages/77/' },
  { id: 79, canonical: 'Λόγγος',         variants: ['Λόγγος',         'Λόγγου'],                                    url: '/villages/79/' },
  { id: 91, canonical: 'Χλωμό',          variants: ['Χλωμό',          'Χλωμού'],                                    url: '/villages/91/' },
  // ── Very short name — strict boundary guards prevent false positives ──────
  { id: 83, canonical: 'Κρα',            variants: ['Κρα'],                                                          url: '/villages/83/' },
];

// ─── Inject function ──────────────────────────────────────────────────────────

/**
 * Walks the HTML as alternating "tag" and "text-node" chunks.
 * Only text nodes outside `<a>…</a>` are eligible for replacement.
 */
export function injectInternalLinks(html: string): string {
  // Track which village IDs have already been linked in this article.
  const linkedIds = new Set<number>();
  // Depth counter for nested <a> tags (rare but possible with bad markup).
  let anchorDepth = 0;

  return html.replace(/<[^>]*>|[^<]+/g, (chunk) => {
    // ── HTML tag chunk ────────────────────────────────────────────────────────
    if (chunk.startsWith('<')) {
      if (/^<a[\s>]/i.test(chunk))   anchorDepth++;
      if (/^<\/a\s*>/i.test(chunk))  anchorDepth = Math.max(0, anchorDepth - 1);
      return chunk; // return every tag completely unchanged
    }

    // ── Text node chunk ───────────────────────────────────────────────────────
    if (anchorDepth > 0) return chunk; // already inside an <a> — do not nest

    let text = chunk;
    for (const { id, variants, url } of VILLAGE_ENTITY_MAP) {
      if (linkedIds.has(id)) continue; // this village is already linked earlier

      for (const variant of variants) {
        const rx = villageRx(variant);
        if (rx.test(text)) {
          // Replace first (and only) occurrence — rx has no /g flag.
          text = text.replace(
            rx,
            `<a href="${url}" class="seo-village-link">${variant}</a>`,
          );
          linkedIds.add(id);
          break; // stop trying other variants for this village
        }
      }
    }
    return text;
  });
}
