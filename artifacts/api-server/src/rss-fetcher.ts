import Parser from "rss-parser";
import { GoogleGenAI } from "@google/genai";
import { db, articlesTable } from "@workspace/db";
import { eq, sql, like } from "drizzle-orm";
import { logger } from "./lib/logger.js";
import { autoIndexArticle } from "./lib/auto-indexing.js";
import { enhanceArticle } from "./lib/article-enhancer.js";

const parser = new Parser({ timeout: 10000, headers: { "User-Agent": "Dropolis/1.0 RSS Reader" } });

interface FeedSource {
  url: string;
  name: string;
  defaultCategory: string;
  needsTranslation?: boolean;
}

const FEED_SOURCES: FeedSource[] = [
  {
    url: "https://dropolinews.gr/index.php?format=feed&type=rss",
    name: "DropoliNews",
    defaultCategory: "Επικαιρότητα",
    needsTranslation: false,
  },
  {
    url: "https://apenadi.blogspot.com/feeds/posts/default?alt=rss",
    name: "Αποκλειστικό Δρόπολη",
    defaultCategory: "Επικαιρότητα",
    needsTranslation: false,
  },
  {
    url: "https://epirusonline.gr/feed/",
    name: "Epirus Online",
    defaultCategory: "Ομογένεια",
    needsTranslation: false,
  },
  {
    url: "https://www.news.gr/rss.ashx",
    name: "News.gr",
    defaultCategory: "Ελλάδα",
    needsTranslation: false,
  },
];

// Google News feeds that require translation
const TRANSLATION_FEEDS: FeedSource[] = [
  {
    url: "https://news.google.com/rss/search?q=albania&hl=en&gl=US&ceid=US:en",
    name: "Google News – Albania",
    defaultCategory: "Διεθνή",
    needsTranslation: true,
  },
  {
    url: "https://news.google.com/rss/search?q=Shqip%C3%ABri&hl=en&gl=US&ceid=US:en",
    name: "Google News – Shqipëri",
    defaultCategory: "Διεθνή",
    needsTranslation: true,
  },
  {
    url: "https://news.google.com/rss/search?q=Tirana&hl=en&gl=US&ceid=US:en",
    name: "Google News – Tirana",
    defaultCategory: "Διεθνή",
    needsTranslation: true,
  },
];

const MAX_PER_TRANSLATION_FEED = 5;

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#?\w+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function mapCategory(cats: unknown[], title: string, defaultCat: string): string {
  const catsStr = cats.map(c => (typeof c === "string" ? c : (c as Record<string, string>)?.["_"] ?? (c as Record<string, string>)?.term ?? String(c))).join(" ");
  const combined = (catsStr + " " + title).toLowerCase();
  if (combined.includes("αποψ") || combined.includes("γράφ") || combined.includes("opinion") || combined.includes("σχολι")) return "Απόψεις";
  if (combined.includes("ιστορ") || combined.includes("αφιερωμ") || combined.includes("history")) return "Αφιέρωμα";
  if (combined.includes("ομογεν") || combined.includes("diaspora") || combined.includes("homogeneia")) return "Ομογένεια";
  if (combined.includes("πολιτισμ") || combined.includes("culture") || combined.includes("μουσικ") || combined.includes("εκδηλ")) return "Πολιτισμός";
  if (combined.includes("κοσμ") || combined.includes("world") || combined.includes("international") || combined.includes("διεθν")) return "Διεθνή";
  if (combined.includes("ελλαδ") || combined.includes("ελλην") || combined.includes("greece") || combined.includes("greek")) return "Ελλάδα";
  if (combined.includes("πολιτ") || combined.includes("βουλ") || combined.includes("κυβερν") || combined.includes("politics")) return "Πολιτική";
  if (combined.includes("οικονομ") || combined.includes("αγορ") || combined.includes("χρηματ") || combined.includes("economy")) return "Οικονομία";
  if (combined.includes("αθλητ") || combined.includes("ποδοσφαιρ") || combined.includes("sport")) return "Αθλητισμός";
  if (combined.includes("τεχνολ") || combined.includes("ψηφιακ") || combined.includes("tech") || combined.includes("internet")) return "Τεχνολογία";
  return defaultCat;
}

