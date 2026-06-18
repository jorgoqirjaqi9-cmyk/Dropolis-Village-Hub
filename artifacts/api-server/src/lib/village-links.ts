/**
 * Internal Link Injection — Transform 9 in the SEO sanitizer pipeline.
 *
 * Scans an HTML article body and replaces the FIRST occurrence of each
 * Dropolë village name (in any of its name variants) with a hyperlink to
 * that village's canonical page on Dropolis.net.
 *
 * Supports two language modes:
 *  • 'el' (default) — Greek variants → /villages/:id/
 *  • 'en'           — English/Albanian variants → /en/villages/:id/
 *
 * Edge-case guarantees:
 *  • Skips text inside existing <a>…</a> (no nested links — anchorDepth guard).
 *  • Skips HTML attributes (alt, src, href, title) — the replacer only
 *    touches text nodes, never tag chunks.
 *  • Language-appropriate word-boundary lookahead/lookbehind prevents
 *    partial matches inside longer words.
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
   * Greek name variants (nominative, genitive, etc.), longest-first within entry.
   * Used when lang === 'el' (default).
   */
  variants: readonly string[];
  /**
   * English / Albanian-transliteration name variants, longest-first within entry.
   * Used when lang === 'en'.
   */
  enVariants: readonly string[];
  /** Greek URL — /villages/:id/ */
  url: string;
  /** English URL — /en/villages/:id/ */
  enUrl: string;
}

// ─── Word-boundary helpers ────────────────────────────────────────────────────
// Standard \b doesn't work for non-ASCII characters.
// We use negative lookahead/lookbehind on the full Unicode Greek range
// (including polytonic and extended) to simulate Greek word boundaries.
// For English/Latin we rely on ASCII word-char class.

const GR_RANGE = 'α-ωΑ-ΩάέήίόύώΆΈΉΊΌΎΏϊϋΐΰΪΫ';

