/**
 * SEO Article Templates — Scalable patterns for Dropolis.net
 *
 * 3 templates keyed to article type:
 *   A — Local news (τοπική είδηση)
 *   B — Village page (χωριό / τοπική κοινότητα)
 *   C — International news with local context (γενική / διεθνής είδηση)
 *
 * Usage:
 *   import { buildSeoTitle, buildMetaDescription, detectTemplateType } from './seo-templates.js';
 *   const type = detectTemplateType({ title, villageName, tags });
 *   const seoTitle = buildSeoTitle(title, type, villageName);
 *   const metaDesc = buildMetaDescription(topic, type, villageName);
 */

// ─── Template types ───────────────────────────────────────────────────────────

export type TemplateType = 'A' | 'B' | 'C';

// ─── Template definitions (editorial reference) ───────────────────────────────

export const TEMPLATES = {
  /** Template A — Τοπική Είδηση */
  A: {
    titlePattern:       '{Τίτλος είδησης} | Δρόπολη, 41 χωριά & Βόρεια Ήπειρος',
    metaDescPattern:    'Διαβάστε την είδηση για {θέμα} με επίκεντρο τη Δρόπολη, τα 41 χωριά της, τη Βόρεια Ήπειρο και την ελληνική μειονότητα στην περιοχή Αργυροκάστρου.',
    suffix:             ' | Δρόπολη, 41 χωριά & Βόρεια Ήπειρος',
    metaPrefix:         'Διαβάστε την είδηση για ',
    metaSuffix:         ' με επίκεντρο τη Δρόπολη, τα 41 χωριά της, τη Βόρεια Ήπειρο και την ελληνική μειονότητα στην περιοχή Αργυροκάστρου.',
  },
  /** Template B — Χωριό / Τοπική Κοινότητα */
  B: {
    titlePattern:       '{Χωριό}: νέα, ιστορία και ζωή στη Δρόπολη | Dropolis.net',
    metaDescPattern:    'Νέα, φωτογραφίες, ιστορία και τοπικές πληροφορίες για το χωριό {Χωριό} στη Δρόπολη. Μια ζωντανή εικόνα από τα 41 χωριά της Βορείου Ηπείρου και την ελληνική μειονότητα.',
    suffix:             ': νέα, ιστορία και ζωή στη Δρόπολη | Dropolis.net',
    metaPrefix:         'Νέα, φωτογραφίες, ιστορία και τοπικές πληροφορίες για το χωριό ',
    metaSuffix:         ' στη Δρόπολη. Μια ζωντανή εικόνα από τα 41 χωριά της Βορείου Ηπείρου και την ελληνική μειονότητα.',
  },
  /** Template C — Γενική / Διεθνής Είδηση Με Τοπική Σύνδεση */
  C: {
    titlePattern:       '{Τίτλος είδησης} | Τι σημαίνει για Βόρεια Ήπειρο & Δρόπολη',
    metaDescPattern:    'Σύντομη ενημέρωση για {θέμα} και η πιθανή σύνδεσή του με την Αλβανία, τη Βόρεια Ήπειρο, τη Δρόπολη και την ελληνική μειονότητα στην περιοχή Αργυροκάστρου.',
    suffix:             ' | Τι σημαίνει για Βόρεια Ήπειρο & Δρόπολη',
    metaPrefix:         'Σύντομη ενημέρωση για ',
    metaSuffix:         ' και η πιθανή σύνδεσή του με την Αλβανία, τη Βόρεια Ήπειρο, τη Δρόπολη και την ελληνική μειονότητα στην περιοχή Αργυροκάστρου.',
  },
} as const;

// ─── Core entity signals (for template auto-detection) ────────────────────────

const LOCAL_ENTITIES_RX =
  /Δρόπολη|Δρόπολης|Dropull|Βόρεια\s+Ήπειρος|Βορείου\s+Ηπείρου|Αργυρόκαστρο|Αργυροκάστρου|ελληνική\s+μειονότητα/;

// ─── Auto-detect template type ────────────────────────────────────────────────

/**
 * Infers the best template type from article metadata.
 *  B — when a specific village name is known
 *  A — when the title/tags already mention core local entities
 *  C — everything else (international/generic)
 */
