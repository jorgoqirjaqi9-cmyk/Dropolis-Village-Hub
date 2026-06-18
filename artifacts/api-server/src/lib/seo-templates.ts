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

// ─── English template definitions ────────────────────────────────────────────

export const EN_TEMPLATES = {
  /** Template A — Local news in English */
  A: {
    suffix:      ' | Dropull, 41 Villages & Northern Epirus',
    metaPrefix:  'Read the latest news about ',
    metaSuffix:  ' with a focus on Dropull, the 41 villages, Northern Epirus and the Greek minority of Albania.',
  },
  /** Template B — Village page in English */
  B: {
    suffix:      ': news, history and life in Dropull | Dropolis.net',
    metaPrefix:  'News, photos, history and local information for the village of ',
    metaSuffix:  ' in Dropull. A living picture of the 41 villages of Northern Epirus.',
  },
  /** Template C — International news with local angle, in English */
  C: {
    suffix:      ' | What it means for Northern Epirus & Dropull',
    metaPrefix:  'A brief overview of ',
    metaSuffix:  ' and its potential connection to Albania, Northern Epirus, Dropull and the Greek minority.',
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

function applyTitleBudget(base: string, suffix: string): string {
  const candidate = `${base}${suffix}`;
  if (candidate.length <= MAX_SEO_TITLE) return candidate;
  const budget = MAX_SEO_TITLE - suffix.length - 1; // 1 for "…"
  if (budget < 10) {
    return base.length <= MAX_SEO_TITLE ? base : base.slice(0, MAX_SEO_TITLE - 1) + '…';
  }
  return `${base.slice(0, budget)}…${suffix}`;
}

/**
 * Builds an SEO title using the appropriate template.
 * Strict ≤ 60 char limit. Truncates the raw title (with "…") before the suffix
 * when the combined length would exceed the budget.
 *
 * Pass `lang: 'en'` for English-language content to use the English suffix set.
 */
export function buildSeoTitle(
  title: string,
  type: TemplateType,
  villageName?: string | null,
  lang?: 'el' | 'en',
): string {
  if (!title.trim()) return title;

  if (lang === 'en') {
    const t = EN_TEMPLATES[type];
    const base = type === 'B' && villageName ? villageName : title;
    return applyTitleBudget(base, t.suffix);
  }

  const t = TEMPLATES[type];
  const base = type === 'B' && villageName ? villageName : title;
  return applyTitleBudget(base, t.suffix);
}

// ─── Build meta description ───────────────────────────────────────────────────

const MIN_META_DESC = 100;
const MAX_META_DESC = 155;
const META_PAD_EL = ' Ειδήσεις και νέα με εγκυρότητα από το Dropolis.net.';
const META_PAD_EN = ' Reliable news, history, and cultural heritage from the Dropull region.';

function applyDescBounds(desc: string, pad: string): string {
  // Enforce upper bound: 152 chars + "…" = 155 total
  if (desc.length > MAX_META_DESC) {
    desc = desc.slice(0, MAX_META_DESC - 3) + '…';
  }
  // Enforce lower bound: pad with brand sentence, staying ≤ 155
  if (desc.length < MIN_META_DESC) {
    const room = MAX_META_DESC - desc.length;
    const snippet = pad.slice(0, Math.min(pad.length, room));
    if (MIN_META_DESC - desc.length <= snippet.length) desc = desc + snippet;
  }
  return desc;
}

/**
 * Builds a meta description using the appropriate template.
 * `topic` is a short noun phrase describing the article subject.
 *
 * Guarantees: 100 ≤ result.length ≤ 155
 *   – < 100 chars → padded with a brand SEO sentence (language-aware)
 *   – > 155 chars → hard-truncated to 152 + "…"
 *
 * Pass `lang: 'en'` for English-language content.
 */
export function buildMetaDescription(
  topic: string,
  type: TemplateType,
  villageName?: string | null,
  lang?: 'el' | 'en',
): string {
  if (lang === 'en') {
    const t = EN_TEMPLATES[type];
    const subject = type === 'B' && villageName ? villageName : topic;
    return applyDescBounds(`${t.metaPrefix}${subject}${t.metaSuffix}`, META_PAD_EN);
  }

  const t = TEMPLATES[type];
  const subject = type === 'B' && villageName ? villageName : topic;
  return applyDescBounds(`${t.metaPrefix}${subject}${t.metaSuffix}`, META_PAD_EL);
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
