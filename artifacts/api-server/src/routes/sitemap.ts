import { Router } from "express";
import { db } from "@workspace/db";
import { articlesTable, villagesTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";

const router = Router();

const BASE_URL = "https://dropolis.net";

// Canonical static route list — keep in sync with STATIC_ROUTES in
// artifacts/dropolis/src/route-manifest.ts (shared within the frontend package;
// duplicated here because api-server is a separate package).
const STATIC_ROUTES = [
  { loc: "/",                   changefreq: "daily",   priority: "1.0" },
  { loc: "/news/",              changefreq: "hourly",  priority: "0.9" },
  { loc: "/villages/",          changefreq: "weekly",  priority: "0.8" },
  { loc: "/photos/",            changefreq: "weekly",  priority: "0.7" },
  { loc: "/videos/",            changefreq: "weekly",  priority: "0.7" },
  { loc: "/about/",             changefreq: "monthly", priority: "0.8" },
  { loc: "/contact/",           changefreq: "monthly", priority: "0.7" },
  { loc: "/press/",             changefreq: "monthly", priority: "0.6" },
  { loc: "/help/",              changefreq: "monthly", priority: "0.5" },
  { loc: "/faq/",               changefreq: "monthly", priority: "0.7" },
  { loc: "/privacy/",           changefreq: "yearly",  priority: "0.4" },
  { loc: "/terms/",             changefreq: "yearly",  priority: "0.4" },
  { loc: "/cookie-policy/",     changefreq: "yearly",  priority: "0.3" },
  { loc: "/disclaimer/",        changefreq: "yearly",  priority: "0.3" },
  { loc: "/sitemap/",           changefreq: "monthly", priority: "0.3" },
  { loc: "/editorial-policy/",  changefreq: "monthly", priority: "0.5" },
  { loc: "/corrections-policy/",changefreq: "monthly", priority: "0.5" },
  { loc: "/contributors/",      changefreq: "monthly", priority: "0.5" },
  { loc: "/advertise/",         changefreq: "monthly", priority: "0.4" },
  { loc: "/en/",                changefreq: "monthly", priority: "0.6" },
  { loc: "/en/about/",          changefreq: "monthly", priority: "0.5" },
  { loc: "/en/villages/",       changefreq: "monthly", priority: "0.5" },
  { loc: "/en/news/",           changefreq: "monthly", priority: "0.5" },
  { loc: "/en/contact/",        changefreq: "monthly", priority: "0.5" },
  { loc: "/en/photos/",         changefreq: "weekly",  priority: "0.5" },
  { loc: "/villages/map/",      changefreq: "weekly",  priority: "0.8" },
  { loc: "/upload-photo/",      changefreq: "monthly", priority: "0.6" },
  { loc: "/submit-news/",       changefreq: "monthly", priority: "0.6" },
  { loc: "/submit-video/",      changefreq: "monthly", priority: "0.6" },
];

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function urlEntry(
  loc: string,
  lastmod: string,
  changefreq: string,
  priority: string,
  extras?: string
): string {
  return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
    <lastmod>${lastmod}</lastmod>${extras ? `\n${extras}` : ""}
  </url>`;
}

// ---------------------------------------------------------------------------
// Prerender manifest — the single authoritative signal that prerendered HTML
// has been published for a given article or village.
//
// Format (written by prerender.ts and on-demand-prerender.ts):
//   {
//     "generatedAt": "ISO timestamp",
//     "articles": { "<id>": "<ISO prerender timestamp>", ... },
//     "villages": { "<id>": "<ISO prerender timestamp>", ... }
//   }
//
// The per-item prerender timestamp is compared against the DB row's updatedAt:
//   - If updatedAt <= prerenderTs  → HTML is current → include in sitemap
//   - If updatedAt > prerenderTs   → content changed since last prerender
//                                    → WITHHELD until on-demand/build prerender runs
//
// When the manifest is unavailable (dev, first deploy before build runs):
//   - Fail conservatively: fall back to a time-based grace period
//     (SITEMAP_GRACE_MS), exposing only content old enough that a prerender
//     run would plausibly have captured it. Content newer than the grace
//     window is withheld.
// ---------------------------------------------------------------------------

type PrerenderManifest = {
  generatedAt: string;
  articles: Record<string, string>;   // id → ISO prerender timestamp
  villages: Record<string, string>;   // id → ISO prerender timestamp
};

type ManifestCache = {
  data: PrerenderManifest;
  fetchedAt: number;
};

const MANIFEST_URL = `${BASE_URL}/prerender-manifest.json`;
const MANIFEST_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

let manifestCache: ManifestCache | null = null;

/** Immediately invalidates the in-process manifest cache so the next sitemap
 *  request fetches a fresh copy from disk (e.g. after an article is deleted). */
export function invalidateSitemapManifestCache(): void {
  manifestCache = null;
}

async function fetchPrerenderManifest(): Promise<PrerenderManifest | null> {
  if (manifestCache && Date.now() - manifestCache.fetchedAt < MANIFEST_CACHE_TTL_MS) {
    return manifestCache.data;
  }
  try {
    const res = await fetch(MANIFEST_URL, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const data = (await res.json()) as PrerenderManifest;
    if (typeof data.articles !== "object" || Array.isArray(data.articles)) return null;
    manifestCache = { data, fetchedAt: Date.now() };
    return data;
  } catch {
    return null;
  }
}

// Grace period used when manifest is unavailable.
// Only content OLDER than this window is exposed — conservative, not optimistic.
const SITEMAP_GRACE_MS = (() => {
  const v = parseInt(process.env.SITEMAP_GRACE_MS ?? "", 10);
  return Number.isFinite(v) && v >= 0 ? v : 30 * 60 * 1000;
})();

router.get("/sitemap.xml", async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

    const [articles, villages, manifest] = await Promise.all([
      db
        .select({
          id: articlesTable.id,
          title: articlesTable.title,
          imageUrl: articlesTable.imageUrl,
          createdAt: articlesTable.createdAt,
          updatedAt: articlesTable.updatedAt,
        })
        .from(articlesTable)
        .where(eq(articlesTable.published, true))
        .orderBy(desc(articlesTable.createdAt)),
      db
        .select({ id: villagesTable.id, createdAt: villagesTable.createdAt })
        .from(villagesTable)
        .orderBy(villagesTable.id),
      fetchPrerenderManifest(),
    ]);

    // Conservative fallback threshold when manifest is unavailable.
    // Content created within SITEMAP_GRACE_MS is treated as potentially not
    // yet prerendered and is withheld. Content older than the grace window
    // has (very likely) been captured by a deployment prerender run.
    const graceThreshold = new Date(Date.now() - SITEMAP_GRACE_MS);

    // ---------------------------------------------------------------------------
    // Article filtering: three visibility states
    //   "visible"  — included in sitemap; lastmod = min(updatedAt, prerenderTs)
    //   "withheld" — excluded; content updated since last prerender or too new
    //   "unknown"  — manifest unavailable and article is within grace window
    // ---------------------------------------------------------------------------
    type ArticleRow = { id: number; title: string | null; imageUrl: string | null; createdAt: Date; updatedAt: Date };
    type ArticleEntry = { row: ArticleRow; lastmod: string };

    const visibleArticles: ArticleEntry[] = [];
    let withheldArticles = 0;

    for (const a of articles) {
      if (manifest) {
        const prerenderTs = manifest.articles[String(a.id)];
        if (!prerenderTs) {
          // Not in manifest — no prerendered HTML exists yet
          withheldArticles++;
          continue;
        }
        // Cap lastmod at the prerender timestamp so we never advertise
        // freshness beyond what crawlers will actually see in the HTML.
        const effectiveLastmod = a.updatedAt > new Date(prerenderTs)
          ? prerenderTs.slice(0, 10)   // content changed since prerender — use prerender date
          : a.updatedAt.toISOString().slice(0, 10);
        visibleArticles.push({ row: a, lastmod: effectiveLastmod });
      } else {
        // Manifest unavailable: fail conservatively — only expose content
        // older than the grace window (likely captured by a deploy prerender).
        if (a.createdAt > graceThreshold) {
          withheldArticles++;
          continue;
        }
        // Within conservative window: use createdAt as lastmod to avoid
        // advertising false freshness without a manifest to verify against.
        visibleArticles.push({ row: a, lastmod: a.createdAt.toISOString().slice(0, 10) });
      }
    }

    const visibleVillages: Array<{ id: number; lastmod: string }> = [];
    let withheldVillages = 0;

    for (const v of villages) {
      if (manifest) {
        const prerenderTs = manifest.villages[String(v.id)];
        if (!prerenderTs) {
          withheldVillages++;
          continue;
        }
        visibleVillages.push({ id: v.id, lastmod: prerenderTs.slice(0, 10) });
      } else {
        if (v.createdAt > graceThreshold) {
          withheldVillages++;
          continue;
        }
        visibleVillages.push({ id: v.id, lastmod: v.createdAt.toISOString().slice(0, 10) });
      }
    }

    const filterMode = manifest ? "manifest" : `grace-period-${SITEMAP_GRACE_MS}ms`;

    const staticEntries = STATIC_ROUTES.map((r) =>
      urlEntry(`${BASE_URL}${r.loc}`, today, r.changefreq, r.priority)
    );

    const articleEntries = visibleArticles.map(({ row: a, lastmod }) => {
      const isRecent = a.createdAt > twoDaysAgo;

      const parts: string[] = [];

      if (isRecent && a.title) {
        const pubDate = a.createdAt.toISOString();
        parts.push(`    <news:news>
      <news:publication>
        <news:name>Δρόπολη</news:name>
        <news:language>el</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${escapeXml(a.title)}</news:title>
    </news:news>`);
      }

      if (a.imageUrl && a.title) {
        parts.push(`    <image:image>
      <image:loc>${escapeXml(a.imageUrl)}</image:loc>
      <image:title>${escapeXml(a.title)}</image:title>
    </image:image>`);
      }

      return urlEntry(
        `${BASE_URL}/news/${a.id}/`,
        lastmod,
        "monthly",
        "0.8",
        parts.join("\n")
      );
    });

    const villageEntries = visibleVillages.map(({ id, lastmod }) =>
      urlEntry(`${BASE_URL}/villages/${id}/`, lastmod, "monthly", "0.7")
    );

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">

  <!-- Static Routes -->
${staticEntries.join("\n")}

  <!-- Article Pages (${visibleArticles.length} of ${articles.length} total; ${withheldArticles} withheld pending prerender; filter: ${filterMode}) -->
${articleEntries.join("\n")}

  <!-- Village Pages (${visibleVillages.length} of ${villages.length} total; ${withheldVillages} withheld pending prerender; filter: ${filterMode}) -->
${villageEntries.join("\n")}

</urlset>`;

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(xml);
  } catch (err) {
    req.log.error({ err }, "Failed to generate sitemap");
    res.status(500).send("Failed to generate sitemap");
  }
});

export default router;
