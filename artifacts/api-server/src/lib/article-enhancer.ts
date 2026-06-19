const VILLAGE_NAMES: readonly string[] = [
  "Δερβιτσιάνη", "Γλίνα", "Κεφαλόβρυσο", "Κεφαλόχωρο", "Λιβίκωση",
  "Παλαιοχώρι", "Σωπικό", "Φοινίκη", "Βουλιαράτες", "Μπουλιαράτες",
  "Γκαρδίκι", "Λαπατέ", "Εσθήτα", "Άρδηνα", "Χαμηλόν",
  "Δρόπολη",
  "Αγία Κυριακή", "Αγία Μαρίνα", "Άγιος Νικόλαος",
  "Βούρμπιανη", "Βρυσέλλα", "Βορεάδες", "Βουνοπλαγιά",
  "Γλυκύρριζο", "Κεστρίνη", "Κοτσικά",
  "Λιάπηδες", "Λιάσοβο", "Μαστιλέ", "Μουζακαίοι",
  "Νεοχώρι", "Πεστάνι", "Πέρδικα", "Πωγωνιανή",
  "Ρίζο", "Ρινιάσα", "Σαμψούντα", "Σουλόπουλο",
  "Τσαμαντάς", "Φάρος", "Φιλιάτες", "Χορεψιά",
];

const TOPIC_KEYWORDS: Array<[string, string[]]> = [
  ["Πολιτική", ["πολιτ", "βουλ", "κυβερν", "υπουργ", "εκλογ", "κόμμα", "πρωθυπουργ", "πρόεδρ", "ψηφ"]],
  ["Οικονομία", ["οικονομ", "αγορ", "χρηματ", "επένδ", "τράπεζ", "ευρώ", "μισθ", "εμπόρ", "φορολ"]],
  ["Πολιτισμός", ["πολιτισμ", "μουσικ", "εκδηλ", "παράδοσ", "φεστιβ", "χορ", "θέατρ", "τέχν", "πολιτιστ"]],
  ["Ομογένεια", ["ομογεν", "διασπορ", "μετανάστ", "απόδημ"]],
  ["Αστυνομικό", ["αστυνομ", "έγκλημ", "σύλληψ", "κατηγορ", "δικαστ", "φυλακ", "κλοπ", "δολοφον", "τροχαί"]],
  ["Τουρισμός", ["τουρισμ", "επισκέπτ", "ταξίδ", "ξενοδοχ", "τουρίστ"]],
  ["Αλβανία", ["αλβαν", "τίρανα", "tirana", "albania", "shqipëri", "shqiperi", "αλβανικ"]],
  ["Ελλάδα", ["ελλαδ", "ελλην", "αθήν", "athens", "greece", "greek", "ελληνικ"]],
];

const BOILERPLATE_PATTERNS: RegExp[] = [
  /\b(Επόμενο|Προηγούμενο|Next post|Previous post|Read more|Διαβάστε περισσότερα|Δείτε επίσης|See also)\b[^\n]*/gi,
  /!\[.*?\]\(.*?\)/g,
  /thumbnail[-_]image[^\s]*/gi,
  /https?:\/\/[^\s<>"']+/g,
  /\[.*?\]\(https?:\/\/[^\)]+\)/g,
];

// Keywords indicating relevance to Northern Epirus / Greek minority in Albania.
// Articles from international translation feeds that lack these keywords are
// penalised in quality score and saved as drafts to protect topical authority.
const NORTHERN_EPIRUS_RELEVANCE_KEYWORDS: string[] = [
  "dropull", "dropolis", "δρόπολ", "βόρεια ήπειρ", "northern epirus",
  "χειμάρρ", "himara", "χιμάρα", "gjirokastr", "αργυρόκαστρ",
  "ελληνική μειονότητ", "greek minority", "μειονότητ",
  "omonoia", "ομόνοια", "vorio ipeiros",
  "σαράντα", "saranda", "sarandë",
  "φοινίκη", "φινίκη", "dervician", "dervitsiani",
  "βούρμπιαν", "βουλιαράτ",
];