function escRxVillage(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function villageRx(variant: string, lang: 'el' | 'en'): RegExp {
  if (lang === 'en') {
    // Latin word boundary: not preceded/followed by [a-zA-Z0-9_-]
    return new RegExp(
      `(?<![a-zA-Z0-9_\\-])${escRxVillage(variant)}(?![a-zA-Z0-9_\\-])`,
      'i',
    );
  }
  // Greek word boundary
  return new RegExp(
    `(?<![${GR_RANGE}a-zA-Z])${escRxVillage(variant)}(?![${GR_RANGE}a-zA-Z])`,
  );
}

// ─── Village entity map ───────────────────────────────────────────────────────
// All 41 villages of Bashkia Dropull (DB IDs 51–93, two IDs absent: 85, 90).
// Sorted longest-canonical-first so multi-word names are matched before their
// shorter sub-strings (e.g. "Κάτω Επισκοπή" before "Επισκοπή").

export const VILLAGE_ENTITY_MAP: readonly VillageEntry[] = [
  // ── Multi-word / compound names first ────────────────────────────────────────
  {
    id: 65, canonical: 'Βραχογοραντζή',
    variants:   ['Βραχογοραντζή', 'Βραχογοραντζής'],
    enVariants: ['Vraho-Goranxi', 'Vracho-Goranxi', 'Vrachogorantzi'],
    url: '/villages/65/', enUrl: '/en/villages/65/',
  },
  {
    id: 62, canonical: 'Άνω Επισκοπή',
    variants:   ['Άνω Επισκοπή', 'Άνω Επισκοπής'],
    enVariants: ['Upper Episkopi', 'Episkopi i Siperm', 'Ano Episkopi'],
    url: '/villages/62/', enUrl: '/en/villages/62/',
  },
  {
    id: 63, canonical: 'Κάτω Επισκοπή',
    variants:   ['Κάτω Επισκοπή', 'Κάτω Επισκοπής'],
    enVariants: ['Lower Episkopi', 'Episkopi i Poshem', 'Kato Episkopi'],
    url: '/villages/63/', enUrl: '/en/villages/63/',
  },
  {
    id: 84, canonical: 'Άγιος Νικόλαος',
    variants:   ['Άγιος Νικόλαος', 'Αγίου Νικολάου', 'Αγίω Νικολάω'],
    enVariants: ['Agios Nikolaos', 'Drite', 'Dritë'],
    url: '/villages/84/', enUrl: '/en/villages/84/',
  },
  // ── Plural forms ──────────────────────────────────────────────────────────────
  {
    id: 67, canonical: 'Γιωργουτσάτες',
    variants:   ['Γιωργουτσάτες', 'Γιωργουτσάτων'],
    enVariants: ['Gjergucate', 'Georgoutsates', 'Gorgucat'],
    url: '/villages/67/', enUrl: '/en/villages/67/',
  },
  {
    id: 69, canonical: 'Βουλιαράτες',
    variants:   ['Βουλιαράτες', 'Βουλιαράτων'],
    enVariants: ['Bularat', 'Vouliarates'],
    url: '/villages/69/', enUrl: '/en/villages/69/',
  },
  {
    id: 87, canonical: 'Σχωριάδες',
    variants:   ['Σχωριάδες', 'Σχωριάδων'],
    enVariants: ['Skore', 'Sxoriades'],
    url: '/villages/87/', enUrl: '/en/villages/87/',
  },
  // ── Longer single-word names ──────────────────────────────────────────────────
  {
    id: 80, canonical: 'Κοσσοβίτσα',
    variants:   ['Κοσσοβίτσα', 'Κοσσοβίτσας'],
    enVariants: ['Kosovce', 'Kosovcë', 'Kosovitsa'],
    url: '/villages/80/', enUrl: '/en/villages/80/',
  },
  {
    id: 56, canonical: 'Σωφράτικα',
    variants:   ['Σωφράτικα', 'Σωφράτικας', 'Σωφράτικη', 'Σωφράτικης'],
    enVariants: ['Sofratike', 'Sofratikë', 'Sophratika'],
    url: '/villages/56/', enUrl: '/en/villages/56/',
  },
  {
    id: 51, canonical: 'Δερβιτσάνη',
    variants:   ['Δερβιτσάνη', 'Δερβιτσάνης'],
    enVariants: ['Dervitsani', 'Derviçan', 'Dervican'],
    url: '/villages/51/', enUrl: '/en/villages/51/',
  },
  {
    id: 57, canonical: 'Τεριαχάτι',
    variants:   ['Τεριαχάτι', 'Τεριαχατίου'],
    enVariants: ['Terjahat'],
    url: '/villages/57/', enUrl: '/en/villages/57/',
  },
  {
    id: 60, canonical: 'Λιούγκαρη',
    variants:   ['Λιούγκαρη', 'Λιούγκαρης'],
    enVariants: ['Liugar', 'Liougari'],
    url: '/villages/60/', enUrl: '/en/villages/60/',
  },
  {
    id: 89, canonical: 'Τσατίστα',
    variants:   ['Τσατίστα', 'Τσατίστας'],
    enVariants: ['Cacisht', 'Caçisht', 'Tsatista'],
    url: '/villages/89/', enUrl: '/en/villages/89/',
  },
  {
    id: 52, canonical: 'Γοραντζή',
    variants:   ['Γοραντζή', 'Γοραντζής'],
    enVariants: ['Goranxi', 'Gorantzi'],
    url: '/villages/52/', enUrl: '/en/villages/52/',
  },
  {
    id: 55, canonical: 'Δούβιανη',
    variants:   ['Δούβιανη', 'Δούβιανης'],
    enVariants: ['Duvjan', 'Douviani'],
    url: '/villages/55/', enUrl: '/en/villages/55/',
  },
  {
    id: 59, canonical: 'Φράστανη',
    variants:   ['Φράστανη', 'Φράστανης'],
    enVariants: ['Frashtan', 'Frastani'],
    url: '/villages/59/', enUrl: '/en/villages/59/',
  },
  {
    id: 81, canonical: 'Κακαβιά',
    variants:   ['Κακαβιά', 'Κακαβιάς'],
    enVariants: ['Kakavije', 'Kakavijë', 'Kakavia'],
    url: '/villages/81/', enUrl: '/en/villages/81/',
  },
  {
    id: 86, canonical: 'Πολίτσανη',
    variants:   ['Πολίτσανη', 'Πολίτσανης'],
    enVariants: ['Politsan', 'Politsani'],
    url: '/villages/86/', enUrl: '/en/villages/86/',
  },
  {
    id: 93, canonical: 'Μαυρόγερο',
    variants:   ['Μαυρόγερο', 'Μαυρόγερου'],
    enVariants: ['Mavrogjer', 'Mavrogero'],
    url: '/villages/93/', enUrl: '/en/villages/93/',
  },
  {
    id: 66, canonical: 'Ραντάτι',
    variants:   ['Ραντάτι', 'Ραντατίου'],
    enVariants: ['Radati'],
    url: '/villages/66/', enUrl: '/en/villages/66/',
  },
  {
    id: 68, canonical: 'Ζερβάτι',
    variants:   ['Ζερβάτι', 'Ζερβατίου'],
    enVariants: ['Zervat', 'Zervati'],
    url: '/villages/68/', enUrl: '/en/villages/68/',
  },
  {
    id: 73, canonical: 'Κλεισάρι',
    variants:   ['Κλεισάρι', 'Κλεισαρίου'],
    enVariants: ['Klishar', 'Klisari'],
    url: '/villages/73/', enUrl: '/en/villages/73/',
  },
  {
    id: 75, canonical: 'Λυκομίλι',
    variants:   ['Λυκομίλι', 'Λυκομιλίου'],
    enVariants: ['Likomil', 'Lykomili'],
    url: '/villages/75/', enUrl: '/en/villages/75/',
  },
  {
    id: 78, canonical: 'Κρυονέρι',
    variants:   ['Κρυονέρι', 'Κρυονερίου'],
    enVariants: ['Krioneri'],
    url: '/villages/78/', enUrl: '/en/villages/78/',
  },
  {
    id: 88, canonical: 'Σωπίκι',
    variants:   ['Σωπίκι', 'Σωπικίου'],
    enVariants: ['Sopik', 'Sopiki'],
    url: '/villages/88/', enUrl: '/en/villages/88/',
  },
  {
    id: 92, canonical: 'Σέλτση',
    variants:   ['Σέλτση', 'Σέλτσης'],
    enVariants: ['Selce', 'Selcë', 'Seltsi'],
    url: '/villages/92/', enUrl: '/en/villages/92/',
  },
  {
    id: 82, canonical: 'Βρυσερά',
    variants:   ['Βρυσερά', 'Βρυσεράς'],
    enVariants: ['Vrysera'],
    url: '/villages/82/', enUrl: '/en/villages/82/',
  },
  {
    id: 70, canonical: 'Βόδριστα',
    variants:   ['Βόδριστα', 'Βόδριστας'],
    enVariants: ['Bodrishte', 'Bodrishtë', 'Vodrista'],
    url: '/villages/70/', enUrl: '/en/villages/70/',
  },
  // ── Shorter single-word names ─────────────────────────────────────────────────
  {
    id: 53, canonical: 'Βάνιστα',
    variants:   ['Βάνιστα', 'Βάνιστας'],
    enVariants: ['Vaniste', 'Vanistë', 'Vanista'],
    url: '/villages/53/', enUrl: '/en/villages/53/',
  },
  {
    id: 54, canonical: 'Χάσκοβο',
    variants:   ['Χάσκοβο', 'Χάσκοβου'],
    enVariants: ['Hazkovo'],
    url: '/villages/54/', enUrl: '/en/villages/54/',
  },
  {
    id: 58, canonical: 'Γορίτσα',
    variants:   ['Γορίτσα', 'Γορίτσας'],
    enVariants: ['Gorice', 'Goricë', 'Goritsa'],
    url: '/villages/58/', enUrl: '/en/villages/58/',
  },
  {
    id: 61, canonical: 'Γράψη',
    variants:   ['Γράψη', 'Γράψης'],
    enVariants: ['Grapse', 'Grapsë'],
    url: '/villages/61/', enUrl: '/en/villages/61/',
  },
  {
    id: 64, canonical: 'Γλύνα',
    variants:   ['Γλύνα', 'Γλύνας'],
    enVariants: ['Glina', 'Glyna'],
    url: '/villages/64/', enUrl: '/en/villages/64/',
  },
  {
    id: 71, canonical: 'Βοδίνο',
    variants:   ['Βοδίνο', 'Βοδίνου'],
    enVariants: ['Vodino'],
    url: '/villages/71/', enUrl: '/en/villages/71/',
  },
  {
    id: 72, canonical: 'Πέπελη',
    variants:   ['Πέπελη', 'Πέπελης'],
    enVariants: ['Pepel', 'Pepeli'],
    url: '/villages/72/', enUrl: '/en/villages/72/',
  },
  {
    id: 74, canonical: 'Σελλιό',
    variants:   ['Σελλιό', 'Σελλιού'],
    enVariants: ['Sello', 'Sellio'],
    url: '/villages/74/', enUrl: '/en/villages/74/',
  },
  {
    id: 76, canonical: 'Λοβίνα',
    variants:   ['Λοβίνα', 'Λοβίνας'],
    enVariants: ['Lovina'],
    url: '/villages/76/', enUrl: '/en/villages/76/',
  },
  {
    id: 77, canonical: 'Σωτήρα',
    variants:   ['Σωτήρα', 'Σωτήρας'],
    enVariants: ['Sotire', 'Sotirë', 'Sotira'],
    url: '/villages/77/', enUrl: '/en/villages/77/',
  },
  {
    id: 79, canonical: 'Λόγγος',
    variants:   ['Λόγγος', 'Λόγγου'],
    enVariants: ['Llongos', 'Longos'],
    url: '/villages/79/', enUrl: '/en/villages/79/',
  },
  {
    id: 91, canonical: 'Χλωμό',
    variants:   ['Χλωμό', 'Χλωμού'],
    enVariants: ['Hlome', 'Hlomë', 'Xlomo'],
    url: '/villages/91/', enUrl: '/en/villages/91/',
  },
  // ── Very short name — strict boundary guards prevent false positives ───────────
  {
    id: 83, canonical: 'Κρα',
    variants:   ['Κρα'],
    enVariants: ['Kra'],
    url: '/villages/83/', enUrl: '/en/villages/83/',
  },
];

// ─── Inject function ──────────────────────────────────────────────────────────

/**
 * Walks the HTML as alternating "tag" and "text-node" chunks.
 * Only text nodes outside `<a>…</a>` are eligible for replacement.
 *
 * @param html   Article HTML body.
 * @param lang   'el' (default) → Greek variants + /villages/:id/
 *               'en'           → English variants + /en/villages/:id/
 */
export function injectInternalLinks(html: string, lang: 'el' | 'en' = 'el'): string {
  const linkedIds = new Set<number>();
  let anchorDepth = 0;

  return html.replace(/<[^>]*>|[^<]+/g, (chunk) => {
    // ── HTML tag chunk ─────────────────────────────────────────────────────────
    if (chunk.startsWith('<')) {
      if (/^<a[\s>]/i.test(chunk))   anchorDepth++;
      if (/^<\/a\s*>/i.test(chunk))  anchorDepth = Math.max(0, anchorDepth - 1);
      return chunk;
    }

    // ── Text node chunk ────────────────────────────────────────────────────────
    if (anchorDepth > 0) return chunk;

    let text = chunk;
    for (const entry of VILLAGE_ENTITY_MAP) {
      if (linkedIds.has(entry.id)) continue;

      const activeVariants = lang === 'en' ? entry.enVariants : entry.variants;
      const targetUrl      = lang === 'en' ? entry.enUrl      : entry.url;

      for (const variant of activeVariants) {
        const rx = villageRx(variant, lang);
        if (rx.test(text)) {
          text = text.replace(
            rx,
            `<a href="${targetUrl}" class="seo-village-link">${variant}</a>`,
          );
          linkedIds.add(entry.id);
          break;
        }
      }
    }
    return text;
  });
}
