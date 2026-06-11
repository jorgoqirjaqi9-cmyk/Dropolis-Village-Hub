import { Router } from "express";
import { db } from "@workspace/db";
import { articlesTable, villagesTable } from "@workspace/db";
import { desc } from "drizzle-orm";

const router = Router();

const BASE_URL = "https://dropolis.net";

const STATIC_ROUTES = [
  { loc: "/", changefreq: "daily", priority: "1.0" },
  { loc: "/news", changefreq: "hourly", priority: "0.9" },
  { loc: "/villages", changefreq: "weekly", priority: "0.8" },
  { loc: "/photos", changefreq: "weekly", priority: "0.7" },
  { loc: "/videos", changefreq: "weekly", priority: "0.7" },
  { loc: "/about", changefreq: "monthly", priority: "0.8" },
  { loc: "/contact", changefreq: "monthly", priority: "0.7" },
  { loc: "/press", changefreq: "monthly", priority: "0.6" },
  { loc: "/help", changefreq: "monthly", priority: "0.5" },
  { loc: "/privacy", changefreq: "yearly", priority: "0.4" },
  { loc: "/terms", changefreq: "yearly", priority: "0.4" },
  { loc: "/cookie-policy", changefreq: "yearly", priority: "0.3" },
  { loc: "/disclaimer", changefreq: "yearly", priority: "0.3" },
  { loc: "/sitemap", changefreq: "monthly", priority: "0.3" },
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

router.get("/sitemap.xml", async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

    const [articles, villages] = await Promise.all([
      db
        .select({
          id: articlesTable.id,
          title: articlesTable.title,
          imageUrl: articlesTable.imageUrl,
          createdAt: articlesTable.createdAt,
          updatedAt: articlesTable.updatedAt,
        })
        .from(articlesTable)
        .orderBy(desc(articlesTable.createdAt)),
      db
        .select({ id: villagesTable.id, createdAt: villagesTable.createdAt })
        .from(villagesTable)
        .orderBy(villagesTable.id),
    ]);

    const staticEntries = STATIC_ROUTES.map((r) =>
      urlEntry(`${BASE_URL}${r.loc}`, today, r.changefreq, r.priority)
    );

    const articleEntries = articles.map((a) => {
      const articleDate = a.updatedAt ?? a.createdAt;
      const lastmod = articleDate
        ? new Date(articleDate).toISOString().slice(0, 10)
        : today;
      const isRecent = a.createdAt ? new Date(a.createdAt) > twoDaysAgo : false;

      const parts: string[] = [];

      if (isRecent && a.title) {
        const pubDate = a.createdAt
          ? new Date(a.createdAt).toISOString()
          : new Date().toISOString();
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
        `${BASE_URL}/news/${a.id}`,
        lastmod,
        "monthly",
        "0.8",
        parts.join("\n")
      );
    });

    const villageEntries = villages.map((v) => {
      const lastmod = v.createdAt
        ? new Date(v.createdAt).toISOString().slice(0, 10)
        : today;
      return urlEntry(
        `${BASE_URL}/villages/${v.id}`,
        lastmod,
        "monthly",
        "0.7"
      );
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">

  <!-- Static Routes -->
${staticEntries.join("\n")}

  <!-- Article Pages (${articles.length}) -->
${articleEntries.join("\n")}

  <!-- Village Pages (${villages.length}) -->
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
