/**
 * SEO & Content Sanitization Pipeline
 *
 * 100% local — zero AI API costs. Pure TypeScript/regex/string transforms.
 *
 * Pipeline (in order):
 *  1. cleanTitle          — strip clickbait/fluff prefixes
 *  2. stripOldDomains     — erase blogspot/old-domain artifacts
 *  3. fixTypography       — copy-paste cleanup (Word spans, empty <p>, etc.)
 *  4. enforceTrailing…    — add trailing slash to /news/ID and /villages/ID links
 *  5. boldTopicalEntities — wrap key Greek entities in <strong> in first 2 <p>s
 *  6. generateMetaDesc    — auto-fill metaDescription if empty (autoFill mode)
 *  7. autoTags            — extract topical tags from content   (autoFill mode)
 *  8. injectLocalContext  — append local-context para to international articles
 *  9. injectInternalLinks — link first occurrence of each village name (autoFill)
 */

import { injectInternalLinks } from './village-links.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SanitizeInput {
  title?: string | null;
  content?: string | null;
  excerpt?: string | null;
  metaDescription?: string | null;
  seoTitle?: string | null;
  tags?: string | null;
  villageName?: string | null;
  category?: string | null;
}

export interface SanitizeChange {
  field: string;
  reason: string;
}

export interface SanitizeOutput extends SanitizeInput {
  changes: SanitizeChange[];
}

export interface SanitizeOptions {
  /**
   * When true (default, use for POST/create):
   *   auto-generate metaDescription and tags if they are empty.
   * When false (use for PATCH/update):
   *   only clean fields that are already present — never inject new ones.
   */
  autoFill?: boolean;
}

// ─── Title fluff prefixes ─────────────────────────────────────────────────────
// Tested in order; only the first match is stripped per call (one prefix at a time).
const TITLE_FLUFF_RX: RegExp[] = [
  /^Ειδήσεις\s*[-–—:]\s*/,
  /^ΕΙΔΗΣΕΙΣ\s*[-–—:]\s*/,
  /^Αποκλειστικό\s*[-–—:]\s*/,
  /^ΑΠΟΚΛΕΙΣΤΙΚΟ\s*[-–—:]\s*/,
  /^Τελευταία\s+[Ωώ]ρα\s*[-–—:]\s*/,
  /^ΤΕΛΕΥΤΑΙΑ\s+ΩΡΑ\s*[-–—:]\s*/,
  /^ΕΚΤΑΚΤΟ\s*[-–—:]\s*/,
  /^Ρεπορτάζ\s*[-–—:]\s*/,
  /^Ανακοίνωση\s*[-–—:]\s*/,
  /^Δελτίο\s+Τύπου\s*[-–—:]\s*/,
  /^Breaking(?:\s+News)?\s*:\s*/i,
  /^BREAKING(?:\s+NEWS)?\s*:\s*/,
  /^NEWS\s*:\s*/i,
  /^EXCLUSIVE\s*:\s*/i,
];

