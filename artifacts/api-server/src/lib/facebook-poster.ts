import { logger } from "./logger.js";

interface ArticleData {
  id: number;
  title: string;
  excerpt: string | null;
  content: string;
  category: string;
}

const HASHTAGS =
  "#Δρόπολη #Dropolis #ΒόρειαΉπειρος #Ειδήσεις #ΧωριάΔρόπολης";

function buildCaption(article: ArticleData): string {
  const url = `https://dropolis.net/news/${article.id}`;
  const description = (article.excerpt ?? article.content.slice(0, 220)).trim();
  return `📰 ${article.title}\n\n${description}\n\n👉 Διαβάστε περισσότερα: ${url}\n\n${HASHTAGS}`;
}

/**
 * Posts an article to the configured Facebook Page via Meta Graph API.
 *
 * Controlled by three environment variables:
 *   FACEBOOK_AUTO_POST_ENABLED  — "true" to enable (default: disabled)
 *   FACEBOOK_PAGE_ID            — numeric Facebook Page ID
 *   FACEBOOK_PAGE_ACCESS_TOKEN  — long-lived Page access token (secret)
 *
 * Always resolves — never throws. Article publishing is unaffected if
 * credentials are missing or the API call fails.
 */
export async function postArticleToFacebook(article: ArticleData): Promise<void> {
  if (process.env.FACEBOOK_AUTO_POST_ENABLED !== "true") {
    logger.debug({ articleId: article.id }, "Facebook auto-post disabled — skipping");
    return;
  }

  const pageId = process.env.FACEBOOK_PAGE_ID;
  const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

  if (!pageId || !accessToken) {
    logger.warn(
      { articleId: article.id },
      "Facebook credentials not configured (FACEBOOK_PAGE_ID / FACEBOOK_PAGE_ACCESS_TOKEN) — skipping auto-post"
    );
    return;
  }

  const message = buildCaption(article);
  const apiUrl = `https://graph.facebook.com/${pageId}/feed`;

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, access_token: accessToken }),
    });

    const data = (await response.json()) as {
      id?: string;
      error?: { message: string; code: number; type: string };
    };

    if (!response.ok || data.error) {
      logger.error(
        {
          articleId: article.id,
          httpStatus: response.status,
          fbError: data.error,
        },
        "Facebook auto-post failed"
      );
      return;
    }

    logger.info(
      { articleId: article.id, fbPostId: data.id, title: article.title },
      "Article auto-posted to Facebook Page"
    );
  } catch (err) {
    logger.error({ err, articleId: article.id }, "Facebook auto-post network error");
  }
}
