import { Router } from "express";
import { db, articlesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../lib/admin-auth.js";

const router = Router();

const GREEK_STOP = new Set([
  "και", "για", "στο", "στη", "στην", "στον", "στα", "στις", "στους",
  "από", "που", "της", "του", "τον", "την", "τους", "τις", "τα", "τη",
  "το", "ο", "η", "οι", "με", "ως", "αν", "αλλά", "είναι", "ήταν",
  "έχει", "έχουν", "θα", "να", "δεν", "μια", "ένα", "ένας", "μετά",
  "πριν", "πολύ", "πιο", "όλα", "ούτε", "ακόμα", "όταν", "κάθε",
  "αυτό", "αυτή", "αυτός", "εκεί", "εδώ", "πώς", "μόνο", "όλοι",
  "ενώ", "μέσα", "εκτός", "κατά", "πάνω", "κάτω", "μέχρι", "γύρω",
  "μαζί", "μεταξύ", "σχετικά", "νέο", "νέα", "νέος", "νέοι",
  "the", "and", "for", "with", "from", "that", "this", "are", "was",
]);

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^α-ωa-zά-ώ]+/i)
      .filter((t) => t.length >= 4 && !GREEK_STOP.has(t))
  );
}

function extractContext(content: string, targetTitle: string): string | null {
  const words = targetTitle.toLowerCase().split(/\s+/).filter((w) => w.length >= 4).slice(0, 3);
  if (words.length === 0) return null;
  const lower = content.toLowerCase();
  for (const word of words) {
    const idx = lower.indexOf(word);
    if (idx === -1) continue;
    const sentenceStart = content.lastIndexOf(".", idx - 1) + 1;
    const sentenceEnd = content.indexOf(".", idx);
    const sentence = content.slice(sentenceStart, sentenceEnd > idx ? sentenceEnd : idx + 120).trim();
    if (sentence.length > 20) return sentence.slice(0, 200);
  }
  return null;
}

function articleUrl(id: number, slug: string | null): string {
  return slug ? `/news/${slug}/` : `/news/${id}/`;
}

function isAlreadyLinked(sourceContent: string, targetId: number, targetSlug: string | null): boolean {
  const lower = sourceContent.toLowerCase();
  if (lower.includes(`/news/${targetId}`)) return true;
  if (targetSlug && lower.includes(targetSlug)) return true;
  return false;
}

type ArticleRow = {
  id: number;
  title: string;
  slug: string | null;
  content: string;
  villageName: string | null;
  category: string;
  tags: string | null;
};

/**
 * GET /api/admin/internal-links
 *
 * Analyzes all published articles and returns internal linking suggestions.
 * For each suggestion: source article + target article + score + reason + anchor text.
 *
 * Query params:
 *   minScore  — minimum relevance score (default 3)
 *   limit     — max suggestions returned (default 100)
 *   village   — filter suggestions by village name (optional)
 */
router.get("/admin/internal-links", requireAdmin, async (req, res) => {
  const minScore = Math.max(1, parseInt(String(req.query.minScore ?? "3"), 10) || 3);
  const limit = Math.min(200, Math.max(10, parseInt(String(req.query.limit ?? "100"), 10) || 100));
  const villageFilter = req.query.village ? String(req.query.village).toLowerCase() : null;

  const rows = await db
    .select({
      id: articlesTable.id,
      title: articlesTable.title,
      slug: articlesTable.slug,
      content: articlesTable.content,
      villageName: articlesTable.villageName,
      category: articlesTable.category,
      tags: articlesTable.tags,
    })
    .from(articlesTable)
    .where(eq(articlesTable.published, true));

  type Suggestion = {
    score: number;
    source: { id: number; title: string; slug: string | null; url: string };
    target: { id: number; title: string; slug: string | null; url: string };
    reasons: string[];
    anchorText: string;
    context: string | null;
  };

  const suggestions: Suggestion[] = [];

  for (let i = 0; i < rows.length; i++) {
    const source = rows[i] as ArticleRow;
    if (villageFilter && source.villageName?.toLowerCase() !== villageFilter) continue;

    const srcTokens = tokenize(source.title + " " + (source.tags ?? ""));

    for (let j = 0; j < rows.length; j++) {
      if (i === j) continue;
      const target = rows[j] as ArticleRow;

      if (isAlreadyLinked(source.content, target.id, target.slug)) continue;

      let score = 0;
      const reasons: string[] = [];

      if (
        source.villageName &&
        target.villageName &&
        source.villageName.toLowerCase() === target.villageName.toLowerCase()
      ) {
        score += 5;
        reasons.push(`Ίδιο χωριό: ${source.villageName}`);
      }

      if (source.category === target.category) {
        score += 2;
        reasons.push(`Ίδια κατηγορία: ${source.category}`);
      }

      const tgtTokens = tokenize(target.title + " " + (target.tags ?? ""));
      const sharedTokens = [...srcTokens].filter((t) => tgtTokens.has(t));
      if (sharedTokens.length > 0) {
        score += Math.min(sharedTokens.length, 4);
        reasons.push(`Κοινές λέξεις: ${sharedTokens.slice(0, 3).join(", ")}`);
      }

      const contentLower = source.content.toLowerCase();
      const targetWords = target.title.toLowerCase().split(/\s+/).filter((w) => w.length >= 5);
      const mentionedWords = targetWords.filter((w) => contentLower.includes(w));
      if (mentionedWords.length >= 2) {
        score += 3;
        reasons.push("Αναφέρεται στο κείμενο");
      } else if (mentionedWords.length === 1) {
        score += 1;
      }

      if (
        target.villageName &&
        target.villageName.length >= 4 &&
        contentLower.includes(target.villageName.toLowerCase()) &&
        !reasons.find((r) => r.startsWith("Ίδιο χωριό"))
      ) {
        score += 2;
        reasons.push(`Αναφέρει το χωριό: ${target.villageName}`);
      }

      if (score < minScore) continue;

      const context = extractContext(source.content, target.title);

      suggestions.push({
        score,
        source: {
          id: source.id,
          title: source.title,
          slug: source.slug,
          url: articleUrl(source.id, source.slug),
        },
        target: {
          id: target.id,
          title: target.title,
          slug: target.slug,
          url: articleUrl(target.id, target.slug),
        },
        reasons,
        anchorText: target.title,
        context,
      });
    }
  }

  suggestions.sort((a, b) => b.score - a.score);

  res.json({
    total: suggestions.length,
    suggestions: suggestions.slice(0, limit),
  });
});

export default router;
