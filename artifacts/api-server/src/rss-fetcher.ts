import Parser from "rss-parser";
import { GoogleGenAI } from "@google/genai";
import { db, articlesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
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

async function translateWithGemini(
  ai: GoogleGenAI,
  title: string,
  content: string
): Promise<{ title: string; excerpt: string; content: string }> {
  const prompt = `Μετάφρασε τα παρακάτω στα Ελληνικά. Επέστρεψε ΜΟΝΟ JSON με τα πεδία "title", "excerpt" (1-2 προτάσεις), "content".

Τίτλος: ${title}
Κείμενο: ${content.slice(0, 2000)}

JSON:`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json", maxOutputTokens: 8192 },
    });
    const raw = response.text ?? "{}";
    const parsed = JSON.parse(raw);
    return {
      title: (parsed.title as string) ?? title,
      excerpt: (parsed.excerpt as string) ?? "",
      content: (parsed.content as string) ?? content,
    };
  } catch {
    return { title, excerpt: "", content };
  }
}

async function fetchTranslationFeed(source: FeedSource, ai: GoogleGenAI): Promise<number> {
  try {
    const feed = await parser.parseURL(source.url);
    const items = (feed.items ?? []).slice(0, MAX_PER_TRANSLATION_FEED);
    let inserted = 0;

    for (const item of items) {
      if (!item.title || !item.link) continue;

      const rawContent = item.contentSnippet ?? item.content ?? item.summary ?? item.title;
      const imageUrl = extractImage(item as Parser.Item & Record<string, unknown>);

      let translated: { title: string; excerpt: string; content: string };
      try {
        translated = await translateWithGemini(ai, item.title, stripHtml(rawContent));
      } catch (err) {
        logger.warn({ err, url: item.link }, "Translation failed, storing original");
        translated = { title: item.title, excerpt: "", content: stripHtml(rawContent) };
      }

      if (!translated.title || translated.title.trim().length < 3) continue;

      const result = await db.insert(articlesTable).values({
        title: translated.title.slice(0, 500),
        excerpt: translated.excerpt || null,
        content: translated.content || translated.title,
        category: source.defaultCategory,
        author: source.name,
        imageUrl,
        published: true,
        featured: false,
        sourceUrl: item.link,
      }).onConflictDoNothing();

      if ((result.rowCount ?? 0) > 0) {
        inserted++;
        logger.info({ url: item.link, title: translated.title }, "Translated article imported");
      }

      // Respect Gemini rate limits
      await new Promise((r) => setTimeout(r, 2000));
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