function extractImage(item: Parser.Item & Record<string, unknown>): string | null {
  const mc = item["media:content"] as Record<string, unknown> | undefined;
  if (mc?.url) return mc.url as string;
  if (item.enclosure?.url) return item.enclosure.url;
  return null;
}

// Greek → Latin transliteration for SEO-friendly slugs
const GREEK_TO_LATIN: Record<string, string> = {
  α: "a", ά: "a", β: "v", γ: "g", δ: "d", ε: "e", έ: "e",
  ζ: "z", η: "i", ή: "i", θ: "th", ι: "i", ί: "i", ϊ: "i", ΐ: "i",
  κ: "k", λ: "l", μ: "m", ν: "n", ξ: "x", ο: "o", ό: "o",
  π: "p", ρ: "r", σ: "s", ς: "s", τ: "t", υ: "y", ύ: "y", ϋ: "y", ΰ: "y",
  φ: "f", χ: "ch", ψ: "ps", ω: "o", ώ: "o",
};

function toSlug(title: string, id: number): string {
  const base = title
    .toLowerCase()
    .split("")
    .map(c => GREEK_TO_LATIN[c] ?? c)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
  return `${base}-${id}`;
}

function calcScore(hasImage: boolean, contentLength: number, viewCount = 0): number {
  return (
    viewCount * 2 +
    (hasImage ? 20 : 0) +
    Math.min(Math.floor(contentLength / 100), 20)
  );
}

