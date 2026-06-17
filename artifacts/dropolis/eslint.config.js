import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactPlugin from "eslint-plugin-react";

export default [
  js.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        fetch: "readonly",
        URL: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        navigator: "readonly",
        ResizeObserver: "readonly",
        AbortController: "readonly",
        HTMLImageElement: "readonly",
        HTMLModElement: "readonly",
        HTMLInputElement: "readonly",
        React: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      "jsx-a11y": jsxA11y,
      react: reactPlugin,
    },
    settings: {
      react: { version: "detect" },
    },
    rules: {
      // ── Accessibility (a11y) ──────────────────────────────────────────────
      // Every interactive element needs discernible text (aria-label or visible text)
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/aria-props": "error",
      "jsx-a11y/aria-proptypes": "error",
      "jsx-a11y/aria-unsupported-elements": "error",
      "jsx-a11y/role-has-required-aria-props": "error",
      "jsx-a11y/role-supports-aria-props": "error",
      "jsx-a11y/no-autofocus": "warn",
      "jsx-a11y/anchor-has-content": "warn",
      "jsx-a11y/anchor-is-valid": "warn",

      // ── TypeScript ────────────────────────────────────────────────────────
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",

      // ── React ─────────────────────────────────────────────────────────────
      "react/jsx-key": "error",
      "react/no-unescaped-entities": "off",

      // ── General ───────────────────────────────────────────────────────────
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-unused-vars": "off",
    },
  },
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "src/components/ui/**",
      "plugins/**",
      "prerender.ts",
      "vite.config.ts",
    ],
  },
];