export function detectTemplateType(opts: {
  title?: string | null;
  villageName?: string | null;
  tags?: string | null;
  category?: string | null;
}): TemplateType {
  if (opts.villageName?.trim()) return 'B';

  const scan = `${opts.title ?? ''} ${opts.tags ?? ''} ${opts.category ?? ''}`;
  if (LOCAL_ENTITIES_RX.test(scan)) return 'A';

  return 'C';
}

// ─── Build SEO title ──────────────────────────────────────────────────────────

const MAX_SEO_TITLE = 60;

/**
 * Builds an SEO title using the appropriate template.
 * Strict ≤ 60 char limit. If (rawTitle + suffix) exceeds the limit,
 * the raw title is truncated with "…" so the total stays within budget.
 */
export function buildSeoTitle(
  title: string,
  type: TemplateType,
  villageName?: string | null,
): string {
  if (!title.trim()) return title;

  const t = TEMPLATES[type];
  const base = type === 'B' && villageName ? villageName : title;

  const candidate = `${base}${t.suffix}`;
  if (candidate.length <= MAX_SEO_TITLE) return candidate;

  // Truncate base to fit: budget = MAX - suffix.length - 1 (for "…")
  const budget = MAX_SEO_TITLE - t.suffix.length - 1;
  if (budget < 10) {
    // Suffix itself is too long — fall back to plain title, clipped
    return base.length <= MAX_SEO_TITLE ? base : base.slice(0, MAX_SEO_TITLE - 1) + '…';
  }
  return `${base.slice(0, budget)}…${t.suffix}`;
}

// ─── Build meta description ───────────────────────────────────────────────────

const MIN_META_DESC = 100;
const MAX_META_DESC = 155;
const META_PAD = ' Ειδήσεις και νέα με εγκυρότητα από το Dropolis.net.';

/**
 * Builds a meta description using the appropriate template.
 * `topic` is a short noun phrase describing the article subject (e.g. "τα νέα μέτρα").
 *
 * Guarantees: 100 ≤ result.length ≤ 155
 *   – < 100 chars → padded with a generic SEO sentence (truncated to fit)
 *   – > 155 chars → hard-truncated to 152 + "…"
 */
export function buildMetaDescription(
  topic: string,
  type: TemplateType,
  villageName?: string | null,
): string {
  const t = TEMPLATES[type];
  const subject = type === 'B' && villageName ? villageName : topic;
  let desc = `${t.metaPrefix}${subject}${t.metaSuffix}`;

  // Enforce upper bound: 152 chars + "…" = 155 total
  if (desc.length > MAX_META_DESC) {
    desc = desc.slice(0, MAX_META_DESC - 3) + '…';
  }

  // Enforce lower bound: pad with generic sentence, staying ≤ 155
  if (desc.length < MIN_META_DESC) {
    const padNeeded = MIN_META_DESC - desc.length;
    const pad = META_PAD.slice(0, Math.min(META_PAD.length, MAX_META_DESC - desc.length));
    if (padNeeded <= pad.length) desc = desc + pad;
  }

  return desc;
}

// ─── Long-tail keyword clusters ───────────────────────────────────────────────
// 15 high-value long-tail phrases for Dropolë topical authority.
// Use these in H2/H3 headings, alt text, and internal links.

export const LONG_TAIL_CLUSTERS: readonly string[] = [
  'τα 41 χωριά της Δρόπολης στη Βόρεια Ήπειρο',
  'ιστορία των χωριών της Δρόπολης',
  'ελληνική μειονότητα στη Δρόπολη Αλβανίας',
  'Δρόπολη Αργυρόκαστρο νέα και πληροφορίες',
  'φωτογραφίες από τα χωριά της Δρόπολης',
  'παραδοσιακά χωριά της Βορείου Ηπείρου',
  'Dropull Albania Greek minority villages',
  'χάρτης με τα χωριά της Δρόπολης',
  'πολιτισμός και παράδοση στη Δρόπολη',
  'ορθόδοξες εκκλησίες στα χωριά της Δρόπολης',
  'ομογένεια από τη Δρόπολη και τη Βόρεια Ήπειρο',
  'νέα από τη Δρόπολη και το Αργυρόκαστρο',
  'αξιοθέατα στη Δρόπολη Βόρεια Ήπειρος',
  'παλιά πέτρινα σπίτια στα χωριά της Δρόπολης',
  'ιστορικά χωριά ελληνικής μειονότητας στην Αλβανία',
] as const;
