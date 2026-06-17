import { Router } from "express";

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

export default router;