// ─── Old / external domains ───────────────────────────────────────────────────
// Removes full URLs and bare domain references left over from copy-paste.
const OLD_DOMAIN_RX: RegExp[] = [
  /https?:\/\/[\w.-]*\.blogspot\.[a-z]{2,3}(?:\/[^\s"'<>]*)?\/?/gi,
  /https?:\/\/[\w.-]*\.blogger\.com(?:\/[^\s"'<>]*)?\/?/gi,
  /\b[\w-]+\.blogspot\.[a-z]{2,3}\b/gi,
];

// ─── Topical entities for bold injection ─────────────────────────────────────
// Listed longest-first so multi-word phrases match before their sub-strings.
const TOPICAL_ENTITIES: readonly string[] = [
  'Βόρεια Ήπειρος',
  'Βορείου Ηπείρου',
  'Βόρεια Ήπειρο',
  'ελληνική μειονότητα',
  'Ελληνικής Μειονότητας',
  'Δήμος Δρόπολης',
  'Αντιγόνεια',
  'Γκιρόκαστρο',
  'Αγία Σαράντα',
  'Αργυροκάστρου',
  'Αργυρόκαστρο',
  'Δρόπολης',
  'Δρόπολη',
  'Dropull',
  '41 χωριά',
  'Αλβανίας',
  'Αλβανία',
  'Ελλάδα',
  'αρχαιολογία',
  'ανασκαφής',
  'ανασκαφή',
  'ανασκαφές',
];

// ─── Tag extraction map: match text → canonical tag ──────────────────────────
const TAG_MAP: ReadonlyArray<[string, string]> = [
  ['Δρόπολη',         'Δρόπολη'],
  ['Δρόπολης',        'Δρόπολη'],
  ['Αλβανία',         'Αλβανία'],
  ['Αλβανίας',        'Αλβανία'],
  ['Βόρεια Ήπειρος',  'Βόρεια Ήπειρος'],
  ['Βορείου Ηπείρου', 'Βόρεια Ήπειρος'],
  ['μειονότητα',      'ελληνική μειονότητα'],
  ['αρχαιολογία',     'αρχαιολογία'],
  ['ανασκαφή',        'αρχαιολογία'],
  ['ανασκαφές',       'αρχαιολογία'],
  ['Αντιγόνεια',      'Αντιγόνεια'],
  ['Γκιρόκαστρο',     'Γκιρόκαστρο'],
  ['Αγία Σαράντα',    'Αγία Σαράντα'],
  ['τουρισμός',       'τουρισμός'],
  ['τουριστικ',       'τουρισμός'],
  ['παράδοση',        'παράδοση'],
  ['εκκλησία',        'εκκλησία'],
  ['πολιτισμός',      'πολιτισμός'],
  ['κυβέρνηση',       'κυβέρνηση'],
  ['Αργυρόκαστρο',   'Αργυρόκαστρο'],
  ['Αργυροκάστρου',  'Αργυρόκαστρο'],
  ['Dropull',         'Dropull'],
  ['41 χωριά',        '41 χωριά'],
  ['ομογένεια',       'ομογένεια'],
  ['διασπορά',        'ομογένεια'],
  ['αξιοθέατα',       'τουρισμός'],
  ['πανηγύρι',        'παράδοση'],
  ['μνημεία',         'ιστορία'],
  ['ιστορία',         'ιστορία'],
];

// ─── Local context injection (Transform 8) ───────────────────────────────────
// Appended to international articles that lack any core Dropolë entity.
// The paragraph signals topical relevance to Dropolë for every auto-imported article.

const LOCAL_CONTEXT_HTML =
  '<p class="local-context-note">' +
  '<strong>Dropolis.net:</strong> Παρακολουθούμε την είδηση με ενδιαφέρον, καθώς κάθε εξέλιξη ' +
  'στην <strong>Αλβανία</strong>, τα Βαλκάνια και την περιοχή του ' +
  '<strong>Αργυροκάστρου</strong> μπορεί να επηρεάζει άμεσα ή έμμεσα τη ' +
  '<strong>Δρόπολη</strong>, τα 41 χωριά και την ' +
  '<strong>ελληνική μειονότητα</strong> της <strong>Βορείου Ηπείρου</strong>.' +
  '</p>';

// Presence of ANY one of these means the article is already topically anchored.
const CORE_TOPICAL_RX =
  /Δρόπολη|Δρόπολης|Dropull|Βόρεια\s+Ήπειρος|Βορείου\s+Ηπείρου|ελληνική\s+μειονότητα|Ελληνικής\s+Μειονότητας|Αργυρόκαστρο|Αργυροκάστρου/;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function escRx(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g,  ' ')
    .replace(/&amp;/g,   '&')
    .replace(/&lt;/g,    '<')
    .replace(/&gt;/g,    '>')
    .replace(/&quot;/g,  '"')
    .replace(/&#039;/g,  "'")
    .replace(/\s+/g,     ' ')
    .trim();
}

function isHtmlContent(text: string): boolean {
  return /<[a-z][a-zA-Z0-9]*[\s>]/m.test(text.trimStart());
}

// ─── Transform: 1 — clean title ──────────────────────────────────────────────

function cleanTitle(title: string): string {
  let t = title.trim();
  for (const rx of TITLE_FLUFF_RX) {
    const stripped = t.replace(rx, '').trim();
    if (stripped !== t) { t = stripped; break; }
  }
  return t;
}

// ─── Transform: 2 — strip old domains ────────────────────────────────────────

function stripOldDomains(text: string): string {
  let t = text;
  for (const rx of OLD_DOMAIN_RX) {
    t = t.replace(rx, '');
  }
  return t.replace(/  +/g, ' ').trim();
}

// ─── Transform: 3 — typography / copy-paste cleanup ─────────────────────────

function fixTypography(html: string): string {
  return html
    // Microsoft Word / LibreOffice conditional comment blocks
    .replace(/<!--\[if[^\]]*\]>[\s\S]*?<!\[endif\]-->/gi, '')
    .replace(/<o:p[^>]*>[\s\S]*?<\/o:p>/gi, '')
    .replace(/<w:[^/][^>]*>[\s\S]*?<\/w:[^>]+>/gi, '')
    // <span style="..."> — strip tag, keep text
    .replace(/<span\b[^>]*\bstyle\s*=\s*(?:"[^"]*"|'[^']*')[^>]*>([\s\S]*?)<\/span>/gi, '$1')
    // <span class="..."> — strip tag, keep text
    .replace(/<span\b[^>]*\bclass\s*=\s*(?:"[^"]*"|'[^']*')[^>]*>([\s\S]*?)<\/span>/gi, '$1')
    // bare <span> — strip tag, keep text
    .replace(/<span>([\s\S]*?)<\/span>/gi, '$1')
    // <font ...> — strip tag, keep text
    .replace(/<font[^>]*>([\s\S]*?)<\/font>/gi, '$1')
    // empty paragraphs in all forms: <p></p>, <p>&nbsp;</p>, <p>   </p>, <p><br></p>
    .replace(/<p[^>]*>\s*(?:&nbsp;|\s|<br\s*\/?>)*\s*<\/p>/gi, '')
    // multiple &nbsp; → single space
    .replace(/(?:&nbsp;){2,}/gi, ' ')
    // three or more consecutive <br> → max two
    .replace(/(?:<br\s*\/?>\s*){3,}/gi, '<br><br>')
    // zero-width / invisible Unicode
    .replace(/[\u200B\u200C\u200D\uFEFF\u00AD]/g, '')
    // double spaces (preserves newlines for readable HTML source)
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

// ─── Transform: 4 — trailing slashes on internal links ───────────────────────
// Regex ensures the closing quote is immediately after the digits,
// so already-slashed URLs (/news/123/) are never double-slashed.

function enforceTrailingSlashesInHtml(html: string): string {
  return html
    .replace(/(href=["'])\/news\/(\d+)(["'])/g,     '$1/news/$2/$3')
    .replace(/(href=["'])\/villages\/(\d+)(["'])/g, '$1/villages/$2/$3')
    .replace(
      /(href=["'])https:\/\/dropolis\.net\/news\/(\d+)(["'])/g,
      '$1https://dropolis.net/news/$2/$3',
    )
    .replace(
      /(href=["'])https:\/\/dropolis\.net\/villages\/(\d+)(["'])/g,
      '$1https://dropolis.net/villages/$2/$3',
    )
    // Markdown-style links: [text](/news/123) → [text](/news/123/)
    .replace(/(\[[^\]]*\])\(\/news\/(\d+)\)/g,     '$1(/news/$2/)')
    .replace(/(\[[^\]]*\])\(\/villages\/(\d+)\)/g, '$1(/villages/$2/)');
}

// ─── Transform: 5 — bold topical entities in first 2 paragraphs ──────────────
// Only processes HTML content. Skips paragraphs that already contain
// <strong> or <b> tags to guarantee idempotency.
// Greek chars are not ASCII word-chars so \b doesn't work — we replace
// exact occurrences in text nodes (between > and <), which is safe for
// specific multi-character entity names.

function boldTopicalEntitiesFirst2Paragraphs(html: string): string {
  let pCount = 0;

  return html.replace(/<p\b[^>]*>[\s\S]*?<\/p>/gi, (pBlock) => {
    pCount++;
    if (pCount > 2) return pBlock;
    if (/<(strong|b)\b/i.test(pBlock)) return pBlock;

    return pBlock.replace(/(?<=>)[^<]+(?=<)/g, (textNode) => {
      let t = textNode;
      for (const entity of TOPICAL_ENTITIES) {
        t = t.replace(new RegExp(escRx(entity), 'g'), `<strong>${entity}</strong>`);
      }
      return t;
    });
  });
}

// ─── Transform: 8 — inject local context into international articles ──────────
// Fires only when autoFill=true, content is HTML, and none of the core
// topical entities appear in title + first 500 plain-text chars.

function injectLocalContext(content: string, title: string): string {
  const scan = `${title} ${stripHtml(content).slice(0, 500)}`;
  if (CORE_TOPICAL_RX.test(scan)) return content;
  return `${content}\n${LOCAL_CONTEXT_HTML}`;
}

// ─── Transform: 6 — generate meta description ────────────────────────────────

function generateMetaDescription(content: string, existing?: string | null): string {
  if (existing?.trim()) return existing.trim();

  const plain = stripHtml(content).replace(/\s+/g, ' ').trim();
  if (!plain) return '';
  if (plain.length <= 155) return plain;

  const window = plain.slice(0, 155);

  // Prefer ending at a sentence boundary (. ! ?) inside 110-155 chars
  const sentenceEnd = Math.max(
    window.lastIndexOf('. '),
    window.lastIndexOf('! '),
    window.lastIndexOf('? '),
  );
  if (sentenceEnd > 110) return window.slice(0, sentenceEnd + 1).trim();

  // Fall back to last word boundary
  const lastSpace = window.lastIndexOf(' ', 150);
  return window.slice(0, lastSpace > 100 ? lastSpace : 150).trim() + '…';
}

// ─── Transform: 7 — auto-extract tags ────────────────────────────────────────

function autoTags(data: {
  title: string;
  content: string;
  villageName?: string | null;
  category?: string | null;
  existingTags?: string | null;
}): string {
  const tags = new Set<string>();

  // Preserve every existing tag
  if (data.existingTags?.trim()) {
    for (const t of data.existingTags.split(',')) {
      const trimmed = t.trim();
      if (trimmed) tags.add(trimmed);
    }
  }

  // Village name is always a tag when present
  if (data.villageName?.trim()) tags.add(data.villageName.trim());

  // Δρόπολη is the base tag for every article
  tags.add('Δρόπολη');

  // Scan title + first 600 plain-text chars
  const scan = `${data.title} ${stripHtml(data.content).slice(0, 600)}`;
  for (const [keyword, canonical] of TAG_MAP) {
    if (scan.includes(keyword)) tags.add(canonical);
  }

  return Array.from(tags).join(', ');
}

// ─── Master pipeline ──────────────────────────────────────────────────────────

export function sanitizeArticleData(
  data: SanitizeInput,
  options: SanitizeOptions = {},
): SanitizeOutput {
  const autoFill = options.autoFill ?? true;
  const changes: SanitizeChange[] = [];
  const out: SanitizeInput = { ...data };

  // 1. Clean title
  if (out.title) {
    const cleaned = cleanTitle(out.title);
    if (cleaned !== out.title) {
      const before = out.title.slice(0, 40);
      const after  = cleaned.slice(0, 40);
      changes.push({ field: 'title', reason: `Αφαίρεση clickbait prefix: «${before}» → «${after}»` });
      out.title = cleaned;
    }
  }

  // 2. Strip old domains
  if (out.content) {
    const stripped = stripOldDomains(out.content);
    if (stripped !== out.content) {
      changes.push({ field: 'content', reason: 'Αφαίρεση αναφορών σε παλιά domains (blogspot κ.ά.)' });
      out.content = stripped;
    }
  }
  if (out.excerpt) out.excerpt = stripOldDomains(out.excerpt);

  // 3. Fix typography
  if (out.content) {
    const fixed = fixTypography(out.content);
    if (fixed !== out.content) {
      changes.push({ field: 'content', reason: 'Τυπογραφία: άδεια <p>, inline styles, Word/Docs artifacts' });
      out.content = fixed;
    }
  }

  // 4. Enforce trailing slashes in body links
  if (out.content) {
    const slashed = enforceTrailingSlashesInHtml(out.content);
    if (slashed !== out.content) {
      changes.push({ field: 'content', reason: 'Trailing slash σε εσωτερικά links (/news/ID/ και /villages/ID/)' });
      out.content = slashed;
    }
  }

  // 5. Bold topical entities in first 2 paragraphs (HTML only)
  if (out.content && isHtmlContent(out.content)) {
    const bolded = boldTopicalEntitiesFirst2Paragraphs(out.content);
    if (bolded !== out.content) {
      changes.push({ field: 'content', reason: '<strong> σε τοπικές οντότητες στις πρώτες 2 παραγράφους (topical authority signal)' });
      out.content = bolded;
    }
  }

  // 6. Auto-fill metaDescription (create mode only)
  if (out.content && autoFill && !out.metaDescription?.trim()) {
    const autoMeta = generateMetaDescription(out.content);
    if (autoMeta) {
      changes.push({ field: 'metaDescription', reason: `Αυτόματη δημιουργία meta description (${autoMeta.length} χαρ.)` });
      out.metaDescription = autoMeta;
    }
  }

  // 7. Auto-fill / enrich tags (create mode only)
  if (out.content && out.title && autoFill) {
    const enriched = autoTags({
      title: out.title,
      content: out.content,
      villageName: out.villageName,
      category: out.category,
      existingTags: out.tags,
    });
    const prevCount = out.tags?.split(',').filter(t => t.trim()).length ?? 0;
    const newCount  = enriched.split(',').filter(t => t.trim()).length;
    if (enriched !== out.tags && newCount > prevCount) {
      changes.push({ field: 'tags', reason: `Tags: ${prevCount} → ${newCount} (${enriched})` });
      out.tags = enriched;
    }
  }

  // 8. Inject local context for international articles (autoFill mode only)
  if (out.content && out.title && autoFill && isHtmlContent(out.content)) {
    const injected = injectLocalContext(out.content, out.title);
    if (injected !== out.content) {
      changes.push({ field: 'content', reason: 'Τοπικό πλαίσιο: εισαγωγή παραγράφου σύνδεσης με Δρόπολη (διεθνές άρθρο χωρίς τοπικές οντότητες)' });
      out.content = injected;
    }
  }

  // 9. Internal link injection — first occurrence of each village name (autoFill only)
  if (out.content && autoFill && isHtmlContent(out.content)) {
    const linked = injectInternalLinks(out.content);
    if (linked !== out.content) {
      const count = (linked.match(/class="seo-village-link"/g) ?? []).length;
      changes.push({ field: 'content', reason: `Internal links: ${count} χωριό(-ά) συνδέθηκε(-αν) αυτόματα` });
      out.content = linked;
    }
  }

  return { ...out, changes };
}