async function fetchFeed(source: FeedSource): Promise<number> {
  try {
    // Fetch manually so Node's built-in decompression handles gzip/brotli responses
    const raw = await fetch(source.url, {
      headers: {
        "User-Agent": "Dropolis/1.0 RSS Reader",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept": "application/rss+xml, application/xml, text/xml, */*",
      },
    });
    const xml = await raw.text();
    const feed = await parser.parseString(xml);
    let inserted = 0;

    for (const item of feed.items) {
      if (!item.title || !item.link) continue;

      const rawContent = (item as Record<string, unknown>)["content:encoded"] as string | undefined
        ?? item.content
        ?? item.contentSnippet
        ?? item.summary
        ?? "";

      const content = stripHtml(rawContent);
      if (content.length < 30) continue;

      const cats = item.categories ?? [];
      const category = mapCategory(cats, item.title, source.defaultCategory);
      const imageUrl = item.enclosure?.url ?? null;

      const enhanced = enhanceArticle({
        title: item.title,
        content,
        category,
        sourceName: source.name,
        sourceUrl: item.link,
      });

      const returned = await db.insert(articlesTable).values({
        title: enhanced.title.slice(0, 500),
        excerpt: enhanced.excerpt,
        content: enhanced.content.slice(0, 10000),
        category,
        villageName: enhanced.villageName,
        tags: enhanced.tags,
        author: source.name,
        imageUrl,
        published: enhanced.published,
        featured: false,
        sourceUrl: item.link,
        seoTitle: enhanced.seoTitle,
        metaDescription: enhanced.metaDescription,
      }).onConflictDoNothing().returning({
        id: articlesTable.id,
        title: articlesTable.title,
        imageUrl: articlesTable.imageUrl,
        content: articlesTable.content,
      });

      if (returned.length > 0) {
        inserted++;
        const art = returned[0];
        const slug = toSlug(art.title, art.id);
        const score = calcScore(!!art.imageUrl, art.content.length) + enhanced.qualityScore;
        await db.update(articlesTable).set({ slug, score }).where(eq(articlesTable.id, art.id));
        if (enhanced.published) {
          void autoIndexArticle(art.id);
        } else {
          logger.info({ title: art.title, qualityScore: enhanced.qualityScore }, "RSS article saved as draft — quality score below threshold");
        }
      }
    }

    if (inserted > 0) {
      logger.info({ source: source.name, inserted }, "RSS articles inserted");
    }
    return inserted;
  } catch (err) {
    logger.warn({ err, url: source.url }, "RSS feed fetch failed");
    return 0;
  }
}

function isGreek(text: string): boolean {
  return /[\u0370-\u03FF\u1F00-\u1FFF]/.test(text);
}

interface ArticleInput {
  title: string;
  content: string;
  link: string;
  imageUrl: string | null;
}

interface ArticleTranslated {
  title: string;
  excerpt: string;
  content: string;
  seoTitle?: string;
  metaDescription?: string;
}

// Free Google Translate fallback — no API key, no daily quota
async function googleTranslateFree(text: string, retries = 2): Promise<string> {
  if (!text || text.trim().length === 0) return text;
  const encoded = encodeURIComponent(text.slice(0, 4800));
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=el&dt=t&q=${encoded}`;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as unknown[][];
      return (data[0] as unknown[][]).map((chunk) => (chunk as unknown[])[0] as string).join("");
    } catch (err) {
      if (attempt < retries) await new Promise(r => setTimeout(r, 1000));
      else throw err;
    }
  }
  return text;
}

async function translateArticleWithGoogle(article: ArticleInput): Promise<ArticleTranslated> {
  const title = await googleTranslateFree(article.title);
  await new Promise(r => setTimeout(r, 300));

  // Translate content in chunks if long
  const chunks: string[] = [];
  const sentences = article.content.split(/(?<=[.!?])\s+/);
  let current = "";
  for (const s of sentences) {
    if ((current + s).length > 4000) {
      if (current) chunks.push(current);
      current = s;
    } else {
      current += (current ? " " : "") + s;
    }
  }
  if (current) chunks.push(current);
  const translatedChunks: string[] = [];
  for (const chunk of chunks) {
    translatedChunks.push(await googleTranslateFree(chunk));
    await new Promise(r => setTimeout(r, 300));
  }
  const content = translatedChunks.join(" ");
  const excerpt = content.split(/[.!?]/)[0]?.trim() || title;
  return { title, excerpt, content };
}

// Batch translate all articles for a feed in a SINGLE Gemini call to stay within rate limits.
// Also generates SEO fields (seoTitle, metaDescription) in the same call — no extra quota used.
// Falls back to free Google Translate if Gemini quota is exhausted.
async function batchTranslateWithGemini(
  ai: GoogleGenAI,
  articles: ArticleInput[]
): Promise<ArticleTranslated[]> {
  if (articles.length === 0) return [];

  const articleList = articles
    .map((a, i) => `[${i}] Title: ${a.title}\nText: ${a.content.slice(0, 800)}`)
    .join("\n\n---\n\n");

  const prompt = `You are a professional translator and SEO expert. Translate ALL of the following news articles into Modern Greek (Νέα Ελληνικά / el-GR). The output language MUST be Greek — do not return the original language.

Return ONLY a raw JSON array (no markdown, no code fences) with one object per article in the same order, each with:
- "title": Greek headline (the translated title)
- "excerpt": 1-2 sentence Greek summary
- "content": full Greek translation
- "seoTitle": SEO-optimized Greek title for Google search (max 60 characters, keyword-rich)
- "metaDescription": compelling Greek meta description for search results (120-155 characters)

Articles to translate:

${articleList}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json", maxOutputTokens: 16384 },
    });
    const raw = (response.text ?? "[]")
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();
    const parsed = JSON.parse(raw) as ArticleTranslated[];
    if (!Array.isArray(parsed)) throw new Error("Expected JSON array from Gemini");
    return parsed;
  } catch (err) {
    logger.warn({ err }, "Gemini translation failed — falling back to Google Translate");
    // Fallback: translate each article individually via free Google Translate
    const results: ArticleTranslated[] = [];
    for (const article of articles) {
      try {
        results.push(await translateArticleWithGoogle(article));
      } catch (fallbackErr) {
        logger.warn({ fallbackErr, title: article.title }, "Google Translate fallback also failed — skipping");
        results.push({ title: "", excerpt: "", content: "" });
      }
    }
    return results;
  }
}

async function fetchTranslationFeed(source: FeedSource, ai: GoogleGenAI): Promise<number> {
  try {
    const feed = await parser.parseURL(source.url);
    const allItems = (feed.items ?? []).slice(0, MAX_PER_TRANSLATION_FEED);

    // Filter to new articles only (not already in DB)
    const articleInputs: ArticleInput[] = [];
    const itemsByLink: Map<string, Parser.Item> = new Map();

    for (const item of allItems) {
      if (!item.title || !item.link) continue;
      const rawContent = item.contentSnippet ?? item.content ?? item.summary ?? "";
      articleInputs.push({
        title: item.title,
        content: stripHtml(rawContent) || item.title,
        link: item.link,
        imageUrl: extractImage(item as Parser.Item & Record<string, unknown>),
      });
      itemsByLink.set(item.link, item);
    }

    if (articleInputs.length === 0) return 0;

    // ONE Gemini call for all articles in this feed (includes seoTitle + metaDescription)
    const translations = await batchTranslateWithGemini(ai, articleInputs);
    let inserted = 0;

    for (let i = 0; i < articleInputs.length; i++) {
      const input = articleInputs[i];
      const translated = translations[i] ?? { title: input.title, excerpt: "", content: input.content };

      // Skip if not translated to Greek — will retry on next run
      if (!translated.title || !isGreek(translated.title)) {
        logger.warn({ url: input.link, title: translated.title }, "Translation did not produce Greek — skipping");
        continue;
      }

      const enhanced = enhanceArticle({
        title: translated.title,
        content: translated.content || translated.title,
        excerpt: translated.excerpt,
        category: source.defaultCategory,
        sourceName: source.name,
        sourceUrl: input.link,
      });

      const returned = await db.insert(articlesTable).values({
        title: enhanced.title.slice(0, 500),
        excerpt: enhanced.excerpt || null,
        content: enhanced.content.slice(0, 10000) || enhanced.title,
        villageName: enhanced.villageName,
        tags: enhanced.tags,
        category: source.defaultCategory,
        author: source.name,
        imageUrl: input.imageUrl,
        published: enhanced.published,
        featured: false,
        sourceUrl: input.link,
        seoTitle: enhanced.seoTitle,
        metaDescription: enhanced.metaDescription,
      }).onConflictDoNothing().returning({
        id: articlesTable.id,
        title: articlesTable.title,
        imageUrl: articlesTable.imageUrl,
        content: articlesTable.content,
      });

      if (returned.length > 0) {
        inserted++;
        const art = returned[0];
        const slug = toSlug(art.title, art.id);
        const score = calcScore(!!art.imageUrl, art.content.length) + enhanced.qualityScore;
        await db.update(articlesTable).set({ slug, score }).where(eq(articlesTable.id, art.id));
        if (enhanced.published) {
          void autoIndexArticle(art.id);
          logger.info({ url: input.link, title: translated.title }, "Translated article imported");
        } else {
          logger.info({ url: input.link, title: translated.title, qualityScore: enhanced.qualityScore }, "Translated article saved as draft — quality score below threshold");
        }
      }
    }

    return inserted;
  } catch (err) {
    logger.warn({ err, url: source.url }, "Translation feed fetch failed");
    return 0;
  }
}

export async function fetchAllFeeds(): Promise<void> {
  logger.info("Starting RSS feed fetch");
  let total = 0;

  // Greek feeds — no translation needed
  for (const source of FEED_SOURCES) {
    total += await fetchFeed(source);
  }

  // Google News feeds — translate with Gemini
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    const ai = new GoogleGenAI({ apiKey });
    logger.info("Starting Google News RSS fetch with Gemini translation");
    for (const source of TRANSLATION_FEEDS) {
      total += await fetchTranslationFeed(source, ai);
    }
  } else {
    logger.warn("GEMINI_API_KEY not set — skipping Google News translation feeds");
  }

  // Recalculate scores after every fetch run
  if (total > 0) {
    try {
      await db.execute(sql`
        UPDATE articles
        SET score = GREATEST(0,
          view_count * 2
          + CASE WHEN image_url IS NOT NULL THEN 20 ELSE 0 END
          + LEAST(CHAR_LENGTH(content) / 100, 20)
        )
        WHERE score = 0 AND view_count > 0
      `);
    } catch (scoreErr) {
      logger.warn({ scoreErr }, "Score recalculation after fetch failed (non-fatal)");
    }
  }

  logger.info({ total }, "RSS fetch complete");
}

export async function retranslateEnglishArticles(): Promise<number> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    logger.warn("GEMINI_API_KEY not set — cannot retranslate");
    return 0;
  }
  const ai = new GoogleGenAI({ apiKey });

  // Find Google News articles whose titles are not Greek
  const rows = await db
    .select({ id: articlesTable.id, title: articlesTable.title, content: articlesTable.content, excerpt: articlesTable.excerpt })
    .from(articlesTable)
    .where(like(articlesTable.author, "Google News%"));

  const toRetranslate = rows.filter((r) => !isGreek(r.title));
  logger.info({ count: toRetranslate.length }, "Articles pending retranslation");
  if (toRetranslate.length === 0) return 0;

  // Batch in groups of 5 to avoid token limits
  const BATCH_SIZE = 5;
  let fixed = 0;

  for (let i = 0; i < toRetranslate.length; i += BATCH_SIZE) {
    const batch = toRetranslate.slice(i, i + BATCH_SIZE);
    const inputs: ArticleInput[] = batch.map((r) => ({
      title: r.title,
      content: r.content ?? r.excerpt ?? r.title,
      link: String(r.id),
      imageUrl: null,
    }));

    const translations = await batchTranslateWithGemini(ai, inputs);

    for (let j = 0; j < batch.length; j++) {
      const row = batch[j];
      const translated = translations[j] ?? { title: row.title, excerpt: "", content: row.content ?? "" };

      if (!translated.title || !isGreek(translated.title)) {
        logger.warn({ id: row.id, title: translated.title }, "Retranslation still not Greek — skipping");
        continue;
      }
      await db.update(articlesTable).set({
        title: translated.title.slice(0, 500),
        excerpt: translated.excerpt || row.excerpt,
        content: translated.content || row.content,
        seoTitle: (translated.seoTitle ?? translated.title).slice(0, 60) || null,
        metaDescription: translated.metaDescription?.slice(0, 155) || null,
      }).where(eq(articlesTable.id, row.id));
      fixed++;
      logger.info({ id: row.id, title: translated.title }, "Article retranslated to Greek");
    }

    // Pause between batches to respect rate limits
    if (i + BATCH_SIZE < toRetranslate.length) {
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  logger.info({ fixed }, "Retranslation complete");
  return fixed;
}

export function startRssFetcher(): void {
  // Run once at startup (after 10s delay)
  setTimeout(() => void fetchAllFeeds(), 10000);

  // Then every 24 hours at 06:00 server time
  const INTERVAL_MS = 24 * 60 * 60 * 1000;
  const now = new Date();
  const next6am = new Date(now);
  next6am.setHours(6, 0, 0, 0);
  if (next6am <= now) next6am.setDate(next6am.getDate() + 1);

  const msUntil6am = next6am.getTime() - now.getTime();

  setTimeout(() => {
    void fetchAllFeeds();
    setInterval(() => void fetchAllFeeds(), INTERVAL_MS);
  }, msUntil6am);

  logger.info(
    { nextRunAt: next6am.toISOString(), intervalHours: 24 },
    "RSS fetcher scheduled — daily at 06:00"
  );
}
