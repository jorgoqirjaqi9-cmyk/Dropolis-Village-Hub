import { Router, type Request, type Response, type NextFunction } from "express";
import { hasCyrillicLookalike, latinizeCyrillicSlug } from "../lib/cyrillic.js";

const router = Router();

// Legacy URL aliases — these paths are handled as client-side <Redirect>
// components in the frontend router (App.tsx), which means bots that do not
// execute JavaScript receive a 200 SPA shell instead of a proper redirect.
// Routing these paths through the Express server gives bots a genuine HTTP 301
// so search engines and social scrapers consolidate signals to the canonical URLs.
//
// The artifact.toml for the API server lists these paths alongside /api so the
// shared proxy routes them here rather than to the static frontend.
// Targets include the trailing slash so the 301 destination matches the
// canonical URL that SEO.tsx emits (it always appends "/" to non-root paths).
// Without this, GSC flags the redirect as a "Redirect error" because the
// redirect destination doesn't match the canonical declared on that page.
const PERMANENT_REDIRECTS: Record<string, string> = {
  "/privacy-policy": "https://dropolis.net/privacy/",
  "/terms-of-service": "https://dropolis.net/terms/",
};

for (const [from, to] of Object.entries(PERMANENT_REDIRECTS)) {
  router.get(from, (_req, res) => {
    res.redirect(301, to);
  });
}

// ---------------------------------------------------------------------------
// Cyrillic-lookalike normalizer for /news/ slugs
// ---------------------------------------------------------------------------
// Google Search Console occasionally surfaces article URLs where a visually
// identical Cyrillic character (e.g. U+0430 CYRILLIC SMALL LETTER A, which
// looks exactly like Latin "a") was stored or linked instead of its Latin
// counterpart. Issue a 301 to the clean Latin-only slug so crawlers
// consolidate ranking signals to the canonical URL.
// hasCyrillicLookalike / latinizeCyrillicSlug live in lib/cyrillic.ts.

// Express (via parseurl) does NOT decode percent-encoded chars in req.path —
// %D0%B0 stays as-is, not decoded to the Cyrillic 'а'. Use decodeURIComponent
// explicitly before checking, with a try/catch for malformed sequences.
router.use((req: Request, res: Response, next: NextFunction) => {
  let path: string;
  try {
    path = decodeURIComponent(req.path);
  } catch {
    path = req.path;
  }

  if (path.startsWith("/news/") && hasCyrillicLookalike(path)) {
    const clean = latinizeCyrillicSlug(path);
    const target = clean.endsWith("/") ? clean : `${clean}/`;
    res.redirect(301, target);
    return;
  }
  next();
});

export default router;
