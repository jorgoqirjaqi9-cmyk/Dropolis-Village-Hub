import { Router } from "express";
import { db } from "@workspace/db";
import { articlesTable, villagesTable } from "@workspace/db";
import { desc } from "drizzle-orm";

const router = Router();

const BASE_URL = "https://dropolis.replit.app";

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
];

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function urlEntry(loc: string, lastmod: string, changefreq: string, priority: string): string {
  return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
    <lastmod>${lastmod}</lastmod>
  </url>`;
}

router.get("/sitemap.xml", async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const [articles, villages] = await Promise.all([
      db.select({ id: articlesTable.id, createdAt: articlesTable.createdAt })
        .from(articlesTable)
        .orderBy(desc(articlesTable.createdAt)),
      db.select({ id: villagesTable.id, createdAt: villagesTable.createdAt })
        .from(villagesTable)
        .orderBy(villagesTable.id),
    ]);

    const staticEntries = STATIC_ROUTES.map(r =>
      urlEntry(`${BASE_URL}${r.loc}`, today, r.changefreq, r.priority)
    );

    const articleEntries = articles.map(a => {
      const lastmod = a.createdAt ? new Date(a.createdAt).toISOString().slice(0, 10) : today;
      return urlEntry(`${BASE_URL}/news/${a.id}`, lastmod, "monthly", "0.8");
    });

    const villageEntries = villages.map(v => {
      const lastmod = v.createdAt ? new Date(v.createdAt).toISOString().slice(0, 10) : today;
      return urlEntry(`${BASE_URL}/villages/${v.id}`, lastmod, "monthly", "0.7");
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
