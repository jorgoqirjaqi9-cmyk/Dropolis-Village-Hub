const VILLAGE_NAMES: readonly string[] = [
  "Δερβιτσιάνη", "Γλίνα", "Κεφαλόβρυσο", "Κεφαλόχωρο", "Λιβίκωση",
  "Παλαιοχώρι", "Σωπικό", "Φοινίκη", "Βουλιαράτες", "Μπουλιαράτες",
  "Γκαρδίκι", "Λαπατέ", "Εσθήτα", "Άρδηνα", "Χαμηλόν",
  "Πάνω Δρόπολη", "Κάτω Δρόπολη", "Άνω Δρόπολη", "Δρόπολη",
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
  const tags = buildTags(input.category, villageName, textLower);

  const rawExcerpt = input.excerpt
    ? input.excerpt.replace(/\s+/g, " ").trim()
    : makeExcerpt(cleanContent, 360);
  const excerpt = rawExcerpt.slice(0, 360);
  const metaDescription = excerpt.slice(0, 155);
  const seoTitle = title.slice(0, 60);

  let qualityScore = 0;
  if (title.length >= 20) qualityScore += 20;
  if (excerpt.length >= 60) qualityScore += 20;
  if (cleanContent.length >= 450) qualityScore += 25;
  if (cleanContent.length >= 900) qualityScore += 10;
  if (input.sourceUrl) qualityScore += 10;
  if (villageName) qualityScore += 10;
  if (!hadBoilerplate) qualityScore += 5;

  return {
    title,
    content: cleanContent,
    excerpt,
    metaDescription,
    seoTitle,
    villageName,
    tags,
    qualityScore,
    published: qualityScore >= 55,
  };
}
