import Parser from "rss-parser";
import { db, articlesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./lib/logger.js";

const parser = new Parser({ timeout: 10000, headers: { "User-Agent": "Dropolis/1.0 RSS Reader" } });

interface FeedSource {
  url: string;
  name: string;
  defaultCategory: string;
}

const FEED_SOURCES: FeedSource[] = [
  {
    url: "https://dropolinews.gr/index.php?format=feed&type=rss",
    name: "DropoliNews",
    defaultCategory: "Επικαιρότητα",
  },
  {
    url: "https://apenadi.blogspot.com/feeds/posts/default?alt=rss",
    name: "Αποκλειστικό Δρόπολη",
    defaultCategory: "Επικαιρότητα",
  },
];

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

      const existing = await db
        .select({ id: articlesTable.id })
        .from(articlesTable)
        .where(eq(articlesTable.sourceUrl, item.link))
        .limit(1);

      if (existing.length > 0) continue;

      await db.insert(articlesTable).values({
        title: item.title.slice(0, 500),
        excerpt,
        content: fullContent,
        category,
        author: source.name,
        imageUrl,
        published: true,
        featured: false,
        sourceUrl: item.link,
      });
      inserted++;
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

export async function fetchAllFeeds(): Promise<void> {
  logger.info("Starting RSS feed fetch");
  let total = 0;
  for (const source of FEED_SOURCES) {
    total += await fetchFeed(source);
  }
  logger.info({ total }, "RSS fetch complete");
}

export function startRssFetcher(): void {
  const INTERVAL_MS = 2 * 60 * 60 * 1000; // every 2 hours
  setTimeout(() => {
    void fetchAllFeeds();
    setInterval(() => void fetchAllFeeds(), INTERVAL_MS);
  }, 8000); // wait 8s after server start
  logger.info({ intervalHours: 2 }, "RSS fetcher scheduled");
}