function hasBoilerplate(text: string): boolean {
  return BOILERPLATE_PATTERNS.some((p) => { p.lastIndex = 0; return p.test(text); });
}

function stripBoilerplate(text: string): string {
  let clean = text;
  for (const pat of BOILERPLATE_PATTERNS) {
    clean = clean.replace(pat, " ");
  }
  return clean.replace(/\s{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function detectVillage(text: string): string | null {
  const lower = text.toLowerCase();
  for (const v of VILLAGE_NAMES) {
    if (lower.includes(v.toLowerCase())) return v;
  }
  return null;
}

function buildTags(category: string, villageName: string | null, textLower: string): string {
  const tags = new Set<string>([category, "Δρόπολη"]);
  if (villageName) tags.add(villageName);
  for (const [tag, keywords] of TOPIC_KEYWORDS) {
    if (keywords.some((kw) => textLower.includes(kw))) tags.add(tag);
  }
  return [...tags].join(", ");
}

function makeExcerpt(content: string, maxLen: number): string {
  const sentences = content.split(/(?<=[.!?;])\s+/);
  let excerpt = "";
  for (const s of sentences) {
    if (excerpt.length > 0 && (excerpt + " " + s).length > maxLen) break;
    excerpt += (excerpt ? " " : "") + s;
  }
  return (excerpt || content).slice(0, maxLen);
}

const SOURCE_SUFFIX_RE = /\s*[-–—|]\s*(DropoliNews|Αποκλειστικό Δρόπολη|Epirus Online|News\.gr|Google News.*?)$/i;

/**
 * Returns true if the text contains at least one keyword that directly links
 * the article to Northern Epirus / the Dropolë Greek minority community.
 */
function isRelevantToNorthernEpirus(textLower: string): boolean {
  return NORTHERN_EPIRUS_RELEVANCE_KEYWORDS.some((kw) => textLower.includes(kw.toLowerCase()));
}

/**
 * Builds a short 2-sentence editorial intro that is prepended before the
 * article body.  This provides original Dropolis editorial framing for every
 * syndicated article, which:
 *   – improves AdSense content quality signals (not a raw copy-paste)
 *   – adds internal keywords (Δρόπολη, Βόρεια Ήπειρος, ελληνική μειονότητα)
 *   – clearly attributes the source while maintaining editorial distance
 */
function buildContextualIntro(
  category: string,
  villageName: string | null,
  sourceName: string,
): string {
  if (villageName) {
    return (
      `Το Dropolis παρουσιάζει νέα που αφορούν το χωριό **${villageName}** ` +
      `και ευρύτερα τη Δρόπολη της Βόρειας Ηπείρου. ` +
      `Η παρακάτω είδηση από το *${sourceName}* αναδεικνύει εξελίξεις ` +
      `που ενδιαφέρουν άμεσα την ελληνική κοινότητα της περιοχής.\n\n`
    );
  }

  switch (category) {
    case "Ομογένεια":
      return (
        `Το Dropolis ακολουθεί τις εξελίξεις που αφορούν τον Ελληνισμό ` +
        `της Βόρειας Ηπείρου και τη διασπορά της Δρόπολης. ` +
        `Παρακάτω παρουσιάζουμε σχετική είδηση από το *${sourceName}*.\n\n`
      );
    case "Αλβανία":
    case "Διεθνή":
      return (
        `Το Dropolis παρακολουθεί εξελίξεις που σχετίζονται με την Αλβανία ` +
        `και την περιοχή της Βόρειας Ηπείρου όπου ζει η ελληνική μειονότητα. ` +
        `Η παρακάτω είδηση προέρχεται από το *${sourceName}* και αφορά θέματα ` +
        `ευρύτερου ενδιαφέροντος για την κοινότητα της Δρόπολης.\n\n`
      );
    case "Πολιτική":
      return (
        `Πολιτικές εξελίξεις που μπορούν να επηρεάσουν τις ελληνικές κοινότητες ` +
        `της Βόρειας Ηπείρου — μεταξύ αυτών και τη Δρόπολη — παρουσιάζει ` +
        `σήμερα το *${sourceName}*.\n\n`
      );
    case "Πολιτισμός":
      return (
        `Ο πολιτισμός και η παράδοση αποτελούν κεντρικές αξίες για τη Δρόπολη ` +
        `και την ευρύτερη ελληνική κοινότητα της Βόρειας Ηπείρου. ` +
        `Το *${sourceName}* παρουσιάζει σχετική είδηση.\n\n`
      );
    default:
      return (
        `Το Dropolis παρουσιάζει τελευταίες ειδήσεις από τη Δρόπολη ` +
        `και τη Βόρεια Ήπειρο μέσα από αξιόπιστες πηγές. ` +
        `Παρακάτω η είδηση όπως την μεταφέρει το *${sourceName}*.\n\n`
      );
  }
}

function appendSourceAttribution(content: string, sourceName: string, sourceUrl: string | null | undefined): string {
  const hasAttribution = /\bΠηγή\b|\bSource\b|dropolinews\.gr|epirusonline\.gr|news\.gr|apenadi\.blogspot/i.test(content);
  if (hasAttribution) return content;

  const label = sourceUrl
    ? `\n\n---\n📰 Πηγή: [${sourceName}](${sourceUrl})`
    : `\n\n---\n📰 Πηγή: ${sourceName}`;
  return content + label;
}

export interface ArticleEnhancerInput {
  title: string;
  content: string;
  excerpt?: string | null;
  category: string;
  sourceName: string;
  sourceUrl?: string | null;
}

export interface ArticleEnhancerOutput {
  title: string;
  content: string;
  excerpt: string;
  metaDescription: string;
  seoTitle: string;
  villageName: string | null;
  tags: string;
  qualityScore: number;
  published: boolean;
}

export function enhanceArticle(input: ArticleEnhancerInput): ArticleEnhancerOutput {
  const title = input.title
    .replace(/\s+/g, " ")
    .trim()
    .replace(SOURCE_SUFFIX_RE, "")
    .trim();

  const hadBoilerplate = hasBoilerplate(input.content);
  const cleanContent = stripBoilerplate(input.content);

  const textLower = (title + " " + cleanContent).toLowerCase();

  const villageName = detectVillage(textLower);

  const category = input.category && input.category.trim().length > 0
    ? input.category
    : "Επικαιρότητα";

  // Prepend editorial intro for all syndicated articles
  const intro = buildContextualIntro(category, villageName, input.sourceName);
  const contentWithIntro = intro + cleanContent;

  const contentWithAttribution = appendSourceAttribution(contentWithIntro, input.sourceName, input.sourceUrl);

  const tags = buildTags(category, villageName, textLower);

  const rawExcerpt = input.excerpt
    ? input.excerpt.replace(/\s+/g, " ").trim()
    : makeExcerpt(cleanContent, 360);
  const excerpt = rawExcerpt.slice(0, 360);
  const metaDescription = excerpt.slice(0, 155);
  const seoTitle = title.slice(0, 60);

  // Task 1: articles under 300 chars stay draft regardless of quality score
  const isTooShort = cleanContent.length < 300;

  let qualityScore = 0;
  if (title.length >= 20) qualityScore += 20;
  if (excerpt.length >= 60) qualityScore += 20;
  if (cleanContent.length >= 450) qualityScore += 25;
  if (cleanContent.length >= 900) qualityScore += 10;
  if (input.sourceUrl) qualityScore += 10;
  if (villageName) qualityScore += 10;
  if (!hadBoilerplate) qualityScore += 5;

  // Relevance penalty for international/Albania feeds: if the article has no
  // Northern Epirus keywords it is likely off-topic for Dropolis readers.
  // Penalise enough to push borderline articles into draft status.
  const isInternationalFeed = category === "Διεθνή" || category === "Αλβανία";
  if (isInternationalFeed && !isRelevantToNorthernEpirus(textLower)) {
    qualityScore -= 35;
  }

  return {
    title,
    content: contentWithAttribution,
    excerpt,
    metaDescription,
    seoTitle,
    villageName,
    tags,
    qualityScore,
    published: !isTooShort && qualityScore >= 55,
  };
}
