import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { seoCrawlerPlugin } from "./plugins/seo-crawler";

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
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://pagead2.googlesyndication.com https://www.googletagmanager.com https://www.google.com https://partner.googleadservices.com https://static.doubleclick.net https://adservice.google.com https://www.gstatic.com https://www.youtube.com",
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
