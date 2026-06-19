import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { seoCrawlerPlugin } from "./plugins/seo-crawler";

/**
 * Minimal above-the-fold CSS inlined in <head>.
 *
 * Prevents white flash (hardcoded theme colors), gives the SEO prerender
 * content a legible layout, and sets min-height:100vh on the prerender block
 * so its height matches the React hero section — keeping CLS near zero when
 * React mounts and replaces the prerender markup with the real app.
 */
const CRITICAL_CSS =
  "*,::before,::after{box-sizing:border-box}" +
  "html{scroll-behavior:smooth}" +
  "body{margin:0;-webkit-font-smoothing:antialiased;" +
  "font-family:'Inter Variable',Inter,ui-sans-serif,system-ui,sans-serif;" +
  "background:hsl(210,30%,98%);color:hsl(222,47%,11%);min-height:100vh}" +
  "html.dark body{background:hsl(222,47%,7%);color:hsl(210,20%,92%)}" +
  "#root{min-height:100vh}" +
  ".seo-prerender-content{padding:80px 1rem 2rem;font-size:.875rem;" +
  "line-height:1.6;max-width:720px;margin:0 auto;min-height:100vh}" +
  ".seo-prerender-content h1{font-size:1.5rem;font-weight:700;" +
  "margin:0 0 .75rem;line-height:1.2}" +
  ".seo-prerender-content h2{font-size:1.125rem;font-weight:600;" +
  "margin:1.25rem 0 .5rem;line-height:1.3}" +
  ".seo-prerender-content p{margin:0 0 .75rem}";

/**
 * Make every Vite-generated CSS file async and inject the critical CSS inline.
 *
 * For each <link rel="stylesheet" href="*.css"> Vite emits in index.html:
 *   1. A <link rel="preload" as="style"> hint — browser fetches CSS ASAP.
 *      Includes crossorigin when the stylesheet has it (prevents double-fetch
 *      from credential mismatch that was previously hurting the score).
 *   2. The stylesheet itself with media="print" onload="this.media='all'" —
 *      removes render-blocking, CSS is applied once downloaded.
 *   3. A <noscript> fallback for non-JS contexts.
 *
 * Only matches Vite-hashed *.css hrefs (e.g. /assets/index-abc123.css).
 * Google Fonts URLs (?display=swap…) are intentionally excluded.
 */
function cssAsyncPlugin(): Plugin {
  return {
    name: "vite-plugin-css-async",
    transformIndexHtml: {
      order: "post",
      handler(html: string) {
        const processed = html.replace(
          /<link rel="stylesheet"([^>]*)href="([^"]+\.css)"([^>]*)>/g,
          (_match, before) => {
            // Preserve crossorigin so preload and stylesheet share the same
            // cache entry — omitting it causes the browser to fetch twice.
            const co = before.includes("crossorigin") ? " crossorigin" : "";
            // Extract the href value again from the full match (captured above)
            const hrefMatch = _match.match(/href="([^"]+\.css)"/);
            if (!hrefMatch) return _match;
            const href = hrefMatch[1];
            return (
              `<link rel="preload" as="style"${co} href="${href}" />\n    ` +
              `<link rel="stylesheet"${co} href="${href}" media="print" onload="this.media='all'" />\n    ` +
              `<noscript><link rel="stylesheet"${co} href="${href}" /></noscript>`
            );
          },
        );
        // Inject critical CSS into <head> so above-the-fold content is styled
        // immediately, before the async main CSS file is parsed.
        return processed.replace(
          "</head>",
          `  <style id="critical-css">${CRITICAL_CSS}</style>\n</head>`,
        );
      },
    },
  };
}

const rawPort = process.env.PORT;
const port = rawPort ? Number(rawPort) : 20727;

const basePath = process.env.BASE_PATH ?? "/";

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://pagead2.googlesyndication.com https://www.googletagmanager.com https://www.google.com https://partner.googleadservices.com https://static.doubleclick.net https://adservice.google.com https://www.gstatic.com https://www.youtube.com https://www.clarity.ms https://scripts.clarity.ms",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "frame-src https://www.youtube.com https://youtube-nocookie.com https://pagead2.googlesyndication.com https://tpc.googlesyndication.com https://www.google.com https://googleads.g.doubleclick.net",
    "connect-src 'self' https:",
    "media-src 'self' https:",
    "object-src 'none'",
    "base-uri 'self'",
  ].join("; "),
  // HSTS — only meaningful over HTTPS (production/preview); harmless in dev
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
};

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    seoCrawlerPlugin({ apiPort: 8080 }),
    cssAsyncPlugin(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    cssCodeSplit: true,
    cssMinify: "lightningcss",
    // Remove the module-preload polyfill — saves ~1.5 KB; all our target
    // browsers support <link rel="modulepreload"> natively (2022+).
    modulePreload: { polyfill: false },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes("/node_modules/react/") ||
            id.includes("/node_modules/react-dom/") ||
            id.includes("/node_modules/scheduler/")
          ) {
            return "vendor-react";
          }
          if (id.includes("/node_modules/framer-motion/")) {
            return "vendor-motion";
          }
          if (id.includes("/node_modules/@radix-ui/")) {
            return "vendor-radix";
          }
          if (id.includes("/node_modules/@tanstack/")) {
            return "vendor-query";
          }
          if (id.includes("/node_modules/lucide-react/")) {
            return "vendor-icons";
          }
          if (id.includes("/node_modules/date-fns/")) {
            return "vendor-date";
          }
        },
      },
    },
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    headers: SECURITY_HEADERS,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    headers: SECURITY_HEADERS,
  },
});
