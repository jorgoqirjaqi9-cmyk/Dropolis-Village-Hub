import Parser from "rss-parser";
import { GoogleGenAI } from "@google/genai";
import { db, articlesTable } from "@workspace/db";
import { eq, sql, like, or } from "drizzle-orm";
import { logger } from "./lib/logger.js";

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
  return defaultCat;
}

function extractImage(item: Parser.Item & Record<string, unknown>): string | null {
  const mc = item["media:content"] as Record<string, unknown> | undefined;
  if (mc?.url) return mc.url as string;
  if (item.enclosure?.url) return item.enclosure.url;
  return null;
}

async function fetchFeed(source: FeedSource): Promise<number> {
  try {
    const feed = await parser.parseURL(source.url);
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

      const excerpt = content.slice(0, 400);
      const fullContent = content.slice(0, 10000);
      const cats = item.categories ?? [];
      const category = mapCategory(cats, item.title, source.defaultCategory);
      const imageUrl = item.enclosure?.url ?? null;

      const result = await db.insert(articlesTable).values({
        title: item.title.slice(0, 500),
        excerpt,
        content: fullContent,
        category,
        author: source.name,
        imageUrl,
        published: true,
        featured: false,
        sourceUrl: item.link,
      }).onConflictDoNothing();

      if ((result.rowCount ?? 0) > 0) {
        inserted++;
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
}

// Batch translate all articles for a feed in a SINGLE Gemini call to stay within rate limits
async function batchTranslateWithGemini(
  ai: GoogleGenAI,
  articles: ArticleInput[]
): Promise<ArticleTranslated[]> {
  if (articles.length === 0) return [];

  const articleList = articles
    .map((a, i) => `[${i}] Title: ${a.title}\nText: ${a.content.slice(0, 800)}`)
    .join("\n\n---\n\n");

  const prompt = `You are a professional translator. Translate ALL of the following news articles into Modern Greek (Νέα Ελληνικά / el-GR). The output language MUST be Greek — do not return the original language.

Return ONLY a raw JSON array (no markdown, no code fences) with one object per article in the same order, each with: "title" (Greek headline), "excerpt" (1-2 sentence Greek summary), "content" (full Greek translation).

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
    logger.warn({ err }, "Batch Gemini translation error");
    return articles.map((a) => ({ title: a.title, excerpt: "", content: a.content }));
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

    // ONE Gemini call for all articles in this feed
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

      const result = await db.insert(articlesTable).values({
        title: translated.title.slice(0, 500),
        excerpt: translated.excerpt || null,
        content: translated.content || translated.title,
        category: source.defaultCategory,
        author: source.name,
        imageUrl: input.imageUrl,
        published: true,
        featured: false,
        sourceUrl: input.link,
      }).onConflictDoNothing();

      if ((result.rowCount ?? 0) > 0) {
        inserted++;
        logger.info({ url: input.link, title: translated.title }, "Translated article imported");
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
